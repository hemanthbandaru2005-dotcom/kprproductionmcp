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

const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

// Active upload controllers for pause/cancel support
const activeUploadControllers = new Map(); // uploadId -> { abortController, isPaused: boolean, bytesUploaded: number, totalSize: number }

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format bytes to readable size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  // 1. Fetch from server endpoint
  try {
    const res = await fetch(`${API_BASE}/app/api/drive/uploads`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.records)) {
        json.records.forEach(r => { if (r && r.id) map.set(r.id, r); });
      }
    }
  } catch (e) {
    // Server fetch fallback
  }

  // 2. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('client_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach(r => { if (r && r.id) map.set(r.id, r); });
    }
  } catch (err) {
    console.warn('Supabase client_uploads query error:', err);
  }

  // 3. Merge with local store
  const localItems = getLocalClientUploads();
  localItems.forEach(r => { if (r && r.id && !map.has(r.id)) map.set(r.id, r); });

  const all = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  if (clientId) {
    return all.filter(u => u.client_id === clientId || !u.client_id || u.client_id === 'client-demo-1');
  }
  return all;
}

/**
 * Fetch all uploads for admin panel
 */
export async function fetchAllClientUploadsForAdmin() {
  const map = new Map();

  // 1. Fetch from server endpoint
  try {
    const res = await fetch(`${API_BASE}/app/api/drive/uploads`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.records)) {
        json.records.forEach(r => { if (r && r.id) map.set(r.id, r); });
      }
    }
  } catch (e) {
    // Server fetch fallback
  }

  // 2. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('client_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach(r => { if (r && r.id) map.set(r.id, r); });
    }
  } catch (err) {
    console.warn('Supabase client_uploads admin query error:', err);
  }

  // 3. Merge with local store
  const localItems = getLocalClientUploads();
  localItems.forEach(r => { if (r && r.id && !map.has(r.id)) map.set(r.id, r); });

  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Create or convert local file to object preview
 */
function createDataUrl(file) {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    } else {
      resolve(URL.createObjectURL(file));
    }
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
 * Core Resumable Upload Handler (Stage 5 Hardened):
 * 1. Checks supported extensions.
 * 2. Checks/initiates Resumable Session via POST /app/api/drive/upload/initiate.
 * 3. Persists session state in IndexedDB (resuming from confirmed byte offset).
 * 4. Streams 512KB chunks with Exponential Backoff Retry on transient errors (5xx/network drops).
 * 5. Detects Expired/Invalidated Sessions (404/410) and auto-re-initiates session while retaining confirmed bytes.
 * 6. Finalizes transfer via POST /app/api/drive/upload/complete.
 */
export async function uploadClientFile({
  file,
  clientId,
  clientName,
  clientEmail,
  projectId,
  projectTitle,
  onProgress
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
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
    previewUrl = URL.createObjectURL(file);
  }

  // Initial progress event
  if (onProgress) {
    onProgress({
      percent: 2,
      bytesUploaded: 0,
      totalBytes: totalSize,
      stage: 'Initiating secure Drive session...',
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
      const initRes = await fetch(`${API_BASE}/app/api/drive/upload/initiate`, {
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
    }

    // 3. Chunk Streaming Loop with Exponential Backoff & 404/410 Auto-Recovery
    let driveFileId = null;
    let webViewLink = null;
    const chunkSize = DRIVE_CHUNK_SIZE;

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
          const chunkRes = await fetch(`${API_BASE}/app/api/drive/upload/chunk`, {
            method: 'PUT',
            headers: {
              'Content-Type': mimeType,
              'Content-Range': contentRange,
              'Content-Length': String(chunkLength),
              'x-upload-url': uploadUrl
            },
            body: chunkBlob,
            signal: abortController.signal
          });

          // -------------------------------------------------------------
          // Case A: 404/410 Expired or Invalidated Drive Session URL
          // -------------------------------------------------------------
          if (chunkRes.status === 404 || chunkRes.status === 410) {
            console.warn(`[Drive Resumable] Session expired (HTTP ${chunkRes.status}). Automatically re-initiating session while preserving ${offset} bytes already transferred...`);
            
            if (onProgress) {
              onProgress({
                percent: Math.min(Math.round((offset / totalSize) * 95), 95),
                bytesUploaded: offset,
                totalBytes: totalSize,
                stage: 'Session refreshed. Reconnecting to Google Drive...',
                status: 'retrying',
                attempt: 1,
                maxRetries: MAX_CHUNK_RETRIES
              });
            }

            // Re-initiate session
            await requestFreshSession();
            // Retry chunk immediately with new uploadUrl
            continue;
          }

          // -------------------------------------------------------------
          // Case B: 308 Resume Incomplete (Chunk received by Google Drive)
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

            uploadState.bytesUploaded = offset;
            const percent = Math.min(Math.round((offset / totalSize) * 95), 95);

            await updateUploadProgressInDB(uploadId, offset, 'uploading');

            if (onProgress) {
              onProgress({
                percent,
                bytesUploaded: offset,
                totalBytes: totalSize,
                stage: `Uploading: ${formatFileSize(offset)} of ${formatFileSize(totalSize)} (${percent}%)`,
                status: 'uploading'
              });
            }

            chunkSuccess = true;
            break;
          }

          // -------------------------------------------------------------
          // Case C: 200/201 Created (Upload Completed!)
          // -------------------------------------------------------------
          if (chunkRes.status === 200 || chunkRes.status === 201) {
            const driveJson = await chunkRes.json().catch(() => ({}));
            driveFileId = driveJson.id;
            webViewLink = driveJson.webViewLink;
            offset = totalSize;
            uploadState.bytesUploaded = totalSize;
            chunkSuccess = true;
            break;
          }

          // -------------------------------------------------------------
          // Case D: 5xx Transient Server Error or 429 Rate Limit -> Exponential Backoff
          // -------------------------------------------------------------
          if (chunkRes.status >= 500 || chunkRes.status === 429) {
            attempt++;
            if (attempt >= MAX_CHUNK_RETRIES) {
              const errText = await chunkRes.text().catch(() => '');
              throw new Error(`Upload server temporarily unavailable (${chunkRes.status}) after ${MAX_CHUNK_RETRIES} retry attempts.`);
            }

            const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 400, MAX_BACKOFF_MS);
            if (onProgress) {
              onProgress({
                percent: Math.min(Math.round((offset / totalSize) * 95), 95),
                bytesUploaded: offset,
                totalBytes: totalSize,
                stage: `Upload paused, retrying (attempt ${attempt} of ${MAX_CHUNK_RETRIES})…`,
                status: 'retrying',
                attempt,
                maxRetries: MAX_CHUNK_RETRIES
              });
            }
            await wait(delay);
            continue;
          }

          // Non-retryable HTTP errors (e.g. 403 Forbidden, 400 Bad Request, 401 Unauthorized)
          const errText = await chunkRes.text().catch(() => '');
          let parsedError = errText;
          try {
            const errJson = JSON.parse(errText);
            parsedError = errJson.error?.message || errJson.error || errText;
          } catch (e) {}

          const fatalError = new Error(parsedError || `Upload error (${chunkRes.status})`);
          fatalError.isFatal = true;
          throw fatalError;

        } catch (fetchErr) {
          if (fetchErr.isFatal || fetchErr.name === 'AbortError' || fetchErr.message === 'PAUSED_BY_USER') {
            throw fetchErr;
          }

          attempt++;
          if (attempt >= MAX_CHUNK_RETRIES) {
            throw new Error(`Network interrupted after ${MAX_CHUNK_RETRIES} attempts (${fetchErr.message}).`);
          }

          const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 400, MAX_BACKOFF_MS);
          if (onProgress) {
            onProgress({
              percent: Math.min(Math.round((offset / totalSize) * 95), 95),
              bytesUploaded: offset,
              totalBytes: totalSize,
              stage: `Upload paused, retrying (attempt ${attempt} of ${MAX_CHUNK_RETRIES})…`,
              status: 'retrying',
              attempt,
              maxRetries: MAX_CHUNK_RETRIES
            });
          }
          await wait(delay);
        }
      }
    }

    // 4. Finalize & Persist via POST /app/api/drive/upload/complete
    if (onProgress) {
      onProgress({
        percent: 98,
        bytesUploaded: totalSize,
        totalBytes: totalSize,
        stage: 'Securing upload record...',
        status: 'uploading'
      });
    }

    const completeRes = await fetch(`${API_BASE}/app/api/drive/upload/complete`, {
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
      })
    });

    const completeJson = await completeRes.json().catch(() => ({}));
    const record = completeJson.record || {
      id: uploadId,
      client_id: clientId,
      client_name: cleanClientName,
      project_title: cleanProjectTitle,
      file_name: file.name,
      file_type: fileExt,
      file_category: fileCategory,
      file_size: totalSize,
      file_url: previewUrl,
      drive_sync_status: 'synced',
      drive_file_id: driveFileId,
      drive_file_url: webViewLink,
      created_at: new Date().toISOString(),
      synced_at: new Date().toISOString()
    };

    // Clean up IndexedDB active session
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
        percent: 100,
        bytesUploaded: totalSize,
        totalBytes: totalSize,
        stage: 'Upload Complete & Secured',
        status: 'completed'
      });
    }

    return {
      success: true,
      data: record
    };

  } catch (error) {
    if (error.name === 'AbortError' || error.message === 'PAUSED_BY_USER') {
      return {
        success: false,
        paused: true,
        error: 'Upload paused'
      };
    }

    console.error('Resumable Upload Error:', error);
    activeUploadControllers.delete(uploadId);

    // Store paused/error state in IndexedDB so the user can easily resume
    updateUploadProgressInDB(uploadId, uploadState.bytesUploaded || 0, 'error');

    return {
      success: false,
      error: error.message || 'Upload connection interrupted. Click Resume to continue.'
    };
  }
}

/**
 * Retry Drive Sync for an existing upload record (used by admin panel)
 */
export async function retryDriveSync(uploadId) {
  const all = getLocalClientUploads();
  const record = all.find(r => r.id === uploadId);

  if (!record) {
    throw new Error('Upload record not found');
  }

  // Set status to pending
  await updateUploadRecord(uploadId, {
    drive_sync_status: 'pending',
    drive_sync_error: null
  });

  try {
    const res = await fetch(`${API_BASE}/app/api/drive/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: record.id,
        clientId: record.client_id,
        clientName: record.client_name,
        clientEmail: record.client_email,
        bookingId: record.project_id || record.project_title,
        projectTitle: record.project_title,
        fileId: record.drive_file_id || `file_${Date.now()}`,
        fileName: record.file_name,
        fileSize: record.file_size,
        mimeType: getMimeType(record.file_name),
        webViewLink: record.drive_file_url,
        folderId: record.drive_folder_id,
        folderPath: record.drive_folder_path
      })
    });

    if (res.ok) {
      await updateUploadRecord(uploadId, {
        drive_sync_status: 'synced',
        synced_at: new Date().toISOString(),
        drive_sync_error: null
      });
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({ error: 'Retry failed' }));
      throw new Error(err.error || `Retry failed with status ${res.status}`);
    }
  } catch (error) {
    console.error('retryDriveSync error:', error);
    await updateUploadRecord(uploadId, {
      drive_sync_status: 'failed',
      drive_sync_error: error.message || 'Retry failed'
    });
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing upload record locally and in Supabase
 */
export async function updateUploadRecord(uploadId, updates) {
  try {
    await supabase
      .from('client_uploads')
      .update(updates)
      .eq('id', uploadId);
  } catch (e) {
    console.warn('Supabase updateUploadRecord warning:', e);
  }

  const local = getLocalClientUploads();
  const updated = local.map((item) => (item.id === uploadId ? { ...item, ...updates } : item));
  saveLocalClientUploads(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_client_uploads_updated', { detail: { uploadId, updates } }));
  }
}

/**
 * Delete a client upload record
 */
export async function deleteClientUpload(uploadId) {
  try {
    await supabase
      .from('client_uploads')
      .delete()
      .eq('id', uploadId);
  } catch (e) {
    console.warn('Supabase delete error:', e);
  }

  const local = getLocalClientUploads();
  const filtered = local.filter((item) => item.id !== uploadId);
  saveLocalClientUploads(filtered);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_client_uploads_updated', { detail: { uploadId } }));
  }
}

/**
 * Real-time Subscription for Staff / Admin Dashboard
 * Subscribes to Supabase postgres_changes, broadcast events, and window events.
 */
export function subscribeToClientUploadsRealtime(onUploadChange) {
  const channelName = `client-uploads-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  let channel = null;

  try {
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_uploads' }, (payload) => {
        if (onUploadChange) {
          onUploadChange({
            type: payload.eventType.toLowerCase(),
            record: payload.new || payload.old
          });
        }
      })
      .on('broadcast', { event: 'new-upload' }, (eventPayload) => {
        if (onUploadChange && eventPayload.payload) {
          onUploadChange({
            type: 'insert',
            record: eventPayload.payload
          });
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('Realtime channel subscription error:', err);
  }

  // Cross-tab broadcast channel
  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
      bc.onmessage = (event) => {
        if (onUploadChange && event.data?.record) {
          onUploadChange({
            type: event.data.type || 'insert',
            record: event.data.record
          });
        }
      };
    } catch (e) {}
  }

  const handleWindowEvent = (e) => {
    if (onUploadChange && (e.detail?.record || e.detail?.uploadId)) {
      onUploadChange({
        type: e.detail?.updates ? 'update' : 'insert',
        record: e.detail.record || { id: e.detail.uploadId, ...(e.detail.updates || {}) }
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_client_uploads_updated', handleWindowEvent);
  }

  // Return unsubscribe cleanup function
  return () => {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    }
    if (bc) {
      try {
        bc.close();
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_client_uploads_updated', handleWindowEvent);
    }
  };
}

export default {
  uploadClientFile,
  pauseClientUpload,
  cancelClientUpload,
  retryDriveSync,
  deleteClientUpload,
  fetchClientUploads,
  fetchAllClientUploadsForAdmin,
  updateUploadRecord,
  subscribeToClientUploadsRealtime,
  formatFileSize,
  getFileCategory
};
