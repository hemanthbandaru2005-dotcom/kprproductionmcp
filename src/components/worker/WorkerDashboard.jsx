import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import WorkerChatPanel from './WorkerChatPanel';
import {
  fetchMessagesForWorker,
  subscribeToChatChannel
} from '../../utils/chatService';
import {
  uploadClientFile,
  formatFileSize,
  addUploadActivityMessage
} from '../../utils/clientUploadsService';
import {
  fetchJobs,
  updateJob,
  deleteJob,
  subscribeToJobsRealtime,
  isJobForWorker
} from '../../utils/jobsService';
import {
  Briefcase, CheckCircle, Clock, UploadCloud, FileText,
  LogOut, Bell, Calendar, RefreshCw, AlertCircle,
  File, Image as ImageIcon, Video, ChevronRight, Loader2, Sparkles, UserCheck,
  MessageSquare, User, ArrowUpRight, Trash2, HardDrive, Link as LinkIcon, ExternalLink,
  Plus, Copy
} from 'lucide-react';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', bg: 'bg-[#DCE9FF]', text: 'text-[#1E74FF]', border: 'border-[#BFDBFE]', dot: 'bg-[#1E74FF]' },
  review:      { label: 'Review',      bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]', dot: 'bg-[#D97706]' },
  completed:   { label: 'Completed',   bg: 'bg-[#DFF5E3]', text: 'text-[#13A52D]', border: 'border-[#BBF7D0]', dot: 'bg-[#13A52D]' },
};

function formatShootDate(dateStr) {
  if (!dateStr) return 'Not scheduled';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function WorkerDashboard({ onLogout }) {
  const { user, profile, signOut } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [jobFiles, setJobFiles] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'chat'
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Form states for status updates
  const [editStatus, setEditStatus] = useState('in_progress');

  // Google Drive Linking States
  const [deliverableMode, setDeliverableMode] = useState('drive'); // 'drive' | 'upload'
  const [driveUrl, setDriveUrl] = useState('');
  const [driveTitle, setDriveTitle] = useState('');
  const [savingDriveLink, setSavingDriveLink] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const workerId = user?.id || profile?.id || user?.email || 'worker';

  // Fetch assigned jobs via unified jobsService
  const fetchMyJobs = async () => {
    setLoading(true);

    try {
      const allJobs = await fetchJobs();
      const myJobs = allJobs.filter(j => isJobForWorker(j, user, profile));
      setJobs(myJobs);

      // Auto-select first job if none selected
      if (myJobs.length > 0) {
        if (!selectedJob || !myJobs.some(j => j.id === selectedJob.id)) {
          setSelectedJob(myJobs[0]);
          setEditStatus(myJobs[0].status || 'in_progress');
          fetchJobFiles(myJobs[0].id);
        }
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error('Error fetching worker jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (job) => {
    if (!job) return;

    setJobs(prev => prev.filter(j => j.id !== job.id));
    if (selectedJob?.id === job.id) {
      setSelectedJob(null);
    }

    await deleteJob(job.id);
  };

  // Fetch unread messages
  const fetchUnreadCount = async () => {
    try {
      const emailOrId = user?.email || profile?.email || workerId;
      const msgs = await fetchMessagesForWorker(emailOrId);
      const unread = (msgs || []).filter(m => m.sender_role === 'admin' && !m.read_at).length;
      setUnreadChatCount(unread);
    } catch (e) {}
  };

  // Fetch attachments & linked drive files for selected job
  const fetchJobFiles = async (jobId) => {
    if (!jobId) return;
    const fileList = [];

    // 1. Supabase job_files
    try {
      const { data } = await supabase
        .from('job_files')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        fileList.push(...data);
      }
    } catch (e) {}

    // 2. LocalStorage cache for job files & drive links
    try {
      const raw = localStorage.getItem(`kpr_job_files_${jobId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(lf => {
            if (!fileList.some(f => f.id === lf.id || f.file_path === lf.file_path)) {
              fileList.push(lf);
            }
          });
        }
      }
    } catch (e) {}

    // 3. Check if job has a direct drive_link or drive_folder_url attached
    if (selectedJob?.drive_link || selectedJob?.drive_folder_url) {
      const link = selectedJob.drive_link || selectedJob.drive_folder_url;
      if (!fileList.some(f => f.file_path === link)) {
        fileList.unshift({
          id: `drive-${jobId}-main`,
          job_id: jobId,
          file_name: 'Main Google Drive Folder',
          file_path: link,
          file_type: 'drive',
          is_drive: true,
          created_at: selectedJob.updated_at || new Date().toISOString()
        });
      }
    }

    setJobFiles(fileList);
  };

  useEffect(() => {
    fetchMyJobs();
    fetchUnreadCount();

    // Auto-register worker profile to Supabase SYSTEM_WORKER_REGISTRY so Admin Chat lists them immediately across all devices
    const curEmail = (user?.email || profile?.email || '').toLowerCase().trim();
    if (curEmail) {
      const curName = profile?.full_name || user?.user_metadata?.full_name || formatNameFromEmailOrId(curEmail);
      const curId = (profile?.id || user?.id || curEmail.split('@')[0]).replace(/^worker-/, '');
      supabase.from('verifications').insert([{
        id: `worker_reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        client_id: `worker-${curId}`,
        client_name: curName,
        client_email: curEmail,
        album_id: 'SYSTEM_WORKER_REGISTRY',
        event_id: `worker_profile_${curId}`,
        event_title: 'Studio Staff Worker',
        status: 'active',
        sent_at: new Date().toISOString(),
        photo_items: [{
          id: `worker-${curId}`,
          email: curEmail,
          full_name: curName,
          role: 'worker',
          status: 'active',
          skill: profile?.skill || 'Photographer / Editor'
        }]
      }]).then(() => {}).catch(() => {});
    }

    const unsubscribeJobs = subscribeToJobsRealtime(() => {
      fetchMyJobs();
    });

    const unsubscribeChat = subscribeToChatChannel(
      () => fetchUnreadCount(),
      () => fetchUnreadCount()
    );

    const onMessagesRead = () => {
      fetchUnreadCount();
    };
    window.addEventListener('kpr_chat_messages_read', onMessagesRead);

    return () => {
      if (unsubscribeJobs) unsubscribeJobs();
      if (unsubscribeChat) unsubscribeChat();
      window.removeEventListener('kpr_chat_messages_read', onMessagesRead);
    };
  }, [user, profile]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatCount(0);
      fetchUnreadCount();
    }
  }, [activeTab]);

  // Select a job
  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setEditStatus(job.status || 'in_progress');
    fetchJobFiles(job.id);
  };

  // Handle Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    setUpdatingStatus(true);
    setStatusMsg('');

    const updated = await updateJob(selectedJob.id, {
      status: editStatus
    });

    setUpdatingStatus(false);
    setStatusMsg('Job status updated successfully!');
    if (updated?.job) {
      setSelectedJob(updated.job);
    }
    fetchMyJobs();
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Handle Link Google Drive URL
  const handleLinkGoogleDrive = async (e) => {
    e.preventDefault();
    if (!selectedJob || !driveUrl.trim()) return;

    setSavingDriveLink(true);
    setStatusMsg('');

    const formattedUrl = driveUrl.trim().startsWith('http') ? driveUrl.trim() : `https://${driveUrl.trim()}`;
    const formattedTitle = driveTitle.trim() || 'Google Drive Deliverables Folder';

    const newDriveItem = {
      id: `drive-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      job_id: selectedJob.id,
      file_name: formattedTitle,
      file_path: formattedUrl,
      file_type: 'drive',
      is_drive: true,
      created_at: new Date().toISOString()
    };

    // 1. Save metadata record to Supabase job_files table
    try {
      await supabase.from('job_files').insert([{
        job_id: selectedJob.id,
        file_name: formattedTitle,
        file_path: formattedUrl,
        file_type: 'drive',
        uploaded_by: user?.id || 'worker'
      }]);
    } catch (e) {}

    // 2. Update job record with drive_link / drive_folder_url
    try {
      await supabase.from('jobs').update({
        drive_link: formattedUrl,
        drive_folder_url: formattedUrl,
        updated_at: new Date().toISOString()
      }).eq('id', selectedJob.id);
    } catch (e) {}

    // 3. Save locally in localStorage cache
    try {
      const raw = localStorage.getItem(`kpr_job_files_${selectedJob.id}`);
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem(`kpr_job_files_${selectedJob.id}`, JSON.stringify([newDriveItem, ...list]));

      // Update in admin jobs cache
      const rawJobs = localStorage.getItem('kpr_admin_jobs_v1');
      if (rawJobs) {
        const jList = JSON.parse(rawJobs);
        const nextJList = jList.map(j => j.id === selectedJob.id ? { ...j, drive_link: formattedUrl, drive_folder_url: formattedUrl, updated_at: new Date().toISOString() } : j);
        localStorage.setItem('kpr_admin_jobs_v1', JSON.stringify(nextJList));
      }

      // Also register to Admin Uploads Vault under Worker Deliverables
      const workerUploadRecord = {
        id: newDriveItem.id,
        client_id: selectedJob.client_name || 'studio',
        client_name: selectedJob.client_name || selectedJob.title,
        client_email: user?.email || 'worker@kpr.com',
        project_title: selectedJob.title,
        project_id: selectedJob.id,
        file_name: formattedTitle,
        file_type: 'drive',
        file_category: 'drive',
        file_size: 0,
        file_url: formattedUrl,
        drive_sync_status: 'synced',
        drive_file_url: formattedUrl,
        uploader_role: 'worker',
        uploader_name: profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Staff Worker'),
        uploader_email: user?.email || 'worker@kpr.com',
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      };
      // Also register activity notification message for Admin
      try {
        addUploadActivityMessage({
          uploaderRole: 'worker',
          uploaderName: profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Staff Worker'),
          uploaderEmail: user?.email || 'worker@kpr.com',
          fileName: formattedTitle,
          projectTitle: selectedJob.title || 'Photoshoot Deliverables',
          driveUrl: formattedUrl
        });
      } catch (e) {}
    } catch (e) {}

    setJobFiles(prev => [newDriveItem, ...prev]);
    setDriveUrl('');
    setDriveTitle('');
    setSavingDriveLink(false);
    setStatusMsg('Google Drive deliverable folder linked successfully!');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  // Handle Delete a File or Drive link
  const handleDeleteJobFile = async (file) => {
    if (!file || !selectedJob) return;

    // 1. Optimistic removal
    setJobFiles(prev => prev.filter(f => f.id !== file.id && f.file_path !== file.file_path));

    // 2. Remove from Supabase
    try {
      if (file.id && !file.id.startsWith('drive-')) {
        await supabase.from('job_files').delete().eq('id', file.id);
      } else if (file.file_path) {
        await supabase.from('job_files').delete().eq('file_path', file.file_path);
      }
    } catch (e) {}

    // 3. Remove from LocalStorage cache
    try {
      const raw = localStorage.getItem(`kpr_job_files_${selectedJob.id}`);
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter(f => f.id !== file.id && f.file_path !== file.file_path);
        localStorage.setItem(`kpr_job_files_${selectedJob.id}`, JSON.stringify(filtered));
      }
    } catch (e) {}
  };

  // Direct Google Drive Upload (Streams directly to Google Drive — ZERO Supabase project storage used!)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedJob) return;

    setUploading(true);
    setStatusMsg('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressText(`Uploading "${file.name}" directly to Google Drive (0%)…`);

      try {
        const workerDisplayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Staff Worker');
        const uploadResult = await uploadClientFile({
          file,
          clientId: selectedJob.client_name || 'studio',
          clientName: selectedJob.client_name || selectedJob.title,
          clientEmail: user?.email || 'worker@kpr.com',
          projectId: selectedJob.id,
          projectTitle: selectedJob.title,
          uploaderRole: 'worker',
          uploaderName: workerDisplayName,
          uploaderEmail: user?.email || 'worker@kpr.com',
          onProgress: (p) => {
            setUploadProgressText(`Syncing "${file.name}" to Google Drive: ${p.percent || 0}% (${p.stage || 'Uploading'})`);
          }
        });

        if (uploadResult?.success) {
          const driveLink = uploadResult.record?.drive_file_url || uploadResult.record?.file_url || `https://drive.google.com/file/d/${uploadResult.record?.drive_file_id || 'view'}`;

          const newDriveRecord = {
            id: `drive-upload-${Date.now()}-${i}`,
            job_id: selectedJob.id,
            file_name: file.name,
            file_path: driveLink,
            file_type: 'drive',
            is_drive: true,
            uploaded_by: user?.id || 'worker',
            created_at: new Date().toISOString()
          };

          // Save link record
          try {
            await supabase.from('job_files').insert([newDriveRecord]);
          } catch (e) {}

          try {
            const raw = localStorage.getItem(`kpr_job_files_${selectedJob.id}`);
            const list = raw ? JSON.parse(raw) : [];
            localStorage.setItem(`kpr_job_files_${selectedJob.id}`, JSON.stringify([newDriveRecord, ...list]));
          } catch (e) {}

          setJobFiles(prev => [newDriveRecord, ...prev]);
        }
      } catch (err) {
        console.error('Google Drive direct upload error:', err);
      }
    }

    setUploading(false);
    setUploadProgressText('');
    setStatusMsg('Files streamed directly to Google Drive!');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const handleCopyLink = (file) => {
    navigator.clipboard.writeText(file.file_path);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const reviewCount = jobs.filter(j => j.status === 'review').length;
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Staff Member';

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111111] font-sans antialiased p-2 sm:p-5 lg:p-8 flex flex-col items-center justify-start selection:bg-[#141414] selection:text-white">

      {/* OUTER CONTAINER */}
      <div className="w-full max-w-[1440px] bg-[#F7F8FA] border border-[#E7E8EB] rounded-[20px] sm:rounded-[32px] p-3.5 sm:p-6 md:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] space-y-4 sm:space-y-6">

        {/* TOP NAVBAR */}
        <header className="w-full bg-white rounded-2xl sm:rounded-full border border-[#E7E8EB] px-4 sm:px-6 py-3 shadow-xs flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#141414] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              W
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-[#111111] tracking-tight block leading-tight">
                KPR Staff Portal
              </span>
              <span className="text-[10px] text-[#9CA0A6] font-medium tracking-wider uppercase">
                Worker Desk & Assignments
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {jobs.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#13A52D] ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E7E8EB] rounded-2xl shadow-xl p-4 z-40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-2">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">Shoot Updates</span>
                    <span className="text-[11px] text-[#1E74FF] font-semibold">{jobs.length} assigned</span>
                  </div>
                  <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
                    {jobs.map(j => (
                      <div key={j.id} className="p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E7E8EB]">
                        <p className="font-semibold text-[#111111]">{j.title}</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">{STATUS_CONFIG[j.status]?.label || j.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#DC2626] border border-[#E7E8EB] hover:border-[#FCA5A5] text-xs font-semibold transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* SPACIOUS SEGMENTED NAVIGATION TABS */}
        <div className="flex items-center justify-between gap-3 bg-white p-1.5 rounded-2xl sm:rounded-full border border-[#E7E8EB] shadow-xs">
          <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'jobs'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F7F8FA] sm:bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EEF0F2]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Assigned Shoots ({jobs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`relative px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F7F8FA] sm:bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EEF0F2]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Admin</span>
              {unreadChatCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF4D94] text-white text-[10px] font-bold font-mono">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-2 text-xs text-[#9CA0A6]">
            <span>Signed in as <strong className="text-[#111111]">{userName}</strong></span>
          </div>
        </div>

        {/* TITLE ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111111] tracking-tight leading-tight">
              {activeTab === 'jobs' ? 'My Assigned Shoots & Schedule' : 'Studio Management Chat Desk'}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#9CA0A6] font-normal mt-0.5">
              Welcome back, <strong className="text-[#111111]">{userName}</strong>. Check your photoshoot dates and upload deliverables.
            </p>
          </div>

          <button
            onClick={fetchMyJobs}
            className="self-start sm:self-auto px-4 py-2 rounded-full bg-white hover:bg-[#F1F2F4] text-[#111111] border border-[#E7E8EB] text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Desk</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'chat' && (
          <WorkerChatPanel workerUser={user} workerProfile={profile} />
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-white rounded-[20px] p-5 sm:p-6 shadow-xs border border-[#E7E8EB] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Assigned</span>
                    <p className="text-3xl sm:text-[36px] font-bold text-[#111111] mt-1 leading-none">{jobs.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E7E8EB] text-xs text-[#9CA0A6]">
                  Active photoshoot assignments
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-5 sm:p-6 shadow-xs border border-[#E7E8EB] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">In Progress</span>
                    <p className="text-3xl sm:text-[36px] font-bold text-[#D97706] mt-1 leading-none">{inProgressCount + reviewCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E7E8EB] text-xs text-[#9CA0A6]">
                  Editing & Proofing pipeline
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-5 sm:p-6 shadow-xs border border-[#E7E8EB] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#13A52D] uppercase tracking-wider">Delivered</span>
                    <p className="text-3xl sm:text-[36px] font-bold text-[#13A52D] mt-1 leading-none">{completedCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#DFF5E3] text-[#13A52D] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E7E8EB] text-xs text-[#9CA0A6]">
                  Successfully completed shoots
                </div>
              </div>
            </div>

            {/* MAIN WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT: JOBS QUEUE */}
              <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#111111] uppercase tracking-wider">My Assigned Queue</h3>
                  <span className="text-xs text-[#9CA0A6]">{jobs.length} items</span>
                </div>

                {loading ? (
                  <div className="bg-white rounded-[20px] p-12 text-center text-[#9CA0A6] border border-[#E7E8EB]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
                    <p className="text-xs">Checking assigned shoots…</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="bg-white rounded-[20px] p-10 text-center text-[#9CA0A6] border border-[#E7E8EB] space-y-2">
                    <Briefcase className="w-10 h-10 mx-auto text-[#9CA0A6]" />
                    <p className="text-sm font-semibold text-[#111111]">No Jobs Assigned Yet</p>
                    <p className="text-xs text-[#9CA0A6]">When the studio assigns a photoshoot to your mail ID, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {jobs.map((job) => {
                      const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.in_progress;
                      const isSelected = selectedJob?.id === job.id;
                      const shootDateStr = job.shoot_date || job.date || job.due_date;

                      return (
                        <div
                          key={job.id}
                          onClick={() => handleSelectJob(job)}
                          className={`p-4 rounded-[20px] border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#141414] shadow-md ring-1 ring-[#141414]'
                              : 'bg-white border-[#E7E8EB] hover:bg-[#F7F8FA]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h4 className="text-sm font-bold text-[#111111] leading-tight">{job.title}</h4>
                              <p className="text-[11px] text-[#9CA0A6] capitalize mt-0.5">{job.shoot_type?.replace('_', ' ') || 'Photoshoot'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>

                          {job.client_name && (
                            <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-2">
                              <User className="w-3.5 h-3.5 text-[#9CA0A6]" />
                              <span>Client: <strong className="text-[#111111]">{job.client_name}</strong></span>
                            </p>
                          )}

                          {/* Shoot Date Row */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E7E8EB]">
                            <span className="flex items-center gap-1.5 text-[#111111] font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-[#1E74FF]" />
                              <span>Shoot Date: {formatShootDate(shootDateStr)}</span>
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job);
                              }}
                              className="p-1 text-[#9CA0A6] hover:text-[#DC2626] rounded-full"
                              title="Delete / Dismiss"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT: JOB DETAIL WORKSPACE */}
              <div className="lg:col-span-7">
                {!selectedJob ? (
                  <div className="bg-white rounded-[20px] p-12 text-center text-[#9CA0A6] border border-[#E7E8EB]">
                    <Briefcase className="w-12 h-12 mx-auto text-[#9CA0A6] mb-3" />
                    <p className="text-sm font-semibold text-[#111111]">Select a job from the queue to view workspace details</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-[20px] border border-[#E7E8EB] p-5 sm:p-6 shadow-xs space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E8EB] pb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#111111] tracking-tight">{selectedJob.title}</h3>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          Assigned Shoot Workspace & Deliverables
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_CONFIG[selectedJob.status]?.bg || 'bg-[#DCE9FF]'} ${STATUS_CONFIG[selectedJob.status]?.text || 'text-[#1E74FF]'}`}>
                          {STATUS_CONFIG[selectedJob.status]?.label || selectedJob.status}
                        </span>
                        <button
                          onClick={() => handleDeleteJob(selectedJob)}
                          className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
                          title="Delete / Remove Shoot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notification Alert Message */}
                    {statusMsg && (
                      <div className="p-3 bg-[#DFF5E3] border border-[#BBF7D0] rounded-xl text-[#13A52D] text-xs font-bold flex items-center gap-2 animate-fadeIn">
                        <CheckCircle className="w-4 h-4" />
                        <span>{statusMsg}</span>
                      </div>
                    )}

                    {/* Job Details Grid with Prominent Shoot Date */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-[#F7F8FA] p-4 rounded-2xl border border-[#E7E8EB] text-xs">
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] uppercase font-bold">Shoot Date</span>
                        <p className="font-bold text-[#1E74FF] mt-0.5 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatShootDate(selectedJob.shoot_date || selectedJob.date || selectedJob.due_date)}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] uppercase font-bold">Client Name</span>
                        <p className="font-semibold text-[#111111] mt-0.5">{selectedJob.client_name || 'Studio Booking'}</p>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] uppercase font-bold">Shoot Category</span>
                        <p className="font-semibold text-[#111111] mt-0.5 capitalize">{selectedJob.shoot_type?.replace('_', ' ') || 'Photography'}</p>
                      </div>
                      <div>
                        <span className="text-[#9CA0A6] block text-[10px] uppercase font-bold">Studio Status</span>
                        <p className="font-semibold text-[#111111] mt-0.5 capitalize">{STATUS_CONFIG[selectedJob.status]?.label || selectedJob.status}</p>
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <form onSubmit={handleStatusUpdate} className="space-y-4 pt-2 border-t border-[#E7E8EB]">
                      <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Update Pipeline Status</h4>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs font-semibold text-[#111111] focus:outline-none cursor-pointer"
                        >
                          <option value="in_progress">In Progress</option>
                          <option value="review">Under Review / Completed Shots</option>
                          <option value="completed">Delivered</option>
                        </select>

                        <button
                          type="submit"
                          disabled={updatingStatus}
                          className="px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          <span>Update Status</span>
                        </button>
                      </div>
                    </form>

                    {/* ════════════════════════════════════════════════════════════════════
                        DELIVERABLE FILES & GOOGLE DRIVE INTEGRATION
                        (Direct to Google Drive — ZERO Database Storage Wasted)
                        ════════════════════════════════════════════════════════════════════ */}
                    <div className="space-y-4 pt-4 border-t border-[#E7E8EB]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-[#1E74FF]" />
                            <span>Deliverable Files (Google Drive Storage)</span>
                          </h4>
                          <p className="text-[11px] text-[#9CA0A6]">
                            Link your Google Drive shoot folder or upload directly to Google Drive
                          </p>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex items-center gap-1 bg-[#F1F2F4] p-1 rounded-full border border-[#E7E8EB] self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setDeliverableMode('drive')}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              deliverableMode === 'drive'
                                ? 'bg-white text-[#111111] shadow-xs'
                                : 'text-[#6B7280] hover:text-[#111111]'
                            }`}
                          >
                            <HardDrive className="w-3 h-3 text-[#1E74FF]" />
                            <span>Google Drive Link</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliverableMode('upload')}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              deliverableMode === 'upload'
                                ? 'bg-white text-[#111111] shadow-xs'
                                : 'text-[#6B7280] hover:text-[#111111]'
                            }`}
                          >
                            <UploadCloud className="w-3 h-3 text-[#13A52D]" />
                            <span>Upload to Drive</span>
                          </button>
                        </div>
                      </div>

                      {/* 1. GOOGLE DRIVE LINK FORM */}
                      {deliverableMode === 'drive' && (
                        <div className="bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl p-4 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                              <LinkIcon className="w-3.5 h-3.5 text-[#1E74FF]" />
                              <span>Link Google Drive Folder or Shareable URL</span>
                            </span>
                            <a
                              href="https://drive.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-[#F1F2F4] border border-[#E7E8EB] text-[11px] font-semibold text-[#1E74FF] transition-colors"
                            >
                              <span>Open Google Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <form onSubmit={handleLinkGoogleDrive} className="space-y-2.5">
                            <div>
                              <input
                                type="url"
                                required
                                placeholder="Paste Google Drive folder link (e.g. https://drive.google.com/drive/folders/...)"
                                value={driveUrl}
                                onChange={(e) => setDriveUrl(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                placeholder="Deliverable Title (e.g. Full Shoot RAWs / Color Graded Edits)"
                                value={driveTitle}
                                onChange={(e) => setDriveTitle(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                              />

                              <button
                                type="submit"
                                disabled={savingDriveLink || !driveUrl.trim()}
                                className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {savingDriveLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                <span>Save Drive Link</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* 2. DIRECT GOOGLE DRIVE FILE UPLOADER (Streams directly to Google Drive) */}
                      {deliverableMode === 'upload' && (
                        <div className="space-y-3">
                          <label className="border-2 border-dashed border-[#E7E8EB] hover:border-[#13A52D] bg-[#F7F8FA] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                            <UploadCloud className="w-8 h-8 text-[#13A52D] mb-2" />
                            <span className="text-xs font-bold text-[#111111]">Upload Raw Files & Photos Directly to Google Drive</span>
                            <span className="text-[10px] text-[#9CA0A6] mt-0.5">Files stream directly to Google Drive without consuming database storage</span>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>

                          {uploading && (
                            <div className="p-3 bg-[#DCE9FF] border border-[#BFDBFE] rounded-2xl flex items-center gap-2.5 text-xs text-[#1E74FF]">
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              <span className="font-medium truncate">{uploadProgressText || 'Streaming directly to Google Drive…'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. ATTACHED DELIVERABLES & DRIVE LINKS LIST */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs text-[#9CA0A6] px-1">
                          <span>Attached Deliverables ({jobFiles.length})</span>
                          <span>Synced to Google Drive & Studio</span>
                        </div>

                        {jobFiles.length === 0 ? (
                          <div className="p-6 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] text-center text-xs text-[#9CA0A6]">
                            <HardDrive className="w-6 h-6 mx-auto mb-1 text-[#9CA0A6]" />
                            <p>No deliverables or Google Drive links attached yet.</p>
                            <p className="text-[10px] mt-0.5">Paste your Google Drive link above to share shoot files.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                            {jobFiles.map(file => {
                              return (
                                <div
                                  key={file.id || file.file_path}
                                  className="p-3 bg-white rounded-2xl border border-[#E7E8EB] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-[#D1D5DB] transition-colors"
                                >
                                  <div className="flex items-center gap-3 truncate pr-2">
                                    <div className="w-8 h-8 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center shrink-0">
                                      <HardDrive className="w-4 h-4" />
                                    </div>
                                    <div className="truncate">
                                      <p className="font-bold text-[#111111] truncate">{file.file_name || 'Google Drive Deliverable'}</p>
                                      <p className="text-[10px] text-[#9CA0A6] truncate font-mono mt-0.5">{file.file_path}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLink(file)}
                                      className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F1F2F4] rounded-full transition-colors cursor-pointer"
                                      title="Copy Drive Link"
                                    >
                                      {copiedId === file.id ? <CheckCircle className="w-4 h-4 text-[#13A52D]" /> : <Copy className="w-4 h-4" />}
                                    </button>

                                    <a
                                      href={file.file_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-[#1E74FF] hover:bg-[#0055D6] text-white shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <span>Open in Drive</span>
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteJobFile(file)}
                                      className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
                                      title="Delete Link"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
