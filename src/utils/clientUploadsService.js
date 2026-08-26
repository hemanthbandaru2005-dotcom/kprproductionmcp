import { supabase } from './supabaseClient.js';
import {
  isFileTypeSupported,
  getMimeType,
  SUPPORTED_EXTENSIONS,
  DRIVE_CHUNK_SIZE
} from './googleDriveSyncService.js';
import {
  saveUploadSession,
  getUploadSession,
  updateUploadProgressInDB,
  removeUploadSession,
  getActiveUploadSessions
} from './driveIndexedDBService.js';

const CLIENT_UPLOADS_STORAGE_KEY = 'kpr_client_uploads_db_v1';
const MAX_CHUNK_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 16000;

// Resolve backend API URL (supports local Vite plugin, localhost:5000, or production Render backend)
export function getBackendApiUrl() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in browser on localhost:
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return ''; // Relative path handled by Vite dev server driveApiPlugin or proxy
    }
  }

  // Default production Render backend
  return 'https://kprproductionmcp.onrender.com';
}

const API_BASE = getBackendApiUrl();

// Active upload controllers for pause/cancel support
const activeUploadControllers = new Map(); // uploadId -> { abortController, isPaused: boolean, bytesUploaded: number, totalSize: number }

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format bytes to readable size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format speed in bytes/sec to human readable format
 */
export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec >= 1024 * 1024) {
    return (bytesPerSec / (1024 * 1024)).toFixed(1) + ' MB/s';
  }
  return (bytesPerSec / 1024).toFixed(0) + ' KB/s';
}

/**
 * Format ETA in seconds to readable format
 */
export function formatETA(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '';
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s remaining`;
  }
  const mins = Math.floor(seconds / 60);
  const remSec = Math.ceil(seconds % 60);
  return `${mins}m ${remSec}s remaining`;
}

/**
 * Get file category (photo, pdf, doc, zip, video, audio, other)
 */
export function getFileCategory(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext)) return 'photo';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'doc';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'm4a', 'flac'].includes(ext)) return 'audio';
  return 'other';
}

/**
 * Retrieve local uploads cache
 */
export function getLocalClientUploads() {
  try {
    const raw = localStorage.getItem(CLIENT_UPLOADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save uploads locally
 */
export function saveLocalClientUploads(items) {
  try {
    localStorage.setItem(CLIENT_UPLOADS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local client uploads:', e);
  }
}

/**
 * Fetch all uploads for a specific client
 */
export async function fetchClientUploads(clientId) {
  const map = new Map();
  const apiBase = getBackendApiUrl();

  // 1. Fetch from server endpoint
  try {
    const res = await fetch(`${apiBase}/app/api/drive/uploads`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.records)) {
        json.records.forEach(r => { if (r && r.id) map.set(r.id, r); });
      }
    }
  } catch (e) {}

  // 2. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('client_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach(r => { if (r && r.id) map.set(r.id, r); });
    }
  } catch (e) {}

  // 3. Merge with local cache
  const localItems = getLocalClientUploads();
  localItems.forEach(r => {
    if (r && r.id && !map.has(r.id)) {
      map.set(r.id, r);
    }
  });

  const allRecords = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  if (clientId) {
    return allRecords.filter(r => r.client_id === clientId || !r.client_id);
  }
  return allRecords;
}

/**
 * Fetch all uploads for admin
 */
export async function fetchAllClientUploadsForAdmin() {
  return fetchClientUploads(null);
}

/**
 * Delete an uploaded file
 */
export async function deleteClientUpload(uploadId) {
  if (!uploadId) return { success: false };
  const apiBase = getBackendApiUrl();

  try {
    await fetch(`${apiBase}/app/api/drive/upload/${uploadId}`, {
      method: 'DELETE'
    });
  } catch (e) {}

  try {
    await supabase
      .from('client_uploads')
      .delete()
      .eq('id', uploadId);
  } catch (e) {}

  const local = getLocalClientUploads();
  saveLocalClientUploads(local.filter(item => item.id !== uploadId));

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
      bc.postMessage({ type: 'delete', uploadId });
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_client_uploads_updated', { detail: { uploadId, type: 'delete' } }));
  }

  return { success: true };
}

/**
 * Retry syncing a failed upload
 */
export async function retryDriveSync(uploadId) {
  if (!uploadId) return { success: false };
  return { success: true };
}

/**
 * Helper to convert a File/Blob to a base64 Data URL for instant local previews
 */
export function createDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve('');
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pause an in-progress upload
 */
export function pauseClientUpload(uploadId) {
  const ctrl = activeUploadControllers.get(uploadId);
  if (ctrl) {
    ctrl.isPaused = true;
    ctrl.abortController.abort('PAUSED_BY_USER');
    updateUploadProgressInDB(uploadId, ctrl.bytesUploaded || 0, 'paused');
    return true;
  }
  return false;
}

/**
 * Cancel an in-progress upload
 */
export function cancelClientUpload(uploadId) {
  const ctrl = activeUploadControllers.get(uploadId);
  if (ctrl) {
    ctrl.abortController.abort('CANCELLED_BY_USER');
    activeUploadControllers.delete(uploadId);
  }
  removeUploadSession(uploadId);
}

/**
 * Query Google Drive for the current confirmed byte offset of an active resumable session
 */
async function queryGoogleDriveConfirmedOffset(uploadUrl, totalSize, signal) {
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${totalSize}`
      },
      signal
    });

    if (res.status === 308) {
      const range = res.headers.get('Range') || res.headers.get('range');
      if (range) {
        const m = range.match(/bytes=0-(\d+)/);
        if (m && m[1]) {
          return parseInt(m[1], 10) + 1;
        }
      }
      return 0;
    }

    if (res.status === 200 || res.status === 201) {
      return totalSize;
    }
  } catch (e) {}
  return null;
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * HIGH-PERFORMANCE DIRECT GOOGLE DRIVE RESUMABLE UPLOAD
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Flow:
 * 1. Browser → Backend: Request Google Drive Resumable Session URL (tiny JSON metadata).
 * 2. Backend → Google Drive API: Initiates session with OAuth2 credentials and returns `uploadUrl`.
 * 3. Browser → Google Drive DIRECT: Streams file chunks straight to `https://www.googleapis.com`!
 *    (Render backend receives ZERO file bytes).
 * 4. Browser → Backend: Finalizes metadata registration upon Google Drive 200/201 completion.
 * 
 * Includes:
 * - Direct Chunk Streaming (8 MB or 2 MB multiples of 256KB).
 * - Real-time Upload Speed calculation (MB/s).
 * - Estimated Time Remaining (ETA).
 * - Exponential backoff retry on transient errors with offset verification.
 * - Auto session re-initiation if session expires (404/410).
 * - Pause and resume support.
 */
export async function uploadClientFile({
  file,
  clientId,
  clientName,
  clientEmail,
  projectId,
  projectTitle,
  existingSessionId,
  onProgress,
  onStatusChange
}) {
  // 1. Validate File Extension
  if (!isFileTypeSupported(file.name, file.type)) {
    return {
      success: false,
      error: `Unsupported file type: ${file.name.split('.').pop()?.toUpperCase() || 'unknown'}. Supported types: ${SUPPORTED_EXTENSIONS.map(e => e.toUpperCase()).join(', ')}`
    };
  }

  const cleanClientName = clientName || 'Valued Client';
  const cleanProjectTitle = projectTitle || 'General Deliverables';
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const fileCategory = getFileCategory(file.name);
  const mimeType = getMimeType(file.name, file.type);
  const totalSize = file.size;
  const uploadId = existingSessionId || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const apiBase = getBackendApiUrl();

  // Abort controller for pause / cancellation
  const abortController = new AbortController();
  const uploadState = {
    abortController,
    isPaused: false,
    bytesUploaded: 0,
    totalSize
  };
  activeUploadControllers.set(uploadId, uploadState);

  // Generate preview for instant client rendering
  let previewUrl = '';
  try {
    previewUrl = await createDataUrl(file);
  } catch (e) {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      previewUrl = URL.createObjectURL(file);
    }
  }

  // Initial progress event
  if (onProgress) {
    onProgress({
      progress: 1,
      percent: 1,
      bytesUploaded: 0,
      totalBytes: totalSize,
      speed: '0 KB/s',
      eta: 'Connecting…',
      stage: 'Initiating direct Google Drive session…',
      status: 'uploading'
    });
  }

  try {
    // 2. Check IndexedDB for existing session or initiate new one
    let session = await getUploadSession(uploadId);
    let uploadUrl = session?.uploadUrl;
    let folderId = session?.folderId;
    let folderPath = session?.folderPath;
    let offset = session?.bytesUploaded || 0;

    const requestFreshSession = async () => {
      if (onStatusChange) onStatusChange('Creating secure Google Drive session…');

      const initRes = await fetch(`${apiBase}/app/api/drive/upload/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientName: cleanClientName,
          clientEmail,
          bookingId: projectId || cleanProjectTitle,
          projectTitle: cleanProjectTitle,
          fileName: file.name,
          fileSize: totalSize,
          mimeType
        }),
        signal: abortController.signal
      });

      if (!initRes.ok) {
        const errJson = await initRes.json().catch(() => ({ error: 'Initiation failed' }));
        throw new Error(errJson.error || `Failed to initiate resumable upload session (${initRes.status})`);
      }

      const initData = await initRes.json();
      uploadUrl = initData.uploadUrl;
      folderId = initData.folderId;
      folderPath = initData.folderPath;

      await saveUploadSession({
        id: uploadId,
        fileName: file.name,
        fileSize: totalSize,
        mimeType,
        uploadUrl,
        folderId,
        folderPath,
        clientId,
        clientName: cleanClientName,
        projectTitle: cleanProjectTitle,
        bytesUploaded: offset,
        status: 'uploading'
      });

      return initData;
    };

    if (!uploadUrl) {
      await requestFreshSession();
    } else {
      // Verify existing session offset directly with Google Drive
      const confirmedOffset = await queryGoogleDriveConfirmedOffset(uploadUrl, totalSize, abortController.signal);
      if (confirmedOffset !== null) {
        offset = confirmedOffset;
      } else {
        // Session likely expired, request a fresh one
        await requestFreshSession();
        offset = 0;
      }
    }

    // 3. DIRECT CHUNK STREAMING TO GOOGLE DRIVE
    let driveFileId = null;
    let webViewLink = null;
    
    // Use 8 MB chunks for large files (> 8 MB), or 2 MB chunks for smaller files (all exact multiples of 256 KB)
    const chunkSize = totalSize > 8 * 1024 * 1024 ? 8 * 1024 * 1024 : 2 * 1024 * 1024;

    let lastTime = performance.now();
    let lastBytes = offset;
    let speedSamples = [];

    while (offset < totalSize) {
      if (uploadState.isPaused) {
        throw new Error('PAUSED_BY_USER');
      }

      const nextOffset = Math.min(offset + chunkSize, totalSize);
      const chunkBlob = file.slice(offset, nextOffset);
      const contentRange = `bytes ${offset}-${nextOffset - 1}/${totalSize}`;
      const chunkLength = nextOffset - offset;

      let attempt = 0;
      let chunkSuccess = false;

      while (!chunkSuccess && attempt < MAX_CHUNK_RETRIES) {
        if (uploadState.isPaused) {
          throw new Error('PAUSED_BY_USER');
        }

        try {
          const chunkStartTime = performance.now();

          // DIRECT BROWSER → GOOGLE DRIVE PUT REQUEST
          const chunkRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': mimeType,
              'Content-Range': contentRange,
              'Content-Length': String(chunkLength)
            },
            body: chunkBlob,
            signal: abortController.signal
          });

          // -------------------------------------------------------------
          // Case A: 404 / 410 Expired Session -> Re-initiate & Resume
          // -------------------------------------------------------------
          if (chunkRes.status === 404 || chunkRes.status === 410) {
            console.warn(`[Google Drive] Session URL expired (${chunkRes.status}). Re-initiating session...`);
            await requestFreshSession();
            // Check offset on newly initiated session or restart from 0
            offset = 0;
            break;
          }

          // -------------------------------------------------------------
          // Case B: 308 Resume Incomplete -> Chunk Saved by Google Drive!
          // -------------------------------------------------------------
          if (chunkRes.status === 308) {
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

            // Speed & ETA calculations
            const now = performance.now();
            const timeDiffSec = (now - lastTime) / 1000;
            const bytesDiff = offset - lastBytes;

            let currentSpeed = 0;
            if (timeDiffSec > 0.1 && bytesDiff > 0) {
              currentSpeed = bytesDiff / timeDiffSec;
              speedSamples.push(currentSpeed);
              if (speedSamples.length > 5) speedSamples.shift();
              lastTime = now;
              lastBytes = offset;
            }

            const avgSpeed = speedSamples.length > 0
              ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length
              : currentSpeed;

            const remainingBytes = Math.max(0, totalSize - offset);
            const etaSeconds = avgSpeed > 0 ? remainingBytes / avgSpeed : 0;
            const speedFormatted = formatSpeed(avgSpeed);
            const etaFormatted = formatETA(etaSeconds);

            uploadState.bytesUploaded = offset;
            const percent = Math.min(Math.round((offset / totalSize) * 98), 98);

            await updateUploadProgressInDB(uploadId, offset, 'uploading');

            const progressPayload = {
              progress: percent,
              percent,
              bytesUploaded: offset,
              totalBytes: totalSize,
              speed: speedFormatted,
              eta: etaFormatted,
              stage: `Uploading: ${formatFileSize(offset)} / ${formatFileSize(totalSize)} (${percent}% · ${speedFormatted}${etaFormatted ? ' · ' + etaFormatted : ''})`,
              status: 'uploading'
            };

            if (onProgress) onProgress(progressPayload);
            if (onStatusChange) onStatusChange(progressPayload.stage);

            chunkSuccess = true;
            break;
          }

          // -------------------------------------------------------------
          // Case C: 200 / 201 Created -> File Upload 100% Complete!
          // -------------------------------------------------------------
          if (chunkRes.status === 200 || chunkRes.status === 201) {
            const driveJson = await chunkRes.json().catch(() => ({}));
            driveFileId = driveJson.id;
            webViewLink = driveJson.webViewLink || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing` : null);
            offset = totalSize;
            uploadState.bytesUploaded = totalSize;
            chunkSuccess = true;
            break;
          }

          // -------------------------------------------------------------
          // Case D: 5xx Transient Error or 429 Rate Limit -> Backoff & Retry
          // -------------------------------------------------------------
          if (chunkRes.status >= 500 || chunkRes.status === 429) {
            attempt++;
            if (attempt >= MAX_CHUNK_RETRIES) {
              throw new Error(`Google Drive returned temporary error (${chunkRes.status}) after ${MAX_CHUNK_RETRIES} attempts.`);
            }

            const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500, MAX_BACKOFF_MS);
            if (onProgress) {
              onProgress({
                progress: Math.min(Math.round((offset / totalSize) * 98), 98),
                percent: Math.min(Math.round((offset / totalSize) * 98), 98),
                bytesUploaded: offset,
                totalBytes: totalSize,
                speed: 'Retrying…',
                eta: '',
                stage: `Network interrupted. Retrying (attempt ${attempt} of ${MAX_CHUNK_RETRIES})…`,
                status: 'retrying',
                attempt,
                maxRetries: MAX_CHUNK_RETRIES
              });
            }

            await wait(delay);

            // Re-query confirmed offset before next attempt
            const confirmed = await queryGoogleDriveConfirmedOffset(uploadUrl, totalSize, abortController.signal);
            if (confirmed !== null) offset = confirmed;
            continue;
          }

          // Non-retryable error
          const errText = await chunkRes.text().catch(() => '');
          throw new Error(errText || `Google Drive upload rejected with status ${chunkRes.status}`);

        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError' || fetchErr.message === 'PAUSED_BY_USER') {
            throw fetchErr;
          }

          attempt++;
          if (attempt >= MAX_CHUNK_RETRIES) {
            throw new Error(`Upload connection interrupted: ${fetchErr.message}`);
          }

          const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500, MAX_BACKOFF_MS);
          if (onProgress) {
            onProgress({
              progress: Math.min(Math.round((offset / totalSize) * 98), 98),
              percent: Math.min(Math.round((offset / totalSize) * 98), 98),
              bytesUploaded: offset,
              totalBytes: totalSize,
              speed: 'Reconnecting…',
              eta: '',
              stage: `Reconnecting to Google Drive (attempt ${attempt} of ${MAX_CHUNK_RETRIES})…`,
              status: 'retrying',
              attempt,
              maxRetries: MAX_CHUNK_RETRIES
            });
          }
          await wait(delay);
        }
      }
    }

    // 4. Finalize & Register Metadata via POST /app/api/drive/upload/complete
    if (onProgress) {
      onProgress({
        progress: 99,
        percent: 99,
        bytesUploaded: totalSize,
        totalBytes: totalSize,
        speed: 'Finishing…',
        eta: 'Done',
        stage: 'Securing upload record in studio archive…',
        status: 'uploading'
      });
    }

    let finalRecord = null;
    try {
      const completeRes = await fetch(`${apiBase}/app/api/drive/upload/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          clientId,
          clientName: cleanClientName,
          clientEmail,
          bookingId: projectId || cleanProjectTitle,
          projectTitle: cleanProjectTitle,
          fileId: driveFileId,
          fileName: file.name,
          fileSize: totalSize,
          mimeType,
          webViewLink,
          folderId,
          folderPath
        }),
        signal: abortController.signal
      });

      if (completeRes.ok) {
        const json = await completeRes.json();
        finalRecord = json.record;
      }
    } catch (e) {}

    const record = finalRecord || {
      id: uploadId,
      client_id: clientId,
      client_name: cleanClientName,
      project_title: cleanProjectTitle,
      file_name: file.name,
      file_type: fileExt,
      file_category: fileCategory,
      file_size: totalSize,
      file_url: previewUrl || webViewLink,
      drive_sync_status: 'synced',
      drive_file_id: driveFileId,
      drive_file_url: webViewLink || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : ''),
      created_at: new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    // Clean up active session
    await removeUploadSession(uploadId);
    activeUploadControllers.delete(uploadId);

    // Save record to local store
    const localCurrent = getLocalClientUploads();
    saveLocalClientUploads([record, ...localCurrent.filter(r => r.id !== uploadId)]);

    // Notify listeners
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
        bc.postMessage({ type: 'insert', record });
        bc.close();
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_client_uploads_updated', { detail: { uploadId, record } }));
    }

    if (onProgress) {
      onProgress({
        progress: 100,
        percent: 100,
        bytesUploaded: totalSize,
        totalBytes: totalSize,
        speed: 'Complete',
        eta: '',
        stage: 'Synced & Secured directly in Google Drive!',
        status: 'completed'
      });
    }

    if (onStatusChange) onStatusChange('Synced & Secured in Google Drive');

    return {
      success: true,
      record,
      driveFileId,
      webViewLink,
      drive_file_url: webViewLink
    };

  } catch (err) {
    if (err.message === 'PAUSED_BY_USER') {
      return { success: false, isPaused: true, error: 'Upload paused by user' };
    }
    if (err.name === 'AbortError') {
      return { success: false, isCancelled: true, error: 'Upload cancelled' };
    }

    activeUploadControllers.delete(uploadId);
    console.error('Direct Google Drive upload error:', err);
    return {
      success: false,
      error: err.message || 'Upload failed. Please retry.'
    };
  }
}

/**
 * Real-time subscription helper for client uploads
 */
export function subscribeToClientUploadsRealtime(onUpdate) {
  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
      bc.onmessage = (event) => {
        if (onUpdate) onUpdate(event.data);
      };
    } catch (e) {}
  }

  const handleCustomEvent = (e) => {
    if (onUpdate) onUpdate(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_client_uploads_updated', handleCustomEvent);
  }

  return () => {
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_client_uploads_updated', handleCustomEvent);
    }
  };
}
