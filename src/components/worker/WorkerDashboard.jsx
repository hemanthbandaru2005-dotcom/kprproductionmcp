import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import WorkerChatPanel from './WorkerChatPanel';
import {
  fetchMessagesForWorker,
  subscribeToChatChannel
} from '../../utils/chatService';
import {
  Briefcase, CheckCircle, Clock, UploadCloud, FileText,
  LogOut, Bell, Calendar, RefreshCw, AlertCircle,
  File, Image as ImageIcon, Video, ChevronRight, Loader2, Sparkles, UserCheck,
  MessageSquare
} from 'lucide-react';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  review:      { label: 'Review',      bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  completed:   { label: 'Completed',   bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
};

function formatDueDate(dateStr) {
  if (!dateStr) return 'No date set';
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  target.setHours(0,0,0,0);
  
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Due Today';
  if (diffDays === 1) return 'Due Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d Overdue`;
  return `Due in ${diffDays} days`;
}

function isJobForWorker(job, user, profile) {
  if (!job) return false;
  const assigned = (job.assigned_worker || '').trim().toLowerCase();
  const assignedName = (job.assigned_worker_name || '').trim().toLowerCase();
  const assignedEmail = (job.assigned_worker_email || '').trim().toLowerCase();

  const userEmail = (user?.email || profile?.email || '').trim().toLowerCase();
  const userId = (user?.id || profile?.id || '').trim().toLowerCase();
  const userPrefix = userEmail ? userEmail.split('@')[0] : '';

  // 1. Direct matches with ID or Email
  if (userEmail && (assigned === userEmail || assignedName === userEmail || assignedEmail === userEmail)) return true;
  if (userId && (assigned === userId || assignedName === userId)) return true;

  // 2. Prefix / username match
  if (userPrefix) {
    const cleanAssigned = assigned.replace(/^worker-/, '');
    const cleanAssignedName = assignedName.replace(/^worker-/, '');
    if (cleanAssigned && (cleanAssigned === userPrefix || cleanAssigned.includes(userPrefix) || userPrefix.includes(cleanAssigned))) return true;
    if (cleanAssignedName && (cleanAssignedName === userPrefix || cleanAssignedName.includes(userPrefix) || userPrefix.includes(cleanAssignedName))) return true;
  }

  return false;
}

export default function WorkerDashboard({ onLogout }) {
  const { user, profile, signOut } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobFiles, setJobFiles] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'chat'
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Form states for status updates
  const [editStatus, setEditStatus] = useState('in_progress');
  const [editProgress, setEditProgress] = useState(0);

  const workerId = user?.id || profile?.id || user?.email || 'worker';

  // Fetch assigned jobs
  const fetchMyJobs = async () => {
    if (!user) return;
    setLoading(true);

    const jobsMap = new Map();

    // 1. Supabase jobs
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(j => {
          if (isJobForWorker(j, user, profile)) {
            jobsMap.set(j.id, j);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase worker jobs fetch notice:', err);
    }

    // 2. Local registered jobs
    try {
      const raw = localStorage.getItem('kpr_admin_jobs_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(j => {
            if (isJobForWorker(j, user, profile)) {
              if (!jobsMap.has(j.id)) {
                jobsMap.set(j.id, j);
              }
            }
          });
        }
      }
    } catch (e) {}

    const myJobs = Array.from(jobsMap.values());
    setJobs(myJobs);

    if (myJobs.length > 0) {
      setSelectedJob(prev => (prev && myJobs.some(j => j.id === prev.id)) ? myJobs.find(j => j.id === prev.id) : myJobs[0]);
    } else {
      setSelectedJob(null);
    }

    setLoading(false);
  };

  // Fetch files for selected job
  const fetchJobFiles = async (jobId) => {
    if (!jobId) return;
    const { data } = await supabase
      .from('job_files')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    
    setJobFiles(data || []);
  };

  const checkUnreadChat = async () => {
    const msgs = await fetchMessagesForWorker(workerId);
    const unread = msgs.filter(m => m.sender_role === 'admin' && !m.read_at).length;
    setUnreadChatCount(unread);
  };

  useEffect(() => {
    fetchMyJobs();
    checkUnreadChat();

    // Subscribe to changes on worker's jobs
    const jobChannel = supabase
      .channel('worker-jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchMyJobs();
      })
      .subscribe();

    const handleJobsUpdated = () => {
      fetchMyJobs();
    };
    window.addEventListener('kpr_jobs_updated', handleJobsUpdated);

    const unsubscribeChat = subscribeToChatChannel(
      (newMsg) => {
        if (newMsg.worker_id === workerId && newMsg.sender_role === 'admin') {
          if (activeTab !== 'chat') {
            setUnreadChatCount(prev => prev + 1);
          }
        }
      },
      () => {
        checkUnreadChat();
      }
    );

    return () => {
      supabase.removeChannel(jobChannel);
      window.removeEventListener('kpr_jobs_updated', handleJobsUpdated);
      unsubscribeChat();
    };
  }, [user, profile, workerId, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedJob) {
      setEditStatus(selectedJob.status || 'in_progress');
      setEditProgress(selectedJob.progress_percent || 0);
      fetchJobFiles(selectedJob.id);
    }
  }, [selectedJob]);

  // Handle Save Status Update
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setUpdatingStatus(true);
    setStatusMsg('');

    // 1. Update local storage
    try {
      const raw = localStorage.getItem('kpr_admin_jobs_v1');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map(j => j.id === selectedJob.id ? {
          ...j,
          status: editStatus,
          progress_percent: editProgress,
          updated_at: new Date().toISOString()
        } : j);
        localStorage.setItem('kpr_admin_jobs_v1', JSON.stringify(updated));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kpr_jobs_updated', { detail: { id: selectedJob.id, status: editStatus, progress_percent: editProgress } }));
      }
    } catch (err) {}

    // 2. Update Supabase
    try {
      await supabase
        .from('jobs')
        .update({
          status: editStatus,
          progress_percent: editProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedJob.id);
    } catch (err) {
      console.warn('Supabase job status update notice:', err);
    }

    setUpdatingStatus(false);
    setStatusMsg('Status updated successfully!');
    setSelectedJob(prev => ({
      ...prev,
      status: editStatus,
      progress_percent: editProgress,
    }));
    fetchMyJobs();
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Handle File Upload to Supabase Storage
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedJob) return;

    setUploading(true);
    setStatusMsg('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `job-${selectedJob.id}/${Date.now()}-${file.name}`;

      // Upload file to Supabase storage bucket 'job-attachments'
      const { error: uploadError } = await supabase.storage
        .from('job-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-attachments')
        .getPublicUrl(filePath);

      // Record in job_files table
      await supabase.from('job_files').insert([{
        job_id: selectedJob.id,
        file_name: file.name,
        file_path: urlData.publicUrl,
        file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
        uploaded_by: user.id,
      }]);
    }

    setUploading(false);
    setStatusMsg('Files uploaded successfully!');
    fetchJobFiles(selectedJob.id);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const reviewCount = jobs.filter(j => j.status === 'review').length;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#06B6D4] selection:text-white">
      
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0F172A]/90 backdrop-blur-xl border-b border-cyan-500/20 px-3 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="font-serif text-base sm:text-lg text-white font-medium tracking-wide">
              Worker <span className="text-cyan-400 font-bold">Portal</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-cyan-400/70 font-semibold">
              KPR WORKER DASHBOARD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 sm:p-2.5 text-white/60 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {jobs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1E293B] border border-cyan-500/20 rounded-xl shadow-2xl p-4 z-40 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                  <span className="text-[10px] text-cyan-400">{jobs.length} assigned</span>
                </div>
                <div className="space-y-2 text-xs">
                  {jobs.map(j => (
                    <div key={j.id} className="p-2 bg-white/5 rounded-lg border border-white/5">
                      <p className="font-medium text-white/90">{j.title}</p>
                      <p className="text-[10px] text-cyan-400/70">{STATUS_CONFIG[j.status]?.label || j.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-red-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">

        {/* TOP TAB NAVIGATION: ASSIGNED SHOOTS vs CHAT WITH ADMIN */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-white/10 pb-3 sm:pb-4">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Assigned Shoots ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'chat'
                ? 'bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20'
                : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with Admin</span>
            {unreadChatCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold font-mono animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: CHAT WITH ADMIN */}
        {activeTab === 'chat' && (
          <WorkerChatPanel workerUser={user} workerProfile={profile} />
        )}

        {/* TAB 2: ASSIGNED SHOOTS */}
        {activeTab === 'jobs' && (
          <div className="space-y-8 animate-fadeIn">
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-[#1E293B] border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                <p className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-semibold">Assigned Jobs</p>
                <p className="text-3xl font-serif text-white mt-2">{jobs.length}</p>
              </div>

              <div className="bg-[#1E293B] border border-blue-500/20 rounded-2xl p-6 shadow-xl">
                <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-semibold">In Progress</p>
                <p className="text-3xl font-serif text-white mt-2">{inProgressCount + reviewCount}</p>
              </div>

              <div className="bg-[#1E293B] border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-semibold">Completed</p>
                <p className="text-3xl font-serif text-white mt-2">{completedCount}</p>
              </div>
            </div>

            {/* MAIN JOBS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* LEFT: MY ASSIGNED JOBS LIST (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span>My Assigned Shoots</span>
                  </h2>
                  <button
                    onClick={fetchMyJobs}
                    className="p-1.5 text-white/40 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Refresh Jobs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loading ? (
                  <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-white/40">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    <p className="text-xs">Loading assigned shoots…</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-white/40">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-white/10" />
                    <p className="text-sm font-medium text-white/60">No Shoots Assigned</p>
                    <p className="text-xs text-white/30 mt-1">Admin will assign photoshoots to your Worker ID.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => {
                      const isSelected = selectedJob?.id === job.id;
                      const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.in_progress;
                      
                      return (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-[#1E293B] border-cyan-500/50 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/20'
                              : 'bg-[#1E293B]/60 border-white/5 hover:border-white/15 hover:bg-[#1E293B]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                              {job.title}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.text} ${status.border} flex items-center gap-1.5 shrink-0`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-cyan-400/70" />
                              {job.shoot_date ? new Date(job.shoot_date).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40">
                              {formatDueDate(job.shoot_date)}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-white/40">
                              <span>Progress</span>
                              <span className="font-mono text-cyan-400">{job.progress_percent || 0}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress_percent || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT: JOB DETAILS, STATUS UPDATE & FILE UPLOAD (7 cols) */}
              <div className="lg:col-span-7">
                {selectedJob ? (
                  <div className="bg-[#1E293B] border border-cyan-500/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
                    
                    {/* Header */}
                    <div className="border-b border-white/10 pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                            Job ID: {selectedJob.id?.substring(0, 8)}…
                          </span>
                          <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
                          <p className="text-xs text-white/50 mt-1">Client: {selectedJob.client_name || 'Standard Client'}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${STATUS_CONFIG[selectedJob.status]?.bg} ${STATUS_CONFIG[selectedJob.status]?.text} ${STATUS_CONFIG[selectedJob.status]?.border}`}>
                          {STATUS_CONFIG[selectedJob.status]?.label || selectedJob.status}
                        </span>
                      </div>
                    </div>

                    {statusMsg && (
                      <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{statusMsg}</span>
                      </div>
                    )}

                    {/* Status & Progress Update Form */}
                    <form onSubmit={handleUpdateStatus} className="space-y-4 p-5 bg-[#0F172A]/70 rounded-xl border border-white/5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>Update Job Status & Progress</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                            Status
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                            Progress Percentage ({editProgress}%)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={editProgress}
                            onChange={(e) => setEditProgress(Number(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg mt-3"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={updatingStatus}
                        className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Status Update</span>
                      </button>
                    </form>

                    {/* File Deliverables Upload */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-cyan-400" />
                          <span>Uploaded Deliverables ({jobFiles.length})</span>
                        </h3>
                        <label className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Files</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {uploading && (
                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center text-xs text-cyan-300 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading attachments to cloud storage…</span>
                        </div>
                      )}

                      {jobFiles.length === 0 ? (
                        <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-white/40 space-y-1">
                          <File className="w-8 h-8 mx-auto mb-2 text-white/20" />
                          <p className="text-xs">No deliverables uploaded for this job yet.</p>
                          <p className="text-[10px] text-white/30">Upload edited photos, color grading proofs, or video teasers.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                          {jobFiles.map(file => (
                            <div key={file.id} className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {file.file_type === 'image' ? (
                                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                                ) : file.file_type === 'video' ? (
                                  <Video className="w-4 h-4 text-cyan-400 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                                )}
                                <span className="text-xs text-white/80 truncate">{file.file_name}</span>
                              </div>
                              <a
                                href={file.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-cyan-400 hover:underline shrink-0"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-16 text-center text-white/40">
                    <p className="text-sm font-medium">Select an assigned shoot to view details and update progress.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
