/**
 * IndexedDB Service for Resumable Upload Sessions
 * 
 * Persists active upload sessions, chunk offsets, and file state
 * to survive network drops, accidental tab closures, and page refreshes.
 */

const DB_NAME = 'kpr_upload_store_v1';
const DB_VERSION = 1;
const STORE_NAME = 'active_uploads';

/**
 * Open or upgrade the IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null); // Fallback if IndexedDB is unavailable
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.warn('IndexedDB open error:', event.target.error);
      resolve(null);
    };
  });
}

/**
 * Save or update an upload session
 */
export async function saveUploadSession(session) {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        ...session,
        updatedAt: Date.now()
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveUploadSession error:', err);
  }
}

/**
 * Get an upload session by ID
 */
export async function getUploadSession(uploadId) {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(uploadId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB getUploadSession error:', err);
    return null;
  }
}

/**
 * Update progress of an active upload session
 */
export async function updateUploadProgressInDB(uploadId, bytesUploaded, status = 'uploading') {
  try {
    const existing = await getUploadSession(uploadId);
    if (existing) {
      await saveUploadSession({
        ...existing,
        bytesUploaded,
        status,
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.warn('IndexedDB updateUploadProgress error:', err);
  }
}

/**
 * Delete an upload session upon completion or cancellation
 */
export async function removeUploadSession(uploadId) {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(uploadId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB removeUploadSession error:', err);
  }
}

/**
 * Get all incomplete / paused upload sessions
 */
export async function getActiveUploadSessions() {
  try {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB getActiveUploadSessions error:', err);
    return [];
  }
}

export default {
  saveUploadSession,
  getUploadSession,
  updateUploadProgressInDB,
  removeUploadSession,
  getActiveUploadSessions
};
