import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Search, Check, CheckCheck,
  MessageSquare, Sparkles, RefreshCw,
  Circle, Users, Trash2, Plus, X, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchWorkersForChat,
  fetchMessagesForWorker,
  fetchAllChatThreadsForAdmin,
  sendChatMessage,
  markThreadAsRead,
  subscribeToChatChannel,
  clearThreadMessages,
  clearAllChatHistory,
  DEFAULT_DEMO_WORKERS,
  formatNameFromEmailOrId
} from '../../utils/chatService';

const QUICK_PROMPTS = [
  "Please upload today's raw shoot files 📸",
  "Color grading approved! Proceed with album layout ✨",
  "Can you share the updated drone reel? 🚁",
  "Mandap shots look stunning, great work! 🌟"
];

function getInitials(name, fallback = 'W') {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function formatThreadDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function AdminChatPanel() {
  const { user, profile } = useAuth();
  const currentAdminName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Studio Admin');

  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior });
    } catch (e) {
      // ignore
    }
  };

  // 1. Load workers and message previews on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoadingWorkers(true);
      try {
        const [workerList, msgs] = await Promise.all([
          fetchWorkersForChat(),
          fetchAllChatThreadsForAdmin()
        ]);
        if (!isMounted) return;
        const validWorkers = Array.isArray(workerList) && workerList.length > 0 ? workerList : DEFAULT_DEMO_WORKERS;
        setWorkers(validWorkers);
        const validMsgs = Array.isArray(msgs) ? msgs : [];
        setAllMessages(validMsgs);

        // Default to latest active conversation if any exists
        if (!selectedWorkerId && validMsgs.length > 0) {
          const latest = validMsgs[validMsgs.length - 1];
          if (latest?.worker_id) {
            setSelectedWorkerId(latest.worker_id);
          }
        }
      } catch (err) {
        console.error('Error loading admin chat data:', err);
      } finally {
        if (isMounted) setLoadingWorkers(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  // 2. Load conversation thread when active worker changes
  const loadActiveThread = async (workerIdToLoad) => {
    const targetId = workerIdToLoad || selectedWorkerId;
    if (!targetId) return;

    setLoadingMessages(true);
    try {
      const threadMsgs = await fetchMessagesForWorker(targetId);
      setMessages(Array.isArray(threadMsgs) ? threadMsgs : []);
      setTimeout(() => scrollToBottom('auto'), 80);

      await markThreadAsRead(targetId, 'admin');
      const updatedAll = await fetchAllChatThreadsForAdmin();
      setAllMessages(Array.isArray(updatedAll) ? updatedAll : []);
    } catch (err) {
      console.error('Error loading thread messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedWorkerId) {
      loadActiveThread(selectedWorkerId);
    }
  }, [selectedWorkerId]);

  // 3. Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToChatChannel(
      (newMsg) => {
        if (!newMsg) return;
        if (newMsg.worker_id === selectedWorkerId) {
          setMessages(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some(m => m && (m.id === newMsg.id || (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000)));
            return exists ? list.map(m => (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000) ? newMsg : m) : [...list, newMsg];
          });
          setTimeout(() => scrollToBottom('smooth'), 50);
          markThreadAsRead(selectedWorkerId, 'admin');
        }
        setAllMessages(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(m => m && (m.id === newMsg.id || (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000)));
          return exists ? list.map(m => (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000) ? newMsg : m) : [...list, newMsg];
        });
      },
      (readPayload) => {
        if (readPayload && readPayload.worker_id === selectedWorkerId) {
          setMessages(prev => {
            const list = Array.isArray(prev) ? prev : [];
            return list.map(m => {
              if (!m) return m;
              // Mark admin messages as read when staff reads them
              if (readPayload.reader_role === 'staff' && m.sender_role === 'admin' && !m.read_at) {
                return { ...m, read_at: readPayload.read_at || new Date().toISOString() };
              }
              // Mark staff messages as read when admin reads them
              if (readPayload.reader_role === 'admin' && m.sender_role === 'staff' && !m.read_at) {
                return { ...m, read_at: readPayload.read_at || new Date().toISOString() };
              }
              return m;
            });
          });
        }
      },
      (clearedPayload) => {
        if (clearedPayload && (clearedPayload.all || clearedPayload.worker_id === selectedWorkerId)) {
          setMessages([]);
        }
        fetchAllChatThreadsForAdmin().then(res => setAllMessages(Array.isArray(res) ? res : []));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selectedWorkerId]);

  // Send message handler with instant optimistic UI update
  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const content = (customText !== null ? customText : inputText).trim();
    if (!content || !selectedWorkerId) return;

    const targetWorkerId = selectedWorkerId;
    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date().toISOString();

    const optimisticMsg = {
      id: tempId,
      thread_id: `thread_${targetWorkerId}`,
      worker_id: targetWorkerId,
      sender_id: user?.id || 'admin_user',
      sender_name: currentAdminName,
      sender_role: 'admin',
      content,
      created_at: timestamp,
      read_at: null
    };

    // Instant optimistic state update (0ms lag!)
    setInputText('');
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), optimisticMsg]);
    setAllMessages(prev => [...(Array.isArray(prev) ? prev : []), optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 20);

    setSending(true);

    try {
      const res = await sendChatMessage({
        workerId: targetWorkerId,
        senderId: user?.id || 'admin_user',
        senderName: currentAdminName,
        senderRole: 'admin',
        content
      });

      if (res && res.data && res.data.id !== tempId) {
        setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === tempId ? res.data : m));
        setAllMessages(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === tempId ? res.data : m));
      }
    } catch (err) {
      console.error('Error sending admin message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearThread = async () => {
    if (!activeWorkerId) return;
    const conf = window.confirm(`Clear all messages with ${selectedWorker?.full_name || 'this worker'} and start a fresh conversation?`);
    if (!conf) return;

    setMessages([]);
    await clearThreadMessages(activeWorkerId);
    const updated = await fetchAllChatThreadsForAdmin();
    setAllMessages(Array.isArray(updated) ? updated : []);
  };

  const handleClearAllConversations = async () => {
    const conf = window.confirm('Clear ALL chat conversations across all staff workers to start completely fresh?');
    if (!conf) return;

    setMessages([]);
    setAllMessages([]);
    await clearAllChatHistory();
  };

  const safeWorkers = Array.isArray(workers) && workers.length > 0 ? workers : DEFAULT_DEMO_WORKERS;
  const safeAllMessages = Array.isArray(allMessages) ? allMessages : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Compute active threads ONLY for staff who have actual chat messages (or currently selected)
  const activeWorkerIds = new Set(
    safeAllMessages
      .map(m => m && m.worker_id)
      .filter(Boolean)
  );
  if (selectedWorkerId) {
    activeWorkerIds.add(selectedWorkerId);
  }

  const activeWorkerThreads = Array.from(activeWorkerIds).map(wId => {
    const threadMsgs = safeAllMessages.filter(m => m && m.worker_id === wId);
    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
    const workerMsgName = threadMsgs.find(m => m && m.sender_role === 'staff' && m.sender_name)?.sender_name;
    const existingWorker = safeWorkers.find(w => w && w.id === wId);
    const cleanName = existingWorker?.full_name || workerMsgName || formatNameFromEmailOrId(wId);

    const worker = existingWorker ? { ...existingWorker, full_name: existingWorker.full_name || cleanName } : {
      id: wId,
      full_name: cleanName,
      email: `${wId.replace(/^worker[-_]/, '')}@kpr.com`,
      skill: 'Team Member'
    };
    const unreadCount = threadMsgs.filter(m => m && m.sender_role === 'staff' && !m.read_at).length;

    return {
      worker,
      lastMsg,
      unreadCount
    };
  }).filter(t => t.lastMsg || t.worker.id === selectedWorkerId).sort((a, b) => {
    const timeA = a.lastMsg?.created_at ? new Date(a.lastMsg.created_at).getTime() : 0;
    const timeB = b.lastMsg?.created_at ? new Date(b.lastMsg.created_at).getTime() : 0;
    return timeB - timeA;
  });

  const filteredThreads = activeWorkerThreads.filter(t => {
    if (!t || !t.worker) return false;
    const s = (search || '').toLowerCase();
    return (
      (t.worker.full_name || '').toLowerCase().includes(s) ||
      (t.worker.email || '').toLowerCase().includes(s) ||
      (t.worker.skill || '').toLowerCase().includes(s) ||
      (t.lastMsg?.content || '').toLowerCase().includes(s)
    );
  });

  const selectedWorker = selectedWorkerId
    ? (safeWorkers.find(w => w && w.id === selectedWorkerId) ||
       activeWorkerThreads.find(t => t.worker?.id === selectedWorkerId)?.worker ||
       { id: selectedWorkerId, full_name: formatNameFromEmailOrId(selectedWorkerId), email: `${selectedWorkerId.replace(/^worker[-_]/, '')}@kpr.com`, skill: 'Team Member' })
    : null;
  const activeWorkerId = selectedWorker?.id || null;

  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-140px)] bg-[#0F1623] border md:border-white/10 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl animate-fadeIn flex-1 min-h-0">
      
      {/* ════════ DESKTOP SIDEBAR: ACTIVE CHAT THREADS ════════ */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-white/10 flex-col bg-[#111827] shrink-0">
        
        {/* Search & Header */}
        <div className="p-4 border-b border-white/10 space-y-3 bg-[#0F1623]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif text-base font-bold text-white tracking-wide">Staff Messages</h3>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#C5A880] border border-[#C5A880]/30 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              title="Start a new chat with a staff worker"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search active conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        {/* Workers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 flex flex-col">
          {loadingWorkers ? (
            <div className="p-12 text-center text-white/40 space-y-2 my-auto">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#C5A880]" />
              <p className="text-xs">Loading staff messages…</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-white/40 space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#C5A880]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white/80">No Active Conversations</h4>
              <p className="text-xs text-white/40 max-w-xs mx-auto">
                When a staff worker messages Admin, their conversation appears here automatically.
              </p>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C5A880] text-black text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 shadow-lg shadow-[#C5A880]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start New Chat
              </button>
            </div>
          ) : (
            filteredThreads.map(({ worker, lastMsg, unreadCount }) => {
              const isSelected = activeWorkerId === worker.id;
              const initials = getInitials(worker.full_name || worker.email, 'ST');

              return (
                <button
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-[#C5A880]/10 border-l-4 border-[#C5A880]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                      isSelected
                        ? 'bg-[#C5A880] text-black font-serif'
                        : 'bg-white/10 text-white font-serif group-hover:bg-[#C5A880]/40'
                    }`}>
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#111827]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                        {worker.full_name || worker.email}
                      </h4>
                      {lastMsg && (
                        <span className="text-[10px] font-mono text-white/40 shrink-0">
                          {formatThreadDate(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-[#A09585] truncate mb-1">
                      {worker.skill || 'Photographer / Editor'}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-white/50 truncate">
                        {lastMsg ? (
                          <>
                            {lastMsg.sender_role === 'admin' && <span className="text-[#C5A880] font-medium">You: </span>}
                            {lastMsg.content}
                          </>
                        ) : (
                          <span className="italic text-white/30">Start 1:1 private chat…</span>
                        )}
                      </p>

                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold font-mono shrink-0 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* ════════ MAIN CHAT PANEL ════════ */}
      <div className="flex-1 flex flex-col bg-[#0F1623] min-w-0 h-full overflow-hidden relative">
        
        {/* 1. Mobile Active Conversations Bar (< md) */}
        <div className="md:hidden px-3 py-2 bg-[#111827] border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-10">
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 text-[10px] font-bold uppercase shrink-0"
          >
            <Plus className="w-3 h-3" /> New
          </button>
          {filteredThreads.map(({ worker, unreadCount }) => {
            const isSel = worker.id === activeWorkerId;
            return (
              <button
                key={worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer border ${
                  isSel
                    ? 'bg-[#C5A880] text-black font-bold border-[#C5A880] shadow-md'
                    : 'bg-white/5 text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isSel ? 'bg-black text-[#C5A880]' : 'bg-white/10 text-white'}`}>
                  {getInitials(worker.full_name || worker.email, 'ST')}
                </span>
                <span className="truncate max-w-[90px]">{worker.full_name?.split(' ')[0] || worker.email?.split('@')[0]}</span>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!selectedWorker ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A880]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-serif text-lg text-white font-bold">Studio Staff Communications</h3>
              <p className="text-xs text-white/40">
                Incoming messages from staff workers will appear in the sidebar automatically. Or start a direct conversation below.
              </p>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A880] text-black text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 shadow-lg shadow-[#C5A880]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Message a Staff Worker
            </button>
          </div>
        ) : (
          <>
            {/* 2. Header: Matching WorkerChatPanel Structure */}
            <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/10 bg-[#111827] flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold text-xs sm:text-sm font-serif shadow-md shrink-0">
                  {getInitials(selectedWorker?.full_name || selectedWorker?.email, 'ST')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide truncate">
                      {selectedWorker?.full_name || formatNameFromEmailOrId(selectedWorker?.email || selectedWorker?.id || 'Worker')}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      Worker Online
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-white/40 truncate">{selectedWorker?.skill || 'Photographer / Editor'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleClearThread}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs font-semibold"
                  title="Clear this conversation"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400/80" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

        {/* 3. Messages Stream */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-[#151D2C] to-[#0F1623]">
          {loadingMessages ? (
            <div className="p-12 sm:p-16 text-center text-white/40">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
              <p className="text-xs">Loading conversation history…</p>
            </div>
          ) : safeMessages.length === 0 ? (
            <div className="p-8 sm:p-16 text-center text-white/40 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg text-white/80">No Messages Yet</h4>
              <p className="text-xs text-white/40 max-w-sm mx-auto">
                Start a 1:1 conversation with {selectedWorker?.full_name || 'this worker'} regarding shoot assignments, client proof revisions, or drive file uploads.
              </p>
            </div>
          ) : (
            safeMessages.map((msg, idx) => {
              if (!msg) return null;
              const isAdmin = msg.sender_role === 'admin';
              const workerDisplayName = msg.sender_name || selectedWorker?.full_name || formatNameFromEmailOrId(selectedWorker?.email || selectedWorker?.id || 'Worker');

              return (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-white/50">
                      {isAdmin
                        ? `${msg.sender_name || currentAdminName} (Admin)`
                        : `${workerDisplayName} (Worker)`}
                    </span>
                    <span className="text-[9px] font-mono text-white/30">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg break-words ${
                      isAdmin
                        ? 'bg-gradient-to-r from-[#C5A880] to-[#D4BC9A] text-black font-medium rounded-tr-none'
                        : 'bg-[#1E2433] text-white border border-white/10 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content || ''}</p>
                  </div>

                  {/* Read receipt indicator for Admin messages */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-white/40">
                      {msg.read_at ? (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <CheckCheck className="w-3 h-3" />
                          <span>Seen by Staff</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-white/40">
                          <Check className="w-3 h-3" />
                          <span>Delivered</span>
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick Canned Prompts Bar */}
        <div className="px-3 sm:px-6 py-2 bg-[#111827]/90 backdrop-blur border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A880] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(null, prompt)}
              className="px-2.5 sm:px-3 py-1 rounded-full bg-black/40 hover:bg-[#C5A880]/20 hover:border-[#C5A880]/40 text-white/70 hover:text-white border border-white/10 text-[10px] sm:text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* 5. Bottom Message Input Bar - Pinned & Guaranteed Visible */}
        <form onSubmit={handleSend} className="p-2.5 sm:p-4 bg-[#111827] border-t border-white/10 flex items-center gap-2 sm:gap-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <input
            type="text"
            placeholder={`Type a private message to ${selectedWorker?.full_name || 'Staff'}…`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setTimeout(() => scrollToBottom('smooth'), 200)}
            className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-black/50 border border-white/20 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]"
          />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </>
      )}

      </div>

      {/* ════════ NEW CHAT MODAL ════════ */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Start New Conversation</h3>
                  <p className="text-[10px] text-white/40">Select a staff member to open a private 1:1 chat</p>
                </div>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {safeWorkers.map((w) => {
                const initials = getInitials(w.full_name || w.email, 'ST');
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setSelectedWorkerId(w.id);
                      setNewChatModalOpen(false);
                    }}
                    className="w-full p-3 bg-white/5 hover:bg-[#C5A880]/15 border border-white/5 hover:border-[#C5A880]/30 rounded-xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#C5A880] text-black font-bold text-xs font-serif flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#C5A880]">
                          {w.full_name || w.email}
                        </h4>
                        <p className="text-[10px] text-white/40 truncate">{w.skill || 'Photographer / Editor'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#C5A880] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
