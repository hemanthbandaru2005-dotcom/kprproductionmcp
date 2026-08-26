import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import {
  fetchJobs,
  updateJob,
  deleteJob,
  subscribeToJobsRealtime,
  getDeletedJobIds
} from '../../utils/jobsService';
import {
  Briefcase, User, Clock, RefreshCw, UserCheck,
  Edit2, Trash2, X, CheckCircle, AlertTriangle, Loader2,
  Calendar, Camera, FileText, ExternalLink
} from 'lucide-react';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', bg: 'bg-[#DCE9FF]', text: 'text-[#1E74FF]', dot: 'bg-[#1E74FF]' },
  review:      { label: 'Review',      bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', dot: 'bg-[#D97706]' },
  completed:   { label: 'Completed',   bg: 'bg-[#DFF5E3]', text: 'text-[#16A34A]', dot: 'bg-[#16A34A]' },
};

function formatShootDate(dateStr) {
  if (!dateStr) return 'Not Scheduled';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function JobStatusTable() {
  const [jobs, setJobs] = useState([]);
  const [workersMap, setWorkersMap] = useState({});
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    client_name: '',
    shoot_type: '',
    shoot_date: '',
    assigned_worker: '',
    notes: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkersAndJobs = async () => {
    setLoading(true);

    // 1. Fetch Workers
    const wMap = {};
    const wList = [];

    try {
      const rawReg = localStorage.getItem('kpr_registered_workers_v1');
      if (rawReg) {
        const parsed = JSON.parse(rawReg);
        if (Array.isArray(parsed)) {
          parsed.forEach(w => {
            if (w.id) wMap[w.id] = w;
            if (w.email) {
              const cleanEm = w.email.toLowerCase();
              wMap[cleanEm] = w;
              wList.push({ id: w.id, email: cleanEm, full_name: w.full_name || w.name });
            }
          });
        }
      }

      const { data: wData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'worker');

      if (wData) {
        wData.forEach(w => {
          if (w.id) wMap[w.id] = w;
          if (w.email) {
            const cleanEm = w.email.toLowerCase();
            wMap[cleanEm] = w;
            if (!wList.find(item => item.email === cleanEm)) {
              wList.push({ id: w.id, email: cleanEm, full_name: w.full_name });
            }
          }
        });
      }
    } catch (e) {}

    setWorkersMap(wMap);
    setWorkersList(wList);

    // 2. Fetch Jobs via jobsService
    const allJobs = await fetchJobs();
    setJobs(allJobs);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkersAndJobs();
    const unsubscribe = subscribeToJobsRealtime(() => {
      fetchWorkersAndJobs();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const resolveWorkerName = (job) => {
    if (job.worker?.full_name) return job.worker.full_name;
    if (job.assigned_worker_name) return job.assigned_worker_name;
    if (job.assigned_worker_email) return job.assigned_worker_email.split('@')[0];

    const rawId = job.assigned_worker;
    if (!rawId) return 'Unassigned';

    const match = workersMap[rawId] || workersMap[rawId.toLowerCase()];
    if (match) {
      return match.name || match.full_name || (match.email ? match.email.split('@')[0] : 'Staff Member');
    }

    if (rawId.startsWith('worker-')) {
      const clean = rawId.replace('worker-', '');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    return rawId;
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setEditForm({
      title: job.title || '',
      client_name: job.client_name || '',
      shoot_type: job.shoot_type || 'Photoshoot',
      shoot_date: job.shoot_date || job.date || '',
      assigned_worker: job.assigned_worker || '',
      notes: job.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingJob || !editForm.title.trim()) return;

    setSavingEdit(true);

    const workerEmail = (editForm.assigned_worker || '').trim().toLowerCase() || null;
    const shootDateVal = editForm.shoot_date || null;

    const updated = await updateJob(editingJob.id, {
      title: editForm.title.trim(),
      client_name: editForm.client_name.trim() || null,
      shoot_type: editForm.shoot_type.trim() || 'Photoshoot',
      shoot_date: shootDateVal,
      date: shootDateVal,
      due_date: shootDateVal,
      assigned_worker: workerEmail,
      assigned_worker_name: workerEmail,
      notes: editForm.notes.trim() || null
    });

    if (updated?.job) {
      setJobs(prev => prev.map(j => j.id === editingJob.id ? updated.job : j));
    }

    setSavingEdit(false);
    setEditingJob(null);
  };

  const handleDeleteJob = async (job) => {
    if (!job) return;
    setDeleting(true);

    setJobs(prev => prev.filter(j => j.id !== job.id));
    await deleteJob(job.id);

    setDeleting(false);
    setDeleteConfirmJob(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] p-8 flex items-center justify-center border border-[#E7E8EB]">
        <RefreshCw className="w-5 h-5 text-[#141414] animate-spin" />
        <span className="ml-3 text-sm text-[#6B7280]">Loading live shoot status…</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#E7E8EB] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#E7E8EB] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Live Shoot Status</h3>
          <p className="text-[11px] text-[#9CA0A6] mt-0.5">{jobs.length} active studio pipeline shoots</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWorkersAndJobs}
            className="p-1.5 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh Shoots"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 bg-[#DFF5E3] px-3 py-1 rounded-full border border-[#13A52D]/20">
            <span className="w-2 h-2 rounded-full bg-[#13A52D] animate-pulse" />
            <span className="text-[11px] text-[#13A52D] font-bold uppercase tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center text-[#9CA0A6]">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-[#9CA0A6]" />
          <h4 className="text-base font-bold text-[#111111]">No Active Shoots in Pipeline</h4>
          <p className="text-xs text-[#9CA0A6] mt-1">Create a new task to track real-time studio photoshoot progress.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E7E8EB] bg-[#F7F8FA]">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Shoot Name & Client</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Assigned Staff</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Shoot Date</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E8EB]">
                {jobs.map((job) => {
                  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.in_progress;
                  const workerName = resolveWorkerName(job);
                  const isAssigned = workerName && workerName !== 'Unassigned' && workerName !== '—';
                  const shootDateStr = job.shoot_date || job.date || job.due_date;

                  return (
                    <tr key={job.id} className="hover:bg-[#F7F8FA] transition-colors">
                      {/* Shoot Name & Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#DCE9FF] flex items-center justify-center shrink-0 text-[#1E74FF]">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-[#111111] font-semibold">{job.title}</p>
                              {(job.drive_link || job.drive_folder_url) && (
                                <a
                                  href={job.drive_link || job.drive_folder_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCE9FF] text-[#1E74FF] text-[10px] font-bold hover:bg-[#C2DCFF] transition-colors"
                                  title="Open Google Drive Deliverables"
                                >
                                  <span>Drive</span>
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-[#9CA0A6] capitalize">
                              {job.shoot_type?.replace('_', ' ') || 'Photoshoot'} {job.client_name ? `· ${job.client_name}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Staff */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAssigned ? 'bg-[#141414] text-white' : 'bg-[#EEF0F2] text-[#9CA0A6]'
                          }`}>
                            {isAssigned ? workerName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-sm font-medium ${isAssigned ? 'text-[#111111]' : 'text-[#9CA0A6] italic'}`}>
                            {workerName}
                          </span>
                        </div>
                      </td>

                      {/* Shoot Date */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs font-medium text-[#111111]">
                          <Calendar className="w-3.5 h-3.5 text-[#1E74FF]" />
                          <span>{formatShootDate(shootDateStr)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Actions: Edit, Drive & Delete */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(job.drive_link || job.drive_folder_url) && (
                            <a
                              href={job.drive_link || job.drive_folder_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#1E74FF] hover:bg-[#DCE9FF] rounded-full transition-colors cursor-pointer"
                              title="Open Google Drive Deliverables"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="p-1.5 text-[#6B7280] hover:text-[#1E74FF] hover:bg-[#DCE9FF] rounded-full transition-colors cursor-pointer"
                            title="Edit Shoot Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmJob(job)}
                            className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
                            title="Delete Shoot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#E7E8EB]">
            {jobs.map((job) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.in_progress;
              const workerName = resolveWorkerName(job);
              const isAssigned = workerName && workerName !== 'Unassigned' && workerName !== '—';
              const shootDateStr = job.shoot_date || job.date || job.due_date;

              return (
                <div key={job.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#DCE9FF] flex items-center justify-center shrink-0 text-[#1E74FF]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#111111] leading-tight">{job.title}</h4>
                        <p className="text-[10px] text-[#9CA0A6] capitalize">
                          {job.shoot_type?.replace('_', ' ') || 'Photoshoot'} {job.client_name ? `· ${job.client_name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(job)}
                        className="p-1.5 text-[#6B7280] hover:text-[#1E74FF] rounded-full"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmJob(job)}
                        className="p-1.5 text-[#6B7280] hover:text-[#DC2626] rounded-full"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#9CA0A6]">Staff:</span>
                      <span className={`font-semibold ${isAssigned ? 'text-[#111111]' : 'text-[#9CA0A6] italic'}`}>
                        {workerName}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Shoot Date pill on mobile */}
                  <div className="flex items-center gap-1.5 text-xs text-[#111111] pt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1E74FF]" />
                    <span className="font-medium">{formatShootDate(shootDateStr)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════ EDIT SHOOT MODAL ════════ */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#E7E8EB] overflow-hidden max-h-[90vh] flex flex-col text-[#111111]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">Edit Shoot Details</h3>
                  <p className="text-[11px] text-[#6B7280]">Update shoot information and date schedule</p>
                </div>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                  Shoot Title *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              {/* Client & Shoot Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Client Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editForm.client_name}
                      onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Shoot Type</label>
                  <div className="relative">
                    <Camera className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={editForm.shoot_type}
                      onChange={(e) => setEditForm({ ...editForm, shoot_type: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>
              </div>

              {/* Shoot Date & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                    Shoot Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                    <input
                      type="date"
                      value={editForm.shoot_date}
                      onChange={(e) => setEditForm({ ...editForm, shoot_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                    Assigned Staff (Worker Email)
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                    <select
                      value={editForm.assigned_worker}
                      onChange={(e) => setEditForm({ ...editForm, assigned_worker: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                    >
                      <option value="" className="bg-white">Unassigned</option>
                      {workersList.map((w) => (
                        <option key={w.email} value={w.email} className="bg-white">
                          {w.full_name ? `${w.full_name} (${w.email})` : w.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Notes & Requirements</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] resize-none"
                  placeholder="Enter shoot notes…"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ DELETE CONFIRMATION MODAL ════════ */}
      {deleteConfirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteConfirmJob(null)}
                className="p-1 rounded-full text-[#9CA0A6] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111111]">Delete Shoot Record</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#111111]">{deleteConfirmJob.title}</strong>? This shoot record will be permanently deleted and will not reappear on refresh.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmJob(null)}
                className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmJob)}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
