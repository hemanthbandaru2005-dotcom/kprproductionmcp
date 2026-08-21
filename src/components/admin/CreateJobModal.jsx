import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { WORKER_MEMBERS } from '../../context/AuthContext';
import { X, Plus, Calendar, User, FileText, Camera, Loader2, UserCheck } from 'lucide-react';

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
                map.set(w.email.toLowerCase(), { id: w.id || `worker-${w.email.split('@')[0]}`, email: w.email.toLowerCase() });
              }
            });
          }
        }
      } catch (e) {}

      // 2. Supabase profiles
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('role', 'worker');

        if (data && data.length > 0) {
          data.forEach(w => {
            if (w.email && !w.email.includes('example.com')) {
              map.set(w.email.toLowerCase(), { id: w.id, email: w.email.toLowerCase() });
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

    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: form.title.trim(),
      client_name: form.client_name.trim() || null,
      shoot_type: form.shoot_type.trim() || 'Photoshoot',
      shoot_date: form.shoot_date || null,
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kpr_jobs_updated', { detail: newJob }));
      }
    } catch (e) {}

    // 2. Insert to Supabase jobs table
    try {
      await supabase.from('jobs').insert([{
        title: newJob.title,
        client_name: newJob.client_name,
        shoot_type: newJob.shoot_type,
        shoot_date: newJob.shoot_date,
        assigned_worker: newJob.assigned_worker,
        notes: newJob.notes,
        status: newJob.status,
        progress_percent: newJob.progress_percent,
      }]);
    } catch (err) {
      console.warn('Supabase jobs insert notice:', err);
    }

    setLoading(false);
    setForm({ title: '', client_name: '', shoot_type: '', shoot_date: '', assigned_worker: '', notes: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#1A1F2E] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A880]/15 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#C5A880]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Job</h3>
              <p className="text-[10px] text-white/40">New photoshoot assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Job Title *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Sharma Wedding Reception"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
              />
            </div>
          </div>

          {/* Client + Shoot Type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Client Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Client name"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Shoot Type</label>
              <div className="relative">
                <Camera className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter shoot type (e.g. Wedding, Haldi, Modeling, Event)"
                  value={form.shoot_type}
                  onChange={(e) => setForm({ ...form, shoot_type: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
                />
              </div>
            </div>
          </div>

          {/* Date + Worker row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Shoot Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <input
                  type="date"
                  value={form.shoot_date}
                  onChange={(e) => setForm({ ...form, shoot_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C5A880]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Assign Worker (Mail ID)</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                <select
                  value={form.assigned_worker}
                  onChange={(e) => setForm({ ...form, assigned_worker: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#C5A880]/50 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1A1F2E]">Unassigned</option>
                  {workers.map((w) => (
                    <option key={w.email} value={w.email} className="bg-[#1A1F2E]">
                      {w.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              placeholder="Additional details…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.title}
            className="w-full py-3 bg-[#C5A880] hover:bg-[#A4865E] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Job
          </button>
        </form>
      </div>
    </div>
  );
}
