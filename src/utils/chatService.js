import { supabase } from './supabaseClient';

const CHAT_ALBUM_FLAG = 'CHAT_MESSAGE';
const CHAT_EVENT_ID_PREFIX = 'thread_';
const LOCAL_CHAT_KEY = 'kpr_staff_chats_v1';
const SHARED_CHANNEL_NAME = 'kpr_studio_realtime_chat_v1';

let _chatBc = null;
function getChatBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_chatBc) {
    try {
      _chatBc = new BroadcastChannel('kpr_studio_chat_bc_v1');
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }
  }
  return _chatBc;
}

const _listeners = {
  new_message: new Set(),
  messages_read: new Set(),
  chat_cleared: new Set()
};

let _sharedChannel = null;

export function ensureSharedChannel() {
  if (_sharedChannel) return _sharedChannel;

  try {
    _sharedChannel = supabase.channel(SHARED_CHANNEL_NAME, {
      config: {
        broadcast: { self: true },
        presence: { key: 'studio_chat_presence' }
      }
    });

    _sharedChannel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload) {
          _listeners.new_message.forEach(fn => fn(payload));
        }
      })
      .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
        if (payload) {
          _listeners.messages_read.forEach(fn => fn(payload));
        }
      })
      .on('broadcast', { event: 'chat_cleared' }, ({ payload }) => {
        if (payload) {
          _listeners.chat_cleared.forEach(fn => fn(payload));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'verifications' }, (payload) => {
        if (payload?.new && payload.new.album_id === CHAT_ALBUM_FLAG) {
          const msg = normalizeMessage(payload.new);
          if (msg) {
            const local = getLocalMessages().filter(m => m && m.id !== msg.id);
            saveLocalMessages([...local, msg]);
            _listeners.new_message.forEach(fn => fn(msg));
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'verifications' }, (payload) => {
        if (payload?.new && payload.new.album_id === CHAT_ALBUM_FLAG) {
          const msg = normalizeMessage(payload.new);
          if (msg) {
            _listeners.messages_read.forEach(fn => fn({ worker_id: msg.worker_id, thread_id: msg.thread_id }));
          }
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Chat channel error, will attempt reconnect...');
          _sharedChannel = null;
        }
      });
  } catch (err) {
    console.warn('ensureSharedChannel init error:', err);
  }

  return _sharedChannel;
}

export const DEFAULT_DEMO_WORKERS = [];

function getLocalMessages() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(LOCAL_CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalMessages(msgs) {
  try {
    if (typeof localStorage !== 'undefined' && Array.isArray(msgs)) {
      localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(msgs));
    }
  } catch (e) {
    console.error('Error saving local chat messages:', e);
  }
}

/**
 * Formats a clean human-readable name from an email or worker ID
 */
export function formatNameFromEmailOrId(input) {
  if (!input || typeof input !== 'string') return 'Team Member';
  if (input.includes(' ') && !input.includes('@')) return input;

  let raw = input;
  if (raw.includes('@')) {
    raw = raw.split('@')[0];
  }
  if (raw.startsWith('worker-') || raw.startsWith('worker_')) {
    raw = raw.replace(/^worker[-_]/, '');
  }
  const words = raw.split(/[\._\-]+/).filter(Boolean);
  if (words.length === 0) return input;
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Normalizes a raw Supabase record into a clean Chat Message object
 */
export function normalizeMessage(record) {
  if (!record) return null;
  const meta = Array.isArray(record.photo_items) && record.photo_items[0] ? record.photo_items[0] : {};
  const isMsgAdmin = (record.status === 'admin') || (meta.sender_role === 'admin');
  const role = isMsgAdmin ? 'admin' : 'staff';

  const defaultAdminName = 'KPR Fotography Admin';
  const defaultWorkerName = formatNameFromEmailOrId(record.client_id || 'Staff Member');

  const senderName = meta.sender_name ||
    (isMsgAdmin ? (record.event_title?.startsWith('Admin: ') ? record.event_title.replace('Admin: ', '') : defaultAdminName) : (record.client_name || defaultWorkerName));

  const imageUrl = record.image_url || meta.image_url || null;

  return {
    id: record.id || meta.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    thread_id: record.event_id || `thread_${record.client_id || 'unknown'}`,
    worker_id: record.client_id || meta.worker_id || 'worker-user',
    sender_id: meta.sender_id || (isMsgAdmin ? 'admin_user' : record.client_id),
    sender_name: senderName,
    sender_role: role,
    content: record.client_note || meta.content || '',
    image_url: imageUrl,
    created_at: record.sent_at || record.created_at || new Date().toISOString(),
    read_at: record.responded_at || meta.read_at || null
  };
}

export function normalizeWorkerId(raw) {
  if (!raw || typeof raw !== 'string') return 'worker-default';
  let id = raw.trim().toLowerCase();
  if (id.includes('@')) {
    id = id.split('@')[0];
  }
  // Strip any existing prefix
  id = id.replace(/^(worker[-_]|staff[-_]|client[-_])/, '');
  return `worker-${id}`;
}

/**
 * Comprehensive worker matching that resolves any identifier
 * (email, worker-id, username, thread ID, or sender name)
 */
export function matchesWorker(m, workerIdentifier) {
  if (!m || !workerIdentifier) return false;
  const target = String(workerIdentifier).toLowerCase().trim();
  const targetNorm = normalizeWorkerId(target);
  const targetClean = target.replace(/^(worker[-_]|staff[-_]|client[-_])/, '');
  const targetUser = target.includes('@') ? target.split('@')[0] : targetClean;

  const msgWorker = String(m.worker_id || '').toLowerCase().trim();
  const msgNorm = normalizeWorkerId(msgWorker);
  const msgClean = msgWorker.replace(/^(worker[-_]|staff[-_]|client[-_])/, '');
  const msgThread = String(m.thread_id || '').replace(/^thread_/, '').toLowerCase().trim();
  const msgThreadNorm = normalizeWorkerId(msgThread);
  const msgSender = String(m.sender_name || '').toLowerCase().trim();

  const candidateIds = new Set([target, targetNorm, targetClean, targetUser]);

  return candidateIds.has(msgWorker) ||
    candidateIds.has(msgNorm) ||
    candidateIds.has(msgClean) ||
    candidateIds.has(msgThread) ||
    candidateIds.has(msgThreadNorm) ||
    (m.sender_role === 'staff' && (candidateIds.has(msgSender) || (targetUser.length > 2 && msgSender.includes(targetUser))));
}

const FAKE_WORKER_PATTERNS = [
  'rajesh.lead@kpr.com',
  'priya.editor@kpr.com',
  'vikram.drone@kpr.com',
  'worker-rajesh',
  'worker-priya',
  'worker-vikram',
  'worker-123'
];

function isFakeWorker(worker) {
  if (!worker) return true;
  const email = (worker.email || '').toLowerCase();
  const id = (worker.id || '').toLowerCase();
  const name = (worker.full_name || '').toLowerCase();

  return FAKE_WORKER_PATTERNS.some(p => email.includes(p) || id.includes(p)) ||
    name.includes('lead cinematographer & editor') ||
    name.includes('color lab senior editor') ||
    name.includes('avata fpv & drone pilot');
}

/**
 * Resolves any worker identifier (email, username, UUID, or worker-id) to canonical 'worker-username'
 */
export function resolveWorkerEmailId(workerId) {
  if (!workerId) return 'worker-default';
  const str = String(workerId).trim().toLowerCase();
  
  if (str.includes('@')) {
    return normalizeWorkerId(str.split('@')[0]);
  }
  
  if (isUUID(str) || str.startsWith('worker_reg_')) {
    try {
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const match = parsed.find(w => w && (w.id === workerId || w.id?.toLowerCase() === str));
        if (match && match.email) {
          return normalizeWorkerId(match.email);
        }
      }
    } catch (e) {}
  }

  return normalizeWorkerId(str);
}

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Fetch real registered workers from Supabase and active chat message records
 * Deduplicates by email and canonical worker ID
 */
export async function fetchWorkersForChat() {
  const workerByEmail = new Map();
  const workerById = new Map();

  function addWorker(wObj) {
    if (!wObj || isFakeWorker(wObj)) return;
    const email = (wObj.email || '').toLowerCase().trim();
    const key = email || wObj.id || '';
    if (!key) return;

    if (email && workerByEmail.has(email)) {
      const existing = workerByEmail.get(email);
      if (wObj.id && !existing.id?.includes('-') && wObj.id.includes('-')) {
        existing.id = wObj.id;
      }
      if (wObj.full_name && (!existing.full_name || existing.full_name === formatNameFromEmailOrId(email))) {
        existing.full_name = wObj.full_name;
      }
      return;
    }

    if (email) {
      workerByEmail.set(email, { ...wObj });
    } else {
      workerById.set(wObj.id, { ...wObj });
    }
  }

  // 1. Include default studio staff team members
  const defaultWorkers = [
    { id: 'worker-primary', full_name: 'Studio Senior Photographer', email: 'worker@kpr.com', role: 'worker', status: 'active', skill: 'Photographer & Cinematographer' },
    { id: 'worker-editor', full_name: 'Color Lab Senior Editor', email: 'editor@kpr.com', role: 'worker', status: 'active', skill: 'Album Layout & Color Grading' },
    { id: 'worker-staff', full_name: 'Studio Operations Staff', email: 'staff@kpr.com', role: 'worker', status: 'active', skill: 'Production & Field Crew' }
  ];
  defaultWorkers.forEach(addWorker);

  // 2. Fetch from Supabase verifications chat records (all active worker conversations)
  try {
    const { data: cData, error: cErr } = await supabase
      .from('verifications')
      .select('client_id, client_name, client_email, photo_items')
      .eq('album_id', CHAT_ALBUM_FLAG)
      .order('sent_at', { ascending: false });

    if (!cErr && Array.isArray(cData)) {
      cData.forEach(item => {
        const rawId = item.client_id || '';
        const email = item.client_email?.toLowerCase().trim() || (rawId.includes('@') ? rawId.toLowerCase().trim() : `${rawId.replace(/^worker[-_]/, '')}@kpr.com`);
        const name = item.client_name || formatNameFromEmailOrId(rawId || email);
        if (rawId || email) {
          addWorker({
            id: rawId || `worker-${email.split('@')[0]}`,
            full_name: name,
            email: email,
            role: 'worker',
            status: 'active',
            skill: 'Photographer / Editor'
          });
        }
      });
    }
  } catch (err) {}

  // 3. Fetch from Supabase verifications cloud registry
  try {
    const { data: vData, error: vErr } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', 'SYSTEM_WORKER_REGISTRY')
      .order('sent_at', { ascending: false });

    if (!vErr && Array.isArray(vData)) {
      vData.forEach(item => {
        const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
        const email = (item.client_email || meta.email || '').toLowerCase().trim();
        addWorker({
          id: item.id || `worker-${item.client_id || email.split('@')[0]}`,
          full_name: meta.full_name || item.client_name || formatNameFromEmailOrId(email),
          email: email,
          role: 'worker',
          status: item.status || 'active',
          skill: meta.skill || 'Photographer / Editor'
        });
      });
    }
  } catch (err) {}

  // 4. Fetch from Supabase profiles table
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('full_name', { ascending: true });

    if (!error && Array.isArray(data)) {
      data.forEach(w => {
        if (w && w.id) {
          addWorker({
            id: w.id,
            full_name: w.full_name || formatNameFromEmailOrId(w.email),
            email: (w.email || '').toLowerCase().trim(),
            role: 'worker',
            status: w.status || 'active',
            skill: w.skill || 'Photographer / Editor'
          });
        }
      });
    }
  } catch (err) {}

  // 5. Merge from localStorage added workers
  try {
    const raw = localStorage.getItem('kpr_registered_workers_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    const deleted = localStorage.getItem('kpr_deleted_workers_v1') ? JSON.parse(localStorage.getItem('kpr_deleted_workers_v1')) : [];

    parsed.forEach(w => {
      if (w && w.email && !deleted.includes(w.email.toLowerCase())) {
        addWorker({
          id: w.id || `worker-${w.email.split('@')[0]}`,
          full_name: w.full_name || formatNameFromEmailOrId(w.email),
          email: (w.email || '').toLowerCase().trim(),
          role: 'worker',
          status: 'active',
          skill: w.skill || 'Photographer / Editor'
        });
      }
    });

    deleted.forEach(delEmail => {
      workerByEmail.delete(delEmail.toLowerCase().trim());
    });
  } catch (e) {}

  return [...workerByEmail.values(), ...workerById.values()];
}

/**
 * Fetch all recent messages across all threads from Supabase Database (Single Unified Source of Truth)
 */
export async function fetchAllChatThreadsForAdmin() {
  const currentLocal = getLocalMessages();
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', CHAT_ALBUM_FLAG)
      .order('sent_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      const remoteMsgs = data.map(normalizeMessage).filter(Boolean);
      const map = new Map();
      currentLocal.forEach(m => { if (m && m.id) map.set(m.id, m); });
      remoteMsgs.forEach(m => { if (m && m.id) map.set(m.id, m); });

      const merged = Array.from(map.values()).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      saveLocalMessages(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching all chat records from Supabase database:', err);
  }

  return currentLocal;
}

/**
 * Fetch all chat messages for a specific worker's 1:1 thread with Admin
 * Uses the unified all-messages dataset and filters with matchesWorker to guarantee 100% synchronization.
 */
export async function fetchMessagesForWorker(workerId) {
  if (!workerId) return [];
  const allMessages = await fetchAllChatThreadsForAdmin();
  return allMessages.filter(m => matchesWorker(m, workerId));
}

/**
 * Send a new private message (text + image attachment) and save directly into Supabase Database
 */
export async function sendChatMessage({ workerId, senderId, senderName, senderRole, content, imageUrl = null }) {
  if (!workerId || (!content?.trim() && !imageUrl)) return null;

  const normalizedRole = (senderRole === 'admin' || senderRole === 'Admin') ? 'admin' : 'staff';
  const emailBasedId = resolveWorkerEmailId(workerId);
  const normalizedWorkerId = emailBasedId;
  const threadId = `${CHAT_EVENT_ID_PREFIX}${normalizedWorkerId}`;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();
  const cleanContent = (content || '').trim();
  const cleanSenderName = senderName || (normalizedRole === 'admin' ? 'KPR Fotography Admin' : 'Staff Worker');

  const msgPayload = {
    id: msgId,
    thread_id: threadId,
    worker_id: normalizedWorkerId,
    sender_id: senderId || (normalizedRole === 'admin' ? 'admin_user' : normalizedWorkerId),
    sender_name: cleanSenderName,
    sender_role: normalizedRole,
    content: cleanContent,
    image_url: imageUrl || null,
    created_at: timestamp,
    read_at: null
  };

  // 1. Broadcast immediately on instant BroadcastChannel & shared Realtime channel
  try {
    const bc = getChatBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'new_message', payload: msgPayload });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_chat_new_msg', { detail: msgPayload }));
    }

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: msgPayload
    }).catch(e => console.warn('Broadcast send catch:', e));
  } catch (bErr) {
    console.warn('Broadcast channel error:', bErr);
  }

  // 2. Persist to Supabase Database
  const supabaseRecord = {
    client_id: normalizedWorkerId,
    client_name: normalizedRole === 'staff' ? cleanSenderName : 'Staff Worker',
    client_email: `${normalizedWorkerId}@kpr.com`,
    event_id: threadId,
    event_title: `Admin: ${cleanSenderName}`,
    album_id: CHAT_ALBUM_FLAG,
    client_note: cleanContent,
    image_url: imageUrl || null,
    status: normalizedRole,
    sent_at: timestamp,
    responded_at: null,
    photo_items: [{
      id: msgId,
      sender_id: msgPayload.sender_id,
      sender_name: cleanSenderName,
      sender_role: normalizedRole,
      worker_id: normalizedWorkerId,
      content: cleanContent,
      image_url: imageUrl || null,
      read_at: null
    }]
  };

  try {
    const { data, error } = await supabase
      .from('verifications')
      .insert([supabaseRecord])
      .select();

    if (!error && Array.isArray(data) && data.length > 0) {
      const normalized = normalizeMessage(data[0]);
      const local = getLocalMessages().filter(m => m && m.id !== msgId && m.id !== normalized.id);
      saveLocalMessages([...local, normalized]);
      return normalized;
    }
  } catch (err) {
    console.warn('Notice while persisting message to database (stored in local broadcast):', err);
  }

  // 3. Local save fallback
  const local = getLocalMessages().filter(m => m && m.id !== msgId);
  saveLocalMessages([...local, msgPayload]);
  return msgPayload;
}

/**
 * Mark messages in a thread as read in Supabase Database and local store
 */
export async function markThreadAsRead(workerId, readerRole = 'admin') {
  if (!workerId) return;
  const normalizedWorkerId = normalizeWorkerId(workerId);
  const now = new Date().toISOString();
  const isReaderStaff = readerRole === 'staff' || readerRole === 'worker';
  const targetSenderRole = isReaderStaff ? 'admin' : 'staff';

  try {
    const bc = getChatBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'messages_read',
        payload: { worker_id: normalizedWorkerId, reader_role: readerRole, read_at: now }
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_chat_messages_read', {
        detail: { worker_id: normalizedWorkerId, reader_role: readerRole, read_at: now }
      }));
    }

    await supabase
      .from('verifications')
      .update({ responded_at: now })
      .eq('album_id', CHAT_ALBUM_FLAG)
      .eq('status', targetSenderRole)
      .or(`client_id.eq.${workerId},client_id.eq.${normalizedWorkerId},event_id.eq.thread_${normalizedWorkerId},event_id.eq.thread_${workerId}`)
      .is('responded_at', null);

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'messages_read',
      payload: { worker_id: normalizedWorkerId, reader_role: readerRole, read_at: now }
    }).catch(e => console.warn('Broadcast send catch:', e));
  } catch (err) {
    console.warn('Error marking messages as read in database:', err);
  }

  const local = getLocalMessages().map(m => {
    if (matchesWorker(m, workerId) && m.sender_role === targetSenderRole && !m.read_at) {
      return { ...m, read_at: now };
    }
    return m;
  });
  saveLocalMessages(local);
}

/**
 * Clear all chat messages across all threads in Supabase Database and local storage
 */
export async function clearAllChatHistory() {
  try {
    const bc = getChatBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'chat_cleared', payload: { all: true } });
    }

    await supabase
      .from('verifications')
      .delete()
      .eq('album_id', CHAT_ALBUM_FLAG);

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'chat_cleared',
      payload: { all: true }
    }).catch(e => console.warn('Broadcast send catch:', e));
  } catch (e) {}

  saveLocalMessages([]);
}

/**
 * Clear all messages for a specific worker thread
 */
export async function clearThreadMessages(workerId) {
  if (!workerId) return;
  const normalizedWorkerId = normalizeWorkerId(workerId);
  const threadId = `${CHAT_EVENT_ID_PREFIX}${normalizedWorkerId}`;

  try {
    await supabase
      .from('verifications')
      .delete()
      .eq('album_id', CHAT_ALBUM_FLAG)
      .or(`client_id.eq.${workerId},client_id.eq.${normalizedWorkerId},event_id.eq.${threadId},event_id.eq.thread_${workerId}`);
  } catch (e) {}

  const local = getLocalMessages().filter(m => !matchesWorker(m, workerId));
  saveLocalMessages(local);
}

/**
 * Subscribe to real-time chat updates
 */
export function subscribeToChatChannel(onNewMessage, onMessageUpdated, onCleared) {
  ensureSharedChannel();

  if (onNewMessage) _listeners.new_message.add(onNewMessage);
  if (onMessageUpdated) _listeners.messages_read.add(onMessageUpdated);
  if (onCleared) _listeners.chat_cleared.add(onCleared);

  const handleCustomEvent = (e) => {
    if (e.detail && onNewMessage) onNewMessage(e.detail);
  };
  const handleReadEvent = (e) => {
    if (e.detail && onMessageUpdated) onMessageUpdated(e.detail);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('kpr_chat_new_msg', handleCustomEvent);
    window.addEventListener('kpr_chat_messages_read', handleReadEvent);
  }

  return () => {
    if (onNewMessage) _listeners.new_message.delete(onNewMessage);
    if (onMessageUpdated) _listeners.messages_read.delete(onMessageUpdated);
    if (onCleared) _listeners.chat_cleared.delete(onCleared);

    if (typeof window !== 'undefined') {
      window.removeEventListener('kpr_chat_new_msg', handleCustomEvent);
      window.removeEventListener('kpr_chat_messages_read', handleReadEvent);
    }
  };
}
