import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Search, Check, CheckCheck,
  MessageSquare, Sparkles, RefreshCw,
  Circle, Users, Trash2, Plus, X, UserPlus,
  Image as ImageIcon, Paperclip, Eye, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchWorkersForChat,
  fetchAllChatThreadsForAdmin,
  sendChatMessage,
  markThreadAsRead,
  subscribeToChatChannel,
  clearThreadMessages,
  clearAllChatHistory,
  DEFAULT_DEMO_WORKERS,
  formatNameFromEmailOrId,
  normalizeWorkerId,
  matchesWorker,
  generateUUID
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

function mergeAndDeduplicateMessages(existingList, newMsg) {
  if (!newMsg) return existingList;
  const list = Array.isArray(existingList) ? existingList : [];

  const isDuplicate = list.some(m => {
    if (!m) return false;
    if (m.id === newMsg.id) return true;
    const sameWorker = m.worker_id === newMsg.worker_id;
    const sameRole = m.sender_role === newMsg.sender_role;
    const sameContent = (m.content || '').trim() === (newMsg.content || '').trim();
    const sameImage = m.image_url === newMsg.image_url;
    const timeDiff = Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0));
    return sameWorker && sameRole && sameContent && sameImage && timeDiff < 10000;
  });

  if (isDuplicate) {
    return list.map(m => {
      if (m.id === newMsg.id || (
        m.worker_id === newMsg.worker_id &&
        m.sender_role === newMsg.sender_role &&
        (m.content || '').trim() === (newMsg.content || '').trim() &&
        m.image_url === newMsg.image_url &&
        Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0)) < 10000
      )) {
        return { ...m, ...newMsg };
      }
      return m;
    });
  }

  return [...list, newMsg];
}

export default function AdminChatPanel() {
  const { user, profile } = useAuth();
  const currentAdminName = profile?.full_name ||
    (user?.email === 'kprfotography@gmail.com' ? 'KPR Fotography Admin' :
     user?.email === 'kprevents@gmail.com' ? 'KPR Events Admin' :
     user?.email === 'kprcolourlab@gmail.com' ? 'KPR Colour Lab Admin' :
     user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'KPR Studio Admin'));

  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [allMessages, setAllMessages] = useState([]); // Unified Source of Truth
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedWorkerIdRef = useRef(selectedWorkerId);

  useEffect(() => {
    selectedWorkerIdRef.current = selectedWorkerId;
  }, [selectedWorkerId]);

  const scrollToBottom = (behavior = 'smooth') => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior });
    } catch (e) {
      // ignore
    }
  };

  // Safe data definitions computed in top scope
  const safeWorkers = Array.isArray(workers) ? workers : [];
  const safeAllMessages = Array.isArray(allMessages) ? allMessages : [];

  const uniqueWorkers = useMemo(() => {
    const map = new Map();
    safeWorkers.forEach(w => {
      if (!w) return;
      const key = (w.email ? w.email.split('@')[0] : (w.id || w.full_name || '')).toLowerCase().replace(/^(worker[-_]|staff[-_])/, '');
      if (key && !map.has(key)) {
        map.set(key, w);
      }
    });
    return Array.from(map.values());
  }, [safeWorkers]);

  const selectedWorker = selectedWorkerId
    ? (uniqueWorkers.find(w => {
        if (!w) return false;
        if (w.id === selectedWorkerId) return true;
        if (normalizeWorkerId(w.id || w.email) === normalizeWorkerId(selectedWorkerId)) return true;
        if (w.email && normalizeWorkerId(w.email) === normalizeWorkerId(selectedWorkerId)) return true;
        return false;
      }) ||
       { id: selectedWorkerId, full_name: formatNameFromEmailOrId(selectedWorkerId), email: `${selectedWorkerId.replace(/^worker[-_]/, '')}@kpr.com`, skill: 'Photographer / Editor' })
    : (uniqueWorkers.length > 0 ? uniqueWorkers[0] : null);
  const activeWorkerId = selectedWorker?.id || selectedWorkerId || null;

  // Derive active threads for the sidebar from safeAllMessages using deduplicated workers
  const activeWorkerThreads = uniqueWorkers.map(worker => {
    const threadMsgs = safeAllMessages.filter(m => matchesWorker(m, worker.id || worker.email || worker.full_name));
    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
    const unreadCount = threadMsgs.filter(m => m && m.sender_role === 'staff' && !m.read_at).length;

    return {
      worker,
      lastMsg,
      unreadCount
    };
  }).sort((a, b) => {
    const timeA = a.lastMsg?.created_at ? new Date(a.lastMsg.created_at).getTime() : 0;
    const timeB = b.lastMsg?.created_at ? new Date(b.lastMsg.created_at).getTime() : 0;
    return timeB - timeA;
  });

  // Current open thread messages dynamically and strictly derived from the single source of truth (safeAllMessages)
  const currentThreadMessages = useMemo(() => {
    if (!selectedWorker) return [];
    return safeAllMessages.filter(m =>
      matchesWorker(m, selectedWorker.id || selectedWorker.email || selectedWorker.full_name)
    ).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }, [selectedWorker, safeAllMessages]);

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

  // 1. Load workers and all message threads on mount
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

        setWorkers(workerList || []);
        setAllMessages(msgs || []);

        if (Array.isArray(workerList) && workerList.length > 0) {
          setSelectedWorkerId(prev => prev || workerList[0].id);
        }
      } catch (err) {
        console.error('Error initializing Admin Chat data:', err);
      } finally {
        if (isMounted) setLoadingWorkers(false);
      }
    }

    loadData();

    // Listen for registered worker changes
    const onWorkersUpdated = () => {
      fetchWorkersForChat().then(w => {
        if (isMounted) setWorkers(w || []);
      });
    };
    window.addEventListener('kpr_registered_workers_updated', onWorkersUpdated);

    // Subscribe to chat channel for real-time updates
    const unsubscribe = subscribeToChatChannel(
      (newMsg) => {
        if (!newMsg) return;
        setAllMessages((prev) => mergeAndDeduplicateMessages(prev, newMsg));

        const activeId = selectedWorkerIdRef.current;
        if (activeId && matchesWorker(newMsg, activeId)) {
          setTimeout(() => scrollToBottom('smooth'), 50);

          if (newMsg.sender_role === 'staff') {
            markThreadAsRead(activeId, 'admin');
          }
        }
      },
      (receipt) => {
        if (!receipt) return;
        setAllMessages((prev) => prev.map(m => {
          if (m && matchesWorker(m, receipt.worker_id) && m.sender_role === 'staff' && !m.read_at) {
            return { ...m, read_at: receipt.read_at || new Date().toISOString() };
          }
          return m;
        }));
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('kpr_registered_workers_updated', onWorkersUpdated);
    };
  }, []);

  // 2. When selectedWorkerId changes, mark messages as read and scroll to bottom
  useEffect(() => {
    if (!selectedWorkerId) return;
    markThreadAsRead(selectedWorkerId, 'admin');
    setTimeout(() => scrollToBottom('auto'), 80);
  }, [selectedWorkerId]);

  // 3. Auto-poll for incoming messages and new staff workers every 2.5 seconds
  useEffect(() => {
    let isMounted = true;

    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const [latestAll, latestWorkers] = await Promise.all([
          fetchAllChatThreadsForAdmin(),
          fetchWorkersForChat()
        ]);
        if (!isMounted) return;

        if (Array.isArray(latestWorkers) && latestWorkers.length > 0) {
          setWorkers(latestWorkers);
        }

        if (Array.isArray(latestAll)) {
          setAllMessages(prev => {
            if (latestAll.length !== prev.length || (latestAll.length > 0 && prev.length > 0 && latestAll[latestAll.length - 1]?.id !== prev[prev.length - 1]?.id)) {
              setTimeout(() => scrollToBottom('smooth'), 100);
              return latestAll;
            }
            return prev;
          });
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Reload workers list whenever New Chat modal opens
  useEffect(() => {
    if (newChatModalOpen) {
      fetchWorkersForChat().then(w => {
        if (Array.isArray(w) && w.length > 0) setWorkers(w);
      }).catch(() => {});
    }
  }, [newChatModalOpen]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setSelectedImage(loadEvt.target?.result || null);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputText;
    const imageToSend = selectedImage;
    const targetWorker = selectedWorker || (safeWorkers.length > 0 ? safeWorkers[0] : null);
    const targetWorkerId = targetWorker?.email || targetWorker?.id || selectedWorkerId || 'worker-primary';

    if ((!textToSend.trim() && !imageToSend) || !targetWorkerId || sending) return;

    if (!selectedWorkerId && targetWorker?.id) {
      setSelectedWorkerId(targetWorker.id);
    }

    setSending(true);
    setInputText('');
    setSelectedImage(null);
    // Immediate optimistic message rendering with UUID
    const msgUUID = generateUUID();
    const optimisticMsg = {
      id: msgUUID,
      thread_id: `thread_${normalizeWorkerId(targetWorkerId)}`,
      worker_id: normalizeWorkerId(targetWorkerId),
      sender_id: user?.id || user?.email || 'admin_user',
      sender_name: currentAdminName || 'KPR Fotography Admin',
      sender_role: 'admin',
      content: textToSend.trim() || (imageToSend ? 'Attached photo 📷' : ''),
      image_url: imageToSend,
      created_at: new Date().toISOString(),
      read_at: null
    };

    setAllMessages(prev => mergeAndDeduplicateMessages(prev, optimisticMsg));
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const sent = await Promise.race([
        sendChatMessage({
          workerId: targetWorkerId,
          senderRole: 'admin',
          senderName: currentAdminName || 'KPR Fotography Admin',
          senderId: user?.id || user?.email || 'admin_user',
          content: textToSend.trim() || (imageToSend ? 'Attached photo 📷' : ''),
          imageUrl: imageToSend,
          customId: msgUUID
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout')), 8000))
      ]);

      if (sent) {
        setAllMessages(prev => mergeAndDeduplicateMessages(prev, sent));
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    } catch (err) {
      console.warn('Notice while sending message (saved locally/optimistically):', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearThread = async () => {
    if (!selectedWorkerId) return;
    if (!window.confirm('Are you sure you want to clear this entire conversation?')) return;

    setAllMessages(prev => prev.filter(m => !matchesWorker(m, selectedWorkerId)));
    await clearThreadMessages(selectedWorkerId);
  };

  return (
    <div className="flex flex-col md:flex-row h-[750px] bg-white border border-[#E7E8EB] rounded-[20px] overflow-hidden shadow-xs animate-fadeIn flex-1 min-h-0">
      
      {/* ════════ DESKTOP SIDEBAR: ACTIVE CHAT THREADS ════════ */}
      <div className="hidden md:flex w-80 lg:w-96 border-r border-[#E7E8EB] flex-col bg-[#F7F8FA] shrink-0">
        
        {/* Search & Header */}
        <div className="p-4 border-b border-[#E7E8EB] space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1E74FF]" />
              <h3 className="text-base font-bold text-[#111111] tracking-tight">Staff Messages</h3>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              title="Start a new chat with a staff worker"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search active conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>

        {/* Workers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E7E8EB] flex flex-col">
          {loadingWorkers ? (
            <div className="p-12 text-center text-[#9CA0A6] space-y-2 my-auto">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#141414]" />
              <p className="text-xs">Loading staff messages…</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-[#9CA0A6] space-y-3 my-auto">
              <div className="w-12 h-12 rounded-full bg-[#DCE9FF] flex items-center justify-center mx-auto text-[#1E74FF]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#111111]">No Active Conversations</h4>
              <p className="text-xs text-[#6B7280] max-w-xs mx-auto">
                When a staff worker messages Admin, their conversation appears here automatically.
              </p>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:bg-[#333333]"
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
                      ? 'bg-white border-l-4 border-[#141414] shadow-xs'
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                      isSelected
                        ? 'bg-[#141414] text-white'
                        : 'bg-[#EEF0F2] text-[#6B7280] group-hover:bg-[#141414] group-hover:text-white'
                    }`}>
                      {initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#13A52D] ring-2 ring-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#111111]' : 'text-[#6B7280] group-hover:text-[#111111]'}`}>
                        {worker.full_name || worker.email}
                      </h4>
                      {lastMsg && (
                        <span className="text-[10px] font-mono text-[#9CA0A6] shrink-0">
                          {formatThreadDate(lastMsg.created_at)}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-[#9CA0A6] truncate mb-1">
                      {worker.skill || 'Photographer / Editor'}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {lastMsg ? (
                          <>
                            {lastMsg.sender_role === 'admin' && <span className="text-[#1E74FF] font-semibold">You: </span>}
                            {lastMsg.image_url && <span className="text-[#1E74FF] font-semibold">[Photo] </span>}
                            {lastMsg.content}
                          </>
                        ) : (
                          <span className="italic text-[#9CA0A6]">Start 1:1 private chat…</span>
                        )}
                      </p>

                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF4D94] text-white text-[10px] font-bold font-mono shrink-0">
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
      <div className="flex-1 flex flex-col bg-[#F7F8FA] min-w-0 h-full overflow-hidden relative">
        
        {/* 1. Mobile Active Conversations Bar (< md) */}
        <div className="md:hidden px-3 py-2 bg-white border-b border-[#E7E8EB] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-10">
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#141414] text-white text-[10px] font-bold uppercase shrink-0"
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
                    ? 'bg-[#141414] text-white font-bold border-[#141414]'
                    : 'bg-white text-[#6B7280] hover:text-[#111111] border-[#E7E8EB]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isSel ? 'bg-white text-[#111111]' : 'bg-[#EEF0F2] text-[#6B7280]'}`}>
                  {getInitials(worker.full_name || worker.email, 'ST')}
                </span>
                <span className="truncate max-w-[90px]">{worker.full_name?.split(' ')[0] || worker.email?.split('@')[0]}</span>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#FF4D94] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!selectedWorker ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9CA0A6] space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg text-[#111111] font-bold">Studio Staff Communications</h3>
              <p className="text-xs text-[#6B7280]">
                Incoming messages from staff workers will appear in the sidebar automatically. Or start a direct conversation below.
              </p>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:bg-[#333333]"
            >
              <Plus className="w-4 h-4" /> Message a Staff Worker
            </button>
          </div>
        ) : (
          <>
            {/* 2. Header */}
            <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[#E7E8EB] bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                  {getInitials(selectedWorker?.full_name || selectedWorker?.email, 'ST')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#111111] tracking-tight truncate">
                      {selectedWorker?.full_name || formatNameFromEmailOrId(selectedWorker?.email || selectedWorker?.id || 'Worker')}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D]">
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      Worker Online
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9CA0A6] truncate">{selectedWorker?.skill || 'Photographer / Editor'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearThread}
                  className="px-3 py-1.5 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Clear this conversation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

            {/* 3. Messages Stream */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[#F7F8FA]">
              {loadingWorkers ? (
                <div className="p-12 sm:p-16 text-center text-[#9CA0A6]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
                  <p className="text-xs">Loading conversation history…</p>
                </div>
              ) : currentThreadMessages.length === 0 ? (
                <div className="p-8 sm:p-16 text-center text-[#9CA0A6] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-[#111111]">No Messages Yet</h4>
                  <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                    Start a 1:1 conversation with {selectedWorker?.full_name || 'this worker'} regarding shoot assignments, client proof revisions, or drive file uploads.
                  </p>
                </div>
              ) : (
                currentThreadMessages.map((msg, idx) => {
                  if (!msg) return null;
                  const isOutgoingAdmin = msg.sender_role === 'admin';
                  const authorName = isOutgoingAdmin
                    ? (msg.sender_name || currentAdminName || 'Studio Admin')
                    : (msg.sender_name || selectedWorker?.full_name || formatNameFromEmailOrId(selectedWorker?.email || selectedWorker?.id || 'Worker'));

                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`flex flex-col ${isOutgoingAdmin ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Identification Header */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className={`text-[11px] font-bold ${isOutgoingAdmin ? 'text-[#111111]' : 'text-[#1E74FF]'}`}>
                          {isOutgoingAdmin ? `You (${authorName})` : authorName}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                          isOutgoingAdmin ? 'bg-[#FFE8CC] text-[#D97706]' : 'bg-[#DCE9FF] text-[#1E74FF]'
                        }`}>
                          {isOutgoingAdmin ? 'Admin' : 'Staff Worker'}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                          isOutgoingAdmin
                            ? 'bg-[#141414] text-white rounded-tr-none'
                            : 'bg-white text-[#111111] border border-[#E7E8EB] rounded-tl-none'
                        }`}
                      >
                        {/* Image Attachment Preview */}
                        {msg.image_url && (
                          <div className="mb-2 relative rounded-xl overflow-hidden group cursor-pointer border border-white/20 bg-black/20">
                            <img
                              src={msg.image_url}
                              alt="Photo Attachment"
                              className="max-h-64 sm:max-h-72 w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-102"
                              onClick={() => setLightboxImage(msg.image_url)}
                            />
                            <div
                              onClick={() => setLightboxImage(msg.image_url)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold"
                            >
                              <Eye className="w-4 h-4" /> Click to View Full Photo
                            </div>
                          </div>
                        )}

                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Timestamp & Double Ticks Footer */}
                        <div className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${
                          isOutgoingAdmin ? 'text-white/60' : 'text-[#9CA0A6]'
                        }`}>
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isOutgoingAdmin && (
                            msg.read_at ? (
                              <span className="flex items-center text-[#38BDF8] font-bold" title="Seen by Staff">
                                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="flex items-center text-white/50" title="Delivered">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 4. Quick Canned Prompts Bar */}
            <div className="px-4 sm:px-6 py-2 bg-white border-t border-[#E7E8EB] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E74FF] shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick:
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(null, prompt)}
                  className="px-3 py-1 rounded-full bg-[#F7F8FA] hover:bg-[#EEF0F2] text-[#111111] border border-[#E7E8EB] text-[11px] whitespace-nowrap transition-colors cursor-pointer font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Selected Image Attachment Preview Bar */}
            {selectedImage && (
              <div className="px-4 py-2 bg-[#F3F4F6] border-t border-[#E7E8EB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={selectedImage} alt="Attachment" className="w-10 h-10 object-cover rounded-lg border border-[#D1D5DB]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111111] truncate">Photo Attached</p>
                    <p className="text-[10px] text-[#6B7280]">Ready to send with your message</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-900 cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 5. Bottom Message Input Bar with Photo Upload */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-[#E7E8EB] flex items-center gap-2 sm:gap-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Photo Upload Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full bg-[#F7F8FA] hover:bg-[#EEF0F2] text-[#6B7280] hover:text-[#111111] border border-[#E7E8EB] transition-colors cursor-pointer shrink-0"
                title="Attach photo / image"
              >
                <ImageIcon className="w-4 h-4 text-[#1E74FF]" />
              </button>

              <input
                type="text"
                placeholder={`Type a private message to ${selectedWorker?.full_name || 'Staff'}…`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setTimeout(() => scrollToBottom('smooth'), 200)}
                className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedImage) || sending}
                className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-md p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Start New Conversation</h3>
                  <p className="text-[11px] text-[#6B7280]">Select a staff member to open a private 1:1 chat</p>
                </div>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="p-2 text-[#6B7280] hover:text-[#111111] rounded-full hover:bg-[#F1F2F4] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {uniqueWorkers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#9CA0A6] space-y-1">
                  <p className="font-bold text-[#111111]">No Workers Added Yet</p>
                  <p>Go to the Workers tab to register staff emails.</p>
                </div>
              ) : (
                uniqueWorkers.map((w) => {
                  const initials = getInitials(w.full_name || w.email, 'ST');
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWorkerId(w.id);
                        setNewChatModalOpen(false);
                      }}
                      className="w-full p-3 bg-[#F7F8FA] hover:bg-white border border-[#E7E8EB] rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#141414] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#111111] truncate group-hover:text-[#1E74FF]">
                            {w.full_name || w.email}
                          </h4>
                          <p className="text-[10px] text-[#9CA0A6] truncate">{w.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#1E74FF] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        Chat →
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ FULL-SCREEN IMAGE LIGHTBOX MODAL ════════ */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Full Preview"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
