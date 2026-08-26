import React, { useState, useEffect } from 'react';
import {
  CloudUpload, HardDrive, RefreshCw, Search, Filter,
  ExternalLink, Eye, AlertCircle, CheckCircle, Clock,
  FileText, Image as ImageIcon, Trash2, Folder, User,
  ArrowUpRight, RotateCcw, X, ShieldAlert, Sparkles, Radio,
  Archive, Film, Music
} from 'lucide-react';
import {
  fetchAllClientUploadsForAdmin,
  retryDriveSync,
  deleteClientUpload,
  subscribeToClientUploadsRealtime,
  formatFileSize,
  getFileCategory
} from '../../utils/clientUploadsService';

export default function ClientUploadsManager() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'synced' | 'failed' | 'pending'
  const [retryingId, setRetryingId] = useState(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadUploads = async () => {
    setLoading(true);
    const data = await fetchAllClientUploadsForAdmin();
    setUploads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUploads();

    // Subscribe to real-time events via Supabase Realtime & broadcast channels
    const unsubscribe = subscribeToClientUploadsRealtime(({ type, record }) => {
      if (!record) return;

      if (type === 'insert') {
        setUploads((prev) => {
          if (prev.some(item => item.id === record.id)) {
            return prev.map(item => item.id === record.id ? { ...item, ...record } : item);
          }
          return [{ ...record, isNew: true }, ...prev];
        });
        showNotice(`🔔 New upload received: "${record.file_name}" from ${record.client_name || 'Client'}`, 'success');
      } else if (type === 'update') {
        setUploads((prev) => prev.map(item => item.id === record.id ? { ...item, ...record } : item));
      } else if (type === 'delete') {
        setUploads((prev) => prev.filter(item => item.id !== record.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 5000);
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
    e.stopPropagation();
    if (window.confirm('Delete this upload record?')) {
      await deleteClientUpload(uploadId);
      loadUploads();
      showNotice('Upload record deleted', 'success');
    }
  };

  // Filtered uploads
  const filteredUploads = uploads.filter((item) => {
    const matchesSearch =
      (item.file_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.project_title || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      item.drive_sync_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E8EB] rounded-[20px] p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#13A52D] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#13A52D]">
              GOOGLE DRIVE SYNC ENGINE ACTIVE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">Client Uploads & Drive Vault</h2>
          <p className="text-xs text-[#6B7280]">
            Automatic multi-file synchronization directly into dedicated client folders in KPR Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {failedCount > 0 && (
            <button
              onClick={handleRetryAllFailed}
              disabled={retryingAll}
              className="px-4 py-2 rounded-full bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${retryingAll ? 'animate-spin' : ''}`} />
              <span>Retry All Failed ({failedCount})</span>
            </button>
          )}

          <button
            onClick={loadUploads}
            className="p-2.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ═══════ STATS CARDS ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280]">Total Uploads</span>
            <div className="w-8 h-8 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
              <CloudUpload className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#111111]">{uploads.length}</p>
          <p className="text-[11px] text-[#9CA0A6]">{formatFileSize(totalBytes)} total storage</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#13A52D]">Synced to Drive</span>
            <div className="w-8 h-8 rounded-full bg-[#DFF5E3] text-[#13A52D] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#13A52D]">{syncedCount}</p>
          <p className="text-[11px] text-[#9CA0A6]">Secured in Google Drive</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#DC2626]">Sync Failed</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#DC2626]">{failedCount}</p>
          <p className="text-[11px] text-[#9CA0A6]">Action required (retry available)</p>
        </div>

        <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#D97706]">Pending Sync</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#D97706]">{pendingCount}</p>
          <p className="text-[11px] text-[#9CA0A6]">Syncing in background</p>
        </div>
      </div>

      {/* ═══════ SEARCH & FILTER CONTROLS ═══════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#E7E8EB] rounded-[20px] p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by file name, client, or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Files', count: uploads.length },
            { key: 'synced', label: 'Synced', count: syncedCount },
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
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ UPLOADS TABLE ═══════ */}
      <div className="bg-white rounded-[20px] border border-[#E7E8EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-[#9CA0A6] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414]" />
            <p className="text-xs">Loading client uploaded records…</p>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="p-16 text-center text-[#9CA0A6] space-y-3">
            <CloudUpload className="w-12 h-12 mx-auto text-[#9CA0A6]" />
            <p className="text-sm font-semibold text-[#111111]">No Uploaded Files Found</p>
            <p className="text-xs text-[#9CA0A6]">
              {search || statusFilter !== 'all' ? 'Try adjusting your search filter.' : 'Client uploads will appear here when submitted via portal.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E7E8EB] text-[10px] text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                  <th className="px-6 py-3.5">File Details</th>
                  <th className="px-6 py-3.5">Client & Target Project</th>
                  <th className="px-6 py-3.5">Size & Date</th>
                  <th className="px-6 py-3.5">Google Drive Status & Path</th>
                  <th className="px-6 py-3.5 text-right">Staff Actions (Drive Jump)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E8EB]">
                {filteredUploads.map((item) => {
                  const isPhoto = item.file_category === 'photo';
                  const isPdf = item.file_category === 'pdf';
                  const isSynced = item.drive_sync_status === 'synced';
                  const isFailed = item.drive_sync_status === 'failed';
                  const isPending = item.drive_sync_status === 'pending';
                  const isRetrying = retryingId === item.id;
                  const driveLink = item.drive_file_url || (item.drive_file_id ? `https://drive.google.com/file/d/${item.drive_file_id}/view` : null);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition-colors group ${
                        item.isNew ? 'bg-[#C5A880]/10 animate-pulse' : ''
                      }`}
                    >
                      
                      {/* File Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F1F2F4] border border-[#E7E8EB] flex items-center justify-center shrink-0 overflow-hidden relative">
                            {isPhoto && item.file_url ? (
                              <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                            ) : item.file_category === 'zip' || (item.file_name && item.file_name.toLowerCase().endsWith('.zip')) ? (
                              <Archive className="w-5 h-5 text-amber-500" />
                            ) : isPdf ? (
                              <FileText className="w-5 h-5 text-rose-500" />
                            ) : item.file_category === 'video' ? (
                              <Film className="w-5 h-5 text-purple-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-[#1E74FF]" />
                            )}
                          </div>
                          <div className="max-w-xs truncate">
                            <p className="text-xs font-bold text-[#111111] truncate" title={item.file_name}>
                              {item.file_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#EEF0F2] text-[#6B7280] font-semibold">
                                .{item.file_type || 'file'}
                              </span>
                              {item.drive_file_id && (
                                <span className="text-[9px] font-mono text-[#9CA0A6] truncate max-w-[120px]" title={`Drive ID: ${item.drive_file_id}`}>
                                  ID: {item.drive_file_id.substring(0, 10)}…
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Client & Project */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#141414]" />
                          <span className="text-xs font-semibold text-[#111111]">{item.client_name || 'Client'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] truncate max-w-xs">
                          <Folder className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.project_title || 'General Deliverables'}</span>
                        </div>
                      </td>

                      {/* Size & Date */}
                      <td className="px-6 py-4 space-y-0.5 text-xs text-[#6B7280]">
                        <p className="font-mono text-[11px] font-semibold text-[#111111]">{formatFileSize(item.file_size)}</p>
                        <p className="text-[10px] text-[#9CA0A6]">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </p>
                      </td>

                      {/* Drive Sync Status & Folder Path */}
                      <td className="px-6 py-4">
                        {isSynced ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#13A52D]" />
                              Synced to Drive
                            </span>
                            {item.drive_folder_path && (
                              <p className="text-[9px] text-[#9CA0A6] font-mono truncate max-w-[220px]" title={item.drive_folder_path}>
                                📁 {item.drive_folder_path}
                              </p>
                            )}
                          </div>
                        ) : isFailed ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#DC2626]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                                Sync failed
                              </span>

                              <button
                                onClick={(e) => handleRetry(item.id, e)}
                                disabled={isRetrying}
                                className="px-2.5 py-1 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#D97706] rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                title="Retry Drive Sync"
                              >
                                <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                                <span>{isRetrying ? 'Syncing…' : 'Retry'}</span>
                              </button>
                            </div>
                            {item.drive_sync_error && (
                              <p className="text-[9px] text-[#DC2626] font-mono truncate max-w-[200px]" title={item.drive_sync_error}>
                                {item.drive_sync_error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DCE9FF] text-[#1E74FF]">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Sync Pending
                            </span>
                            <button
                              onClick={(e) => handleRetry(item.id, e)}
                              disabled={isRetrying}
                              className="px-2 py-0.5 bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] rounded-full text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Push Now
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Staff Actions & Direct Drive Jump Link */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Staff-Only Direct Google Drive Jump Button */}
                          {driveLink && (
                            <a
                              href={driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                              title="Open Directly in Google Drive"
                            >
                              <HardDrive className="w-3.5 h-3.5" />
                              <span>Open in Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* App Preview */}
                          <button
                            onClick={() => setPreviewFile(item)}
                            className="px-3 py-1.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E7E8EB]"
                            title="Preview File in Portal"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span className="hidden sm:inline">Preview</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] transition-colors cursor-pointer rounded-full hover:bg-[#FEF2F2]"
                            title="Delete record"
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

      {/* ═══════ STAFF INSPECTION & APP VIEWER MODAL ═══════ */}
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
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#DCE9FF] text-[#1E74FF]">
                    STAFF FILE INSPECTOR & VIEWER
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#111111] truncate pt-1">{previewFile.file_name}</h4>
                <p className="text-xs text-[#6B7280]">
                  Client: <strong className="text-[#111111]">{previewFile.client_name}</strong> • Project: <strong className="text-[#111111]">{previewFile.project_title}</strong>
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
                  <FileText className="w-16 h-16 text-[#1E74FF] mx-auto" />
                  <div className="space-y-1">
                    <p className="text-base font-bold text-[#111111]">Project File / Document</p>
                    <p className="text-xs text-[#6B7280]">Stored securely on Google Drive</p>
                  </div>
                  {(previewFile.drive_file_url || previewFile.file_url) && (
                    <a
                      href={previewFile.drive_file_url || previewFile.file_url}
                      download={previewFile.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Download / Open File</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Staff Google Drive Jump Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6B7280]">
              <div className="flex items-center gap-4">
                <span>Size: <strong className="text-[#111111]">{formatFileSize(previewFile.file_size)}</strong></span>
                <span>Type: <strong className="text-[#111111] font-mono uppercase">.{previewFile.file_type}</strong></span>
                {previewFile.drive_folder_path && (
                  <span className="hidden sm:inline font-mono text-[10px] text-[#9CA0A6]">
                    Drive Path: {previewFile.drive_folder_path}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(previewFile.drive_file_url || previewFile.drive_file_id) && (
                  <a
                    href={previewFile.drive_file_url || `https://drive.google.com/file/d/${previewFile.drive_file_id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs"
                  >
                    <HardDrive className="w-4 h-4" />
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
