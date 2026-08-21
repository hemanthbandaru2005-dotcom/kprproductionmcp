import { supabase } from './supabaseClient';

export const PHOTOGRAPHY_CATEGORIES = [
  'Wedding',
  'Pre Wedding',
  'Engagement',
  'Haldi',
  'Reception',
  'Birthday',
  '21',
  'Modeling',
  'Maternity',
  'Nature',
  'Panchalu',
  'Saree Function',
  'Portraits',
  'Commercial',
  'Events'
];

export const COLORLAB_CATEGORIES = [
  'Prints',
  'Canvas',
  'Framed',
  'Restoration',
  'Large Format',
  'Album Artistry',
  'Stationery & Invites'
];

const LOCAL_STORAGE_KEY = 'kpr_custom_site_photos_v1';

function getLocalCustomPhotos() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizePhotoRow);
      }
    }
  } catch (e) {}
  return [];
}

function saveLocalCustomPhotos(photos) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {}
}

/**
 * Ensures gallery field is strictly 'photography' or 'colorlab' without ambiguity
 */
function sanitizePhotoRow(photo) {
  if (!photo) return photo;
  let gallery = (photo.gallery || '').toLowerCase().trim();
  
  // If gallery wasn't set, deduce from category
  if (!gallery || (gallery !== 'photography' && gallery !== 'colorlab')) {
    if (COLORLAB_CATEGORIES.includes(photo.category)) {
      gallery = 'colorlab';
    } else {
      gallery = 'photography';
    }
  }

  return {
    ...photo,
    gallery
  };
}

/**
 * Fetch ONLY admin-added custom site photos strictly for the requested gallery.
 * @param {'photography' | 'colorlab'} gallery
 */
export async function fetchCustomSitePhotos(gallery = 'photography') {
  const targetGallery = (gallery || 'photography').toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('site_photos')
      .select('*')
      .eq('gallery', targetGallery)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      // Sync local cache with real database
      const sanitized = data
        .map(sanitizePhotoRow)
        .filter(p => p.gallery === targetGallery);
      
      const local = getLocalCustomPhotos().filter(p => p.gallery !== targetGallery);
      saveLocalCustomPhotos([...sanitized, ...local]);

      return sanitized;
    }
    
    if (error) {
      console.warn('Supabase site_photos query returned error:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase site_photos query failed:', err);
  }

  const local = getLocalCustomPhotos();
  return local.filter(p => p.gallery === targetGallery);
}

/**
 * Add a new admin photo strictly tagged with the active gallery.
 */
export async function addCustomSitePhoto({ gallery, category, file_url, title, display_order, uploaded_by }) {
  const strictGallery = (gallery || 'photography').toLowerCase().trim();
  const validGallery = (strictGallery === 'colorlab') ? 'colorlab' : 'photography';

  const newRow = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    gallery: validGallery,
    category: category || (validGallery === 'photography' ? 'Wedding' : 'Prints'),
    title: title || `${category} Showcase`,
    file_url,
    display_order: Number(display_order) || 1,
    uploaded_by: uploaded_by || 'Admin',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('site_photos')
      .insert([newRow])
      .select();

    if (!error && data && data.length > 0) {
      const sanitized = sanitizePhotoRow(data[0]);
      const local = getLocalCustomPhotos().filter(p => p.id !== sanitized.id);
      saveLocalCustomPhotos([sanitized, ...local]);
      return { data: sanitized, error: null };
    }

    if (error) {
      console.error('Supabase site_photos insert error:', error);
      // Still save locally so admin doesn't lose work, but bubble up note
      const local = getLocalCustomPhotos();
      saveLocalCustomPhotos([newRow, ...local]);
      return { 
        data: newRow, 
        error: error.message?.includes('schema cache') || error.code === 'PGRST205'
          ? "Database table 'site_photos' needs to be created in Supabase SQL editor."
          : error.message 
      };
    }
  } catch (err) {
    console.error('Supabase site_photos network exception:', err);
  }

  const local = getLocalCustomPhotos();
  saveLocalCustomPhotos([newRow, ...local]);
  return { data: newRow, error: null };
}

/**
 * Delete a custom admin photo.
 */
export async function deleteCustomSitePhoto(photoId) {
  try {
    const { error } = await supabase
      .from('site_photos')
      .delete()
      .eq('id', photoId);

    if (!error) {
      const local = getLocalCustomPhotos();
      saveLocalCustomPhotos(local.filter(p => p.id !== photoId));
      return { error: null };
    }
  } catch (err) {
    console.warn('Supabase site_photos delete error, removing locally:', err);
  }

  const local = getLocalCustomPhotos();
  saveLocalCustomPhotos(local.filter(p => p.id !== photoId));
  return { error: null };
}
