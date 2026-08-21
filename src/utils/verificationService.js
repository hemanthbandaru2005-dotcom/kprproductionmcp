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

function getLocalVerifications() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalVerifications(items) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
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
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .neq('album_id', 'CHAT_MESSAGE')
      .order('sent_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const unpacked = data.filter(item => item.album_id !== 'CHAT_MESSAGE').map(unpackVerification);
      // Sync to local
      const local = getLocalVerifications();
      const merged = [...unpacked];
      local.forEach(loc => {
        if (!merged.some(m => m.id === loc.id) && loc.album_id !== 'CHAT_MESSAGE') {
          merged.push(loc);
        }
      });
      saveLocalVerifications(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Supabase verifications table query failed, using local store:', err);
  }

  return getLocalVerifications().filter(item => item.album_id !== 'CHAT_MESSAGE').map(unpackVerification);
}

function matchClient(item, clientId, clientEmail) {
  if (!item) return false;
  const targetEmail = (clientEmail || '').trim().toLowerCase();
  const itemEmail = (item.client_email || '').trim().toLowerCase();
  const targetEmailNorm = targetEmail.replace('gamil.com', 'gmail.com');
  const itemEmailNorm = itemEmail.replace('gamil.com', 'gmail.com');

  // 1. Direct email match (exact or typo-tolerant)
  if (targetEmail && itemEmail && (targetEmail === itemEmail || targetEmailNorm === itemEmailNorm)) {
    return true;
  }

  // 2. Username prefix match (e.g. 'nani' matches 'nani@gmail.com' or 'nani@gamil.com')
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
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .neq('album_id', 'CHAT_MESSAGE')
      .order('sent_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const nonChat = data.filter(item => item.album_id !== 'CHAT_MESSAGE').map(unpackVerification);
      
      // Filter for this client by ID or Email
      const matching = nonChat.filter(item => matchClient(item, clientId, clientEmail));

      if (matching.length > 0) {
        return matching;
      }
    }
  } catch (err) {
    console.warn('Supabase client verifications query error, checking local store:', err);
  }

  // Fallback to local
  const localItems = getLocalVerifications().filter(item => item.album_id !== 'CHAT_MESSAGE').map(unpackVerification);
  const filtered = localItems.filter(item => matchClient(item, clientId, clientEmail));

  return filtered;
}

/**
 * Insert a new verification record
 */
export async function createVerification(payload) {
  const chosenPhotoItems = [...(payload.photo_items || [])];

  // Encode Verification / Drive Link into photo_items metadata payload
  const linkToAttach = (payload.verification_link || payload.drive_link || payload.link || '').trim();
  if (linkToAttach) {
    chosenPhotoItems.push({
      id: '__verification_link_meta__',
      type: 'verification_link',
      verification_link: linkToAttach,
      drive_link: linkToAttach,
      link_title: payload.link_title || 'Verification / Approval Link',
      drive_link_included: true
    });
  }

  const newId = `verif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Pure Supabase-compatible record matching existing columns
  const supabaseRecord = {
    id: newId,
    client_id: payload.client_id || (payload.client_email ? `client-${payload.client_email.split('@')[0]}` : null),
    client_name: payload.client_name || 'Client',
    client_email: (payload.client_email || '').trim().toLowerCase(),
    event_id: payload.event_id || null,
    event_title: payload.event_title || 'Color Lab Proofing Project',
    album_id: payload.album_id || null,
    album_title: payload.album_title || null,
    album_pages: payload.album_pages || [],
    photo_ids: payload.photo_ids || [],
    photo_items: chosenPhotoItems,
    status: 'pending',
    sent_at: new Date().toISOString(),
    responded_at: null,
    client_note: null,
    flagged_items: []
  };

  // 1. Try Supabase insert
  try {
    const { data, error } = await supabase
      .from('verifications')
      .insert([supabaseRecord])
      .select();

    if (!error && data && data.length > 0) {
      const unpacked = unpackVerification(data[0]);
      // Also sync to local
      const local = getLocalVerifications();
      saveLocalVerifications([unpacked, ...local.filter(x => x.id !== unpacked.id)]);
      notifyVerificationChange('CREATED', unpacked);
      return { data: unpacked, error: null };
    }
    if (error) {
      console.warn('Supabase verifications insert error:', error);
    }
  } catch (err) {
    console.warn('Could not insert directly to Supabase verifications, saving locally:', err);
  }

  // 2. Local fallback
  const localRecord = unpackVerification({
    id: newId,
    ...supabaseRecord,
    drive_link: payload.drive_link || null,
    drive_link_included: Boolean(payload.drive_link_included)
  });
  const local = getLocalVerifications();
  const updated = [localRecord, ...local.filter(x => x.id !== localRecord.id)];
  saveLocalVerifications(updated);
  notifyVerificationChange('CREATED', localRecord);

  return { data: localRecord, error: null };
}

/**
 * Persist or update drive link for an event/job
 */
export async function saveEventDriveLink(eventId, driveLink) {
  if (!eventId) return;
  try {
    await supabase
      .from('jobs')
      .update({ drive_link: driveLink || null })
      .eq('id', eventId);
  } catch (err) {
    console.warn('Could not update jobs.drive_link in Supabase:', err);
  }
}

/**
 * Update verification status (Approve or Request Changes)
 */
export async function updateVerificationStatus(id, { status, client_note, flagged_items }) {
  const updates = {
    status,
    responded_at: new Date().toISOString(),
    client_note: client_note || null,
    flagged_items: flagged_items || []
  };

  // 1. Try Supabase update
  try {
    const { data, error } = await supabase
      .from('verifications')
      .update(updates)
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      const unpacked = unpackVerification(data[0]);
      // Sync local
      const local = getLocalVerifications();
      saveLocalVerifications(local.map(item => item.id === id ? { ...item, ...unpacked } : item));
      notifyVerificationChange('STATUS_UPDATED', unpacked);
      return { data: unpacked, error: null };
    }
  } catch (err) {
    console.warn('Could not update Supabase verifications, updating locally:', err);
  }

  // 2. Local fallback
  const local = getLocalVerifications();
  const updated = local.map(item => item.id === id ? { ...item, ...updates } : item);
  saveLocalVerifications(updated);

  const matched = updated.find(x => x.id === id);
  const unpacked = unpackVerification(matched);
  notifyVerificationChange('STATUS_UPDATED', unpacked);
  return { data: unpacked, error: null };
}
