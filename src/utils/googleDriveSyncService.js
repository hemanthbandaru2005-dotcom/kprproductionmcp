/**
 * Google Drive Sync Service
 * 
 * Direct Google Drive API v3 chunked resumable upload and MIME utilities.
 * Completely replaces legacy Google Apps Script webhooks.
 * Supports ZIP archives, images, videos, PDFs, and project documents.
 */

// Supported MIME types mapping
export const SUPPORTED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'heic', 'webp',
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp4', 'mov', 'avi', 'mkv', 'webm',
  'mp3', 'wav', 'aac', 'm4a', 'flac'
];

export const MIME_TYPE_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  rtf: 'application/rtf',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  flac: 'audio/flac'
};

const ZIP_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
  'application/x-zip',
  'multipart/x-zip'
];

/**
 * Validate if file extension or MIME type is supported
 */
export function isFileTypeSupported(filename, mimeType = '') {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (SUPPORTED_EXTENSIONS.includes(ext)) {
    return true;
  }

  if (mimeType) {
    if (ZIP_MIME_TYPES.includes(mimeType) && ext === 'zip') {
      return true;
    }
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
      return true;
    }
    if (mimeType === 'application/pdf') {
      return true;
    }
  }

  return false;
}

/**
 * Get MIME type for file extension
 */
export function getMimeType(filename, fileType = '') {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (ext === 'zip') {
    return 'application/zip';
  }
  if (fileType && fileType !== 'application/octet-stream') {
    return fileType;
  }
  return MIME_TYPE_MAP[ext] || 'application/octet-stream';
}

/**
 * Standard Chunk Size: 512 KiB (must be exact multiple of 256 KiB for Google Drive API)
 * Standard Chunk Size: 2MB (must be exact multiple of 256 KiB for Google Drive API)
 */
export const DRIVE_CHUNK_SIZE = 2 * 1024 * 1024;

const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Performs a complete chunked resumable upload to Google Drive via backend API proxy:
 * 1. POST /app/api/drive/upload/initiate -> opens session
 * 2. PUT /app/api/drive/upload/chunk (iterative 2MB chunks, handling 308 Resume Incomplete)
 * 3. POST /app/api/drive/upload/complete -> persists to Supabase & returns metadata
 */
export async function uploadFileWithDriveResumable({
  file,
  clientId,
  clientName,
  clientEmail,
  bookingId,
  projectTitle,
  uploadId,
  onProgress
}) {
  if (!isFileTypeSupported(file.name, file.type)) {
    throw new Error(`Unsupported file type: ${file.name}. Allowed formats include .zip, images, videos, PDFs, and documents.`);
  }

  const mimeType = getMimeType(file.name, file.type);
  const totalSize = file.size;

  if (onProgress) onProgress(5, 'Opening resumable Drive session...');

  // 1. Initiate Session
  const initiateRes = await fetch(`${API_BASE}/app/api/drive/upload/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientName,
      clientEmail,
      bookingId: bookingId || projectTitle,
      projectTitle,
      fileName: file.name,
      fileSize: totalSize,
      mimeType
    })
  });

  if (!initiateRes.ok) {
    const err = await initiateRes.json().catch(() => ({ error: 'Initiate request failed' }));
    throw new Error(err.error || `Failed to initiate resumable upload session (${initiateRes.status})`);
  }

  const sessionData = await initiateRes.json();
  const uploadUrl = sessionData.uploadUrl;
  const folderId = sessionData.folderId;
  const folderPath = sessionData.folderPath;

  // 2. Upload Chunks
  let offset = 0;
  let driveFileId = null;
  let webViewLink = null;

  while (offset < totalSize) {
    const nextOffset = Math.min(offset + DRIVE_CHUNK_SIZE, totalSize);
    const chunkBlob = file.slice(offset, nextOffset);
    const contentRange = `bytes ${offset}-${nextOffset - 1}/${totalSize}`;
    const chunkLength = nextOffset - offset;

    const percent = Math.round((offset / totalSize) * 85) + 5;
    if (onProgress) {
      onProgress(percent, `Uploading chunk (${Math.round(nextOffset / 1024)} KB / ${Math.round(totalSize / 1024)} KB)...`);
    }

    const chunkRes = await fetch(`${API_BASE}/app/api/drive/upload/chunk`, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Range': contentRange,
        'Content-Length': String(chunkLength),
        'x-upload-url': uploadUrl
      },
      body: chunkBlob
    });

    if (chunkRes.status === 308) {
      // 308 Resume Incomplete: Drive received chunk, advance to next offset
      const rangeHeader = chunkRes.headers.get('range') || chunkRes.headers.get('Range');
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=0-(\d+)/);
        if (match && match[1]) {
          offset = parseInt(match[1], 10) + 1;
        } else {
          offset = nextOffset;
        }
      } else {
        offset = nextOffset;
      }
    } else if (chunkRes.status === 200 || chunkRes.status === 201) {
      // Finished!
      const driveJson = await chunkRes.json().catch(() => ({}));
      driveFileId = driveJson.id;
      webViewLink = driveJson.webViewLink;
      offset = totalSize;
      break;
    } else {
      const errText = await chunkRes.text().catch(() => '');
      throw new Error(`Chunk upload failed with status ${chunkRes.status}: ${errText}`);
    }
  }

  if (onProgress) onProgress(92, 'Finalizing record with Supabase...');

  // 3. Complete Upload Record
  const completeRes = await fetch(`${API_BASE}/app/api/drive/upload/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      clientId,
      clientName,
      clientEmail,
      bookingId: bookingId || projectTitle,
      projectTitle,
      fileId: driveFileId,
      fileName: file.name,
      fileSize: totalSize,
      mimeType,
      webViewLink,
      folderId,
      folderPath
    })
  });

  const completeData = await completeRes.json().catch(() => ({}));

  if (onProgress) onProgress(100, 'Upload complete!');

  return {
    success: true,
    drive_file_id: driveFileId,
    drive_file_url: webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`,
    drive_folder_id: folderId,
    drive_folder_path: folderPath,
    record: completeData.record
  };
}

export default {
  SUPPORTED_EXTENSIONS,
  MIME_TYPE_MAP,
  isFileTypeSupported,
  getMimeType,
  DRIVE_CHUNK_SIZE,
  uploadFileWithDriveResumable
};
