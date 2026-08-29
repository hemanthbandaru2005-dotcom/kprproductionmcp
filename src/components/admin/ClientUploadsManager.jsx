import React, { useState, useEffect } from 'react';
import {
  CloudUpload, HardDrive, RefreshCw, Search, Filter,
  ExternalLink, Eye, AlertCircle, CheckCircle, Clock,
  FileText, Image as ImageIcon, Trash2, Folder, User,
  ArrowUpRight, RotateCcw, X, ShieldAlert, Sparkles, Radio,
  Archive, Film, Music, Briefcase, CheckCircle2, Bell
} from 'lucide-react';
import {
  fetchAllClientUploadsForAdmin,
  retryDriveSync,
  deleteClientUpload,
  subscribeToClientUploadsRealtime,
  formatFileSize,
  getFileCategory,
  fetchUploadActivityMessages,
  deleteUploadActivityMessage,
  clearAllUploadActivityMessages,
  subscribeToUploadActivityMessages,
  formatUploaderDisplayName,
  formatProjectDisplayName
} from '../../utils/clientUploadsService';

export default function ClientUploadsManager() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceTab, setSourceTab] = useState('all'); // 'all' | 'client' | 'worker'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'synced' | 'failed' | 'pending'
  const [retryingId, setRetryingId] = useState(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activityMessages, setActivityMessages] = useState([]);

  const loadUploads = async () => {
    setLoading(true);
    const data = await fetchAllClientUploadsForAdmin();
    setUploads(data || []);
    setLoading(false);
  };

  const loadActivityMessages = async () => {
    const msgs = await fetchUploadActivityMessages();
    setActivityMessages(msgs || []);
  };

  useEffect(() => {
    loadUploads();
    loadActivityMessages();

    // Auto-poll every 4 seconds for live cross-device sync
    const pollInterval = setInterval(() => {
      fetchAllClientUploadsForAdmin().then(data => {
        if (Array.isArray(data)) {
          setUploads(data);
        }
      }).catch(() => {});

      fetchUploadActivityMessages().then(msgs => {
        if (Array.isArray(msgs)) {
          setActivityMessages(msgs);
        }
      }).catch(() => {});
    }, 4000);

    // Subscribe to real-time events for upload records (cross-device via Supabase Realtime)
    const unsubscribeUploads = subscribeToClientUploadsRealtime((event) => {
      if (!event) return;

      if (event.type === 'insert' && event.record) {
        setUploads((prev) => {
          if (prev.some(item => item.id === event.record.id)) {
            return prev.map(item => item.id === event.record.id ? { ...item, ...event.record } : item);
          }
          return [{ ...event.record, isNew: true }, ...prev];
        });
        const uploaderType = (event.record.uploader_role === 'worker' || event.record.is_worker_upload) ? 'Worker' : 'Client';
        showNotice(`🔔 ${uploaderType} ${event.record.uploader_name || event.record.client_name || ''} uploaded: "${event.record.file_name}"`, 'success');
        loadActivityMessages();
      } else if (event.type === 'update' && event.record) {
        setUploads((prev) => prev.map(item => item.id === event.record.id ? { ...item, ...event.record } : item));
      } else if (event.type === 'delete') {
        // Instant cross-device deletion — remove by uploadId, cleanId, and fileName
        const delId = event.uploadId || (event.record && event.record.id);
        const cleanId = event.cleanId || (delId ? String(delId).replace(/^worker_jf_/, '') : '');
        const delFileName = event.fileName || (event.record && event.record.file_name) || '';
        setUploads((prev) => prev.filter(item =>
          item.id !== delId &&
          item.id !== cleanId &&
          item.id !== `worker_jf_${cleanId}` &&
          (!delFileName || item.file_name !== delFileName)
        ));
        if (previewFile && (previewFile.id === delId || previewFile.id === cleanId || (delFileName && previewFile.file_name === delFileName))) {
          setPreviewFile(null);
        }
      }
    });

    // Subscribe to activity alerts
    const unsubscribeActivity = subscribeToUploadActivityMessages((event) => {
      if (!event) return;
      if (event.type === 'new_activity' && event.message) {
        setActivityMessages(prev => [event.message, ...prev.filter(m => m.id !== event.message.id)]);
      } else if (event.type === 'delete_activity' && event.id) {
        setActivityMessages(prev => prev.filter(m => m.id !== event.id));
      } else if (event.type === 'clear_all') {
        setActivityMessages([]);
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribeUploads();
      unsubscribeActivity();
    };
  }, []);

  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 5000);
  };

  // Helper: determine if an upload is from a client or worker
  const isWorkerUpload = (item) => {
    if (!item) return false;
    if (item.uploader_role === 'worker' || item.is_worker_upload === true) return true;
    const email = (item.client_email || item.uploader_email || '').toLowerCase();
    const id = (item.client_id || item.uploader_name || '').toLowerCase();
    const name = (item.uploader_name || '').toLowerCase();
    return email.includes('@kpr.com') ||
      id.startsWith('worker') ||
      name.includes('worker') ||
      name.includes('staff') ||
      name.includes('photographer') ||
      name.includes('editor');
  };

  // Handle single file retry
  const handleRetry = async (uploadId, e) => {
    e.stopPropagation();
    setRetryingId(uploadId);
    try {
      const res = await retryDriveSync(uploadId);
      if (res.success) {
        showNotice('Successfully mirrored file to Google Drive!', 'success');
      } else {
        showNotice(`Drive sync retry failed: ${res.error}`, 'error');
      }
      await loadUploads();
    } catch (err) {
      showNotice(`Error: ${err.message}`, 'error');
    } finally {
      setRetryingId(null);
    }
  };

  // Handle batch retry for all failed syncs
  const handleRetryAllFailed = async () => {
    const failedItems = uploads.filter(u => u.drive_sync_status === 'failed');
    if (failedItems.length === 0) return;

    setRetryingAll(true);
    let successCount = 0;
    for (const item of failedItems) {
      try {
        const res = await retryDriveSync(item.id);
        if (res.success) successCount++;
      } catch (err) {
        console.error('Batch retry error on', item.id, err);
      }
    }
    await loadUploads();
    setRetryingAll(false);
    showNotice(`Batch retry finished: ${successCount} of ${failedItems.length} synced to Drive!`, 'success');
  };

  const handleDelete = async (uploadId, e) => {
    if (e) e.stopPropagation();
    const targetItem = uploads.find(item => item.id === uploadId || item.id === String(uploadId).replace(/^worker_jf_/, ''));
    const fileName = targetItem?.file_name || '';
    if (window.confirm(`Are you sure you want to PERMANENTLY delete "${fileName || 'this file'}" from storage and Google Drive?`)) {
      const cleanId = String(uploadId).replace(/^worker_jf_/, '');
      // 1. Optimistic instant UI removal (0ms delay)
      setUploads(prev => prev.filter(item => item.id !== uploadId && item.id !== cleanId && (!fileName || item.file_name !== fileName)));
      if (previewFile?.id === uploadId || previewFile?.id === cleanId || (fileName && previewFile?.file_name === fileName)) {
        setPreviewFile(null);
      }
      showNotice('File permanently deleted from storage and Google Drive', 'success');

      // 2. Perform deep deletion across all storages & Supabase tables in background
      try {
        await deleteClientUpload(uploadId);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  // Handle delete a specific activity message
  const handleDeleteActivity = async (id, e) => {
    if (e) e.stopPropagation();
    setActivityMessages(prev => prev.filter(m => m.id !== id));
    await deleteUploadActivityMessage(id);
    showNotice('Upload alert removed', 'success');
  };

  // Handle clear all activity messages
  const handleClearAllActivity = async () => {
    if (window.confirm('Clear all upload activity alerts?')) {
      setActivityMessages([]);
      await clearAllUploadActivityMessages();
      showNotice('All upload alerts cleared', 'success');
    }
  };

  // Filtered uploads
  const filteredUploads = uploads.filter((item) => {
    const isWorker = isWorkerUpload(item);

    // 1. Source Tab Filter
    if (sourceTab === 'client' && isWorker) return false;
    if (sourceTab === 'worker' && !isWorker) return false;

    // 2. Search Filter
    const matchesSearch =
      (item.file_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.uploader_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.project_title || '').toLowerCase().includes(search.toLowerCase());

    // 3. Status Filter
    const matchesStatus =
      statusFilter === 'all' ||
      item.drive_sync_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clientUploads = uploads.filter(u => !isWorkerUpload(u));
  const workerUploads = uploads.filter(u => isWorkerUpload(u));

  const syncedCount = uploads.filter(u => u.drive_sync_status === 'synced').length;
  const failedCount = uploads.filter(u => u.drive_sync_status === 'failed').length;
  const pendingCount = uploads.filter(u => u.drive_sync_status === 'pending').length;
  const totalBytes = uploads.reduce((acc, curr) => acc + (curr.file_size || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Notice Toast */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl animate-slideUp ${
            notice.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{notice.msg}</span>
          <button onClick={() => setNotice(null)} className="ml-2 text-white/40 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════ LIVE UPLOAD ACTIVITY & NOTIFICATION MESSAGES FEED ═══════ */}
      {activityMessages.length > 0 && (
        <div className="bg-white border border-[#E7E8EB] rounded-[24px] p-5 sm:p-6 space-y-3.5 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <span>Live Upload Messages & Activity</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#141414] text-white">
                    {activityMessages.length}
                  </span>
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Real-time notifications when workers or clients upload files to Google Drive.
                </p>
              </div>
            </div>

            <button
              onClick={handleClearAllActivity}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#DC2626] flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#FEF2F2] transition-colors cursor-pointer border border-[#E7E8EB]"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          {/* List of active upload messages */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {activityMessages.map((msg) => {
              const isWorker = msg.uploader_role === 'worker';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    isWorker
                      ? 'bg-[#EAF8EE]/50 border-[#BBF7D0] hover:bg-[#EAF8EE]'
                      : 'bg-[#EBF3FF]/50 border-[#BFDBFE] hover:bg-[#EBF3FF]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate max-w-2xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isWorker ? 'bg-[#13A52D] text-white' : 'bg-[#1E74FF] text-white'
                    }`}>
                      {isWorker ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="truncate space-y-0.5">
                      <p className="text-xs font-semibold text-[#111111] truncate">
                        {isWorker ? (
                          <span>
                            Worker <strong className="text-[#13A52D] font-bold">{msg.uploader_name}</strong> uploaded photos/deliverables for <strong className="text-[#111111]">{msg.project_title}</strong>
                          </span>
                        ) : (
                          <span>
                            Client <strong className="text-[#1E74FF] font-bold">{msg.uploader_name}</strong> uploaded photos for <strong className="text-[#111111]">{msg.project_title}</strong>
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#6B7280] flex items-center gap-2 truncate">
                        <span className="font-mono text-[#111111] font-medium truncate">📁 {msg.file_name}</span>
                        <span>•</span>
                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {msg.drive_url && (
                      <a
                        href={msg.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-white border border-[#E7E8EB] hover:bg-[#F7F8FA] text-[11px] font-semibold text-[#111111] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-[#13A52D]" />
                        <span>Open in Drive</span>
                        <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                      </a>
                    )}

                    <button
                      onClick={(e) => handleDeleteActivity(msg.id, e)}
                      className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                      title="Delete this message"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ PRIMARY VIEW SELECTOR TABS (Client vs Worker vs All) ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ALL UPLOADS TAB */}
        <button
          onClick={() => setSourceTab('all')}
          className={`p-4 rounded-[20px] border transition-all text-left flex items-center justify-between cursor-pointer ${
            sourceTab === 'all'
              ? 'bg-[#141414] text-white border-[#141414] shadow-md'
              : 'bg-white text-[#111111] border-[#E7E8EB] hover:bg-[#F9FAFB]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              sourceTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#DCE9FF] text-[#1E74FF]'
            }`}>
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">All Uploads Vault</p>
              <p className={`text-[11px] ${sourceTab === 'all' ? 'text-white/70' : 'text-[#6B7280]'}`}>
                Entire Studio Archive
              </p>
            </div>
          </div>
          <span className={`text-xl font-bold font-mono px-3 py-1 rounded-full ${
            sourceTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#F1F2F4] text-[#111111]'
          }`}>
            {uploads.length}
          </span>
        </button>

        {/* CLIENT UPLOADS TAB */}
        <button
          onClick={() => setSourceTab('client')}
          className={`p-4 rounded-[20px] border transition-all text-left flex items-center justify-between cursor-pointer ${
            sourceTab === 'client'
              ? 'bg-[#1E74FF] text-white border-[#1E74FF] shadow-md ring-2 ring-[#1E74FF]/30'
              : 'bg-white text-[#111111] border-[#E7E8EB] hover:bg-[#F9FAFB]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              sourceTab === 'client' ? 'bg-white/20 text-white' : 'bg-[#DCE9FF] text-[#1E74FF]'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Client Uploads</p>
              <p className={`text-[11px] ${sourceTab === 'client' ? 'text-white/80' : 'text-[#6B7280]'}`}>
                Photos & Proofs from Clients
              </p>
            </div>
          </div>
          <span className={`text-xl font-bold font-mono px-3 py-1 rounded-full ${
            sourceTab === 'client' ? 'bg-white/20 text-white' : 'bg-[#EBF3FF] text-[#1E74FF]'
          }`}>
            {clientUploads.length}
          </span>
        </button>

        {/* WORKER UPLOADS TAB */}
        <button
          onClick={() => setSourceTab('worker')}
          className={`p-4 rounded-[20px] border transition-all text-left flex items-center justify-between cursor-pointer ${
            sourceTab === 'worker'
              ? 'bg-[#13A52D] text-white border-[#13A52D] shadow-md ring-2 ring-[#13A52D]/30'
              : 'bg-white text-[#111111] border-[#E7E8EB] hover:bg-[#F9FAFB]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              sourceTab === 'worker' ? 'bg-white/20 text-white' : 'bg-[#DFF5E3] text-[#13A52D]'
            }`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Worker Deliverables</p>
              <p className={`text-[11px] ${sourceTab === 'worker' ? 'text-white/80' : 'text-[#6B7280]'}`}>
                Staff Edits, Reels & Raw Shoots
              </p>
            </div>
          </div>
          <span className={`text-xl font-bold font-mono px-3 py-1 rounded-full ${
            sourceTab === 'worker' ? 'bg-white/20 text-white' : 'bg-[#EAF8EE] text-[#13A52D]'
          }`}>
            {workerUploads.length}
          </span>
        </button>
      </div>

      {/* ═══════ STATS SUMMARY ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280]">Total Vault Files</span>
            <div className="w-8 h-8 rounded-full bg-[#F1F2F4] text-[#111111] flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111]">{uploads.length}</p>
          <p className="text-[11px] text-[#9CA0A6]">{formatFileSize(totalBytes)} storage recorded</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#13A52D]">Synced to Google Drive</span>
            <div className="w-8 h-8 rounded-full bg-[#DFF5E3] text-[#13A52D] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#13A52D]">{syncedCount}</p>
          <p className="text-[11px] text-[#9CA0A6]">100% Cloud Confirmed</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#1E74FF]">Client Submissions</span>
            <div className="w-8 h-8 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#1E74FF]">{clientUploads.length}</p>
          <p className="text-[11px] text-[#9CA0A6]">Client Portal Submissions</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#D97706]">Worker Deliverables</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#D97706]">{workerUploads.length}</p>
          <p className="text-[11px] text-[#9CA0A6]">Staff Uploads & Drive Links</p>
        </div>
      </div>

      {/* ═══════ SEARCH & STATUS FILTER BAR ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#E7E8EB] rounded-[20px] p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search files, client name, staff name, or shoot…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Status' },
            { key: 'synced', label: 'Synced to Drive', count: syncedCount },
            { key: 'failed', label: 'Failed', count: failedCount },
            { key: 'pending', label: 'Pending', count: pendingCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-[#141414] text-white font-bold'
                  : 'bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className="text-[10px] opacity-70">({tab.count})</span>}
            </button>
          ))}

          {failedCount > 0 && (
            <button
              onClick={handleRetryAllFailed}
              disabled={retryingAll}
              className="px-3.5 py-1.5 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
              <span>Retry Failed</span>
            </button>
          )}

          <button
            onClick={() => { loadUploads(); loadActivityMessages(); }}
            className="p-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer border border-[#E7E8EB] shrink-0"
            title="Refresh All Records & Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ═══════ UPLOADS TABLE ═══════ */}
      <div className="bg-white rounded-[24px] border border-[#E7E8EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-[#9CA0A6] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414]" />
            <p className="text-xs">Loading Google Drive upload records…</p>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="p-16 text-center text-[#9CA0A6] space-y-3">
            <CloudUpload className="w-12 h-12 mx-auto text-[#9CA0A6]" />
            <p className="text-base font-bold text-[#111111]">
              No {sourceTab === 'client' ? 'Client' : sourceTab === 'worker' ? 'Worker' : ''} Uploads Found
            </p>
            <p className="text-xs text-[#9CA0A6] max-w-md mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : sourceTab === 'client'
                ? 'Files uploaded by clients via the Client Portal will automatically appear here with Google Drive links.'
                : sourceTab === 'worker'
                ? 'Files and Google Drive deliverables uploaded by staff photographers/editors will appear here.'
                : 'Upload records will appear here as soon as files are submitted.'}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-[#E7E8EB]">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-[#E7E8EB] text-[10px] text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                  <th className="px-3.5 py-3">File Details</th>
                  <th className="px-3 py-3">Uploaded By</th>
                  <th className="px-3 py-3">Target Shoot</th>
                  <th className="px-3 py-3">Size & Date</th>
                  <th className="px-3 py-3">Drive Status</th>
                  <th className="px-3 py-3 text-right">Actions & Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E8EB] bg-white">
                {filteredUploads.map((item) => {
                  const isPhoto = item.file_category === 'photo';
                  const isPdf = item.file_category === 'pdf';
                  const isSynced = item.drive_sync_status === 'synced';
                  const isFailed = item.drive_sync_status === 'failed';
                  const isPending = item.drive_sync_status === 'pending';
                  const isRetrying = retryingId === item.id;
                  const isWorker = isWorkerUpload(item);
                  const driveLink = item.drive_file_url || item.file_url || (item.drive_file_id ? `https://drive.google.com/file/d/${item.drive_file_id}/view` : null);

                  const uploaderName = formatUploaderDisplayName(item.uploader_name || item.client_name, item.uploader_email || item.client_email, isWorker ? 'worker' : 'client');
                  const uploaderEmail = item.uploader_email || item.client_email || '';
                  const projectTitle = formatProjectDisplayName(item.project_title);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F9FAFB] transition-colors group ${
                        item.isNew ? 'bg-[#C5A880]/10 animate-pulse' : ''
                      }`}
                    >
                      
                      {/* File Details */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#F1F2F4] border border-[#E7E8EB] flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                            {isPhoto && item.file_url ? (
                              <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                            ) : item.file_category === 'zip' || (item.file_name && item.file_name.toLowerCase().endsWith('.zip')) ? (
                              <Archive className="w-4 h-4 text-amber-500" />
                            ) : isPdf ? (
                              <FileText className="w-4 h-4 text-rose-500" />
                            ) : item.file_category === 'video' ? (
                              <Film className="w-4 h-4 text-purple-500" />
                            ) : item.file_type === 'drive' || item.is_drive ? (
                              <HardDrive className="w-4 h-4 text-[#13A52D]" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#1E74FF]" />
                            )}
                          </div>
                          <div className="max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate">
                            <p className="text-xs font-bold text-[#111111] truncate" title={item.file_name}>
                              {item.file_name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#EEF0F2] text-[#6B7280] font-semibold">
                                .{item.file_type || 'file'}
                              </span>
                              {item.drive_file_id && (
                                <span className="text-[9px] font-mono text-[#9CA0A6] truncate max-w-[90px]" title={`Drive ID: ${item.drive_file_id}`}>
                                  ID: {item.drive_file_id.substring(0, 8)}…
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Uploaded By */}
                      <td className="px-3 py-3 space-y-0.5">
                        {isWorker ? (
                          <span className="whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#EAF8EE] text-[#13A52D] border border-[#BBF7D0]">
                            <Briefcase className="w-2.5 h-2.5" />
                            Worker
                          </span>
                        ) : (
                          <span className="whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#EBF3FF] text-[#1E74FF] border border-[#BFDBFE]">
                            <User className="w-2.5 h-2.5" />
                            Client
                          </span>
                        )}
                        <p className="text-xs font-bold text-[#111111] truncate max-w-[130px]">{uploaderName}</p>
                        {uploaderEmail && <p className="text-[10px] text-[#6B7280] font-mono truncate max-w-[130px]">{uploaderEmail}</p>}
                      </td>

                      {/* Shoot / Project */}
                      <td className="px-3 py-3 space-y-0.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#111111] max-w-[140px] truncate">
                          <Folder className="w-3 h-3 text-[#141414] shrink-0" />
                          <span className="truncate">{projectTitle}</span>
                        </div>
                        {item.client_name && !item.client_name.startsWith('worker_reg_') && (
                          <p className="text-[10px] text-[#6B7280] truncate max-w-[140px]">
                            {item.client_name}
                          </p>
                        )}
                      </td>

                      {/* Size & Date */}
                      <td className="px-3 py-3 space-y-0.5 text-xs text-[#6B7280]">
                        <p className="font-mono text-[11px] font-semibold text-[#111111] whitespace-nowrap">
                          {item.file_size > 0 ? formatFileSize(item.file_size) : 'Drive Link'}
                        </p>
                        <p className="text-[10px] text-[#9CA0A6] whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </p>
                      </td>

                      {/* Drive Sync Status */}
                      <td className="px-3 py-3">
                        {isSynced ? (
                          <div className="space-y-0.5">
                            <span className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D] border border-[#BBF7D0]">
                              <CheckCircle2 className="w-3 h-3 text-[#13A52D]" />
                              Synced
                            </span>
                            {item.drive_folder_path && (
                              <p className="text-[9px] text-[#9CA0A6] font-mono truncate max-w-[160px]" title={item.drive_folder_path}>
                                📁 {item.drive_folder_path}
                              </p>
                            )}
                          </div>
                        ) : isFailed ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                                <span className="w-1 h-1 rounded-full bg-[#DC2626]" />
                                Failed
                              </span>

                              <button
                                onClick={(e) => handleRetry(item.id, e)}
                                disabled={isRetrying}
                                className="whitespace-nowrap px-2 py-0.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#D97706] rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                title="Retry Drive Sync"
                              >
                                <RotateCcw className={`w-2.5 h-2.5 ${isRetrying ? 'animate-spin' : ''}`} />
                                <span>{isRetrying ? '…' : 'Retry'}</span>
                              </button>
                            </div>
                            {item.drive_sync_error && (
                              <p className="text-[9px] text-[#DC2626] font-mono truncate max-w-[140px]" title={item.drive_sync_error}>
                                {item.drive_sync_error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#DCE9FF] text-[#1E74FF] border border-[#BFDBFE]">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              Pending
                            </span>
                            <button
                              onClick={(e) => handleRetry(item.id, e)}
                              disabled={isRetrying}
                              className="whitespace-nowrap px-1.5 py-0.5 bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Push
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          
                          {/* Direct Google Drive Link */}
                          {driveLink && (
                            <a
                              href={driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-all shadow-xs shrink-0 cursor-pointer"
                              title="Open Directly in Google Drive"
                            >
                              <HardDrive className="w-3.5 h-3.5 text-[#13A52D]" />
                              <span className="hidden sm:inline">Drive</span>
                              <ExternalLink className="w-2.5 h-2.5 text-white/70" />
                            </a>
                          )}

                          {/* App Preview */}
                          <button
                            onClick={() => setPreviewFile(item)}
                            className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer border border-[#E7E8EB] shrink-0"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span className="hidden sm:inline">View</span>
                          </button>

                          {/* Delete Permanently Button */}
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-[#DC2626] hover:text-white transition-all cursor-pointer rounded-full bg-[#FEF2F2] hover:bg-[#DC2626] border border-[#FECACA] shrink-0 shadow-2xs"
                            title="Permanently Delete File from Storage & Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════ FILE PREVIEW & INSPECTOR MODAL ═══════ */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3">
              <div className="space-y-0.5 truncate pr-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    isWorkerUpload(previewFile) ? 'bg-[#DFF5E3] text-[#13A52D]' : 'bg-[#DCE9FF] text-[#1E74FF]'
                  }`}>
                    {isWorkerUpload(previewFile) ? 'STAFF DELIVERABLE INSPECTOR' : 'CLIENT UPLOAD INSPECTOR'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#111111] truncate pt-1">{previewFile.file_name}</h4>
                <p className="text-xs text-[#6B7280]">
                  Uploader: <strong className="text-[#111111]">{previewFile.uploader_name || previewFile.client_name}</strong> • Shoot: <strong className="text-[#111111]">{previewFile.project_title}</strong>
                </p>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media canvas */}
            <div className="flex-1 overflow-auto bg-[#F7F8FA] rounded-2xl flex items-center justify-center min-h-[360px] p-4 border border-[#E7E8EB]">
              {previewFile.file_category === 'photo' && previewFile.file_url ? (
                <img
                  src={previewFile.file_url}
                  alt={previewFile.file_name}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-md"
                />
              ) : previewFile.file_category === 'zip' || (previewFile.file_name && previewFile.file_name.toLowerCase().endsWith('.zip')) ? (
                <div className="text-center space-y-4 p-8">
                  <Archive className="w-16 h-16 text-amber-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[#111111]">ZIP Compressed Archive</p>
                    <p className="text-xs text-[#6B7280]">Stored securely in Google Drive KPR folder</p>
                  </div>
                  {(previewFile.drive_file_url || previewFile.file_url) && (
                    <a
                      href={previewFile.drive_file_url || previewFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Open Archive in Drive</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : previewFile.file_category === 'pdf' ? (
                <div className="text-center space-y-4 p-8">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[#111111]">PDF Document Ready</p>
                    <p className="text-xs text-[#6B7280]">Stored securely on Google Drive / Supabase</p>
                  </div>
                  {(previewFile.drive_file_url || previewFile.file_url) && (
                    <a
                      href={previewFile.drive_file_url || previewFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Open PDF Document</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <HardDrive className="w-16 h-16 text-[#13A52D] mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[#111111]">Google Drive Deliverables</p>
                    <p className="text-xs text-[#6B7280]">Accessible directly via Google Drive storage</p>
                  </div>
                  {(previewFile.drive_file_url || previewFile.file_url) && (
                    <a
                      href={previewFile.drive_file_url || previewFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Open in Google Drive</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Google Drive Jump Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6B7280]">
              <div className="flex items-center gap-4">
                <span>Size: <strong className="text-[#111111]">{previewFile.file_size > 0 ? formatFileSize(previewFile.file_size) : 'Drive Link'}</strong></span>
                <span>Type: <strong className="text-[#111111] font-mono uppercase">.{previewFile.file_type || 'drive'}</strong></span>
                {previewFile.drive_folder_path && (
                  <span className="hidden sm:inline font-mono text-[10px] text-[#9CA0A6]">
                    Drive Path: {previewFile.drive_folder_path}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDelete(previewFile.id, e)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-bold tracking-wider uppercase transition-all shadow-xs border border-[#FCA5A5] cursor-pointer"
                  title="Permanently delete this file from storage and Google Drive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete from Storage</span>
                </button>

                {(previewFile.drive_file_url || previewFile.drive_file_id || previewFile.file_url) && (
                  <a
                    href={previewFile.drive_file_url || previewFile.file_url || `https://drive.google.com/file/d/${previewFile.drive_file_id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs"
                  >
                    <HardDrive className="w-4 h-4 text-[#13A52D]" />
                    <span>Open in Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
