import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import { X, UserCheck, Loader2, Briefcase } from 'lucide-react';

export default function AssignWorkerModal({ isOpen, onClose }) {
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      // 1. Load jobs
      const jobsMap = new Map();
      try {
        const raw = localStorage.getItem('kpr_admin_jobs_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(j => jobsMap.set(j.id, j));
          }
        }
      } catch (e) {}

      try {
        const { data } = await supabase
          .from('jobs')
          .select('id, title, assigned_worker')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          data.forEach(j => {
            if (!jobsMap.has(j.id)) jobsMap.set(j.id, j);
          });
        }
      } catch (e) {}
      setJobs(Array.from(jobsMap.values()));

      // 2. Load all real workers
      const workersMap = new Map();

      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(w => {
              if (w && w.email && !w.email.includes('example.com')) {
                workersMap.set(w.email.toLowerCase(), { id: w.id || `worker-${w.email.split('@')[0]}`, email: w.email.toLowerCase() });
              }
            });
          }
        }
      } catch (e) {}

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('role', 'worker');

        if (data && data.length > 0) {
          data.forEach(w => {
            if (w.email && !w.email.includes('example.com')) {
              workersMap.set(w.email.toLowerCase(), { id: w.id, email: w.email.toLowerCase() });
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

    // 1. Update local storage cache
    try {
      const raw = localStorage.getItem('kpr_admin_jobs_v1');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map(j => j.id === selectedJob ? {
          ...j,
          assigned_worker: workerEmail,
          assigned_worker_name: workerEmail,
          updated_at: new Date().toISOString()
        } : j);
        localStorage.setItem('kpr_admin_jobs_v1', JSON.stringify(updated));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kpr_jobs_updated', { detail: { id: selectedJob, assigned_worker: workerEmail } }));
      }
    } catch (e) {}

    // 2. Update Supabase
    try {
      await supabase
        .from('jobs')
        .update({ assigned_worker: workerEmail, updated_at: new Date().toISOString() })
        .eq('id', selectedJob);
    } catch (err) {
      console.warn('Supabase job assign update notice:', err);
    }

    setLoading(false);
    setSelectedJob('');
    setSelectedWorker('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#1A1F2E] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Assign Worker</h3>
              <p className="text-[10px] text-white/40">Link a worker to a job</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Select Job */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Select Job *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <select
                required
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C5A880]/50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1A1F2E]">Choose a job…</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id} className="bg-[#1A1F2E]">
                    {job.title} {job.assigned_worker ? `(${job.assigned_worker})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Worker */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Select Worker (Mail ID) *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <select
                required
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C5A880]/50 appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1A1F2E]">Choose worker Mail ID…</option>
                {workers.map((w) => (
                  <option key={w.email} value={w.email} className="bg-[#1A1F2E]">
                    {w.email}
                  </option>
                ))}
              </select>
            </div>

            {workers.length === 0 && (
              <p className="text-[10px] text-amber-400 mt-2">
                No workers found. Create worker accounts first and set their role to "worker".
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedJob || !selectedWorker}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Assign Worker
          </button>
        </form>
      </div>
    </div>
  );
}
