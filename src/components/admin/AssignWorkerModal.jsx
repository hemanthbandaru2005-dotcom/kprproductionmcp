import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import { fetchJobs, updateJob } from '../../utils/jobsService';
import { X, UserCheck, Loader2, Briefcase } from 'lucide-react';

export default function AssignWorkerModal({ isOpen, onClose, onWorkerAssigned }) {
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      // 1. Load jobs via jobsService
      const allJobs = await fetchJobs();
      setJobs(allJobs);

      // 2. Load all real workers
      const workersMap = new Map();

      try {
        const rawReg = localStorage.getItem('kpr_registered_workers_v1');
        if (rawReg) {
          const parsed = JSON.parse(rawReg);
          if (Array.isArray(parsed)) {
            parsed.forEach(w => {
              if (w && w.email && !w.email.includes('example.com')) {
                workersMap.set(w.email.toLowerCase(), { id: w.id || `worker-${w.email.split('@')[0]}`, email: w.email.toLowerCase(), full_name: w.full_name || w.name });
              }
            });
          }
        }
      } catch (e) {}

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('role', 'worker');

        if (data && data.length > 0) {
          data.forEach(w => {
            if (w.email && !w.email.includes('example.com')) {
              workersMap.set(w.email.toLowerCase(), { id: w.id, email: w.email.toLowerCase(), full_name: w.full_name });
            }
          });
        }
      } catch (e) {}

      setWorkers(Array.from(workersMap.values()));
    }

    loadData();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob || !selectedWorker) return;

    setLoading(true);

    const workerEmail = selectedWorker.trim().toLowerCase();

    // Update job via jobsService (syncs across backend API, Supabase, and broadcast channels)
    await updateJob(selectedJob, {
      assigned_worker: workerEmail,
      assigned_worker_name: workerEmail
    });

    setLoading(false);
    if (onWorkerAssigned) onWorkerAssigned();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#E7E8EB] overflow-hidden max-h-[90vh] flex flex-col text-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">Assign Staff</h3>
              <p className="text-[11px] text-[#6B7280]">Link a team member to an active photoshoot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Select Job */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Select Job *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <select
                required
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
              >
                <option value="" className="bg-white">Choose a job…</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id} className="bg-white">
                    {job.title} {job.assigned_worker ? `(${job.assigned_worker})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Worker */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Select Staff Member (Mail ID) *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <select
                required
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
              >
                <option value="" className="bg-white">Choose staff mail ID…</option>
                {workers.map((w) => (
                  <option key={w.email} value={w.email} className="bg-white">
                    {w.full_name ? `${w.full_name} (${w.email})` : w.email}
                  </option>
                ))}
              </select>
            </div>

            {workers.length === 0 && (
              <p className="text-[11px] text-[#D97706] mt-2">
                No workers found. Add staff accounts in the Workers tab first.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedJob || !selectedWorker}
            className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Confirm Assignment</span>
          </button>
        </form>
      </div>
    </div>
  );
}
