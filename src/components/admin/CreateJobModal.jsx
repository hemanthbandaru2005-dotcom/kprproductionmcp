import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import { X, Plus, Calendar, User, FileText, Camera, Loader2, UserCheck } from 'lucide-react';

function broadcastJob(detail) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('kpr_jobs_bc_v1');
      bc.postMessage({ detail, timestamp: Date.now() });
      setTimeout(() => bc.close(), 200);
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_jobs_updated', { detail }));
    }
  } catch (e) {}
}

export default function CreateJobModal({ isOpen, onClose }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    client_name: '',
    shoot_type: '',
    shoot_date: '',
    assigned_worker: '',
    notes: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    async function loadAllWorkers() {
      const map = new Map();

      // 1. Local registered workers
      try {
        const raw = localStorage.getItem('kpr_registered_workers_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(w => {
              if (w && w.email && !w.email.includes('example.com')) {
                map.set(w.email.toLowerCase(), { id: w.id || `worker-${w.email.split('@')[0]}`, email: w.email.toLowerCase(), full_name: w.full_name });
              }
            });
          }
        }
      } catch (e) {}

      // 2. Supabase profiles
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('role', 'worker');

        if (data && data.length > 0) {
          data.forEach(w => {
            if (w.email && !w.email.includes('example.com')) {
              map.set(w.email.toLowerCase(), { id: w.id, email: w.email.toLowerCase(), full_name: w.full_name });
            }
          });
        }
      } catch (e) {}

      setWorkers(Array.from(map.values()));
    }

    loadAllWorkers();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);

    const workerEmail = (form.assigned_worker || '').trim().toLowerCase() || null;
    const shootDateVal = form.shoot_date || null;

    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: form.title.trim(),
      client_name: form.client_name.trim() || null,
      shoot_type: form.shoot_type.trim() || 'Photoshoot',
      shoot_date: shootDateVal,
      date: shootDateVal,
      due_date: shootDateVal,
      assigned_worker: workerEmail,
      assigned_worker_name: workerEmail,
      notes: form.notes.trim() || null,
      status: 'in_progress',
      progress_percent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Save locally for instant reactivity
    try {
      const raw = localStorage.getItem('kpr_admin_jobs_v1');
      const list = raw ? JSON.parse(raw) : [];
      localStorage.setItem('kpr_admin_jobs_v1', JSON.stringify([newJob, ...list]));
    } catch (e) {}

    // 2. Insert to Supabase jobs table
    try {
      await supabase.from('jobs').insert([{
        title: newJob.title,
        client_name: newJob.client_name,
        shoot_type: newJob.shoot_type,
        shoot_date: newJob.shoot_date,
        date: newJob.date,
        assigned_worker: workerEmail,
        assigned_worker_name: workerEmail,
        notes: newJob.notes,
        status: 'in_progress',
        progress_percent: 0,
      }]);
    } catch (e) {}

    broadcastJob(newJob);

    setLoading(false);
    onClose();
    setForm({
      title: '',
      client_name: '',
      shoot_type: '',
      shoot_date: '',
      assigned_worker: '',
      notes: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#E7E8EB] overflow-hidden max-h-[90vh] flex flex-col text-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E7E8EB] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider">Create New Job</h3>
              <p className="text-[11px] text-[#6B7280]">New photoshoot assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
              Job Title *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Enter job / photoshoot title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
              />
            </div>
          </div>

          {/* Client + Shoot Type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Client Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter client name"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
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
                  placeholder="Wedding, Event, Haldi…"
                  value={form.shoot_type}
                  onChange={(e) => setForm({ ...form, shoot_type: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>
          </div>

          {/* Date + Worker row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Shoot Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={form.shoot_date}
                  onChange={(e) => setForm({ ...form, shoot_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Assign Staff (Mail ID)</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
                <select
                  value={form.assigned_worker}
                  onChange={(e) => setForm({ ...form, assigned_worker: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                >
                  <option value="" className="bg-white text-[#111111]">Unassigned</option>
                  {workers.map((w) => (
                    <option key={w.email} value={w.email} className="bg-white text-[#111111]">
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
              placeholder="Additional details and shoot instructions…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full p-3.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl text-xs sm:text-sm text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.title}
            className="w-full py-3 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Create Shoot Task</span>
          </button>
        </form>
      </div>
    </div>
  );
}
