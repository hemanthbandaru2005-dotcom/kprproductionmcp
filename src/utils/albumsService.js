import { supabase } from './supabaseClient.js';

export const ALBUM_SIZES = [
  '12x36',
  '13x39',
  '14x40',
  '16x24',
  '18x24',
  '12x24'
];

export const INITIAL_ALBUMS = [];

const LOCAL_STORAGE_KEY = 'kpr_albums_db_v3';
let memoryAlbums = null;

function normalizeAlbum(album) {
  if (!album) return null;
  const pages = Array.isArray(album.pages)
    ? album.pages
    : typeof album.pages === 'string'
      ? JSON.parse(album.pages || '[]')
      : [];

  return {
    id: album.id,
    title: album.title || 'Wedding Album',
    subtitle: album.subtitle || '',
    coverImage: album.cover_image || album.coverImage || (pages[0] || '/images/services/wedding_album_printing.png'),
    cover_image: album.cover_image || album.coverImage || (pages[0] || '/images/services/wedding_album_printing.png'),
    desc: album.description || album.desc || '',
    description: album.description || album.desc || '',
    pages: pages,
    size: album.size ? String(album.size).trim() : null,
    status: album.status || 'published',
    display_order: Number(album.display_order) || 1,
    created_at: album.created_at || new Date().toISOString(),
    updated_at: album.updated_at || new Date().toISOString()
  };
}

function getLocalAlbums() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeAlbum).filter(Boolean);
        }
      }
    }
  } catch (e) {}
  if (memoryAlbums && Array.isArray(memoryAlbums) && memoryAlbums.length > 0) {
    return memoryAlbums.map(normalizeAlbum);
  }
  return INITIAL_ALBUMS.map(normalizeAlbum);
}

function saveLocalAlbums(albums) {
  const normalized = (albums || []).map(normalizeAlbum).filter(Boolean);
  memoryAlbums = normalized;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch (e) {}
}

function notifyAlbumsChanged() {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('kpr_albums_channel_v1');
      bc.postMessage({ type: 'albums_updated', timestamp: Date.now() });
      setTimeout(() => bc.close(), 200);
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_albums_updated'));
    }
  } catch (e) {}
}

/**
 * Fetch all albums (from Supabase if available, fallback to local storage)
 */
export async function fetchAlbums() {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const normalizedList = data.map(normalizeAlbum).filter(Boolean);
      saveLocalAlbums(normalizedList);
      return normalizedList;
    }
  } catch (err) {
    console.warn('Supabase albums fetch error, using local data:', err);
  }

  const localList = getLocalAlbums();
  return localList;
}

/**
 * Create a new album
 */
export async function createAlbum(payload) {
  const newAlbum = normalizeAlbum({
    id: payload.id || `album-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: payload.title || 'New Wedding Album',
    subtitle: payload.subtitle || '',
    cover_image: payload.cover_image || payload.coverImage || '',
    description: payload.description || payload.desc || '',
    pages: payload.pages || [],
    size: payload.size ? String(payload.size).trim() : null,
    status: payload.status || 'published',
    display_order: Number(payload.display_order) || 99,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // 1. Update local storage
  const current = getLocalAlbums();
  const updated = [...current, newAlbum];
  saveLocalAlbums(updated);
  notifyAlbumsChanged();

  // 2. Insert into Supabase if table exists
  try {
    await supabase.from('albums').insert([{
      id: newAlbum.id,
      title: newAlbum.title,
      subtitle: newAlbum.subtitle,
      cover_image: newAlbum.cover_image,
      description: newAlbum.description,
      pages: newAlbum.pages,
      size: newAlbum.size,
      status: newAlbum.status,
      display_order: newAlbum.display_order
    }]);
  } catch (e) {
    console.warn('Supabase insert album error:', e);
  }

  return { data: newAlbum, error: null };
}

/**
 * Update an existing album by ID
 */
export async function updateAlbum(id, updates) {
  if (!id) return { error: 'Missing album ID' };

  // 1. Update local storage
  const current = getLocalAlbums();
  let found = false;
  const updated = current.map(item => {
    if (item.id === id) {
      found = true;
      return normalizeAlbum({
        ...item,
        ...updates,
        updated_at: new Date().toISOString()
      });
    }
    return item;
  });

  if (found) {
    saveLocalAlbums(updated);
    notifyAlbumsChanged();
  }

  // 2. Update Supabase
  try {
    const dbPayload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    if (dbPayload.coverImage) {
      dbPayload.cover_image = dbPayload.coverImage;
      delete dbPayload.coverImage;
    }
    if (dbPayload.desc) {
      dbPayload.description = dbPayload.desc;
      delete dbPayload.desc;
    }

    await supabase
      .from('albums')
      .update(dbPayload)
      .eq('id', id);
  } catch (e) {
    console.warn('Supabase update album error:', e);
  }

  const result = updated.find(a => a.id === id);
  return { data: result, error: null };
}

/**
 * Specifically updates only the size attribute on an album's existing row
 */
export async function updateAlbumSize(id, size) {
  const cleanSize = size ? String(size).trim() : null;
  return updateAlbum(id, { size: cleanSize });
}

/**
 * Delete an album by ID
 */
export async function deleteAlbum(id) {
  if (!id) return { error: 'Missing album ID' };

  const current = getLocalAlbums();
  const updated = current.filter(a => a.id !== id);
  saveLocalAlbums(updated);
  notifyAlbumsChanged();

  try {
    await supabase.from('albums').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete album error:', e);
  }

  return { success: true };
}
