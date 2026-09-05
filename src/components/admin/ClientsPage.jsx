import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AddClientModal from './AddClientModal';
import { Users, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Trash2, AlertTriangle, X, Eye, EyeOff, Copy, CheckCircle, Key, Sparkles, MessageSquare, Loader2, Check } from 'lucide-react';

const DELETED_CLIENTS_KEY = 'kpr_deleted_clients_v1';

function getDeletedClientEmails() {
  try {
    const raw = localStorage.getItem(DELETED_CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export default function ClientsPage() {
  const { profile, resetAccountTempPassword } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Reset Password State
  const [resetModalClient, setResetModalClient] = useState(null);
  const [resetTempPw, setResetTempPw] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccessCreds, setResetSuccessCreds] = useState(null);
  const [resetCopied, setResetCopied] = useState(false);

  const isMasterAdmin = profile?.role === 'superadmin' || profile?.username === 'master';

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenResetModal = (client) => {
    setResetModalClient(client);
    setResetTempPw(generateRandomPassword());
    setResetError('');
    setResetSuccessCreds(null);
    setResetCopied(false);
  };

  const handleExecutePasswordReset = async (e) => {
    if (e) e.preventDefault();
    if (!resetModalClient) return;
    const cleanPw = resetTempPw.trim();
    if (!cleanPw || cleanPw.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await resetAccountTempPassword(resetModalClient, cleanPw);
      if (!res.success) {
        setResetError(res.error || 'Failed to reset client password.');
        setResetLoading(false);
        return;
      }

      // Update local client state in table
      setClients(prev => prev.map(c => {
        if (c.id === resetModalClient.id || (c.email && c.email.toLowerCase() === resetModalClient.email?.toLowerCase())) {
          return {
            ...c,
            temp_password: cleanPw,
            is_temp_password: true,
            first_login_at: null
          };
        }
        return c;
      }));

      setResetSuccessCreds({
        name: resetModalClient.full_name || resetModalClient.email,
        email: resetModalClient.email,
        password: cleanPw,
        phone: resetModalClient.phone
      });
    } catch (err) {
      setResetError(err.message || 'An error occurred while resetting client password.');
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

  const fetchClients = async () => {
    const deletedEmails = getDeletedClientEmails();
    const clientMap = new Map();

    // 1. Supabase verifications cloud registry
    try {
      const { data: vData, error: vErr } = await supabase
        .from('verifications')
        .select('*')
        .eq('album_id', 'SYSTEM_CLIENT_REGISTRY')
        .order('sent_at', { ascending: false });

      if (!vErr && Array.isArray(vData)) {
        vData.forEach(item => {
          const email = (item.client_email || '').toLowerCase().trim();
          const meta = Array.isArray(item.photo_items) && item.photo_items[0] ? item.photo_items[0] : {};
          if (email && !deletedEmails.includes(email) && !email.includes('example.com')) {
            clientMap.set(email, {
              id: item.id || `client-${email.split('@')[0]}`,
              client_id: item.client_id,
              full_name: meta.full_name || item.client_name,
              email: email,
              phone: meta.phone || item.client_note || 'N/A',
              role: 'client',
              status: item.status || 'active',
              temp_password: meta.temp_password || null,
              is_temp_password: meta.is_temp_password || false,
              first_login_at: meta.first_login_at || null,
              created_at: item.sent_at || item.created_at
            });
          }
        });
      }
    } catch (e) {}

    // 2. Supabase Profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach(c => {
          const email = (c.email || '').toLowerCase().trim();
          if (email && !deletedEmails.includes(email) && !email.includes('example.com')) {
            const existing = clientMap.get(email) || {};
            clientMap.set(email, {
              ...existing,
              ...c,
              email,
              temp_password: c.temp_password || existing.temp_password || null,
              first_login_at: c.first_login_at || existing.first_login_at || null,
            });
          }
        });
      }
    } catch (e) {}

    // 3. Local Registered Clients
    try {
      const raw = localStorage.getItem('kpr_registered_clients_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            const email = (c && c.email ? c.email : '').toLowerCase().trim();
            if (email && !deletedEmails.includes(email) && !email.includes('example.com')) {
              if (!clientMap.has(email)) {
                clientMap.set(email, c);
              }
            }
          });
        }
      }
    } catch (e) {}

    // 4. Fallback default Nani only if NOT deleted by user
    if (!deletedEmails.includes('nani@gmail.com') && !deletedEmails.includes('nani@gamil.com')) {
      if (!clientMap.has('nani@gmail.com') && !clientMap.has('nani@gamil.com')) {
        clientMap.set('nani@gmail.com', {
          id: 'client-nani',
          full_name: 'Nani',
          email: 'nani@gmail.com',
          phone: 'N/A',
          role: 'client',
          status: 'active',
          temp_password: '123456',
          is_temp_password: true,
          first_login_at: null,
          created_at: new Date().toISOString()
        });
      }
    }

    setClients(Array.from(clientMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();

    const channelId = `clients-realtime-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    let channel = null;
    try {
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchClients();
        })
        .subscribe();
    } catch (e) {}

    const handleLocalClientUpdated = () => {
      fetchClients();
    };
    window.addEventListener('kpr_registered_clients_updated', handleLocalClientUpdated);

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
      window.removeEventListener('kpr_registered_clients_updated', handleLocalClientUpdated);
    };
  }, []);

  const toggleClientStatus = async (clientId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    // Optimistic UI update
    setClients(clients.map(c => c.id === clientId ? { ...c, status: newStatus } : c));

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', clientId);

    if (error) {
      console.error('Error toggling client status:', error.message);
      fetchClients();
    }
  };

  const handleDeleteClient = async (client) => {
    if (!client) return;
    setDeleting(true);

    const emailToDelete = (client.email || '').toLowerCase().trim();

    // 1. Optimistic removal from UI state
    setClients(prev => prev.filter(c => c.id !== client.id && (c.email || '').toLowerCase() !== emailToDelete));

    // 2. Add to permanent deleted tracking
    try {
      const deletedEmails = getDeletedClientEmails();
      if (emailToDelete && !deletedEmails.includes(emailToDelete)) {
        deletedEmails.push(emailToDelete);
        localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(deletedEmails));
      }

      // Remove from LocalStorage registered list
      const raw = localStorage.getItem('kpr_registered_clients_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter(c => (c.email || '').toLowerCase() !== emailToDelete);
        localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(filtered));
      }
    } catch (e) {}

    // 3. Remove from Supabase cloud database
    try {
      await supabase.from('verifications').delete().eq('album_id', 'SYSTEM_CLIENT_REGISTRY').eq('client_email', emailToDelete);
      if (client.id) {
        await supabase.from('verifications').delete().eq('album_id', 'SYSTEM_CLIENT_REGISTRY').eq('client_id', client.id);
      }
      await supabase.from('profiles').delete().eq('email', emailToDelete);
      if (client.id) {
        await supabase.from('profiles').delete().eq('id', client.id);
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kpr_registered_clients_updated', { detail: { deleted: emailToDelete } }));
    }

    setDeleting(false);
    setDeleteConfirmClient(null);
  };

  const filteredClients = clients.filter(c => 
    (c.full_name && c.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search clients by name or email…"
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
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#E7E8EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFE1EC] flex items-center justify-center text-[#FF4D94]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Client Accounts Directory</h3>
              <p className="text-[11px] text-[#9CA0A6]">{clients.length} registered clients</p>
            </div>
          </div>
          <button
            onClick={fetchClients}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#141414]" />
            <p className="text-xs">Loading clients…</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-[#9CA0A6]">
            <Users className="w-10 h-10 mx-auto mb-3 text-[#9CA0A6]" />
            <p className="text-sm text-[#111111] font-semibold">No Clients Found</p>
            <p className="text-xs text-[#9CA0A6] mt-1">Click "Add Client" above to provision a portal account.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E7E8EB] text-[10px] text-[#6B7280] uppercase tracking-wider bg-[#F7F8FA]">
                    <th className="px-6 py-3.5">Client Name</th>
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Allocated Password</th>
                    <th className="px-6 py-3.5">Date Added</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8EB]">
                  {filteredClients.map((client) => {
                    const isActive = client.status !== 'disabled';
                    const isRevealed = revealedPasswords[client.id];
                    const assignedPw = client.temp_password || '123456';

                    return (
                      <tr key={client.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                              {(client.full_name || client.email || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#111111]">{client.full_name || 'Unnamed Client'}</p>
                              <p className="text-[11px] text-[#9CA0A6] capitalize">{client.role || 'Client'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            <Mail className="w-3.5 h-3.5 text-[#9CA0A6]" />
                            <span>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-[11px] text-[#9CA0A6]">
                              <Phone className="w-3.5 h-3.5 text-[#9CA0A6]" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Allocated Password Column */}
                        <td className="px-6 py-4">
                          {isMasterAdmin ? (
                            <div className="inline-flex items-center gap-2 bg-[#F1F2F4] px-2.5 py-1 rounded-lg border border-[#E7E8EB]">
                              <span className="font-mono text-xs font-semibold text-[#111111]">
                                {isRevealed ? assignedPw : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(client.id)}
                                className="text-[#9CA0A6] hover:text-[#111111] transition-colors cursor-pointer"
                                title={isRevealed ? "Hide Password" : "Show Password"}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(client.id, assignedPw)}
                                className="text-[#9CA0A6] hover:text-[#FF4D94] transition-colors cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === client.id ? <CheckCircle className="w-3.5 h-3.5 text-[#13A52D]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F1F2F4] text-[#6B7280] border border-[#E7E8EB]" title="Client passwords are confidential to Master Admin">
                              Master Admin Only
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-[#6B7280]">
                          {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '—'}
                        </td>

                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DFF5E3] text-[#13A52D]">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FEF2F2] text-[#DC2626]">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {isMasterAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResetModal(client)}
                                className="p-1.5 text-[#9CA0A6] hover:text-[#FF4D94] hover:bg-[#FFE1EC]/60 rounded-full transition-colors cursor-pointer"
                                title="Reset Client Password (Anytime)"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 text-[#D1D5DB] rounded-full cursor-not-allowed opacity-40"
                                title="Client password management is restricted to Master Admin"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleClientStatus(client.id, client.status)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                                isActive ? 'bg-[#13A52D]' : 'bg-[#EEF0F2]'
                              }`}
                              title={isActive ? 'Click to disable access' : 'Click to enable access'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmClient(client)}
                              className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
                              title="Delete Client Account"
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
              {filteredClients.map((client) => {
                const isActive = client.status !== 'disabled';
                const isRevealed = revealedPasswords[client.id];
                const assignedPw = client.temp_password || '123456';

                return (
                  <div key={client.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#141414] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {(client.full_name || client.email || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#111111]">{client.full_name || 'Unnamed Client'}</h4>
                          <p className="text-[11px] text-[#1E74FF]">{client.email}</p>
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
                            onClick={() => togglePasswordVisibility(client.id)}
                            className="text-[#9CA0A6] hover:text-[#111111] cursor-pointer"
                            title={isRevealed ? "Hide Password" : "Show Password"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(client.id, assignedPw)}
                            className="text-[#9CA0A6] hover:text-[#FF4D94] cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === client.id ? <CheckCircle className="w-3.5 h-3.5 text-[#13A52D]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#F1F2F4] p-2 rounded-lg text-xs">
                        <span className="text-[#6B7280] font-medium">Password Access:</span>
                        <span className="text-[10px] text-[#9CA0A6] font-semibold">Master Admin Only</span>
                      </div>
                    )}

                    {client.phone && client.phone !== 'N/A' && (
                      <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#9CA0A6]" />
                        <span>{client.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#E7E8EB]">
                      <span className="text-[11px] text-[#9CA0A6]">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(client)}
                            className="px-2.5 py-1 bg-[#F1F2F4] hover:bg-[#FFE1EC] text-[#FF4D94] text-[10px] font-bold uppercase rounded-full flex items-center gap-1 cursor-pointer"
                          >
                            <Key className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleClientStatus(client.id, client.status)}
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
                          onClick={() => setDeleteConfirmClient(client)}
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

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={fetchClients}
      />

      {/* Reset Password Modal (Master Admin Only) */}
      {resetModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-[#111111]">
          <div className="bg-white border border-[#E7E8EB] rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E7E8EB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFE1EC] flex items-center justify-center text-[#FF4D94] shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Reset Client Password</h3>
                  <p className="text-xs text-[#6B7280]">Generates a new temporary portal login password</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalClient(null)}
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
                    <p className="text-[11px] text-[#6B7280]">This temporary password is ready to share with the client.</p>
                  </div>
                </div>

                <div className="bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Client:</span>
                    <strong className="text-[#111111]">{resetSuccessCreds.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Login Email:</span>
                    <span className="font-mono font-bold text-[#FF4D94]">{resetSuccessCreds.email}</span>
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
                      const text = `KPR Productions Client Portal Login\nName: ${resetSuccessCreds.name}\nEmail: ${resetSuccessCreds.email}\nNew Password: ${resetSuccessCreds.password}\nPortal URL: ${window.location.origin}`;
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
                      `*KPR Photography Studio - Client Portal Password Reset*\n\nHello ${resetSuccessCreds.name},\nYour album proofing portal password has been reset:\n\n*Email:* ${resetSuccessCreds.email}\n*New Temporary Password:* ${resetSuccessCreds.password}\n*Portal URL:* ${window.location.origin}\n\nPlease use these credentials to sign in and view your photos.`
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
                    onClick={() => setResetModalClient(null)}
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
                    <span className="text-[#6B7280]">Client Name:</span>
                    <strong className="text-[#111111]">{resetModalClient.full_name || resetModalClient.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Email:</span>
                    <span className="font-mono text-[#FF4D94] font-semibold">{resetModalClient.email}</span>
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
                      className="text-[11px] text-[#FF4D94] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
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
                    This password will remain visible to Master Admin until the client logs in again.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E8EB]">
                  <button
                    type="button"
                    onClick={() => setResetModalClient(null)}
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
      {deleteConfirmClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteConfirmClient(null)}
                className="p-1 rounded-full text-[#9CA0A6] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111111]">Delete Client Account</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[#111111]">{deleteConfirmClient.full_name || deleteConfirmClient.email}</strong>? This client account will be deleted permanently and will not reappear on refresh.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmClient(null)}
                className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirmClient)}
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
