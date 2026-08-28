import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send, MessageSquare, Sparkles, RefreshCw,
  Check, CheckCheck, Circle, Trash2
} from 'lucide-react';
import {
  fetchMessagesForWorker,
  sendChatMessage,
  markThreadAsRead,
  subscribeToChatChannel,
  clearThreadMessages,
  formatNameFromEmailOrId,
  normalizeWorkerId
} from '../../utils/chatService';

const WORKER_QUICK_PROMPTS = [
  "Raw shoot files uploaded to Drive folder 📂",
  "Color grading in progress, will deliver by evening ⏱️",
  "Client requested a minor skin tone revision ✨",
  "Arrived on site for today's wedding shoot 🚗"
];

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    const timeDiff = Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0));
    return sameWorker && sameRole && sameContent && timeDiff < 10000;
  });

  if (isDuplicate) {
    return list.map(m => {
      if (m.id === newMsg.id || (
        m.worker_id === newMsg.worker_id &&
        m.sender_role === newMsg.sender_role &&
        (m.content || '').trim() === (newMsg.content || '').trim() &&
        Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0)) < 10000
      )) {
        return { ...m, ...newMsg };
      }
      return m;
    });
  }

  return [...list, newMsg];
}

export default function WorkerChatPanel({ workerUser, workerProfile }) {
  const workerEmail = (workerUser?.email || workerProfile?.email || '').toLowerCase().trim();
  const workerId = normalizeWorkerId(workerEmail || workerUser?.id || workerProfile?.id || 'worker-user');
  const workerName = workerProfile?.full_name || workerUser?.user_metadata?.full_name || formatNameFromEmailOrId(workerEmail || workerId);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Load conversation messages
  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await fetchMessagesForWorker(workerId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => scrollToBottom('auto'), 100);

      await markThreadAsRead(workerId, 'staff');
    } catch (err) {
      console.error('Error loading worker messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [workerId]);

  // Real-time channel listener
  useEffect(() => {
    const unsubscribe = subscribeToChatChannel(
      (newMsg) => {
        if (!newMsg) return;
        const targetNorm = normalizeWorkerId(workerId);
        const matchesWorker = (
          newMsg.worker_id === workerId ||
          newMsg.worker_id === targetNorm ||
          normalizeWorkerId(newMsg.worker_id) === targetNorm ||
          newMsg.thread_id === `thread_${workerId}` ||
          newMsg.thread_id === `thread_${targetNorm}`
        );

        if (matchesWorker) {
          setMessages(prev => mergeAndDeduplicateMessages(prev, newMsg));
          setTimeout(() => scrollToBottom('smooth'), 100);

          if (newMsg.sender_role === 'admin') {
            markThreadAsRead(workerId, 'staff');
          }
        }
      },
      (receipt) => {
        if (!receipt) return;
        const { worker_id, reader_role, read_at } = receipt;
        const targetNorm = normalizeWorkerId(workerId);
        if (reader_role === 'admin' && (worker_id === workerId || worker_id === targetNorm || normalizeWorkerId(worker_id) === targetNorm)) {
          setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => {
            if (m && m.sender_role === 'staff' && !m.read_at) {
              return { ...m, read_at };
            }
            return m;
          }));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [workerId, workerUser]);

  // Auto-poll for new messages every 3 seconds (ensures real-time sync across all devices)
  useEffect(() => {
    let isMounted = true;

    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const threadMsgs = await fetchMessagesForWorker(workerId);
        if (!isMounted || !Array.isArray(threadMsgs)) return;
        setMessages(prev => {
          if (threadMsgs.length !== prev.length || (threadMsgs.length > 0 && prev.length > 0 && threadMsgs[threadMsgs.length - 1]?.id !== prev[prev.length - 1]?.id)) {
            setTimeout(() => scrollToBottom('smooth'), 100);
            return threadMsgs;
          }
          return prev;
        });
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [workerId]);

  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputText;
    if (!textToSend.trim() || sending) return;

    setSending(true);
    setInputText('');

    try {
      const sent = await sendChatMessage({
        workerId,
        senderRole: 'staff',
        senderName: workerName,
        content: textToSend.trim()
      });

      if (sent) {
        setMessages(prev => mergeAndDeduplicateMessages(prev, sent));
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    } catch (err) {
      console.error('Error sending staff message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history with Admin?')) return;
    setMessages([]);
    await clearThreadMessages(workerId);
  };

  return (
    <div className="flex flex-col h-[680px] bg-white rounded-[20px] border border-[#E7E8EB] overflow-hidden shadow-xs animate-fadeIn">
      
      {/* 1. Header */}
      <div className="h-16 px-5 sm:px-6 border-b border-[#E7E8EB] bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111] tracking-tight">KPR Studio Admin</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D]">
                <Circle className="w-1.5 h-1.5 fill-current" />
                Live Desk
              </span>
            </div>
            <p className="text-[11px] text-[#9CA0A6]">Direct 1:1 communication channel with Studio Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMessages}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh conversation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearHistory}
            className="p-2 rounded-full bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer border border-[#FCA5A5]"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Message History Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F7F8FA]">
        {loading ? (
          <div className="p-16 text-center text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
            <p className="text-xs">Loading studio chat history…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-[#9CA0A6] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">Start a conversation with Admin</h4>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Send updates on today's photoshoot, request equipment, report drive uploads, or coordinate shoot timelines.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (!msg) return null;
            const isOutgoingWorker = msg.sender_role === 'staff';
            const authorName = isOutgoingWorker
              ? (msg.sender_name || workerName || 'Staff Member')
              : (msg.sender_name || 'Studio Admin');

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col ${isOutgoingWorker ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Identification Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className={`text-[11px] font-bold ${isOutgoingWorker ? 'text-[#111111]' : 'text-[#D97706]'}`}>
                    {isOutgoingWorker ? `You (${authorName})` : authorName}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                    isOutgoingWorker ? 'bg-[#DCE9FF] text-[#1E74FF]' : 'bg-[#FFE8CC] text-[#D97706]'
                  }`}>
                    {isOutgoingWorker ? 'Staff' : 'Studio Admin'}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                    isOutgoingWorker
                      ? 'bg-[#141414] text-white rounded-tr-none'
                      : 'bg-white text-[#111111] border border-[#E7E8EB] rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content || ''}</p>

                  {/* Timestamp & Read Receipt */}
                  <div className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${
                    isOutgoingWorker ? 'text-white/60' : 'text-[#9CA0A6]'
                  }`}>
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isOutgoingWorker && (
                      msg.read_at ? (
                        <span className="flex items-center text-[#38BDF8] font-bold" title="Seen by Admin">
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

      {/* 3. Quick Canned Prompts Bar */}
      <div className="px-4 sm:px-6 py-2 bg-white border-t border-[#E7E8EB] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E74FF] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick:
        </span>
        {WORKER_QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(null, prompt)}
            className="px-3 py-1 rounded-full bg-[#F7F8FA] hover:bg-[#EEF0F2] text-[#111111] border border-[#E7E8EB] text-[11px] whitespace-nowrap transition-colors cursor-pointer font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Bottom Message Input Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-[#E7E8EB] flex items-center gap-2 sm:gap-3 shrink-0">
        <input
          type="text"
          placeholder="Type a message to Studio Admin…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

    </div>
  );
}
