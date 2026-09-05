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

const LOCAL_STORAGE_KEY = 'kpr_albums_db_v4';
let memoryAlbums = null;

const LEGACY_DUMMY_IDS = [
  'album-royal-velvet',
  'album-editorial-fineart',
  'album-cinematic-sunset'
];

const LEGACY_DUMMY_TITLES = [
  'royal velvet wedding album',
  'editorial fine art book',
  'cinematic sunset storybook'
];

function isLegacyDummy(album) {
  if (!album) return true;
  const t = (album.title || '').toLowerCase().trim();
  const id = (album.id || '').toLowerCase().trim();
  if (LEGACY_DUMMY_IDS.includes(id)) return true;
  if (LEGACY_DUMMY_TITLES.includes(t)) return true;
  return false;
}

function normalizeAlbum(album) {
  if (!album || isLegacyDummy(album)) return null;
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
      localStorage.removeItem('kpr_albums_db');
      localStorage.removeItem('kpr_albums_db_v2');
      localStorage.removeItem('kpr_albums_db_v3');
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
    return memoryAlbums.map(normalizeAlbum).filter(Boolean);
  }
  return [];
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

/**
 * Physical album size specifications and aspect ratio rules
 */
export const ALBUM_SIZE_SPECS = {
  '12x36': {
    name: '12x36 Layflat Spread',
    spreadRatio: 3.0,     // 36" width / 12" height
    pageRatio: 1.5,       // 18" width / 12" height
    validRatios: [1.5, 3.0],
    description: '12x36 spread (3:1) or 12x18 page (1.5:1)'
  },
  '13x39': {
    name: '13x39 Royal Grand Spread',
    spreadRatio: 3.0,     // 39" width / 13" height
    pageRatio: 1.5,       // 19.5" width / 13" height
    validRatios: [1.5, 3.0],
    description: '13x39 spread (3:1) or 13x19.5 page (1.5:1)'
  },
  '14x40': {
    name: '14x40 Imperial Panorama',
    spreadRatio: 2.857,   // 40" width / 14" height (~2.86)
    pageRatio: 1.428,     // 20" width / 14" height (~1.43)
    validRatios: [1.43, 2.86],
    description: '14x40 spread (2.86:1) or 14x20 page (1.43:1)'
  },
  '16x24': {
    name: '16x24 Portrait Heirloom',
    spreadRatio: 1.5,     // 24" width / 16" height
    pageRatio: 0.75,      // 12" width / 16" height
    validRatios: [0.75, 1.5],
    description: '16x24 spread (1.5:1) or 12x16 portrait page (0.75:1)'
  },
  '18x24': {
    name: '18x24 Masterpiece Fine Art',
    spreadRatio: 1.333,   // 24" width / 18" height (4:3)
    pageRatio: 0.667,     // 12" width / 18" height (2:3 portrait)
    validRatios: [0.67, 1.33],
    description: '18x24 spread (1.33:1) or 12x18 portrait page (0.67:1)'
  },
  '12x24': {
    name: '12x24 Studio Square Spread',
    spreadRatio: 2.0,     // 24" width / 12" height
    pageRatio: 1.0,       // 12" width / 12" height (1:1 square)
    validRatios: [1.0, 2.0],
    description: '12x24 spread (2:1) or 12x12 square page (1:1)'
  }
};

/**
 * Validates an image file, blob, or URL against a selected physical album size.
 * Returns { valid: boolean, error?: string, width?: number, height?: number, ratio?: string }
 */
export async function validateImageSizeForAlbum(fileOrUrl, selectedSize) {
  if (!fileOrUrl) {
    return { valid: false, error: 'No image file provided for validation.' };
  }

  const cleanSize = String(selectedSize || '').toLowerCase().replace(/\s+/g, '');
  const spec = ALBUM_SIZE_SPECS[cleanSize];
  const fileName = typeof fileOrUrl === 'object' && fileOrUrl.name ? fileOrUrl.name : 'Image';

  // If no specific size restriction or not in standard specs, allow valid image
  if (!spec) {
    return { valid: true, fileName };
  }

  return new Promise((resolve) => {
    // If PDF file, allow (PDF renderer parses vector/bitmap spreads)
    if (typeof fileOrUrl === 'object' && (fileOrUrl.type === 'application/pdf' || fileOrUrl.name?.endsWith('.pdf'))) {
      resolve({ valid: true, fileName, isPdf: true });
      return;
    }

    const img = new Image();
    const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(url);

      if (!width || !height || width <= 0 || height <= 0) {
        resolve({
          valid: false,
          fileName,
          error: `Photo "${fileName}" cannot be read or has invalid 0×0 resolution.`
        });
        return;
      }

      const ratio = width / height;

      // Check if ratio matches any of the valid ratios within 22% tolerance (accommodates sensor vs print trim margin)
      const matches = spec.validRatios.some(expected => {
        return Math.abs(ratio - expected) / expected <= 0.22;
      });

      if (!matches) {
        resolve({
          valid: false,
          fileName,
          width,
          height,
          ratio: ratio.toFixed(2),
          error: `Photo "${fileName}" (${width}×${height}px, aspect ratio ${ratio.toFixed(2)}:1) does not match the required ${spec.name} dimensions (${spec.description}). Please upload photos formatted for ${selectedSize}.`
        });
      } else {
        resolve({
          valid: true,
          fileName,
          width,
          height,
          ratio: ratio.toFixed(2)
        });
      }
    };

    img.onerror = () => {
      if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(url);
      resolve({
        valid: false,
        fileName,
        error: `Photo "${fileName}" failed to load or is a corrupted image file.`
      });
    };

    img.src = url;
  });
}

