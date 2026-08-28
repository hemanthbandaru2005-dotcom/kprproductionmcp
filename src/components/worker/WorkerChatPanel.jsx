import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MessageSquare, Sparkles, RefreshCw,
  Check, CheckCheck, Circle, Trash2,
  Image as ImageIcon, X, Eye
} from 'lucide-react';
import {
  fetchMessagesForWorker,
  sendChatMessage,
  markThreadAsRead,
  subscribeToChatChannel,
  clearThreadMessages,
  formatNameFromEmailOrId,
  normalizeWorkerId,
  matchesWorker,
  generateUUID
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
    const sameRole = m.sender_role === newMsg.sender_role;
    const sameContent = (m.content || '').trim() === (newMsg.content || '').trim();
    const sameImage = m.image_url === newMsg.image_url;
    const timeDiff = Math.abs(new Date(m.created_at || 0) - new Date(newMsg.created_at || 0));
    return sameRole && sameContent && sameImage && timeDiff < 10000;
  });

  if (isDuplicate) {
    return list.map(m => {
      if (m.id === newMsg.id || (
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

export default function WorkerChatPanel({ workerUser, workerProfile }) {
  const workerEmail = (workerUser?.email || workerProfile?.email || '').toLowerCase().trim();
  const rawId = workerProfile?.id || workerUser?.id || workerEmail.split('@')[0] || 'worker-user';
  const workerId = normalizeWorkerId(workerEmail || rawId);
  const workerName = workerProfile?.full_name || workerUser?.user_metadata?.full_name || formatNameFromEmailOrId(workerEmail || rawId);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Load conversation messages
  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await fetchMessagesForWorker(workerEmail || workerId || workerName);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => scrollToBottom('auto'), 100);

      await markThreadAsRead(workerEmail || workerId, 'staff');
    } catch (err) {
      console.error('Error loading worker messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [workerId, workerEmail]);

  // Real-time channel listener
  useEffect(() => {
    const unsubscribe = subscribeToChatChannel(
      (newMsg) => {
        if (!newMsg) return;
        if (matchesWorker(newMsg, workerEmail || workerId || workerName)) {
          setMessages(prev => mergeAndDeduplicateMessages(prev, newMsg));
          setTimeout(() => scrollToBottom('smooth'), 100);

          if (newMsg.sender_role === 'admin') {
            markThreadAsRead(workerEmail || workerId, 'staff');
          }
        }
      },
      (receipt) => {
        if (!receipt) return;
        const { worker_id, reader_role, read_at } = receipt;
        if (reader_role === 'admin' && matchesWorker({ worker_id }, workerEmail || workerId || workerName)) {
          setMessages(prev => (Array.isArray(prev) ? prev : []).map(m => {
            if (m && m.sender_role === 'staff' && !m.read_at) {
              return { ...m, read_at: read_at || new Date().toISOString() };
            }
            return m;
          }));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [workerId, workerEmail, workerName]);

  // Auto-poll for new messages every 2.5 seconds (ensures real-time sync across all devices)
  useEffect(() => {
    let isMounted = true;

    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const threadMsgs = await fetchMessagesForWorker(workerEmail || workerId || workerName);
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
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [workerId, workerEmail, workerName]);

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
    if ((!textToSend.trim() && !imageToSend) || sending) return;

    setSending(true);
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const effectiveTargetId = workerEmail || workerId || 'worker-primary';
    const msgUUID = generateUUID();

    const optimisticMsg = {
      id: msgUUID,
      thread_id: `thread_${normalizeWorkerId(effectiveTargetId)}`,
      worker_id: normalizeWorkerId(effectiveTargetId),
      sender_id: workerUser?.id || workerUser?.email || effectiveTargetId,
      sender_name: workerName || 'Staff Member',
      sender_role: 'staff',
      content: textToSend.trim() || (imageToSend ? 'Attached photo 📷' : ''),
      image_url: imageToSend,
      created_at: new Date().toISOString(),
      read_at: null,
      client_email: workerEmail || `${normalizeWorkerId(effectiveTargetId).replace(/^worker[-_]/, '')}@kpr.com`
    };

    setMessages(prev => mergeAndDeduplicateMessages(prev, optimisticMsg));
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const sent = await Promise.race([
        sendChatMessage({
          workerId: effectiveTargetId,
          senderRole: 'staff',
          senderName: workerName,
          senderId: workerUser?.id || workerUser?.email || effectiveTargetId,
          content: textToSend.trim() || (imageToSend ? 'Attached photo 📷' : ''),
          imageUrl: imageToSend,
          customId: msgUUID
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout')), 8000))
      ]);

      if (sent) {
        setMessages(prev => mergeAndDeduplicateMessages(prev, sent));
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    } catch (err) {
      console.warn('Notice while sending staff message (saved locally/optimistically):', err);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history with Admin?')) return;
    setMessages([]);
    await clearThreadMessages(workerEmail || workerId);
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
                Live Channel
              </span>
            </div>
            <p className="text-[10px] text-[#9CA0A6]">
              Logged in as <span className="font-semibold text-[#111111]">{workerName}</span> ({workerEmail || workerId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-full hover:bg-[#F1F2F4] text-[#6B7280] hover:text-[#DC2626] transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Message List */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 bg-[#F7F8FA]">
        {loading ? (
          <div className="p-16 text-center text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
            <p className="text-xs">Loading studio messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-[#9CA0A6] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">1:1 Studio Direct Line</h4>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Send updates, photos, questions about your shoot assignments, or notify Admin about Drive uploads here.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (!msg) return null;
            const isMe = msg.sender_role === 'staff';

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className={`text-[11px] font-bold ${isMe ? 'text-[#1E74FF]' : 'text-[#111111]'}`}>
                    {isMe ? 'You' : (msg.sender_name || 'KPR Studio Admin')}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                    isMe ? 'bg-[#DCE9FF] text-[#1E74FF]' : 'bg-[#FFE8CC] text-[#D97706]'
                  }`}>
                    {isMe ? 'Staff' : 'Admin'}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                    isMe
                      ? 'bg-[#1E74FF] text-white rounded-tr-none'
                      : 'bg-white text-[#111111] border border-[#E7E8EB] rounded-tl-none'
                  }`}
                >
                  {/* Image Attachment Preview */}
                  {msg.image_url && (
                    <div className="mb-2 relative rounded-xl overflow-hidden group cursor-pointer border border-white/20 bg-black/20">
                      <img
                        src={msg.image_url}
                        alt="Photo Attachment"
                        className="max-h-64 w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-102"
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

                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                    isMe ? 'text-white/70' : 'text-[#9CA0A6]'
                  }`}>
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isMe && (
                      msg.read_at ? (
                        <span className="flex items-center text-[#E0F2FE] font-bold" title="Seen by Admin">
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

      {/* 3. Quick Canned Prompts */}
      <div className="px-4 sm:px-6 py-2 bg-white border-t border-[#E7E8EB] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
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

      {/* Selected Image Attachment Preview Bar */}
      {selectedImage && (
        <div className="px-4 py-2 bg-[#F3F4F6] border-t border-[#E7E8EB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src={selectedImage} alt="Attachment" className="w-10 h-10 object-cover rounded-lg border border-[#D1D5DB]" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#111111] truncate">Photo Attached</p>
              <p className="text-[10px] text-[#6B7280]">Ready to send to Admin</p>
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

      {/* 4. Input Form with Photo Upload */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-[#E7E8EB] flex items-center gap-2 sm:gap-3 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

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
          placeholder="Type message to Studio Admin…"
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

      {/* 5. Fullscreen Lightbox Modal */}
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
