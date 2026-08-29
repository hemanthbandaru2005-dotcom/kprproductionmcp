import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, CloudUpload, FileText, Image as ImageIcon, FileCheck,
  AlertCircle, CheckCircle, RefreshCw, HardDrive,
  ExternalLink, Eye, X, ChevronDown, Sparkles, ShieldCheck, Pause, Play, RotateCcw,
  Archive, Film, Music
} from 'lucide-react';
import {
  uploadClientFile,
  pauseClientUpload,
  cancelClientUpload,
  fetchClientUploads,
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

  // Active concurrency limit
  const MAX_CONCURRENT_UPLOADS = 2;
  const activeUploadsCountRef = useRef(0);
  const pendingQueueRef = useRef([]);

  // Process the queue with controlled concurrency
  const processNextInQueue = () => {
    while (activeUploadsCountRef.current < MAX_CONCURRENT_UPLOADS && pendingQueueRef.current.length > 0) {
      const nextTask = pendingQueueRef.current.shift();
      if (nextTask) {
        activeUploadsCountRef.current += 1;
        executeFileUpload(nextTask.file, nextTask.queueId).finally(() => {
          activeUploadsCountRef.current = Math.max(0, activeUploadsCountRef.current - 1);
          processNextInQueue();
        });
      }
    }
  };

  // Upload execution handler
  const executeFileUpload = async (file, queueId) => {
    const effectiveProject = selectedProject === 'Other / Custom Project'
      ? (customProject.trim() || 'Custom Project Uploads')
      : selectedProject;

    try {
      const result = await uploadClientFile({
        file,
        clientId,
        clientName,
        clientEmail,
        projectTitle: effectiveProject,
        existingSessionId: queueId,
        onProgress: ({ progress, percent, bytesUploaded, totalBytes, speed, eta, stage }) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    progress: progress || percent || 0,
                    bytesUploaded,
                    size: totalBytes,
                    speed: speed || '',
                    eta: eta || '',
                    stage: stage || `Uploading (${formatFileSize(bytesUploaded)} / ${formatFileSize(totalBytes)})`
                  }
                : item
            )
          );
        },
        onStatusChange: (stage) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, stage } : item
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
                  speed: 'Complete',
                  eta: '',
                  stage: 'Synced & Secured in Google Drive',
                  status: 'completed'
                }
              : item
          )
        );
        showToast(`"${file.name}" uploaded directly to Google Drive!`, 'success');
        loadUploads();

        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
        }, 3500);
      } else {
        const errMsg = result.error || 'Upload could not complete.';
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? {
                  ...item,
                  stage: errMsg,
                  status: result.isPaused ? 'paused' : 'error',
                  file
                }
              : item
          )
        );
        if (!result.isPaused && !result.isCancelled) {
          showToast(errMsg, 'error');
        }
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

  // Queue a file for upload
  const startFileUpload = (file, resumeQueueId = null) => {
    const queueId = resumeQueueId || `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    if (!resumeQueueId) {
      setUploadQueue((prev) => [
        {
          id: queueId,
          name: file.name,
          size: file.size,
          bytesUploaded: 0,
          progress: 0,
          speed: '',
          eta: 'Starting…',
          stage: 'Connecting directly to Google Drive…',
          status: 'uploading',
          file
        },
        ...prev
      ]);
    } else {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId
            ? { ...item, status: 'uploading', stage: 'Resuming direct upload…', file }
            : item
        )
      );
    }

    pendingQueueRef.current.push({ file, queueId });
    processNextInQueue();
  };

  // Handle files selection or drop
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const validFiles = [];
    const rejectedFiles = [];

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

    // Queue valid files with controlled concurrency
    validFiles.forEach((file) => {
      startFileUpload(file);
    });
  };

  const handlePause = (queueId, e) => {
    e.stopPropagation();
    pauseClientUpload(queueId);
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === queueId ? { ...item, status: 'paused', stage: 'Upload paused' } : item
      )
    );
  };

  const handleResume = (item, e) => {
    e.stopPropagation();
    if (item.file) {
      startFileUpload(item.file, item.id);
    } else {
      showToast('Please re-select this file to continue transfer.', 'error');
      fileInputRef.current?.click();
    }
  };

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

  return (
    <div className="space-y-6 text-[#111111]">
      
      {/* ═══════ TOAST NOTIFICATION ═══════ */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl flex items-start gap-3 border backdrop-blur-xs animate-slideUp ${
            toast.type === 'error'
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
              : 'bg-[#DFF5E3] border-[#BBF7D0] text-[#13A52D]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-[#13A52D] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-[10px]">
              {toast.type === 'error' ? 'Notice' : 'Success'}
            </p>
            <p className="mt-0.5 font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-[#9CA0A6] hover:text-[#111111] transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════ HEADER CARD ═══════ */}
      <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFF5E3] border border-[#BBF7D0] text-[#13A52D] text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Studio Cloud Vault & Archive</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              Upload Photos, PDFs & Project Deliverables
            </h3>
            <p className="text-xs text-[#6B7280] max-w-xl">
              High-speed resumable uploads with automatic network-drop protection, retry handling, and direct Google Drive sync.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="px-4 py-2 rounded-full bg-[#F7F8FA] border border-[#E7E8EB] flex items-center gap-2 text-xs font-semibold text-[#111111]">
              <HardDrive className="w-4 h-4 text-[#1E74FF]" />
              <span>{uploads.length} File{uploads.length !== 1 ? 's' : ''} Stored</span>
            </div>
          </div>
        </div>

        {/* ═══════ PROJECT SELECTOR ═══════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E7E8EB]">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Target Project or Order Name
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#141414] transition-colors cursor-pointer pr-10"
              >
                {DEFAULT_PROJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-[#111111]">
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#9CA0A6] absolute right-4 top-3 pointer-events-none" />
            </div>
          </div>

          {selectedProject === 'Other / Custom Project' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                Custom Project / Order Name
              </label>
              <input
                type="text"
                placeholder="e.g. Hyderabad Reception Custom Songs & PDF Brief"
                value={customProject}
                onChange={(e) => setCustomProject(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
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
              ? 'border-[#141414] bg-[#F1F2F4] scale-[1.01]'
              : 'border-[#E7E8EB] bg-[#F7F8FA] hover:border-[#141414] hover:bg-white'
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

          <div className="space-y-3 max-w-md mx-auto pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-[#111111]">
                Drag & drop files here, or <span className="text-[#1E74FF] underline">browse from device</span>
              </p>
              <p className="text-xs text-[#6B7280]">
                Upload ZIP archives, raw photos, wedding music notes, design feedback PDFs, or Word documents.
              </p>
            </div>

            {/* Supported format badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              {['zip', 'jpg', 'png', 'heic', 'webp', 'pdf', 'doc', 'mp4'].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 bg-white border border-[#E7E8EB] rounded-md text-[10px] font-mono uppercase text-[#6B7280] font-semibold"
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ UPLOAD QUEUE ═══════ */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#141414] animate-spin" />
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
                    className={`bg-white border rounded-2xl p-4 space-y-2.5 shadow-xs transition-all ${
                      isRetrying
                        ? 'border-[#FDE68A] bg-[#FEF3C7]/20'
                        : isError
                        ? 'border-[#FCA5A5] bg-[#FEF2F2]/30'
                        : 'border-[#E7E8EB]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[60%] sm:max-w-md">
                        <FileCheck className="w-4 h-4 text-[#1E74FF] shrink-0" />
                        <span className="text-[#111111] font-semibold truncate">{item.name}</span>
                        <span className="text-[10px] text-[#9CA0A6] font-mono">
                          ({formatFileSize(item.bytesUploaded || 0)} / {formatFileSize(item.size)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.speed && item.status === 'uploading' && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#DCE9FF] text-[#1E74FF] font-mono text-[10px] font-bold">
                            {item.speed}
                          </span>
                        )}
                        {item.eta && item.status === 'uploading' && (
                          <span className="hidden sm:inline-block text-[10px] text-[#6B7280] font-mono">
                            {item.eta}
                          </span>
                        )}
                        <span className={`text-[11px] font-mono font-bold ${
                          isRetrying ? 'text-[#D97706]' : isError ? 'text-[#DC2626]' : 'text-[#1E74FF]'
                        }`}>
                          {item.progress}%
                        </span>

                        {/* Controls */}
                        {isUploading && (
                          <button
                            onClick={(e) => handlePause(item.id, e)}
                            className="p-1.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer"
                            title="Pause transfer"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {(isPaused || isError) && (
                          <button
                            onClick={(e) => handleResume(item, e)}
                            className="px-2.5 py-1 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="Resume transfer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={(e) => handleCancel(item.id, e)}
                            className="p-1.5 rounded-full hover:bg-[#FEF2F2] text-[#9CA0A6] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#EEF0F2] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          isError
                            ? 'bg-[#DC2626]'
                            : isRetrying
                            ? 'bg-[#D97706] animate-pulse'
                            : isCompleted
                            ? 'bg-[#13A52D]'
                            : isPaused
                            ? 'bg-[#D97706]'
                            : 'bg-[#1E74FF]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {/* Status Text */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`truncate pr-2 ${
                        isRetrying ? 'text-[#D97706] font-medium' : isError ? 'text-[#DC2626]' : 'text-[#6B7280]'
                      }`}>
                        {isRetrying && (
                          <RefreshCw className="w-2.5 h-2.5 inline mr-1 animate-spin text-[#D97706]" />
                        )}
                        {item.stage}
                      </span>
                      {isCompleted && (
                        <span className="text-[#13A52D] font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          <span>Secured in Drive</span>
                        </span>
                      )}
                      {isPaused && (
                        <span className="text-[#D97706] font-semibold shrink-0">Paused</span>
                      )}
                      {isError && (
                        <span className="text-[#DC2626] font-semibold shrink-0">Interrupted</span>
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
            <HardDrive className="w-5 h-5 text-[#1E74FF]" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
              Your Studio Archive & Vault
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DCE9FF] text-[#1E74FF] text-[11px] font-mono font-bold">
              {uploads.length}
            </span>
          </div>

          <button
            onClick={loadUploads}
            className="p-2 rounded-full bg-white hover:bg-[#F1F2F4] text-[#111111] border border-[#E7E8EB] transition-colors cursor-pointer shadow-xs"
            title="Refresh uploads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-[20px] p-12 text-center text-[#9CA0A6] border border-[#E7E8EB] space-y-2 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414]" />
            <p className="text-xs">Loading vault files…</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="bg-white rounded-[20px] p-10 sm:p-14 text-center border border-[#E7E8EB] space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center mx-auto">
              <CloudUpload className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-bold text-[#111111]">No Files Uploaded Yet</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
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

              return (
                <div
                  key={fileItem.id}
                  onClick={() => setPreviewModalFile(fileItem)}
                  className="bg-white border border-[#E7E8EB] hover:border-[#141414] rounded-[20px] p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs group cursor-pointer"
                >
                  {/* Top Thumbnail / Icon Area */}
                  <div className="relative w-full h-36 bg-[#F7F8FA] rounded-2xl overflow-hidden flex items-center justify-center border border-[#E7E8EB]">
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
                        <Archive className="w-10 h-10 text-amber-500 mx-auto" />
                        <span className="text-[10px] font-mono text-amber-600 uppercase font-bold">ZIP Archive</span>
                      </div>
                    ) : isPdf ? (
                      <div className="text-center space-y-1">
                        <FileText className="w-10 h-10 text-rose-500 mx-auto" />
                        <span className="text-[10px] font-mono text-rose-600 uppercase font-bold">PDF Document</span>
                      </div>
                    ) : isVideo ? (
                      <div className="text-center space-y-1">
                        <Film className="w-10 h-10 text-purple-500 mx-auto" />
                        <span className="text-[10px] font-mono text-purple-600 uppercase font-bold">Video File</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <FileText className="w-10 h-10 text-[#1E74FF] mx-auto" />
                        <span className="text-[10px] font-mono text-[#1E74FF] uppercase font-bold">Document</span>
                      </div>
                    )}

                    {/* Category pill */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 shadow-xs text-[9px] font-mono text-[#111111] uppercase font-bold">
                      .{fileItem.file_type || 'file'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-bold text-[#111111] truncate" title={fileItem.file_name}>
                      {fileItem.file_name}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {fileItem.project_title || 'General Deliverables'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#9CA0A6] pt-1">
                      <span className="font-mono font-semibold text-[#111111]">{formatFileSize(fileItem.file_size)}</span>
                      <span>
                        {fileItem.created_at ? new Date(fileItem.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric'
                        }) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Client Confirmation Badge */}
                  <div className="pt-2 border-t border-[#E7E8EB] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#13A52D]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#13A52D]" />
                      <span>Saved & Secured</span>
                    </span>

                    <button
                      onClick={() => setPreviewModalFile(fileItem)}
                      className="p-1 text-[#6B7280] hover:text-[#111111] transition-colors flex items-center gap-1 text-[11px] font-semibold"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3">
              <div className="space-y-0.5 truncate pr-4">
                <h4 className="text-sm font-bold text-[#111111] truncate">{previewModalFile.file_name}</h4>
                <p className="text-[11px] text-[#1E74FF] font-semibold">{previewModalFile.project_title}</p>
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media viewer */}
            <div className="flex-1 overflow-auto bg-[#F7F8FA] rounded-2xl flex items-center justify-center min-h-[300px] p-4 border border-[#E7E8EB]">
              {previewModalFile.file_category === 'photo' && previewModalFile.file_url ? (
                <img
                  src={previewModalFile.file_url}
                  alt={previewModalFile.file_name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                />
              ) : previewModalFile.file_category === 'zip' || (previewModalFile.file_name && previewModalFile.file_name.toLowerCase().endsWith('.zip')) ? (
                <div className="text-center space-y-3 p-8">
                  <Archive className="w-16 h-16 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-[#111111]">ZIP Compressed Archive</p>
                  <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                    This archive contains package deliverables uploaded safely to your studio Google Drive folder.
                  </p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Open in Google Drive</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : previewModalFile.file_category === 'pdf' ? (
                <div className="text-center space-y-3 p-8">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-[#111111]">PDF Document Preview Ready</p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Open PDF</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3 p-8">
                  <FileText className="w-16 h-16 text-[#1E74FF] mx-auto" />
                  <p className="text-sm font-bold text-[#111111]">Document File</p>
                  {previewModalFile.file_url && (
                    <a
                      href={previewModalFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                    >
                      <span>Download / Open File</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6B7280]">
              <div className="flex items-center gap-4">
                <span>Size: <strong className="text-[#111111]">{formatFileSize(previewModalFile.file_size)}</strong></span>
                <span>Type: <strong className="text-[#111111] font-mono uppercase">.{previewModalFile.file_type}</strong></span>
              </div>

              <div className="flex items-center gap-1 text-[#13A52D] text-xs font-bold">
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
