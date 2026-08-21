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
  formatNameFromEmailOrId
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

export default function WorkerChatPanel({ workerUser, workerProfile }) {
  const workerRaw = workerUser?.email || workerProfile?.email || workerUser?.id || workerProfile?.id || 'worker-user';
  const workerId = workerUser?.id || workerProfile?.id || `worker-${workerRaw.split('@')[0]}`;
  const workerName = workerProfile?.full_name || formatNameFromEmailOrId(workerUser?.email || workerProfile?.email || workerId);

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
        const matchesWorker = newMsg.worker_id === workerId ||
          (workerUser?.email && newMsg.worker_id?.includes(workerUser.email.split('@')[0])) ||
          (workerId === 'worker-rajesh' && newMsg.worker_id === 'worker-123') ||
          (workerId === 'worker-123' && newMsg.worker_id === 'worker-rajesh');

        if (matchesWorker) {
          setMessages(prev => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some(m => m && (m.id === newMsg.id || (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000)));
            return exists ? list.map(m => (m.content === newMsg.content && Math.abs(new Date(m.created_at) - new Date(newMsg.created_at)) < 3000) ? newMsg : m) : [...list, newMsg];
          });
          setTimeout(() => scrollToBottom('smooth'), 100);

          if (newMsg.sender_role === 'admin') {
            markThreadAsRead(workerId, 'staff');
          }
        }
      },
      (receipt) => {
        if (!receipt) return;
        const { worker_id, reader_role, read_at } = receipt;
        if (reader_role === 'admin' && (worker_id === workerId || worker_id === 'worker-123' || worker_id === 'worker-rajesh')) {
          setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => {
            if (m && m.sender_role === 'staff' && !m.read_at) {
              return { ...m, read_at };
            }
            return m;
          }));
        }
      },
      (clearedPayload) => {
        if (clearedPayload && (clearedPayload.all || clearedPayload.worker_id === workerId)) {
          setMessages([]);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [workerId, workerUser]);

  // Send message to Admin with instant optimistic UI update
  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const content = (customText !== null ? customText : inputText).trim();
    if (!content) return;

    const tempId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date().toISOString();

    const optimisticMsg = {
      id: tempId,
      thread_id: `thread_${workerId}`,
      worker_id: workerId,
      sender_id: workerId,
      sender_name: workerName,
      sender_role: 'staff',
      content,
      created_at: timestamp,
      read_at: null
    };

    setInputText('');
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 20);

    setSending(true);

    try {
      const res = await sendChatMessage({
        workerId,
        senderId: workerId,
        senderName: workerName,
        senderRole: 'staff',
        content
      });

      if (res && res.data && res.data.id !== tempId) {
        setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === tempId ? res.data : m));
      }
    } catch (err) {
      console.error('Error sending worker message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    const conf = window.confirm('Clear your chat history with Studio Admin to start fresh?');
    if (!conf) return;

    setMessages([]);
    await clearThreadMessages(workerId);
  };

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] min-h-[480px] sm:min-h-[600px] bg-[#0F1623] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
      
      {/* 1. Header: KPR Studio Admin */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/10 bg-[#111827] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C5A880] text-black flex items-center justify-center font-bold text-xs sm:text-sm font-serif shadow-md shrink-0">
            KPR
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide truncate">Studio Management</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Circle className="w-1.5 h-1.5 fill-current" />
                Online
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-white/40 truncate">Direct private channel with KPR management</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleClearChat}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs font-semibold"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400/80" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-[#151D2C] to-[#0F1623]">
        {loading ? (
          <div className="p-12 sm:p-16 text-center text-white/40">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
            <p className="text-xs">Connecting to private studio chat…</p>
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="p-8 sm:p-16 text-center text-white/40 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#C5A880]/10 text-[#C5A880] flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-lg text-white/80">Direct Studio Support</h4>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              You can message Studio Admin here about your shoot schedules, file uploads, client proof revisions, or equipment requirements.
            </p>
          </div>
        ) : (
          safeMessages.map((msg, idx) => {
            if (!msg) return null;
            const isWorker = msg.sender_role === 'staff';

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${isWorker ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-white/50">
                    {isWorker ? 'You' : `${msg.sender_name || 'Studio Admin'} (Admin)`}
                  </span>
                  <span className="text-[9px] font-mono text-white/30">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md lg:max-w-lg px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg break-words ${
                    isWorker
                      ? 'bg-gradient-to-r from-[#C5A880] to-[#D4BC9A] text-black font-medium rounded-tr-none'
                      : 'bg-[#1E2433] text-white border border-white/10 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content || ''}</p>
                </div>

                {isWorker && (
                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-white/40">
                    {msg.read_at ? (
                      <span className="flex items-center gap-0.5 text-emerald-400">
                        <CheckCheck className="w-3 h-3" />
                        <span>Seen by Admin</span>
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

      {/* 3. Quick Canned Prompts */}
      <div className="px-3 sm:px-6 py-2 bg-[#111827]/90 backdrop-blur border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A880] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Quick:
        </span>
        {WORKER_QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(null, prompt)}
            className="px-2.5 sm:px-3 py-1 rounded-full bg-black/40 hover:bg-[#C5A880]/20 hover:border-[#C5A880]/40 text-white/70 hover:text-white border border-white/10 text-[10px] sm:text-[11px] whitespace-nowrap transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* 4. Bottom Input Bar */}
      <form onSubmit={handleSend} className="p-2.5 sm:p-4 bg-[#111827] border-t border-white/10 flex items-center gap-2 sm:gap-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <input
          type="text"
          placeholder="Type a private message to Studio Admin…"
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

    </div>
  );
}
