import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddWorkerModal from './AddWorkerModal';
import { UserCheck, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Key, Trash2, AlertTriangle, X } from 'lucide-react';

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmWorker, setDeleteConfirmWorker] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkers = async () => {
    const workerMap = new Map();

    // 1. Supabase Profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(w => {
          if (w.email) {
            workerMap.set(w.email.toLowerCase(), w);
          }
        });
      }
    } catch (e) {}

    // 2. Local Registered Workers
    try {
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(w => {
            if (w && w.email && !workerMap.has(w.email.toLowerCase())) {
              workerMap.set(w.email.toLowerCase(), w);
            }
          });
        }
      }
    } catch (e) {}

    setWorkers(Array.from(workerMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();

    const channel = supabase
      .channel('workers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchWorkers();
      })
      .subscribe();

    const handleLocalWorkerUpdated = () => {
      fetchWorkers();
    };
    window.addEventListener('kpr_registered_workers_updated', handleLocalWorkerUpdated);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('kpr_registered_workers_updated', handleLocalWorkerUpdated);
    };
  }, []);

  const toggleWorkerStatus = async (workerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    // Optimistic UI update
    setWorkers(workers.map(w => w.id === workerId ? { ...w, status: newStatus } : w));

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', workerId);

    if (error) {
      console.error('Error toggling worker status:', error.message);
      fetchWorkers(); // Revert on failure
    }
  };

  const handleDeleteWorker = async (worker) => {
    if (!worker) return;
    setDeleting(true);

    // 1. Optimistic removal from UI state
    setWorkers(prev => prev.filter(w => w.id !== worker.id && w.email.toLowerCase() !== worker.email.toLowerCase()));

    // 2. Remove from LocalStorage
    try {
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.filter(w => w.id !== worker.id && w.email.toLowerCase() !== worker.email.toLowerCase());
        localStorage.setItem('kpr_registered_workers_v1', JSON.stringify(updated));
      }
    } catch (e) {}

    // 3. Remove from Supabase profiles
    try {
      await supabase.from('profiles').delete().eq('id', worker.id);
      await supabase.from('profiles').delete().eq('email', worker.email);
    } catch (err) {
      console.warn('Supabase profile worker deletion notice:', err);
    }

    setDeleting(false);
    setDeleteConfirmWorker(null);
  };

  const filteredWorkers = workers.filter(w => 
    (w.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.real_email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search workers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1E2433] border border-white/5 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Worker</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E2433] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Staff & Crew Directory</h3>
              <p className="text-[10px] text-white/40">{workers.length} registered team members</p>
            </div>
          </div>
          <button
            onClick={fetchWorkers}
            className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
            <p className="text-xs">Loading team directory…</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            <UserCheck className="w-10 h-10 mx-auto mb-3 text-white/10" />
            <p className="text-sm text-white/60 font-medium">No Workers Found</p>
            <p className="text-xs text-white/30 mt-1">Click "Add Worker" above to provision a team account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="px-6 py-3">Worker Name</th>
                  <th className="px-6 py-3">Login ID</th>
                  <th className="px-6 py-3">Contact Email</th>
                  <th className="px-6 py-3">Date Added</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => {
                  const isActive = worker.status !== 'disabled';
                  return (
                    <tr key={worker.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      {/* Name & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-400 font-bold flex items-center justify-center text-xs">
                            {(worker.full_name || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/90">{worker.full_name || 'Unnamed Worker'}</p>
                            {worker.phone && (
                              <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{worker.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Login ID */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs font-semibold">
                          <Key className="w-3.5 h-3.5" />
                          <span>{worker.email}</span>
                        </div>
                      </td>

                      {/* Real Contact Email */}
                      <td className="px-6 py-4">
                        {worker.real_email ? (
                          <div className="flex items-center gap-1.5 text-xs text-white/70">
                            <Mail className="w-3.5 h-3.5 text-white/30" />
                            <span>{worker.real_email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-white/20 italic">Not set</span>
                        )}
                      </td>

                      {/* Date Added */}
                      <td className="px-6 py-4 text-xs text-white/50">
                        {worker.created_at ? new Date(worker.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
                            <ShieldCheck className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/15 text-red-400">
                            <ShieldAlert className="w-3 h-3" />
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleWorkerStatus(worker.id, worker.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                              isActive ? 'bg-emerald-500' : 'bg-white/10'
                            }`}
                            title={isActive ? 'Click to disable worker access' : 'Click to enable worker access'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmWorker(worker)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20"
                            title="Delete Worker Account"
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
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmWorker(null)} />
          <div className="relative w-full max-w-md bg-[#1A1F2E] rounded-2xl shadow-2xl border border-rose-500/30 overflow-hidden p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Worker Account?</h4>
                <p className="text-xs text-white/50">This action will remove the team member from your studio roster.</p>
              </div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs space-y-1">
              <p className="font-semibold text-white">{deleteConfirmWorker.full_name || 'Worker'}</p>
              <p className="text-white/60 font-mono">{deleteConfirmWorker.email}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmWorker(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWorker(deleteConfirmWorker)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-lg flex items-center gap-2"
                disabled={deleting}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting…' : 'Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWorkerAdded={fetchWorkers}
      />
    </div>
  );
}
