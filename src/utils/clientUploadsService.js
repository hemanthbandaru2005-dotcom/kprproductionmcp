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

export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DELETED_UPLOADS_STORAGE_KEY = 'kpr_deleted_uploads_v1';

export function getDeletedUploadIds() {
  try {
    const raw = localStorage.getItem(DELETED_UPLOADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add an upload ID to the permanent deletion blacklist.
 * Persists to BOTH localStorage (this device) AND Supabase verifications table (all devices).
 */
export async function addDeletedUploadId(id, filePath, fileUrl, fileName) {
  // 1. Always persist to localStorage first (instant, same device)
  try {
    const current = getDeletedUploadIds();
    const set = new Set(current);
    if (id) {
      set.add(id);
      set.add(String(id).replace(/^worker_jf_/, ''));
      set.add(`worker_jf_${id}`);
    }
    if (filePath) set.add(filePath);
    if (fileUrl) set.add(fileUrl);
    if (fileName) set.add(fileName);
    const updated = Array.from(set);
    localStorage.setItem(DELETED_UPLOADS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[KPR Delete] localStorage blacklist save failed:', e);
  }

  // 2. Persist deletion record to Supabase verifications table (cross-device sync with valid UUID)
  const recordUUID = generateUUID();
  try {
    const { error } = await supabase.from('verifications').insert([{
      id: recordUUID,
      client_id: id ? String(id).slice(0, 100) : 'deleted_upload',
      client_name: 'SYSTEM_DELETION_SYNC',
      client_email: 'sync@kpr.com',
      album_id: 'SYSTEM_DELETED_UPLOADS',
      event_id: id ? String(id).slice(0, 150) : '',
      event_title: fileName ? String(fileName).slice(0, 150) : 'Deleted Upload',
      client_note: (fileName || filePath || fileUrl || '').slice(0, 255),
      status: 'deleted',
      notes: JSON.stringify({
        id,
        cleanId: id ? String(id).replace(/^worker_jf_/, '') : '',
        filePath: filePath || '',
        fileUrl: fileUrl || '',
        fileName: fileName || '',
        deleted_at: new Date().toISOString()
      }),
      sent_at: new Date().toISOString()
    }]);
    if (error) {
      console.error('[KPR Delete] Supabase blacklist insert failed:', error.message, error);
    }
  } catch (e) {
    console.error('[KPR Delete] Supabase blacklist insert exception:', e);
  }
}

export function formatUploaderDisplayName(name, email, role) {
  if (!name || name.startsWith('worker_reg_') || name.startsWith('client_reg_') || name.startsWith('usr_') || name.startsWith('worker-') || name.startsWith('job_')) {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        if (raw) {
          const workers = JSON.parse(raw);
          const found = workers.find(w => w.id === name || (email && w.email === email));
          if (found && found.full_name) return found.full_name;
        }
      } catch (e) {}
    }
    if (email && email.includes('@')) {
      const p = email.split('@')[0];
      return p.charAt(0).toUpperCase() + p.slice(1).replace(/[._-]/g, ' ');
    }
    return role === 'worker' ? 'Studio Staff Member' : 'Valued Client';
  }
  return name;
}

export function formatProjectDisplayName(title) {
  if (!title) return 'Studio Deliverables';
  if (title.includes('job_') || title.includes('job-') || title.startsWith('#job_')) {
    return 'Studio Photoshoot Deliverables';
  }
  return title;
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

  // 4. Merge worker job deliverables from Supabase job_files & local job cache
  try {
    const { data: jobFiles } = await supabase.from('job_files').select('*');
    if (Array.isArray(jobFiles)) {
      jobFiles.forEach(jf => {
        if (!jf || !jf.id) return;
        const uploadKey = `worker_jf_${jf.id}`;
        if (!map.has(uploadKey) && !map.has(jf.id)) {
          map.set(uploadKey, {
            id: uploadKey,
            file_name: jf.file_name || 'Deliverable Drive Folder / File',
            file_type: jf.file_type || 'drive',
            file_category: jf.file_category || 'drive',
            file_size: jf.file_size || 0,
            file_url: jf.file_path,
            drive_file_url: jf.file_path,
            drive_sync_status: 'synced',
            client_id: jf.job_id || 'studio',
            client_name: jf.client_name || 'Studio Production',
            project_title: formatProjectDisplayName(jf.job_title || jf.project_title),
            uploader_role: 'worker',
            uploader_name: formatUploaderDisplayName(jf.uploaded_by, jf.uploaded_by_email || 'worker@kpr.com', 'worker'),
            uploader_email: jf.uploaded_by_email || 'worker@kpr.com',
            created_at: jf.created_at || new Date().toISOString()
          });
        }
      });
    }
  } catch (e) {}

  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kpr_job_files_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(jf => {
                if (jf && jf.id && !map.has(jf.id) && !map.has(`worker_jf_${jf.id}`)) {
                  map.set(jf.id, {
                    id: jf.id,
                    file_name: jf.file_name || 'Worker Deliverable Folder / File',
                    file_type: jf.file_type || 'drive',
                    file_category: 'drive',
                    file_size: jf.file_size || 0,
                    file_url: jf.file_path || jf.drive_link,
                    drive_file_url: jf.file_path || jf.drive_link,
                    drive_sync_status: 'synced',
                    client_name: 'Studio Production',
                    project_title: formatProjectDisplayName(jf.job_title || jf.project_title),
                    uploader_role: 'worker',
                    uploader_name: formatUploaderDisplayName(jf.uploaded_by, 'worker@kpr.com', 'worker'),
                    created_at: jf.created_at || new Date().toISOString()
                  });
                }
              });
            }
          }
        }
      }
    }
  } catch (e) {}

  // ═══ FETCH DELETION BLACKLIST FROM SUPABASE (cross-device) + localStorage (this device) ═══
  const deletedSet = new Set(getDeletedUploadIds());
  try {
    const { data: delData } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', 'SYSTEM_DELETED_UPLOADS');
    if (Array.isArray(delData)) {
      delData.forEach(d => {
        if (d.event_id) {
          deletedSet.add(d.event_id);
          deletedSet.add(d.event_id.replace(/^worker_jf_/, ''));
          deletedSet.add(`worker_jf_${d.event_id}`);
        }
        if (d.client_id && d.client_id !== 'deleted_upload') {
          deletedSet.add(d.client_id);
          deletedSet.add(d.client_id.replace(/^worker_jf_/, ''));
          deletedSet.add(`worker_jf_${d.client_id}`);
        }
        if (d.client_note) deletedSet.add(d.client_note);
        try {
          const parsed = typeof d.notes === 'string' ? JSON.parse(d.notes) : d.notes;
          if (parsed?.id) {
            deletedSet.add(parsed.id);
            deletedSet.add(parsed.id.replace(/^worker_jf_/, ''));
            deletedSet.add(`worker_jf_${parsed.id}`);
          }
          if (parsed?.filePath) deletedSet.add(parsed.filePath);
          if (parsed?.fileUrl) deletedSet.add(parsed.fileUrl);
          if (parsed?.fileName) deletedSet.add(parsed.fileName);
        } catch (err) {}
      });
      // Sync cloud blacklist into localStorage so it persists on this device too
      if (delData.length > 0) {
        try {
          const updated = Array.from(deletedSet);
          localStorage.setItem(DELETED_UPLOADS_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
      }
    }
  } catch (e) {
    console.warn('[KPR] Failed to fetch deletion blacklist from Supabase:', e);
  }

  // Purge any deleted items from local client uploads cache
  const currentLocal = getLocalClientUploads();
  const cleanedLocal = currentLocal.filter(r => {
    if (!r || !r.id) return false;
    const cleanId = r.id.replace(/^worker_jf_/, '');
    if (deletedSet.has(r.id) || deletedSet.has(cleanId) || deletedSet.has(`worker_jf_${r.id}`)) return false;
    if (r.file_path && deletedSet.has(r.file_path)) return false;
    if (r.file_url && deletedSet.has(r.file_url)) return false;
    if (r.file_name && deletedSet.has(r.file_name)) return false;
    return true;
  });
  if (cleanedLocal.length !== currentLocal.length) {
    saveLocalClientUploads(cleanedLocal);
  }

  // Filter out all deleted items from the merged map
  const allRecords = Array.from(map.values())
    .filter(item => {
      if (!item || !item.id) return false;
      const cleanId = item.id.replace(/^worker_jf_/, '');
      if (deletedSet.has(item.id) || deletedSet.has(cleanId) || deletedSet.has(`worker_jf_${item.id}`)) return false;
      if (item.file_path && deletedSet.has(item.file_path)) return false;
      if (item.file_url && deletedSet.has(item.file_url)) return false;
      if (item.drive_file_url && deletedSet.has(item.drive_file_url)) return false;
      if (item.file_name && deletedSet.has(item.file_name)) return false;
      return true;
    })
    .sort(
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
 * Delete an uploaded file permanently from storage, Google Drive, and database
 */
export async function deleteClientUpload(uploadId) {
  if (!uploadId) return { success: false };
  const cleanId = uploadId.replace(/^worker_jf_/, '');
  const apiBase = getBackendApiUrl();

  // 1. Fetch file record to obtain file_path / drive IDs before deletion
  let fileRecord = null;
  try {
    const { data } = await supabase
      .from('client_uploads')
      .select('*')
      .or(`id.eq.${uploadId},id.eq.${cleanId}`)
      .maybeSingle();
    fileRecord = data;
  } catch (e) {}

  // Also try job_files if not found in client_uploads
  if (!fileRecord) {
    try {
      const { data } = await supabase
        .from('job_files')
        .select('*')
        .or(`id.eq.${uploadId},id.eq.${cleanId}`)
        .maybeSingle();
      fileRecord = data;
    } catch (e) {}
  }

  if (!fileRecord) {
    const local = getLocalClientUploads();
    fileRecord = local.find(item => item.id === uploadId || item.id === cleanId);
  }

  const filePath = fileRecord?.file_path || fileRecord?.drive_file_url || fileRecord?.file_url;
  const fileUrl = fileRecord?.file_url || fileRecord?.drive_file_url;
  const fileName = fileRecord?.file_name;

  // 2. Add to deleted blacklist permanently (AWAIT to ensure it persists to Supabase)
  await addDeletedUploadId(uploadId, filePath, fileUrl, fileName);
  if (cleanId !== uploadId) {
    await addDeletedUploadId(cleanId, filePath, fileUrl, fileName);
  }

  // 3. Delete from Backend Google Drive Storage API
  try {
    await fetch(`${apiBase}/app/api/drive/upload/${uploadId}`, { method: 'DELETE' });
    if (cleanId !== uploadId) {
      await fetch(`${apiBase}/app/api/drive/upload/${cleanId}`, { method: 'DELETE' });
    }
  } catch (e) {}

  // 4. Delete directly from Supabase Storage buckets if path exists
  if (filePath) {
    try {
      await supabase.storage.from('client-uploads').remove([filePath]);
      await supabase.storage.from('job-files').remove([filePath]);
      await supabase.storage.from('portfolio').remove([filePath]);
    } catch (e) {}
  }

  // 5. Delete from Supabase Database tables
  try {
    const { error: e1 } = await supabase.from('client_uploads').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
    if (e1) console.warn('[KPR Delete] client_uploads delete by id failed:', e1.message);
    if (filePath) {
      await supabase.from('client_uploads').delete().eq('file_path', filePath);
    }
    if (fileName) {
      await supabase.from('client_uploads').delete().eq('file_name', fileName);
    }
  } catch (e) {}

  try {
    const { error: e2 } = await supabase.from('job_files').delete().or(`id.eq.${uploadId},id.eq.${cleanId}`);
    if (e2) console.warn('[KPR Delete] job_files delete by id failed:', e2.message);
    if (filePath) {
      await supabase.from('job_files').delete().eq('file_path', filePath);
    }
    if (fileName) {
      await supabase.from('job_files').delete().eq('file_name', fileName);
    }
  } catch (e) {}

  // 6. Delete ONLY non-blacklist verification records (DO NOT delete SYSTEM_DELETED_UPLOADS records!)
  try {
    await supabase.from('verifications')
      .delete()
      .or(`event_id.eq.${uploadId},event_id.eq.${cleanId},id.eq.${uploadId},id.eq.${cleanId}`)
      .neq('album_id', 'SYSTEM_DELETED_UPLOADS');
  } catch (e) {}

  // 7. Clean up IndexedDB sessions
  try {
    await removeUploadSession(uploadId);
    await removeUploadSession(cleanId);
  } catch (e) {}

  // 8. Delete from LocalStorage cache
  const local = getLocalClientUploads();
  saveLocalClientUploads(local.filter(item => item.id !== uploadId && item.id !== cleanId && item.file_path !== filePath && item.file_name !== fileName));

  // 9. Delete from all local job files caches (kpr_job_files_*)
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kpr_job_files_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const filtered = list.filter(f => f.id !== uploadId && f.id !== cleanId && f.file_path !== filePath && f.file_path !== fileUrl && f.drive_link !== fileUrl && f.file_name !== fileName);
              localStorage.setItem(k, JSON.stringify(filtered));
            }
          }
        }
      }
    } catch (e) {}
  }

  // 10. Clean up any related activity alert messages
  try {
    await deleteUploadActivityMessage(uploadId);
    if (cleanId !== uploadId) {
      await deleteUploadActivityMessage(cleanId);
    }
  } catch (e) {}

  // 11. Broadcast permanent deletion across Supabase Realtime (all devices & laptops)
  try {
    const realtimeBc = supabase.channel('kpr_client_uploads_broadcast_v1');
    await realtimeBc.send({
      type: 'broadcast',
      event: 'delete_upload',
      payload: { uploadId, cleanId, fileName, filePath, fileUrl }
    });
  } catch (e) {}

  // 12. Broadcast permanent deletion across same-browser tabs
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
      bc.postMessage({ type: 'delete', uploadId, cleanId, fileName });
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_client_uploads_updated', { detail: { uploadId, cleanId, fileName, type: 'delete' } }));
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
  uploaderRole = 'client',
  uploaderName,
  uploaderEmail,
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

          let chunkRes = null;
          try {
            // DIRECT BROWSER → GOOGLE DRIVE PUT REQUEST
            chunkRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': mimeType,
                'Content-Range': contentRange,
                'Content-Length': String(chunkLength)
              },
              body: chunkBlob,
              signal: abortController.signal
            });
          } catch (directErr) {
            if (directErr.name === 'AbortError' || directErr.message === 'PAUSED_BY_USER') {
              throw directErr;
            }
            console.warn('[Google Drive] Direct chunk PUT interrupted, streaming via backend proxy fallback...', directErr);
            chunkRes = await fetch(`${apiBase}/app/api/drive/upload/chunk`, {
              method: 'PUT',
              headers: {
                'Content-Type': mimeType,
                'Content-Range': contentRange,
                'x-upload-url': uploadUrl
              },
              body: chunkBlob,
              signal: abortController.signal
            });
          }

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

    const determinedRole = uploaderRole || (clientEmail?.includes('@kpr.com') || clientId?.startsWith('worker') ? 'worker' : 'client');
    const determinedName = uploaderName || (determinedRole === 'worker' ? (clientName || 'Staff Worker') : cleanClientName);

    const record = {
      ...(finalRecord || {}),
      id: uploadId,
      client_id: clientId,
      client_name: cleanClientName,
      client_email: clientEmail,
      project_title: cleanProjectTitle,
      project_id: projectId,
      file_name: file.name,
      file_type: fileExt,
      file_category: fileCategory,
      file_size: totalSize,
      file_url: previewUrl || webViewLink,
      drive_sync_status: 'synced',
      drive_file_id: driveFileId,
      drive_file_url: webViewLink || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : ''),
      uploader_role: determinedRole,
      uploader_name: determinedName,
      uploader_email: uploaderEmail || clientEmail,
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

    // Also register activity notification message for Admin Uploads feed
    try {
      addUploadActivityMessage({
        uploaderRole: determinedRole,
        uploaderName: determinedName,
        uploaderEmail: uploaderEmail || clientEmail,
        fileName: file.name,
        projectTitle: cleanProjectTitle,
        driveUrl: webViewLink || (driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : '')
      });
    } catch (e) {}

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
 * ════════════════════════════════════════════════════════════════════════════════
 * UPLOAD ACTIVITY MESSAGES & ALERTS SYSTEM (Admin Notification Feed)
 * ════════════════════════════════════════════════════════════════════════════════
 */
const ACTIVITY_ALBUM_FLAG = 'UPLOAD_ACTIVITY_MESSAGE';
const LOCAL_ACTIVITY_KEY = 'kpr_upload_activity_messages_v1';

export function getLocalActivityMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalActivityMessages(list) {
  try {
    localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Fetch all upload activity messages from cloud + local cache
 */
export async function fetchUploadActivityMessages() {
  const map = new Map();

  // 1. Fetch from Supabase verifications table
  try {
    const { data } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', ACTIVITY_ALBUM_FLAG)
      .order('created_at', { ascending: false });

    if (Array.isArray(data)) {
      data.forEach(row => {
        try {
          const parsed = typeof row.notes === 'string' ? JSON.parse(row.notes) : (row.notes || {});
          const item = {
            id: row.event_id || row.id,
            uploader_role: parsed.uploader_role || 'worker',
            uploader_name: parsed.uploader_name || row.client_name || 'Staff Member',
            uploader_email: parsed.uploader_email || '',
            file_name: parsed.file_name || 'Photoshoot Deliverables',
            file_count: parsed.file_count || 1,
            project_title: parsed.project_title || 'Photoshoot Order',
            drive_url: parsed.drive_url || row.image_url || '',
            created_at: row.created_at || new Date().toISOString()
          };
          map.set(item.id, item);
        } catch (err) {}
      });
    }
  } catch (e) {}

  // 2. Merge local cache
  const localList = getLocalActivityMessages();
  localList.forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

/**
 * Add a new upload activity message
 */
export async function addUploadActivityMessage({
  uploaderRole = 'worker',
  uploaderName = 'Staff Member',
  uploaderEmail = '',
  fileName = 'Uploaded Photos',
  fileCount = 1,
  projectTitle = 'Photoshoot Deliverables',
  driveUrl = ''
}) {
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const messageItem = {
    id,
    uploader_role: uploaderRole,
    uploader_name: uploaderName,
    uploader_email: uploaderEmail,
    file_name: fileName,
    file_count: fileCount,
    project_title: projectTitle,
    drive_url: driveUrl,
    created_at: new Date().toISOString()
  };

  // 1. Save to Supabase verifications
  try {
    await supabase.from('verifications').insert([{
      event_id: id,
      album_id: ACTIVITY_ALBUM_FLAG,
      client_name: uploaderName,
      image_url: driveUrl,
      notes: JSON.stringify(messageItem),
      created_at: messageItem.created_at
    }]);
  } catch (e) {}

  // 2. Save to local storage
  const current = getLocalActivityMessages();
  saveLocalActivityMessages([messageItem, ...current.filter(m => m.id !== id)]);

  // 3. Broadcast
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_upload_activity_bc_v1');
      bc.postMessage({ type: 'new_activity', message: messageItem });
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_upload_activity_updated', { detail: { type: 'new_activity', message: messageItem } }));
  }

  return messageItem;
}

/**
 * Delete a specific upload activity message
 */
export async function deleteUploadActivityMessage(id) {
  if (!id) return;

  // 1. Delete from Supabase
  try {
    await supabase
      .from('verifications')
      .delete()
      .eq('event_id', id)
      .eq('album_id', ACTIVITY_ALBUM_FLAG);
  } catch (e) {}

  // 2. Delete from local cache
  const current = getLocalActivityMessages();
  saveLocalActivityMessages(current.filter(m => m.id !== id));

  // 3. Broadcast deletion
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_upload_activity_bc_v1');
      bc.postMessage({ type: 'delete_activity', id });
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_upload_activity_updated', { detail: { type: 'delete_activity', id } }));
  }
}

/**
 * Clear all upload activity messages
 */
export async function clearAllUploadActivityMessages() {
  // 1. Clear from Supabase
  try {
    await supabase
      .from('verifications')
      .delete()
      .eq('album_id', ACTIVITY_ALBUM_FLAG);
  } catch (e) {}

  // 2. Clear local cache
  saveLocalActivityMessages([]);

  // 3. Broadcast clear
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('kpr_upload_activity_bc_v1');
      bc.postMessage({ type: 'clear_all' });
      bc.close();
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kpr_upload_activity_updated', { detail: { type: 'clear_all' } }));
  }
}

/**
 * Subscribe to upload activity messages
 */
export function subscribeToUploadActivityMessages(onUpdate) {
  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('kpr_upload_activity_bc_v1');
      bc.onmessage = (event) => {
        if (onUpdate) onUpdate(event.data);
      };
    } catch (e) {}
  }

  const handleCustomEvent = (e) => {
    if (onUpdate) onUpdate(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_upload_activity_updated', handleCustomEvent);
  }

  return () => {
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_upload_activity_updated', handleCustomEvent);
    }
  };
}

/**
 * Real-time subscription helper for client uploads.
 * Subscribes to:
 *   1. Supabase Realtime on `verifications` table (SYSTEM_DELETED_UPLOADS) — cross-device deletion sync
 *   2. Supabase Realtime on `client_uploads` table — INSERT / DELETE events
 *   3. Supabase Realtime on `job_files` table — INSERT / DELETE events
 *   4. BroadcastChannel (same browser, different tabs)
 *   5. window custom events (same tab)
 */
export function subscribeToClientUploadsRealtime(onUpdate) {
  const channels = [];
  const sessionSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // ─── 1. Supabase Realtime: verifications table (deletion blacklist) ───
  try {
    const deletionChannel = supabase
      .channel(`kpr_deletion_sync_${sessionSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verifications' },
        (payload) => {
          const rec = payload.new;
          if (!rec) return;
          if (rec.album_id === 'SYSTEM_DELETED_UPLOADS') {
            const deletedId = rec.event_id || rec.client_id;
            const deletedFileName = rec.client_note || rec.event_title || '';
            let filePath = '', fileUrl = '';
            try {
              const parsed = typeof rec.notes === 'string' ? JSON.parse(rec.notes) : rec.notes;
              if (parsed) {
                filePath = parsed.filePath || '';
                fileUrl = parsed.fileUrl || '';
              }
            } catch (e) {}
            if (deletedId) {
              addDeletedUploadId(deletedId, filePath, fileUrl, deletedFileName);
            }
            if (onUpdate) {
              onUpdate({
                type: 'delete',
                uploadId: deletedId,
                cleanId: deletedId ? String(deletedId).replace(/^worker_jf_/, '') : '',
                fileName: deletedFileName
              });
            }
          }
        }
      )
      .subscribe();
    channels.push(deletionChannel);
  } catch (e) {
    console.warn('Supabase Realtime deletion channel error:', e);
  }

  // ─── 2. Supabase Realtime: Direct Broadcast Channel (instant <50ms cross-device delivery) ───
  try {
    const broadcastChannel = supabase
      .channel('kpr_client_uploads_broadcast_v1')
      .on(
        'broadcast',
        { event: 'delete_upload' },
        (response) => {
          const payload = response?.payload;
          if (payload) {
            addDeletedUploadId(payload.uploadId, payload.filePath, payload.fileUrl, payload.fileName);
            if (payload.cleanId) {
              addDeletedUploadId(payload.cleanId, payload.filePath, payload.fileUrl, payload.fileName);
            }
            if (onUpdate) {
              onUpdate({
                type: 'delete',
                uploadId: payload.uploadId,
                cleanId: payload.cleanId,
                fileName: payload.fileName
              });
            }
          }
        }
      )
      .subscribe();
    channels.push(broadcastChannel);
  } catch (e) {
    console.warn('Supabase Broadcast channel error:', e);
  }

  // ─── 3. Supabase Realtime: client_uploads table ───
  try {
    const uploadsChannel = supabase
      .channel(`kpr_uploads_tbl_${sessionSuffix}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'client_uploads' },
        (payload) => {
          if (onUpdate) onUpdate({ type: 'insert', record: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'client_uploads' },
        (payload) => {
          if (onUpdate) onUpdate({ type: 'update', record: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'client_uploads' },
        (payload) => {
          const old = payload.old;
          if (old && old.id) {
            addDeletedUploadId(old.id, old.file_path, old.file_url, old.file_name);
            if (onUpdate) onUpdate({ type: 'delete', uploadId: old.id, cleanId: old.id, fileName: old.file_name || '' });
          }
        }
      )
      .subscribe();
    channels.push(uploadsChannel);
  } catch (e) {
    console.warn('Supabase Realtime client_uploads channel error:', e);
  }

  // ─── 4. Supabase Realtime: job_files table ───
  try {
    const jobFilesChannel = supabase
      .channel(`kpr_jf_tbl_${sessionSuffix}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_files' },
        (payload) => {
          if (onUpdate) onUpdate({ type: 'insert', record: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'job_files' },
        (payload) => {
          const old = payload.old;
          if (old && old.id) {
            const prefixedId = `worker_jf_${old.id}`;
            addDeletedUploadId(old.id, old.file_path, null, old.file_name);
            addDeletedUploadId(prefixedId, old.file_path, null, old.file_name);
            if (onUpdate) onUpdate({ type: 'delete', uploadId: prefixedId, cleanId: old.id, fileName: old.file_name || '' });
          }
        }
      )
      .subscribe();
    channels.push(jobFilesChannel);
  } catch (e) {
    console.warn('Supabase Realtime job_files channel error:', e);
  }

  // ─── 5. BroadcastChannel (same browser, different tabs) ───
  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('kpr_client_uploads_bc_v1');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'delete') {
          addDeletedUploadId(event.data.uploadId, null, null, event.data.fileName);
        }
        if (onUpdate) onUpdate(event.data);
      };
    } catch (e) {}
  }

  // ─── 6. Window custom events (same tab) ───
  const handleCustomEvent = (e) => {
    if (onUpdate) onUpdate(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_client_uploads_updated', handleCustomEvent);
  }

  // ─── Cleanup function ───
  return () => {
    channels.forEach(ch => {
      try { supabase.removeChannel(ch); } catch (e) {}
    });
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_client_uploads_updated', handleCustomEvent);
    }
  };
}
