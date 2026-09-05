import { supabase } from './supabaseClient';

export const AVAILABLE_ALBUMS = [
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
    ],
    size: null
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
    ],
    size: null
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
    ],
    size: null
  }
];

const LOCAL_STORAGE_KEY = 'kpr_verifications_db';
const DELETED_STORAGE_KEY = 'kpr_deleted_verifications_v1';

const SYSTEM_ALBUM_IDS = [
  'CHAT_MESSAGE',
  'SYSTEM_JOB_REGISTRY',
  'SYSTEM_WORKER_REGISTRY',
  'SYSTEM_CLIENT_REGISTRY',
  'SYSTEM_DELETED_REGISTRY',
  'SYSTEM_DELETED_VERIFICATIONS'
];

export function getDeletedVerificationIds() {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletedVerificationIds(ids) {
  try {
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (e) {}
}

/**
 * Retrieves all globally deleted verification IDs from Supabase + localStorage
 * Ensures that if Admin deletes on Laptop A, Laptop B instantly knows it's deleted.
 */
export async function getCloudDeletedVerificationIds() {
  const localDeleted = getDeletedVerificationIds();
  const deletedSet = new Set(localDeleted);

  try {
    const { data } = await supabase
      .from('verifications')
      .select('id, client_id, status, album_id')
      .or('album_id.eq.SYSTEM_DELETED_REGISTRY,album_id.eq.SYSTEM_DELETED_VERIFICATIONS,status.eq.deleted');

    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.id) deletedSet.add(item.id);
        if (item.client_id && item.client_id !== 'DELETED_VERIFICATION') deletedSet.add(item.client_id);
      });
    }
  } catch (e) {}

  const mergedList = Array.from(deletedSet);
  saveDeletedVerificationIds(mergedList);
  return mergedList;
}

export function getLocalVerifications() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const deleted = getDeletedVerificationIds();
    return list.filter(item => {
      if (!item || !item.id) return false;
      if (deleted.includes(item.id) || (item.client_id && deleted.includes(item.client_id))) return false;
      if (item.status === 'deleted') return false;
      if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
      return true;
    });
  } catch (e) {
    return [];
  }
}

export function saveLocalVerifications(items) {
  try {
    const deleted = getDeletedVerificationIds();
    const clean = (Array.isArray(items) ? items : []).filter(item => {
      if (!item || !item.id) return false;
      if (deleted.includes(item.id) || (item.client_id && deleted.includes(item.client_id))) return false;
      if (item.status === 'deleted') return false;
      if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
      return true;
    });
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
    album_size: record.album_size || record.size || null,
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
 * Fetch all verifications for Admin (Global cloud sync)
 */
export async function fetchVerificationsForAdmin() {
  const deletedIds = await getCloudDeletedVerificationIds();

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const validRecords = data
        .filter(item => {
          if (!item || !item.id) return false;
          if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
          if (item.status === 'deleted') return false;
          if (deletedIds.includes(item.id) || (item.client_id && deletedIds.includes(item.client_id))) return false;
          return true;
        })
        .map(unpackVerification);

      // Save strictly the clean valid records to local storage
      saveLocalVerifications(validRecords);
      return validRecords;
    }
  } catch (err) {
    console.warn('Supabase verifications table query failed, using local store:', err);
  }

  return getLocalVerifications()
    .filter(item => {
      if (!item || !item.id) return false;
      if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
      if (item.status === 'deleted') return false;
      if (deletedIds.includes(item.id) || (item.client_id && deletedIds.includes(item.client_id))) return false;
      return true;
    })
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
  const deletedIds = await getCloudDeletedVerificationIds();

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .order('sent_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const validRecords = data
        .filter(item => {
          if (!item || !item.id) return false;
          if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
          if (item.status === 'deleted') return false;
          if (deletedIds.includes(item.id) || (item.client_id && deletedIds.includes(item.client_id))) return false;
          return true;
        })
        .map(unpackVerification);

      saveLocalVerifications(validRecords);
      const matching = validRecords.filter(item => matchClient(item, clientId, clientEmail));
      return matching;
    }
  } catch (err) {
    console.warn('Supabase client verifications query error, checking local store:', err);
  }

  // Fallback to local
  const localItems = getLocalVerifications()
    .filter(item => {
      if (!item || !item.id) return false;
      if (SYSTEM_ALBUM_IDS.includes(item.album_id)) return false;
      if (item.status === 'deleted') return false;
      if (deletedIds.includes(item.id) || (item.client_id && deletedIds.includes(item.client_id))) return false;
      return true;
    })
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
    id: `verif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    client_id: payload.client_id || 'client-default',
    client_name: payload.client_name || 'Valued Client',
    client_email: payload.client_email || null,
    event_title: payload.event_title || 'Event Verification',
    album_id: payload.album_id || null,
    album_title: payload.album_title || 'Album Proof',
    album_pages: payload.album_pages || [],
    album_size: payload.album_size || payload.size || null,
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
 * Deletes from Supabase, registers cloud tombstone, and removes from local storage across all devices.
 */
export async function deleteVerification(id) {
  if (!id) return { success: false };

  // 1. Add to permanent local deleted tracking
  try {
    const deleted = getDeletedVerificationIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      saveDeletedVerificationIds(deleted);
    }

    // 2. Remove from local store
    const local = getLocalVerifications();
    const updated = local.filter(item => item.id !== id && item.client_id !== id);
    saveLocalVerifications(updated);
  } catch (e) {}

  // 3. Delete row from Supabase verifications table
  try {
    await supabase.from('verifications').delete().eq('id', id);
    await supabase.from('verifications').delete().eq('client_id', id);
  } catch (e) {
    console.warn('Supabase delete verification error:', e);
  }

  // 4. Mark / Tombstone in Supabase so other laptops instantly drop the record
  try {
    const tombstoneId = `del_${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    await supabase.from('verifications').upsert([{
      id: tombstoneId,
      album_id: 'SYSTEM_DELETED_REGISTRY',
      client_id: id,
      client_name: 'DELETED_VERIFICATION',
      status: 'deleted',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }], { onConflict: 'id' });
  } catch (e) {
    console.warn('Supabase tombstone insert error:', e);
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
