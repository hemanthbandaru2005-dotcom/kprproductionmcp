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

// Fallback demo workers if database profiles list is empty
export const DEFAULT_DEMO_WORKERS = [
  { id: 'worker-123', full_name: 'Rajesh Kumar (Lead Editor)', email: '123@kpr.com', role: 'worker', status: 'active', skill: 'Lead Cinematographer & Editor' },
  { id: 'worker-rajesh', full_name: 'Rajesh Kumar', email: 'rajesh.lead@kpr.com', role: 'worker', status: 'active', skill: 'Lead Cinematographer' },
  { id: 'worker-priya', full_name: 'Priya Sharma', email: 'priya.editor@kpr.com', role: 'worker', status: 'active', skill: 'Color Lab Senior Editor' },
  { id: 'worker-vikram', full_name: 'Vikram Reddy', email: 'vikram.drone@kpr.com', role: 'worker', status: 'active', skill: 'Avata FPV & Drone Pilot' },
];

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
 * Example: 'nihal@kpr.com' -> 'Nihal', 'nihal.reddy' -> 'Nihal Reddy', 'worker-nihal' -> 'Nihal'
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
  const workerRawId = record.client_id || meta.sender_id || 'worker-user';
  const defaultWorkerName = formatNameFromEmailOrId(record.client_name || workerRawId);

  return {
    id: record.id || `msg_${Date.now()}_${Math.random()}`,
    thread_id: record.event_id || `thread_${record.client_id || 'unknown'}`,
    worker_id: record.client_id || meta.sender_id || 'worker-user',
    sender_id: meta.sender_id || record.client_id || 'admin_user',
    sender_name: meta.sender_name || record.client_name || (record.status === 'admin' ? 'Studio Admin' : defaultWorkerName),
    sender_role: record.status || meta.sender_role || 'staff',
    content: record.client_note || meta.content || '',
    created_at: record.sent_at || record.created_at || new Date().toISOString(),
    read_at: record.responded_at || meta.read_at || null
  };
}

/**
 * Fetch all registered workers from profiles table, merging with demo workers
 */
export async function fetchWorkersForChat() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker')
      .order('full_name', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const existingIds = new Set(data.map(w => w?.id));
      const combined = [...data];
      DEFAULT_DEMO_WORKERS.forEach(dw => {
        if (!existingIds.has(dw.id)) {
          combined.push(dw);
        }
      });
      return combined;
    }
  } catch (err) {
    console.warn('Could not fetch workers from profiles table:', err);
  }

  return DEFAULT_DEMO_WORKERS;
}

/**
 * Fetch all chat messages for a specific worker's 1:1 thread with Admin from Supabase Database
 */
export async function fetchMessagesForWorker(workerId) {
  if (!workerId) return [];
  const threadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;
  const localList = getLocalMessages().filter(m => m && (m.worker_id === workerId || m.thread_id === threadId));

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('album_id', CHAT_ALBUM_FLAG)
      .eq('event_id', threadId)
      .order('sent_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      const remoteMessages = data.map(normalizeMessage).filter(Boolean);
      
      // Merge remote and local by id/content
      const map = new Map();
      localList.forEach(m => { if (m && m.id) map.set(m.id, m); });
      remoteMessages.forEach(m => { if (m && m.id) map.set(m.id, m); });

      const merged = Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const otherLocal = getLocalMessages().filter(m => m && m.worker_id !== workerId && m.thread_id !== threadId);
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
  if (!workerId || !content || !content.trim()) return { error: 'Message content is required' };

  const threadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();
  const normalizedRole = senderRole === 'admin' ? 'admin' : 'staff';
  const cleanContent = content.trim();

  const msgPayload = {
    id: msgId,
    thread_id: threadId,
    worker_id: workerId,
    sender_id: senderId || (normalizedRole === 'admin' ? 'admin_user' : workerId),
    sender_name: senderName || (normalizedRole === 'admin' ? 'Studio Admin' : 'Staff Member'),
    sender_role: normalizedRole,
    content: cleanContent,
    created_at: timestamp,
    read_at: null
  };

  const supabaseRecord = {
    id: msgId,
    client_id: workerId,
    client_name: msgPayload.sender_name,
    client_email: `${workerId}@kpr.com`,
    event_id: threadId,
    event_title: 'Admin-Worker Private Chat',
    album_id: CHAT_ALBUM_FLAG,
    client_note: cleanContent,
    status: normalizedRole,
    sent_at: timestamp,
    responded_at: null,
    photo_items: [{
      sender_id: msgPayload.sender_id,
      sender_name: msgPayload.sender_name,
      sender_role: normalizedRole,
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
      return { data: normalized, error: null };
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
  return { data: msgPayload, error: null };
}

/**
 * Mark messages in a thread as read in Supabase Database and local store
 */
export async function markThreadAsRead(workerId, readerRole) {
  if (!workerId) return;
  const threadId = `${CHAT_EVENT_ID_PREFIX}${workerId}`;
  const now = new Date().toISOString();
  const targetSenderRole = readerRole === 'admin' ? 'staff' : 'admin';

  try {
    const bc = getChatBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'messages_read',
        payload: { worker_id: workerId, reader_role: readerRole, read_at: now }
      });
    }

    await supabase
      .from('verifications')
      .update({ responded_at: now })
      .eq('album_id', CHAT_ALBUM_FLAG)
      .eq('event_id', threadId)
      .eq('status', targetSenderRole)
      .is('responded_at', null);

    const channel = ensureSharedChannel();
    channel.send({
      type: 'broadcast',
      event: 'messages_read',
      payload: { worker_id: workerId, reader_role: readerRole, read_at: now }
    }).catch(e => console.warn('Broadcast send catch:', e));
  } catch (err) {
    console.warn('Error marking messages as read in Supabase database:', err);
  }

  const local = getLocalMessages().map(m => {
    if (m && m.worker_id === workerId && m.sender_role === targetSenderRole && !m.read_at) {
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
