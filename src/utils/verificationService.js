import { supabase } from './supabaseClient';

export const AVAILABLE_ALBUMS = [
  {
    id: 'album-kpr-signature',
    title: 'KPR Signature Telugu Wedding Heirloom Album',
    subtitle: 'Flush Mount HD Archival Layflat Album',
    coverImage: '/albums/kpr_album/page_01.jpg',
    desc: 'Exclusive luxury Telugu wedding album designed and printed in KPR Color Lab on premium archival layflat paper.',
    pages: [
      '/albums/kpr_album/page_01.jpg',
      '/albums/kpr_album/page_02.jpg',
      '/albums/kpr_album/page_03.jpg',
      '/albums/kpr_album/page_04.jpg',
      '/albums/kpr_album/page_05.jpg',
      '/albums/kpr_album/page_06.jpg',
      '/albums/kpr_album/page_07.jpg',
      '/albums/kpr_album/page_08.jpg',
      '/albums/kpr_album/page_09.jpg',
      '/albums/kpr_album/page_10.jpg',
    ]
  },
  {
    id: 'album-royal-velvet',
    title: 'Royal Velvet Wedding Album',
    subtitle: 'Flush Mount 30-Sheet Layflat',
    coverImage: '/images/packages/user_pkg_trad_photo.png',
    desc: 'Handcrafted Italian leather album with metallic foil embossing and thick layflat archival sheets.',
    pages: [
      '/images/services/wedding_album_printing.png',
      '/images/services/large_format_printing.png',
      '/images/services/card_sticker_printing.png',
      '/images/services/acrylic_mdf_frames.png',
      '/images/services/photo_frames.png',
      '/images/services/flex_printing.png',
    ]
  },
  {
    id: 'album-editorial-fineart',
    title: 'Editorial Fine Art Book',
    subtitle: 'Silk Linen Hardcover',
    coverImage: '/images/packages/user_pkg_candid_photo.png',
    desc: 'Museum-grade matte cotton paper with custom typography layout for unforgettable wedding stories.',
    pages: [
      '/images/services/large_format_printing.png',
      '/images/services/photo_frames.png',
      '/images/services/acrylic_mdf_frames.png',
      '/images/services/wedding_album_printing.png',
      '/images/services/laser_printing.png',
      '/images/services/card_sticker_printing.png',
    ]
  },
  {
    id: 'album-cinematic-sunset',
    title: 'Cinematic Sunset Storybook',
    subtitle: 'Acrylic Glass Cover',
    coverImage: '/images/packages/user_pkg_cinematic_video.png',
    desc: 'High-definition acrylic front plate with metallic sheen pages capturing golden hour romance.',
    pages: [
      '/images/services/flex_printing.png',
      '/images/services/acrylic_mdf_frames.png',
      '/images/services/wedding_album_printing.png',
      '/images/services/large_format_printing.png',
      '/images/services/photo_frames.png',
      '/images/services/laser_printing.png',
    ]
  }
];

const LOCAL_STORAGE_KEY = 'kpr_verifications_db';
const DELETED_STORAGE_KEY = 'kpr_deleted_verifications_v1';

function getDeletedVerificationIds() {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getLocalVerifications() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const deleted = getDeletedVerificationIds();
    return list.filter(item => !deleted.includes(item.id));
  } catch (e) {
    return [];
  }
}

function saveLocalVerifications(items) {
  try {
    const deleted = getDeletedVerificationIds();
    const clean = items.filter(item => !deleted.includes(item.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Error saving local verifications:', e);
  }
}

/**
 * Unpacks verification object from Supabase (decoding verification / approval link from metadata or explicit columns)
 */
function unpackVerification(record) {
  if (!record) return record;
  let drive_link = record.drive_link || record.verification_link || record.proof_link || null;
  let verification_link = record.verification_link || record.proof_link || record.drive_link || null;
  let link_title = record.link_title || 'Verification / Approval Link';
  let drive_link_included = Boolean(record.drive_link_included || record.verification_link || record.proof_link || record.drive_link);
  let cleanPhotoItems = record.photo_items || [];

  if (Array.isArray(record.photo_items)) {
    const meta = record.photo_items.find(p => p?.id === '__drive_link_meta__' || p?.id === '__verification_link_meta__');
    if (meta) {
      const detectedLink = meta.verification_link || meta.proof_link || meta.drive_link || drive_link;
      drive_link = detectedLink;
      verification_link = detectedLink;
      link_title = meta.link_title || link_title;
      drive_link_included = true;
      cleanPhotoItems = record.photo_items.filter(p => p?.id !== '__drive_link_meta__' && p?.id !== '__verification_link_meta__');
    }
  }

  return {
    ...record,
    id: record.id || `verif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    drive_link,
    verification_link,
    link_title,
    drive_link_included: Boolean(verification_link || drive_link),
    photo_items: cleanPhotoItems
  };
}

function notifyVerificationChange(type, data) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('kpr_verifications_bc_v1');
      bc.postMessage({ type, data, timestamp: Date.now() });
      setTimeout(() => bc.close(), 200);
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_verifications_updated', { detail: { type, data } }));
    }
  } catch (e) {}
}

/**
 * Fetch all verifications for Admin
 */
export async function fetchVerificationsForAdmin() {
  const deletedIds = getDeletedVerificationIds();

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .neq('album_id', 'CHAT_MESSAGE')
      .order('sent_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const unpacked = data
        .filter(item => item.album_id !== 'CHAT_MESSAGE' && !deletedIds.includes(item.id))
        .map(unpackVerification);

      // Sync to local
      const local = getLocalVerifications();
      const merged = [...unpacked];
      local.forEach(loc => {
        if (!merged.some(m => m.id === loc.id) && loc.album_id !== 'CHAT_MESSAGE' && !deletedIds.includes(loc.id)) {
          merged.push(loc);
        }
      });
      saveLocalVerifications(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Supabase verifications table query failed, using local store:', err);
  }

  return getLocalVerifications()
    .filter(item => item.album_id !== 'CHAT_MESSAGE' && !deletedIds.includes(item.id))
    .map(unpackVerification);
}

function matchClient(item, clientId, clientEmail) {
  if (!item) return false;
  const targetEmail = (clientEmail || '').trim().toLowerCase();
  const itemEmail = (item.client_email || '').trim().toLowerCase();
  const targetEmailNorm = targetEmail.replace('gamil.com', 'gmail.com');
  const itemEmailNorm = itemEmail.replace('gamil.com', 'gmail.com');

  // 1. Direct email match
  if (targetEmail && itemEmail && (targetEmail === itemEmail || targetEmailNorm === itemEmailNorm)) {
    return true;
  }

  // 2. Username prefix match
  const targetUser = targetEmailNorm.split('@')[0];
  const itemUser = itemEmailNorm.split('@')[0];
  if (targetUser && itemUser && targetUser === itemUser) {
    return true;
  }

  // 3. Client ID match
  const tId = (clientId || '').trim().toLowerCase().replace(/^client-/, '');
  const iId = (item.client_id || '').trim().toLowerCase().replace(/^client-/, '');
  if (tId && iId && (tId === iId || tId.startsWith(iId) || iId.startsWith(tId))) {
    return true;
  }

  // 4. Client Name match if email is missing on record
  if (targetUser && item.client_name && item.client_name.toLowerCase().trim() === targetUser) {
    return true;
  }

  return false;
}

/**
 * Fetch verifications for a specific client (by ID or Email)
 */
export async function fetchVerificationsForClient(clientId, clientEmail = '') {
  const deletedIds = getDeletedVerificationIds();

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .neq('album_id', 'CHAT_MESSAGE')
      .order('sent_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const nonChat = data
        .filter(item => item.album_id !== 'CHAT_MESSAGE' && !deletedIds.includes(item.id))
        .map(unpackVerification);
      
      const matching = nonChat.filter(item => matchClient(item, clientId, clientEmail));
      if (matching.length > 0) {
        return matching;
      }
    }
  } catch (err) {
    console.warn('Supabase client verifications query error, checking local store:', err);
  }

  // Fallback to local
  const localItems = getLocalVerifications()
    .filter(item => item.album_id !== 'CHAT_MESSAGE' && !deletedIds.includes(item.id))
    .map(unpackVerification);
  return localItems.filter(item => matchClient(item, clientId, clientEmail));
}

/**
 * Insert a new verification record
 */
export async function createVerification(payload) {
  const chosenPhotoItems = [...(payload.photo_items || [])];

  const linkToAttach = (payload.verification_link || payload.drive_link || payload.link || '').trim();
  if (linkToAttach) {
    chosenPhotoItems.push({
      id: '__verification_link_meta__',
      type: 'verification_link',
      verification_link: linkToAttach,
      drive_link: linkToAttach,
      link_title: payload.link_title || 'Verification / Approval Link',
      url: linkToAttach,
      title: 'Verification Link'
    });
  }

  const newRecord = {
    id: `verif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    client_id: payload.client_id || 'client-default',
    client_name: payload.client_name || 'Valued Client',
    client_email: payload.client_email || null,
    event_title: payload.event_title || 'Event Verification',
    album_id: payload.album_id || null,
    album_title: payload.album_title || 'Album Proof',
    album_pages: payload.album_pages || [],
    photo_ids: (payload.photo_items || []).map(p => p.id),
    photo_items: chosenPhotoItems,
    drive_link: linkToAttach || null,
    verification_link: linkToAttach || null,
    status: 'pending',
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_note: null,
    flagged_items: []
  };

  // 1. Save to local storage for instantaneous reactivity
  const local = getLocalVerifications();
  const updatedLocal = [newRecord, ...local];
  saveLocalVerifications(updatedLocal);

  // 2. Try inserting into Supabase verifications table
  try {
    const supabasePayload = {
      id: newRecord.id,
      client_id: newRecord.client_id,
      client_name: newRecord.client_name,
      client_email: newRecord.client_email,
      event_title: newRecord.event_title,
      album_id: newRecord.album_id,
      album_title: newRecord.album_title,
      album_pages: newRecord.album_pages,
      photo_ids: newRecord.photo_ids,
      photo_items: chosenPhotoItems,
      drive_link: linkToAttach || null,
      verification_link: linkToAttach || null,
      status: 'pending',
      sent_at: newRecord.sent_at,
      updated_at: newRecord.updated_at
    };

    const { data, error } = await supabase
      .from('verifications')
      .insert([supabasePayload])
      .select()
      .single();

    if (!error && data) {
      notifyVerificationChange('created', unpackVerification(data));
      return { data: unpackVerification(data), error: null };
    }
  } catch (err) {
    console.warn('Supabase verifications insert notice (using local storage fallback):', err);
  }

  notifyVerificationChange('created', newRecord);
  return { data: newRecord, error: null };
}

/**
 * Permanently delete a verification record (Admin action)
 */
export async function deleteVerification(id) {
  if (!id) return { success: false };

  // 1. Add to permanent deleted tracking
  try {
    const deleted = getDeletedVerificationIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deleted));
    }

    // 2. Remove from local store
    const local = getLocalVerifications();
    const updated = local.filter(item => item.id !== id);
    saveLocalVerifications(updated);
  } catch (e) {}

  // 3. Delete from Supabase
  try {
    await supabase.from('verifications').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase delete verification error:', e);
  }

  notifyVerificationChange('deleted', { id });
  return { success: true };
}

/**
 * Update verification status
 */
export async function updateVerificationStatus(id, { status, client_note, flagged_items }) {
  const updatePayload = {
    status,
    client_note: client_note || null,
    flagged_items: flagged_items || [],
    updated_at: new Date().toISOString()
  };

  // 1. Update local
  const local = getLocalVerifications();
  const updatedLocal = local.map(item => {
    if (item.id === id) {
      return { ...item, ...updatePayload };
    }
    return item;
  });
  saveLocalVerifications(updatedLocal);

  // 2. Update Supabase
  try {
    const { data, error } = await supabase
      .from('verifications')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      notifyVerificationChange('status_updated', unpackVerification(data));
      return { data: unpackVerification(data), error: null };
    }
  } catch (err) {
    console.warn('Supabase update verification error:', err);
  }

  notifyVerificationChange('status_updated', { id, ...updatePayload });
  return { data: { id, ...updatePayload }, error: null };
}

/**
 * Legacy Helper: Save event Drive Link directly
 */
export async function saveEventDriveLink(jobId, driveUrl, clientName = '', eventTitle = '') {
  return createVerification({
    client_id: `client-${jobId}`,
    client_name: clientName || 'Valued Client',
    event_title: eventTitle || 'Client Event Drive Link',
    verification_link: driveUrl,
    drive_link: driveUrl,
    album_pages: [],
    photo_items: []
  });
}
