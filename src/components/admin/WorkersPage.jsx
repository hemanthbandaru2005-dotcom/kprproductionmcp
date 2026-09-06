import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AddWorkerModal from './AddWorkerModal';
import { UserCheck, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Key, Trash2, AlertTriangle, X, Eye, EyeOff, Copy, CheckCircle, Sparkles, MessageSquare, Loader2, Check } from 'lucide-react';

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
  const { profile, resetAccountTempPassword } = useAuth();
  const isMasterAdmin = profile?.role === 'superadmin' || profile?.username === 'master';
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmWorker, setDeleteConfirmWorker] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Reset Password State
  const [resetModalWorker, setResetModalWorker] = useState(null);
  const [resetTempPw, setResetTempPw] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessCreds, setResetSuccessCreds] = useState(null);
  const [resetCopied, setResetCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenResetModal = (worker) => {
    setResetModalWorker(worker);
    setResetTempPw(generateRandomPassword());
    setResetError('');
    setResetSuccessCreds(null);
    setResetCopied(false);
  };

  const handleExecutePasswordReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetModalWorker) return;
    const cleanPw = resetTempPw.trim();
    if (!cleanPw || cleanPw.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await resetAccountTempPassword(resetModalWorker, cleanPw);
      if (!res.success) {
        setResetError(res.error || 'Failed to reset password.');
        setResetLoading(false);
        return;
      }

      // Update local state in table
      setWorkers(prev => prev.map(w => {
        if (w.id === resetModalWorker.id || (w.email && w.email.toLowerCase() === resetModalWorker.email?.toLowerCase())) {
          return {
            ...w,
            temp_password: cleanPw,
            is_temp_password: true,
            first_login_at: null
          };
        }
        return w;
      }));

      setResetSuccessCreds({
        name: resetModalWorker.full_name || resetModalWorker.email,
        email: resetModalWorker.email,
        password: cleanPw,
        phone: resetModalWorker.phone
      });
    } catch (err) {
      setResetError(err.message || 'An error occurred while resetting password.');
    } finally {
      setResetLoading(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyPassword = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchWorkers = async () => {
    const deletedEmails = getDeletedWorkerEmails();
    const workerMap = new Map();

    // 1. Supabase verifications cloud registry
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
              temp_password: meta.temp_password || null,
              is_temp_password: meta.is_temp_password || false,
              first_login_at: meta.first_login_at || null,
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
          if (email && !deletedEmails.includes(email)) {
            const existing = workerMap.get(email) || {};
            workerMap.set(email, {
              ...existing,
              ...w,
              email,
              temp_password: w.temp_password || existing.temp_password || null,
              first_login_at: w.first_login_at || existing.first_login_at || null,
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
            }
          });
        }
      }
    } catch (e) {}

    // 4. Fallback default Nihal only if NOT deleted by admin
    if (!deletedEmails.includes('nihal@kpr.com')) {
      if (!workerMap.has('nihal@kpr.com')) {
        workerMap.set('nihal@kpr.com', {
          id: 'worker-nihal',
          client_id: 'nihal',
          full_name: 'Nihal',
          email: 'nihal@kpr.com',
          phone: '+91 98765 43210',
          real_email: 'nihal@gmail.com',
          role: 'worker',
          status: 'active',
          temp_password: '123456',
          is_temp_password: true,
          first_login_at: null,
          skill: 'Photographer / Editor',
          created_at: new Date().toISOString()
        });
      }
    }

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
      fetchWorkers();
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
            placeholder="Search employees by name or ID…"
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
            <span>Add Employee</span>
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
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Active Employee Roster</h3>
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
            <p className="text-sm text-[#111111] font-semibold">No Employees Found</p>
            <p className="text-xs text-[#9CA0A6] mt-1">Click "Add Employee" above to provision a team account.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E7E8EB] text-[10px] text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                    <th className="px-6 py-3.5">Employee Name</th>
                    <th className="px-6 py-3.5">Login ID</th>
                    <th className="px-6 py-3.5">Contact Email</th>
                    <th className="px-6 py-3.5">Allocated Password</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8EB]">
                  {filteredWorkers.map((worker) => {
                    const isActive = worker.status !== 'disabled';
                    const isRevealed = revealedPasswords[worker.id];
                    const assignedPw = worker.temp_password || worker.password || '123456';

                    return (
                      <tr key={worker.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                              {(worker.full_name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111111]">{worker.full_name || 'Unnamed Employee'}</p>
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

                        {/* Allocated Password */}
                        <td className="px-6 py-4">
                          {isMasterAdmin ? (
                            <div className="inline-flex items-center gap-2 bg-[#F1F2F4] px-2.5 py-1 rounded-lg border border-[#E7E8EB]">
                              <span className="font-mono text-xs font-semibold text-[#111111]">
                                {isRevealed ? assignedPw : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(worker.id)}
                                className="text-[#9CA0A6] hover:text-[#111111] transition-colors cursor-pointer"
                                title={isRevealed ? "Hide Password" : "Show Password"}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(worker.id, assignedPw)}
                                className="text-[#9CA0A6] hover:text-[#1E74FF] transition-colors cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === worker.id ? <CheckCircle className="w-3.5 h-3.5 text-[#13A52D]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F1F2F4] text-[#6B7280] border border-[#E7E8EB]" title="Allocated passwords are only visible to Master Admin">
                              Master Admin Only
                            </span>
                          )}
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
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleOpenResetModal(worker)}
                              className="p-1.5 text-[#9CA0A6] hover:text-[#1E74FF] hover:bg-[#DCE9FF]/50 rounded-full transition-colors cursor-pointer"
                              title="Reset Password (Anytime)"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleWorkerStatus(worker.id, worker.status)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                                isActive ? 'bg-[#13A52D]' : 'bg-[#EEF0F2]'
                              }`}
                              title={isActive ? 'Click to disable employee access' : 'Click to enable employee access'}
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
                              title="Delete Employee Account"
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
                const isRevealed = revealedPasswords[worker.id];
                const assignedPw = worker.temp_password || worker.password || '123456';

                return (
                  <div key={worker.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {(worker.full_name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#111111]">{worker.full_name || 'Unnamed Employee'}</h4>
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

                    {isMasterAdmin ? (
                      <div className="flex items-center justify-between bg-[#F1F2F4] p-2 rounded-lg text-xs">
                        <span className="text-[#6B7280] font-medium">Password:</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs font-bold text-[#111111]">
                            {isRevealed ? assignedPw : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(worker.id)}
                            className="text-[#9CA0A6] hover:text-[#111111] cursor-pointer"
                            title={isRevealed ? "Hide Password" : "Show Password"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(worker.id, assignedPw)}
                            className="text-[#9CA0A6] hover:text-[#1E74FF] cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === worker.id ? <CheckCircle className="w-3.5 h-3.5 text-[#13A52D]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#F1F2F4] px-2.5 py-1.5 rounded-lg text-xs">
                        <span className="text-[#6B7280] font-medium">Password:</span>
                        <span className="text-[10px] font-semibold text-[#6B7280]">Master Admin Only</span>
                      </div>
                    )}

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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenResetModal(worker)}
                          className="px-2.5 py-1 bg-[#F1F2F4] hover:bg-[#DCE9FF] text-[#1E74FF] text-[10px] font-bold uppercase rounded-full flex items-center gap-1 cursor-pointer"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset</span>
                        </button>

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

      {/* Add Employee Modal */}
      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWorkerAdded={fetchWorkers}
      />

      {/* Reset Password Modal */}
      {resetModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-[#111111]">
          <div className="bg-white border border-[#E7E8EB] rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E7E8EB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DCE9FF] flex items-center justify-center text-[#1E74FF] shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Reset Employee Password</h3>
                  <p className="text-xs text-[#6B7280]">Generates a new temporary login password</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalWorker(null)}
                className="p-1.5 rounded-full text-[#9CA0A6] hover:text-[#111111] hover:bg-[#F1F2F4] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccessCreds ? (
              /* Success Creds Screen */
              <div className="space-y-4 pt-1">
                <div className="p-3.5 bg-[#DFF5E3] border border-[#BBF7D0] rounded-2xl flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-[#13A52D] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#13A52D]">Password Reset Successfully!</p>
                    <p className="text-[11px] text-[#6B7280]">This temporary password is ready to share.</p>
                  </div>
                </div>

                <div className="bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Employee:</span>
                    <strong className="text-[#111111]">{resetSuccessCreds.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Login ID:</span>
                    <span className="font-mono font-bold text-[#1E74FF]">{resetSuccessCreds.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E7E8EB]">
                    <span className="text-[#6B7280] font-semibold">New Temp Password:</span>
                    <span className="font-mono font-bold text-[#13A52D] bg-white px-2.5 py-0.5 rounded border border-[#E7E8EB]">
                      {resetSuccessCreds.password}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `KPR Productions Employee Login\nName: ${resetSuccessCreds.name}\nLogin ID: ${resetSuccessCreds.email}\nNew Password: ${resetSuccessCreds.password}\nPortal URL: ${window.location.origin}`;
                      navigator.clipboard.writeText(text);
                      setResetCopied(true);
                      setTimeout(() => setResetCopied(false), 2000);
                    }}
                    className="w-full sm:flex-1 py-2.5 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {resetCopied ? <CheckCircle className="w-4 h-4 text-[#13A52D]" /> : <Copy className="w-4 h-4" />}
                    <span>{resetCopied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `*KPR Productions - Employee Password Reset*\n\nHello ${resetSuccessCreds.name},\nYour employee portal login password has been reset:\n\n*Login ID:* ${resetSuccessCreds.email}\n*New Temporary Password:* ${resetSuccessCreds.password}\n*Portal:* ${window.location.origin}\n\nPlease use these credentials to sign in.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setResetModalWorker(null)}
                    className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold underline cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              /* Reset Form Screen */
              <form onSubmit={handleExecutePasswordReset} className="space-y-4 pt-1">
                {resetError && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Employee:</span>
                    <strong className="text-[#111111]">{resetModalWorker.full_name || resetModalWorker.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Login ID:</span>
                    <span className="font-mono text-[#1E74FF] font-semibold">{resetModalWorker.email}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      New Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetTempPw(generateRandomPassword())}
                      className="text-[11px] text-[#1E74FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={resetTempPw}
                    onChange={(e) => setResetTempPw(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs sm:text-sm text-[#111111] font-mono focus:outline-none focus:border-[#141414]"
                  />
                  <p className="text-[10px] text-[#9CA0A6] mt-1">
                    This password will remain visible in the table until the employee logs in again.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E8EB]">
                  <button
                    type="button"
                    onClick={() => setResetModalWorker(null)}
                    className="px-4 py-2.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetTempPw.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>{resetLoading ? 'Resetting…' : 'Confirm Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

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
              <h3 className="text-base font-bold text-[#111111]">Delete Employee Account</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[#111111]">{deleteConfirmWorker.full_name || deleteConfirmWorker.email}</strong>? This employee account will be deleted permanently and will not reappear on refresh.
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
