import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddWorkerModal from './AddWorkerModal';
import { UserCheck, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Key, Trash2, AlertTriangle, X } from 'lucide-react';

const DELETED_WORKERS_KEY = 'kpr_deleted_workers_v1';

function getDeletedWorkerEmails() {
  try {
    const raw = localStorage.getItem(DELETED_WORKERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmWorker, setDeleteConfirmWorker] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkers = async () => {
    const deletedEmails = getDeletedWorkerEmails();
    const workerMap = new Map();

    // 1. Supabase verifications cloud registry (Works across all laptops & devices)
    try {
      const { data: vData, error: vErr } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_WORKER_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!vErr && Array.isArray(vData)) {
        vData.forEach(item => {
          const email = (item.client_email || '').toLowerCase().trim();
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          if (email && !deletedEmails.includes(email)) {
            workerMap.set(email, {
              id: item.id || `worker-${item.client_id || email.split('@')[0]}`,
              client_id: item.client_id,
              full_name: meta.full_name || item.client_name,
              email: email,
              phone: meta.phone || item.client_note || 'N/A',
              real_email: meta.real_email || 'N/A',
              role: 'worker',
              status: item.status || 'active',
              skill: meta.skill || 'Photographer / Editor',
              created_at: item.sent_at || item.created_at
            });
          }
        });
      }
    } catch (e) {}

    // 2. Supabase Profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach(w => {
          const email = (w.email || '').toLowerCase().trim();
          if (email && !deletedEmails.includes(email) && !workerMap.has(email)) {
            workerMap.set(email, {
              ...w,
              email
            });
          }
        });
      }
    } catch (e) {}

    // 3. Local Registered Workers cache fallback
    try {
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(w => {
            const email = (w.email || '').toLowerCase().trim();
            if (email && !deletedEmails.includes(email) && !workerMap.has(email)) {
              workerMap.set(email, w);
              // Auto-sync local worker to Supabase cloud database so other laptops immediately see them
              const workerKey = (w.id || email.split('@')[0]).replace(/^worker-/, '');
              supabase.from('verifications').insert([{
                id: `worker_reg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                client_id: workerKey,
                client_name: w.full_name || 'Staff Worker',
                client_email: email,
                album_id: 'SYSTEM_WORKER_REGISTRY',
                event_id: `worker_profile_${workerKey}`,
                event_title: 'Studio Staff Worker',
                client_note: w.phone || 'N/A',
                status: w.status || 'active',
                sent_at: w.created_at || new Date().toISOString(),
                photo_items: [w]
              }]).then(() => {}).catch(() => {});
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

    const channelId = `workers-realtime-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let channel = null;
    try {
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchWorkers();
        })
        .subscribe();
    } catch (e) {}

    const handleLocalWorkerUpdated = () => {
      fetchWorkers();
    };
    window.addEventListener('kpr_registered_workers_updated', handleLocalWorkerUpdated);

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
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

    const emailToDelete = (worker.email || '').toLowerCase().trim();

    // 1. Optimistic removal from UI state
    setWorkers(prev => prev.filter(w => w.id !== worker.id && w.email.toLowerCase() !== emailToDelete));

    // 2. Add to permanent deleted tracking
    try {
      const deletedEmails = getDeletedWorkerEmails();
      if (emailToDelete && !deletedEmails.includes(emailToDelete)) {
        deletedEmails.push(emailToDelete);
        localStorage.setItem(DELETED_WORKERS_KEY, JSON.stringify(deletedEmails));
      }

      // Remove from LocalStorage registered list
      const raw = localStorage.getItem('kpr_registered_workers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter(w => (w.email || '').toLowerCase() !== emailToDelete);
        localStorage.setItem('kpr_registered_workers_v1', JSON.stringify(filtered));
      }
    } catch (e) {}

    // 3. Remove from Supabase cloud database
    try {
      await supabase.from('verifications').delete().eq('album_id', 'SYSTEM_WORKER_REGISTRY').eq('client_email', emailToDelete);
      if (worker.client_id) {
        await supabase.from('verifications').delete().eq('album_id', 'SYSTEM_WORKER_REGISTRY').eq('client_id', worker.client_id);
      }
      await supabase.from('profiles').delete().eq('email', emailToDelete);
      if (worker.id) {
        await supabase.from('profiles').delete().eq('id', worker.id);
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_registered_workers_updated', { detail: { deleted: emailToDelete } }));
    }

    setDeleting(false);
    setDeleteConfirmWorker(null);
  };

  const filteredWorkers = workers.filter(w => 
    (w.full_name && w.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (w.email && w.email.toLowerCase().includes(search.toLowerCase())) ||
    (w.real_email && w.real_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search workers by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Worker</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E7E8EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Active Staff Roster</h3>
              <p className="text-[11px] text-[#9CA0A6]">{workers.length} registered team members</p>
            </div>
          </div>
          <button
            onClick={fetchWorkers}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#141414]" />
            <p className="text-xs">Loading team directory…</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-12 text-center text-[#9CA0A6]">
            <UserCheck className="w-10 h-10 mx-auto mb-3 text-[#9CA0A6]" />
            <p className="text-sm text-[#111111] font-semibold">No Workers Found</p>
            <p className="text-xs text-[#9CA0A6] mt-1">Click "Add Worker" above to provision a team account.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E7E8EB] text-[10px] text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                    <th className="px-6 py-3.5">Worker Name</th>
                    <th className="px-6 py-3.5">Login ID</th>
                    <th className="px-6 py-3.5">Contact Email</th>
                    <th className="px-6 py-3.5">Date Added</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8EB]">
                  {filteredWorkers.map((worker) => {
                    const isActive = worker.status !== 'disabled';
                    return (
                      <tr key={worker.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                              {(worker.full_name || 'W').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111111]">{worker.full_name || 'Unnamed Worker'}</p>
                              {worker.phone && (
                                <p className="text-[11px] text-[#9CA0A6] flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  <span>{worker.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE9FF] text-[#1E74FF] font-mono text-xs font-semibold">
                            <Key className="w-3.5 h-3.5" />
                            <span>{worker.email}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {worker.real_email ? (
                            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                              <Mail className="w-3.5 h-3.5 text-[#9CA0A6]" />
                              <span>{worker.real_email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#9CA0A6] italic">Not set</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-[#6B7280]">
                          {worker.created_at ? new Date(worker.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </td>

                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D]">
                              <ShieldCheck className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#DC2626]">
                              <ShieldAlert className="w-3 h-3" />
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => toggleWorkerStatus(worker.id, worker.status)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                                isActive ? 'bg-[#13A52D]' : 'bg-[#EEF0F2]'
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
                              className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
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

            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-[#E7E8EB]">
              {filteredWorkers.map((worker) => {
                const isActive = worker.status !== 'disabled';
                return (
                  <div key={worker.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {(worker.full_name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#111111]">{worker.full_name || 'Unnamed Worker'}</h4>
                          <p className="text-[11px] text-[#1E74FF] font-mono">{worker.email}</p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#DFF5E3] text-[#13A52D]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#FEF2F2] text-[#DC2626]">
                          Disabled
                        </span>
                      )}
                    </div>

                    {worker.real_email && (
                      <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#9CA0A6]" />
                        <span>{worker.real_email}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#E7E8EB]">
                      <span className="text-[11px] text-[#9CA0A6]">
                        {worker.created_at ? new Date(worker.created_at).toLocaleDateString() : ''}
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleWorkerStatus(worker.id, worker.status)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            isActive ? 'bg-[#13A52D]' : 'bg-[#EEF0F2]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmWorker(worker)}
                          className="p-1 text-[#9CA0A6] hover:text-[#DC2626]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Worker Modal */}
      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWorkerAdded={fetchWorkers}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteConfirmWorker(null)}
                className="p-1 rounded-full text-[#9CA0A6] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111111]">Delete Worker Account</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[#111111]">{deleteConfirmWorker.full_name || deleteConfirmWorker.email}</strong>? This worker account will be deleted permanently and will not reappear on refresh.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmWorker(null)}
                className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorker(deleteConfirmWorker)}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider"
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
