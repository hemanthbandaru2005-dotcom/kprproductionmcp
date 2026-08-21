import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import { Briefcase, User, Clock, RefreshCw, UserCheck } from 'lucide-react';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/15', text: 'text-blue-600', dot: 'bg-blue-500' },
  review:      { label: 'Review',      bg: 'bg-amber-500/15', text: 'text-amber-600', dot: 'bg-amber-500' },
  completed:   { label: 'Completed',   bg: 'bg-emerald-500/15', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function JobStatusTable() {
  const [jobs, setJobs] = useState([]);
  const [workersMap, setWorkersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchWorkersAndJobs = async () => {
    // 1. Build workers lookup map
    const wMap = {};

    // Defaults from WORKER_MEMBERS
    if (Array.isArray(WORKER_MEMBERS)) {
      WORKER_MEMBERS.forEach(w => {
        if (w.id) wMap[w.id] = w;
        if (w.email) wMap[w.email.toLowerCase()] = w;
      });
    }

    // Local registered workers
    try {
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(w => {
            if (w && w.id) wMap[w.id] = w;
            if (w && w.email) wMap[w.email.toLowerCase()] = w;
          });
        }
      }
    } catch (e) {}

    // Supabase profiles
    try {
      const { data: wData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'worker');

      if (wData && wData.length > 0) {
        wData.forEach(w => {
          if (w.id) wMap[w.id] = w;
          if (w.email) wMap[w.email.toLowerCase()] = w;
        });
      }
    } catch (e) {}

    setWorkersMap(wMap);

    // 2. Fetch Jobs
    const jobsDict = new Map();

    // From LocalStorage cache
    try {
      const rawJobs = localStorage.getItem('kpr_admin_jobs_v1');
      if (rawJobs) {
        const parsed = JSON.parse(rawJobs);
        if (Array.isArray(parsed)) {
          parsed.forEach(j => {
            if (j && j.id) jobsDict.set(j.id, j);
          });
        }
      }
    } catch (e) {}

    // From Supabase
    try {
      const { data: sJobs, error } = await supabase
        .from('jobs')
        .select('*, worker:assigned_worker(email, full_name)')
        .order('updated_at', { ascending: false });

      if (!error && sJobs && sJobs.length > 0) {
        sJobs.forEach(j => {
          jobsDict.set(j.id, j);
        });
      }
    } catch (e) {}

    setJobs(Array.from(jobsDict.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkersAndJobs();

    // Realtime subscription & custom event listener
    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchWorkersAndJobs();
      })
      .subscribe();

    const handleJobsUpdated = () => {
      fetchWorkersAndJobs();
    };
    window.addEventListener('kpr_jobs_updated', handleJobsUpdated);
    window.addEventListener('kpr_registered_workers_updated', handleJobsUpdated);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('kpr_jobs_updated', handleJobsUpdated);
      window.removeEventListener('kpr_registered_workers_updated', handleJobsUpdated);
    };
  }, []);

  const resolveWorkerName = (job) => {
    if (job.assigned_worker && job.assigned_worker.includes('@')) return job.assigned_worker;
    if (job.worker?.email) return job.worker.email;
    if (job.assigned_worker_name && job.assigned_worker_name.includes('@')) return job.assigned_worker_name;

    const assigned = job.assigned_worker;
    if (!assigned) return 'Unassigned';

    const match = workersMap[assigned] || workersMap[assigned.toLowerCase()];
    if (match?.email) return match.email;
    if (match?.full_name) return match.full_name;

    if (assigned.startsWith('worker-')) {
      const namePart = assigned.replace('worker-', '');
      return `${namePart}@kpr.com`;
    }

    return assigned;
  };

  if (loading) {
    return (
      <div className="bg-[#1E2433] rounded-xl p-8 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-[#C5A880] animate-spin" />
        <span className="ml-3 text-sm text-white/50">Loading jobs…</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-[#1E2433] rounded-xl p-12 text-center border border-white/5">
        <Briefcase className="w-12 h-12 text-white/15 mx-auto mb-4" />
        <h4 className="text-lg text-white/70 font-medium">No Jobs Yet</h4>
        <p className="text-xs text-white/40 mt-1">Click "Create Job" above to add your first photoshoot.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E2433] rounded-xl border border-white/5 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Live Job Status</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Worker</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider w-48">Progress</th>
              <th className="px-6 py-3 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Updated</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.in_progress;
              const workerName = resolveWorkerName(job);
              const isAssigned = workerName && workerName !== 'Unassigned' && workerName !== '—';

              return (
                <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C5A880]/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-[#C5A880]" />
                      </div>
                      <div>
                        <p className="text-sm text-white/90 font-medium">{job.title}</p>
                        <p className="text-[10px] text-white/40 capitalize">{job.shoot_type?.replace('_', ' ') || 'Photoshoot'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAssigned ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
                        {isAssigned ? <UserCheck className="w-3.5 h-3.5" /> : <User className="w-3 h-3" />}
                      </div>
                      <span className={`text-sm font-medium ${isAssigned ? 'text-white/90' : 'text-white/40 italic'}`}>
                        {workerName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${job.progress_percent || 0}%`,
                            backgroundColor: job.status === 'completed' ? '#10B981' : job.status === 'review' ? '#F59E0B' : '#3B82F6',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-white/50 font-mono w-8 text-right">{job.progress_percent || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px]">{timeAgo(job.updated_at)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
