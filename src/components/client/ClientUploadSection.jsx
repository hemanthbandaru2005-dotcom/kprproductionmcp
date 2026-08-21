import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, CloudUpload, FileText, Image as ImageIcon, FileCheck,
  AlertCircle, CheckCircle, RefreshCw, HardDrive, Trash2,
  ExternalLink, Eye, X, ChevronDown, Sparkles, ShieldCheck, Pause, Play, RotateCcw,
  Archive, Film, Music
} from 'lucide-react';
import {
  uploadClientFile,
  pauseClientUpload,
  cancelClientUpload,
  fetchClientUploads,
  deleteClientUpload,
  formatFileSize,
  getFileCategory
} from '../../utils/clientUploadsService';
import { SUPPORTED_EXTENSIONS, isFileTypeSupported } from '../../utils/googleDriveSyncService';
import { getActiveUploadSessions } from '../../utils/driveIndexedDBService';

const DEFAULT_PROJECT_OPTIONS = [
  'Grand Royal Wedding — Hyderabad',
  'Pre-Wedding & Engagement Shoot',
  'Haldi & Mehendi Ceremonies',
  'Reception Highlights & Candid Portraits',
  'Custom Color Lab Print Order',
  'Other / Custom Project'
];

export default function ClientUploadSection({ clientUser, clientProfile }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState(DEFAULT_PROJECT_OPTIONS[0]);
  const [customProject, setCustomProject] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]); // { file, progress, bytesUploaded, size, status, stage, id }
  const [toast, setToast] = useState(null); // { type: 'error' | 'success', message: '' }
  const [previewModalFile, setPreviewModalFile] = useState(null);

  const fileInputRef = useRef(null);

  const clientName = clientProfile?.full_name || clientUser?.email?.split('@')[0] || 'Valued Client';
  const clientEmail = clientProfile?.email || clientUser?.email || '';
  const clientId = clientUser?.id || 'client-demo-1';

  // Load client's uploaded files
  const loadUploads = async () => {
    setLoading(true);
    const data = await fetchClientUploads(clientId);
    setUploads(data || []);
    setLoading(false);
  };

  // Restore any pending / interrupted uploads from IndexedDB
  const checkPendingUploads = async () => {
    try {
      const activeSessions = await getActiveUploadSessions();
      if (activeSessions && activeSessions.length > 0) {
        const clientSessions = activeSessions.filter(s => s.clientId === clientId || !s.clientId);
        if (clientSessions.length > 0) {
          setUploadQueue((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = clientSessions
              .filter(s => !existingIds.has(s.id))
              .map(s => ({
                id: s.id,
                name: s.fileName,
                size: s.fileSize,
                bytesUploaded: s.bytesUploaded || 0,
                progress: Math.min(Math.round(((s.bytesUploaded || 0) / (s.fileSize || 1)) * 100), 99),
                stage: s.status === 'paused' ? 'Paused (Ready to resume)' : 'Ready to resume',
                status: s.status || 'paused',
                file: null // Re-attached on resume
              }));
            return [...newItems, ...prev];
          });
        }
      }
    } catch (e) {
      console.warn('Error checking pending uploads from IndexedDB:', e);
    }
  };

  useEffect(() => {
    loadUploads();
    checkPendingUploads();

    const handleUpdate = () => {
      loadUploads();
    };

    window.addEventListener('kpr_client_uploads_updated', handleUpdate);
    return () => window.removeEventListener('kpr_client_uploads_updated', handleUpdate);
  }, [clientId]);

  // Show Toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Start upload for a specific file
  const startFileUpload = async (file, existingQueueId = null) => {
    const queueId = existingQueueId || `upload_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const projectTitle = selectedProject === 'Other / Custom Project'
      ? (customProject.trim() || 'Custom Client Order')
      : selectedProject;

    setUploadQueue((prev) => {
      const exists = prev.some(item => item.id === queueId);
      if (exists) {
        return prev.map(item =>
          item.id === queueId
            ? { ...item, status: 'uploading', stage: 'Streaming chunks...', progress: Math.max(item.progress, 5), file }
            : item
        );
      }
      return [
        {
          id: queueId,
          name: file.name,
          size: file.size,
          bytesUploaded: 0,
          progress: 5,
          stage: 'Initiating transfer...',
          status: 'uploading',
          file
        },
        ...prev
      ];
    });

    try {
      const result = await uploadClientFile({
        file,
        clientId,
        clientName,
        clientEmail,
        projectId: clientId,
        projectTitle,
        onProgress: (progressData) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    progress: progressData.percent,
                    bytesUploaded: progressData.bytesUploaded,
                    stage: progressData.stage,
                    status: progressData.status || 'uploading'
                  }
                : item
            )
          );
        }
      });

      if (result.success) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? {
                  ...item,
                  progress: 100,
                  bytesUploaded: file.size,
                  stage: 'Upload Complete & Secured',
                  status: 'completed'
                }
              : item
          )
        );
        showToast(`"${file.name}" uploaded and secured successfully!`, 'success');
        loadUploads();

        // Auto remove completed item after 4 seconds
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
        }, 4000);
      } else if (result.paused) {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? { ...item, stage: 'Upload paused', status: 'paused' }
              : item
          )
        );
      } else {
        // Distinct Hard-Failure state with real error message
        const errMsg = result.error || 'Upload could not be completed.';
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? {
                  ...item,
                  stage: errMsg,
                  status: 'error',
                  file
                }
              : item
          )
        );
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const errMsg = err.message || 'Upload error occurred.';
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? {
                ...item,
                stage: errMsg,
                status: 'error',
                file
              }
            : item
        )
      );
      showToast(errMsg, 'error');
    }
  };

  // Handle files selection or drop
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const validFiles = [];
    const rejectedFiles = [];

    // Validate supported formats (including .zip, images, videos, audio, documents)
    filesArray.forEach((file) => {
      if (isFileTypeSupported(file.name, file.type)) {
        validFiles.push(file);
      } else {
        rejectedFiles.push(file.name);
      }
    });

    if (rejectedFiles.length > 0) {
      showToast(
        `Unsupported file type for "${rejectedFiles.join(', ')}". Allowed formats: ${SUPPORTED_EXTENSIONS.map(e => e.toUpperCase()).join(', ')}`,
        'error'
      );
    }

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      startFileUpload(file);
    }
  };

  // Pause an upload
  const handlePause = (queueId, e) => {
    e.stopPropagation();
    pauseClientUpload(queueId);
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === queueId ? { ...item, status: 'paused', stage: 'Upload paused' } : item
      )
    );
  };

  // Resume an upload
  const handleResume = (item, e) => {
    e.stopPropagation();
    if (item.file) {
      startFileUpload(item.file, item.id);
    } else {
      showToast('Please re-select this file to continue transfer.', 'error');
      fileInputRef.current?.click();
    }
  };

  // Cancel an upload
  const handleCancel = (queueId, e) => {
    e.stopPropagation();
    cancelClientUpload(queueId);
    setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (uploadId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this file from your uploads?')) {
      await deleteClientUpload(uploadId);
      loadUploads();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ═══════ TOAST NOTIFICATION ═══════ */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-xl animate-slideUp ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-[10px]">
              {toast.type === 'error' ? 'Notice' : 'Success'}
            </p>
            <p className="mt-0.5 text-white/90">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════ HEADER CARD ═══════ */}
      <div className="bg-[#18202F] border border-[#C5A880]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Resilient Studio Vault & Archive</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-white font-light">
              Upload Photos, PDFs & Project Documents
            </h3>
            <p className="text-xs text-white/60 max-w-xl">
              High-speed resumable uploads with automatic network-drop protection, retry handling, and chunk integrity verification.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-xs text-white/70">
              <HardDrive className="w-4 h-4 text-[#C5A880]" />
              <span>{uploads.length} File{uploads.length !== 1 ? 's' : ''} Stored</span>
            </div>
          </div>
        </div>

        {/* ═══════ PROJECT SELECTOR ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Target Project or Order Name
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-[#0F1623] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]/50 transition-colors cursor-pointer pr-10"
              >
                {DEFAULT_PROJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0F1623] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-white/40 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {selectedProject === 'Other / Custom Project' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Custom Project / Order Name
              </label>
              <input
                type="text"
                placeholder="e.g. Hyderabad Reception Custom Songs & PDF Brief"
                value={customProject}
                onChange={(e) => setCustomProject(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0F1623] border border-[#C5A880]/40 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          )}
        </div>

        {/* ═══════ DRAG & DROP DROPZONE ═══════ */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group ${
            dragActive
              ? 'border-[#C5A880] bg-[#C5A880]/10 scale-[1.01]'
              : 'border-white/15 bg-[#0F1623]/60 hover:border-[#C5A880]/50 hover:bg-[#0F1623]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".zip,.rar,.7z,application/zip,application/x-zip-compressed,application/octet-stream,.jpg,.jpeg,.png,.heic,.webp,image/*,.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,audio/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="space-y-4 max-w-md mx-auto pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="font-serif text-lg text-white font-medium">
                Drag & drop files here, or <span className="text-[#C5A880] underline decoration-[#C5A880]/40">browse from device</span>
              </p>
              <p className="text-xs text-white/50">
                Upload ZIP archives, raw photos, wedding music notes, design feedback PDFs, or Word documents.
              </p>
            </div>

            {/* Supported format badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              {['zip', 'jpg', 'png', 'heic', 'webp', 'pdf', 'doc', 'mp4'].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono uppercase text-[#C5A880]/80 tracking-wider"
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ UPLOAD QUEUE WITH REAL BYTE PROGRESS & RETRY STATES ═══════ */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#C5A880] animate-spin" />
                <span>Uploads Queue ({uploadQueue.length})</span>
              </div>
            </h4>

            <div className="space-y-2.5">
              {uploadQueue.map((item) => {
                const isUploading = item.status === 'uploading';
                const isRetrying = item.status === 'retrying';
                const isPaused = item.status === 'paused';
                const isCompleted = item.status === 'completed';
                const isError = item.status === 'error';

                return (
                  <div
                    key={item.id}
                    className={`bg-[#0F1623] border rounded-xl p-3.5 space-y-2.5 shadow-lg transition-all ${
                      isRetrying
                        ? 'border-amber-500/40 bg-amber-950/10'
                        : isError
                        ? 'border-rose-500/40 bg-rose-950/10'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[60%] sm:max-w-md">
                        <FileCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span className="text-white font-medium truncate">{item.name}</span>
                        <span className="text-[10px] text-white/40 font-mono">
                          ({formatFileSize(item.bytesUploaded || 0)} / {formatFileSize(item.size)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-semibold ${
                          isRetrying ? 'text-amber-400' : isError ? 'text-rose-400' : 'text-[#C5A880]'
                        }`}>
                          {item.progress}%
                        </span>

                        {/* Controls */}
                        {isUploading && (
                          <button
                            onClick={(e) => handlePause(item.id, e)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
                            title="Pause transfer"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {(isPaused || isError) && (
                          <button
                            onClick={(e) => handleResume(item, e)}
                            className="px-2 py-1 rounded bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                            title="Resume transfer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={(e) => handleCancel(item.id, e)}
                            className="p-1 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isError
                            ? 'bg-rose-500'
                            : isRetrying
                            ? 'bg-amber-400 animate-pulse'
                            : isCompleted
                            ? 'bg-emerald-400'
                            : isPaused
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-[#C5A880] to-[#E3D1B8]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {/* Status Text */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`${
                        isRetrying ? 'text-amber-300 font-medium' : isError ? 'text-rose-300' : 'text-white/50'
                      }`}>
                        {isRetrying && (
                          <RefreshCw className="w-2.5 h-2.5 inline mr-1 animate-spin text-amber-400" />
                        )}
                        {item.stage}
                      </span>
                      {isCompleted && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Secured</span>
                        </span>
                      )}
                      {isPaused && (
                        <span className="text-amber-400 font-medium">Paused</span>
                      )}
                      {isError && (
                        <span className="text-rose-400 font-medium">Interrupted</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ UPLOADED FILES VAULT GALLERY ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-[#C5A880]" />
            <h3 className="font-serif text-xl sm:text-2xl text-white font-light">
              Your Studio Archive & Vault
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-mono">
              {uploads.length}
            </span>
          </div>

          <button
            onClick={loadUploads}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Refresh uploads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-[#18202F] rounded-2xl p-12 text-center text-white/40 border border-white/5 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880]" />
            <p className="text-xs">Loading vault files…</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="bg-[#18202F] rounded-2xl p-10 sm:p-14 text-center border border-white/5 space-y-3 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-white/30 flex items-center justify-center mx-auto">
              <CloudUpload className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-serif text-lg text-white">No Files Uploaded Yet</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Use the upload box above to share custom songs, wedding briefs, revision photos, or documents directly with the KPR team.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {uploads.map((fileItem) => {
              const isPhoto = fileItem.file_category === 'photo';
              const isPdf = fileItem.file_category === 'pdf';
              const isZip = fileItem.file_category === 'zip' || (fileItem.file_name && fileItem.file_name.toLowerCase().endsWith('.zip'));
              const isVideo = fileItem.file_category === 'video';
              const isSynced = fileItem.drive_sync_status === 'synced';

              return (
                <div
                  key={fileItem.id}
                  onClick={() => setPreviewModalFile(fileItem)}
                  className="bg-[#18202F] border border-white/10 hover:border-[#C5A880]/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-300 shadow-xl group cursor-pointer"
                >
                  {/* Top Thumbnail / Icon Area */}
                  <div className="relative w-full h-36 bg-[#0F1623] rounded-xl overflow-hidden flex items-center justify-center border border-white/5">
                    {isPhoto && fileItem.file_url ? (
                      <img
                        src={fileItem.file_url}
                        alt={fileItem.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : isZip ? (
                      <div className="text-center space-y-1">
                        <Archive className="w-10 h-10 text-amber-400 mx-auto" />
                        <span className="text-[10px] font-mono text-amber-300 uppercase font-bold">ZIP Archive</span>
                      </div>
                    ) : isPdf ? (
                      <div className="text-center space-y-1">
                        <FileText className="w-10 h-10 text-rose-400 mx-auto" />
                        <span className="text-[10px] font-mono text-rose-300 uppercase font-bold">PDF Document</span>
                      </div>
                    ) : isVideo ? (
                      <div className="text-center space-y-1">
                        <Film className="w-10 h-10 text-purple-400 mx-auto" />
                        <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">Video File</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <FileText className="w-10 h-10 text-blue-400 mx-auto" />
                        <span className="text-[10px] font-mono text-blue-300 uppercase font-bold">Document</span>
                      </div>
                    )}

                    {/* Category pill */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white/80 uppercase">
                      .{fileItem.file_type || 'file'}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(fileItem.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500/80 text-white/60 hover:text-white transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-semibold text-white truncate" title={fileItem.file_name}>
                      {fileItem.file_name}
                    </p>
                    <p className="text-[10px] text-[#A09585] truncate">
                      {fileItem.project_title || 'General Deliverables'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                      <span>{formatFileSize(fileItem.file_size)}</span>
                      <span>
                        {fileItem.created_at ? new Date(fileItem.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        }) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Client Confirmation Badge */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Saved & Secured</span>
                    </span>

                    <button
                      onClick={() => setPreviewModalFile(fileItem)}
                      className="p-1 text-white/40 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                      title="View Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ FILE PREVIEW MODAL ═══════ */}
      {previewModalFile && (
        <div
          onClick={() => setPreviewModalFile(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18202F] border border-[#C5A880]/30 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5 truncate pr-4">
                <h4 className="text-sm font-semibold text-white truncate">{previewModalFile.file_name}</h4>
                <p className="text-[10px] text-[#C5A880]">{previewModalFile.project_title}</p>
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media viewer */}
            <div className="flex-1 overflow-auto bg-[#0F1623] rounded-xl flex items-center justify-center min-h-[300px] p-4">
              {previewModalFile.file_category === 'photo' && previewModalFile.file_url ? (
                <img
                  src={previewModalFile.file_url}
                  alt={previewModalFile.file_name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewModalFile.file_category === 'zip' || (previewModalFile.file_name && previewModalFile.file_name.toLowerCase().endsWith('.zip')) ? (
                <div className="text-center space-y-3 p-8">
                  <Archive className="w-16 h-16 text-amber-400 mx-auto" />
                  <p className="text-sm font-medium text-white">ZIP Compressed Archive</p>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    This archive contains package deliverables uploaded safely to your studio Google Drive folder.
                  </p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span>Open in Google Drive</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : previewModalFile.file_category === 'pdf' ? (
                <div className="text-center space-y-3 p-8">
                  <FileText className="w-16 h-16 text-rose-400 mx-auto" />
                  <p className="text-sm font-medium text-white">PDF Document Preview Ready</p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span>Open PDF</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3 p-8">
                  <FileText className="w-16 h-16 text-blue-400 mx-auto" />
                  <p className="text-sm font-medium text-white">Document File</p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span>Download / Open File</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-white/60">
              <div className="flex items-center gap-4">
                <span>Size: <strong className="text-white">{formatFileSize(previewModalFile.file_size)}</strong></span>
                <span>Type: <strong className="text-white font-mono uppercase">.{previewModalFile.file_type}</strong></span>
              </div>

              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified in Studio Archive</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
