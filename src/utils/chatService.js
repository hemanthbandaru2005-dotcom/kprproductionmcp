import { supabase } from './supabaseClient.js';

const CHAT_EVENT_ID_PREFIX = 'thread_';
const CHAT_ALBUM_FLAG = 'CHAT_MESSAGE';
const LOCAL_CHAT_KEY = 'kpr_admin_worker_chat_v3';
const CHAT_CHANNEL_NAME = 'admin_worker_chat_topic';

// ─── Shared channel + callback registry ─────────────────────────────────
let _sharedChannel = null;
const _listeners = {
  new_message: new Set(),
  messages_read: new Set(),
  chat_cleared: new Set(),
};

// Cross-tab / cross-window instant communication via standard browser BroadcastChannel
let _chatBroadcastChannel = null;
function getChatBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!_chatBroadcastChannel) {
    try {
      _chatBroadcastChannel = new BroadcastChannel('kpr_chat_broadcast_v2');
      _chatBroadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'new_message' && payload) {
          _listeners.new_message.forEach(fn => fn(payload));
        } else if (type === 'messages_read' && payload) {
          _listeners.messages_read.forEach(fn => fn(payload));
        } else if (type === 'chat_cleared' && payload) {
          _listeners.chat_cleared.forEach(fn => fn(payload));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }
  return _chatBroadcastChannel;
}

// Window storage and custom event listeners for bulletproof instant sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LOCAL_CHAT_KEY && e.newValue) {
      try {
        const msgs = JSON.parse(e.newValue);
        if (Array.isArray(msgs) && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg) {
            _listeners.new_message.forEach(fn => fn(lastMsg));
          }
        }
      } catch (err) {}
    }
  });

  window.addEventListener('kpr_chat_new_msg', (e) => {
    if (e.detail) {
      _listeners.new_message.forEach(fn => fn(e.detail));
    }
  });
}

function ensureSharedChannel() {
  getChatBroadcastChannel();
  if (_sharedChannel) return _sharedChannel;

  try {
    _sharedChannel = supabase.channel(CHAT_CHANNEL_NAME)
      // 1. Listen to instant Broadcast events
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
      // 2. Listen to Postgres Database table changes
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

// Real workers registry (No fake demo fallbacks)
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

  return {
    id: record.id || `msg_${Date.now()}_${Math.random()}`,
    thread_id: record.event_id || `thread_${record.client_id || 'unknown'}`,
    worker_id: record.client_id || meta.worker_id || 'worker-user',
    sender_id: meta.sender_id || (isMsgAdmin ? 'admin_user' : record.client_id),
    sender_name: senderName,
    sender_role: role,
    content: record.client_note || meta.content || '',
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
  
  // If it's a UUID or registry key, try looking up the registered worker's email
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
 * Fetch ONLY real registered workers from profiles table and localStorage
 * Deduplicates by email to prevent same person showing up twice
 */
export async function fetchWorkersForChat() {
  const workerByEmail = new Map(); // primary dedup key = email
  const workerById = new Map();    // secondary lookup by id

  function addWorker(wObj) {
    if (!wObj || isFakeWorker(wObj)) return;
    const email = (wObj.email || '').toLowerCase().trim();
    const key = email || wObj.id || '';
    if (!key) return;

    // If we already have this worker by email, merge (prefer existing name, keep profiles UUID as id)
    if (email && workerByEmail.has(email)) {
      const existing = workerByEmail.get(email);
      // Keep UUID id from profiles table if available (it's the auth id)
      if (wObj.id && !existing.id?.includes('-') && wObj.id.includes('-')) {
        existing.id = wObj.id;
      }
      // Keep the better name
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

  // 1. Fetch from Supabase verifications cloud registry (Works across all laptops & devices)
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

  // 2. Fetch from Supabase profiles table
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
  } catch (err) {
    console.warn('Could not fetch workers from profiles table:', err);
  }

  // 3. Merge from localStorage added workers
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

    // Remove deleted workers
    deleted.forEach(delEmail => {
      workerByEmail.delete(delEmail.toLowerCase().trim());
    });
  } catch (e) {}

  return [...workerByEmail.values(), ...workerById.values()];
}

/**
 * Fetch all chat messages for a specific worker's 1:1 thread with Admin
 */
export async function fetchMessagesForWorker(workerId) {
  if (!workerId) return [];
  const normalizedId = normalizeWorkerId(workerId);
  const emailBasedId = resolveWorkerEmailId(workerId);
  const threadId = `${CHAT_EVENT_ID_PREFIX}${normalizedId}`;
  const legacyThreadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;
  const emailThreadId = `${CHAT_EVENT_ID_PREFIX}${emailBasedId}`;

  // All possible IDs this worker might appear under
  const allWorkerIds = new Set([workerId, normalizedId, emailBasedId]);

  const isMatchingWorker = (m) => {
    if (!m) return false;
    return allWorkerIds.has(m.worker_id) ||
      allWorkerIds.has(normalizeWorkerId(m.worker_id)) ||
      allWorkerIds.has(m.thread_id?.replace(CHAT_EVENT_ID_PREFIX, '').replace('thread_', ''));
  };

  const localList = getLocalMessages().filter(isMatchingWorker);

  try {
    const queryIds = Array.from(new Set([
      threadId,
      legacyThreadId,
      emailThreadId,
      `thread_${workerId}`,
      `thread_${normalizedId}`,
      `thread_${emailBasedId}`
    ])).filter(Boolean);

    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', CHAT_ALBUM_FLAG)
      .in('event_id', queryIds)
      .order('sent_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      const remoteMessages = data.map(normalizeMessage).filter(Boolean);
      
      // Merge remote and local by id
      const map = new Map();
      localList.forEach(m => { if (m && m.id) map.set(m.id, m); });
      remoteMessages.forEach(m => { if (m && m.id) map.set(m.id, m); });

      const merged = Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const otherLocal = getLocalMessages().filter(m => !isMatchingWorker(m));
      saveLocalMessages([...otherLocal, ...merged]);
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching thread messages from Supabase database:', err);
  }

  return localList;
}

/**
 * Fetch all recent messages across all threads from Supabase Database for Admin
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

      const merged = Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      saveLocalMessages(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching all chat records from Supabase database:', err);
  }

  return currentLocal;
}

/**
 * Send a new private message and save directly into Supabase Database
 */
export async function sendChatMessage({ workerId, senderId, senderName, senderRole, content }) {
  if (!workerId || !content || !content.trim()) return null;

  const normalizedRole = (senderRole === 'admin' || senderRole === 'Admin') ? 'admin' : 'staff';
  const emailBasedId = resolveWorkerEmailId(workerId);
  const normalizedWorkerId = emailBasedId; // Always use email-based ID for consistency
  const threadId = `${CHAT_EVENT_ID_PREFIX}${normalizedWorkerId}`;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();
  const cleanContent = content.trim();
  const cleanSenderName = senderName || (normalizedRole === 'admin' ? 'KPR Fotography Admin' : 'Staff Worker');

  const msgPayload = {
    id: msgId,
    thread_id: threadId,
    worker_id: normalizedWorkerId,
    sender_id: senderId || (normalizedRole === 'admin' ? 'admin_user' : normalizedWorkerId),
    sender_name: cleanSenderName,
    sender_role: normalizedRole,
    content: cleanContent,
    created_at: timestamp,
    read_at: null
  };

  const supabaseRecord = {
    id: msgId,
    client_id: normalizedWorkerId,
    client_name: normalizedRole === 'staff' ? cleanSenderName : 'Staff Worker',
    client_email: `${normalizedWorkerId}@kpr.com`,
    event_id: threadId,
    event_title: `Admin: ${cleanSenderName}`,
    album_id: CHAT_ALBUM_FLAG,
    client_note: cleanContent,
    status: normalizedRole,
    sent_at: timestamp,
    responded_at: null,
    photo_items: [{
      sender_id: msgPayload.sender_id,
      sender_name: cleanSenderName,
      sender_role: normalizedRole,
      worker_id: normalizedWorkerId,
      content: cleanContent,
      read_at: null
    }]
  };

  // 1. Broadcast on instant BroadcastChannel & shared Realtime channel
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
    if (error) {
      console.warn('Supabase chat insert error:', error);
    }
  } catch (err) {
    console.warn('Failed to insert chat record into Supabase database:', err);
  }

  // 3. Fallback to local
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
  const emailBasedId = resolveWorkerEmailId(workerId);
  const threadId = `${CHAT_EVENT_ID_PREFIX}${normalizedWorkerId}`;
  const legacyThreadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;
  const emailThreadId = `${CHAT_EVENT_ID_PREFIX}${emailBasedId}`;
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

    const updateIds = Array.from(new Set([
      threadId,
      legacyThreadId,
      emailThreadId,
      `thread_${workerId}`,
      `thread_${normalizedWorkerId}`,
      `thread_${emailBasedId}`
    ])).filter(Boolean);

    await supabase
      .from('verifications')
      .update({ responded_at: now })
      .eq('album_id', CHAT_ALBUM_FLAG)
      .in('event_id', updateIds)
      .eq('status', targetSenderRole)
      .is('responded_at', null);

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'messages_read',
      payload: { worker_id: normalizedWorkerId, reader_role: readerRole, read_at: now }
    }).catch(e => console.warn('Broadcast send catch:', e));
  } catch (err) {
    console.warn('Error marking messages as read in Supabase database:', err);
  }

  const allWorkerIds = new Set([workerId, normalizedWorkerId, emailBasedId]);
  const local = getLocalMessages().map(m => {
    const matchesThread = m && (
      allWorkerIds.has(m.worker_id) ||
      allWorkerIds.has(normalizeWorkerId(m.worker_id))
    );
    if (matchesThread && m.sender_role === targetSenderRole && !m.read_at) {
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
    }).catch(() => {});
  } catch (err) {
    console.warn('Error clearing Supabase database chat messages:', err);
  }

  saveLocalMessages([]);
  return { success: true };
}

/**
 * Clear chat messages for a specific worker's 1:1 thread in Supabase Database
 */
export async function clearThreadMessages(workerId) {
  if (!workerId) return;
  const threadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;

  try {
    const bc = getChatBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'chat_cleared', payload: { worker_id: workerId } });
    }

    await supabase
      .from('verifications')
      .delete()
      .eq('album_id', CHAT_ALBUM_FLAG)
      .eq('event_id', threadId);

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'chat_cleared',
      payload: { worker_id: workerId }
    }).catch(() => {});
  } catch (err) {
    console.warn('Error deleting worker thread messages from Supabase database:', err);
  }

  const local = getLocalMessages().filter(m => m && m.worker_id !== workerId && m.thread_id !== threadId);
  saveLocalMessages(local);
  return { success: true };
}

/**
 * Real-time subscription hook for Admin & Worker
 */
export function subscribeToChatChannel(onNewMessage, onMessagesRead, onChatCleared) {
  ensureSharedChannel();

  if (onNewMessage) _listeners.new_message.add(onNewMessage);
  if (onMessagesRead) _listeners.messages_read.add(onMessagesRead);
  if (onChatCleared) _listeners.chat_cleared.add(onChatCleared);

  return () => {
    if (onNewMessage) _listeners.new_message.delete(onNewMessage);
    if (onMessagesRead) _listeners.messages_read.delete(onMessagesRead);
    if (onChatCleared) _listeners.chat_cleared.delete(onChatCleared);
  };
}
