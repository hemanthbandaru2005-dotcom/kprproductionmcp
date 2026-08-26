import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddClientModal from './AddClientModal';
import { Users, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Trash2, AlertTriangle, X } from 'lucide-react';

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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    const deletedEmails = getDeletedClientEmails();
    const clientMap = new Map();

    // 1. Supabase Profiles
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach(c => {
          if (c.email && !deletedEmails.includes(c.email.toLowerCase()) && !c.email.includes('example.com')) {
            clientMap.set(c.email.toLowerCase(), c);
          }
        });
      }
    } catch (e) {}

    // 2. Local Registered Clients
    try {
      const raw = localStorage.getItem('kpr_registered_clients_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            if (c && c.email && !deletedEmails.includes(c.email.toLowerCase()) && !c.email.includes('example.com')) {
              if (!clientMap.has(c.email.toLowerCase())) {
                clientMap.set(c.email.toLowerCase(), c);
              }
            }
          });
        }
      }
    } catch (e) {}

    // 3. Fallback default Nani only if NOT deleted by user
    if (!deletedEmails.includes('nani@gmail.com') && !deletedEmails.includes('nani@gamil.com')) {
      if (!clientMap.has('nani@gmail.com') && !clientMap.has('nani@gamil.com')) {
        clientMap.set('nani@gmail.com', {
          id: 'client-nani',
          full_name: 'Nani',
          email: 'nani@gmail.com',
          phone: 'N/A',
          role: 'client',
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    }

    setClients(Array.from(clientMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();

    const channel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchClients();
      })
      .subscribe();

    const handleLocalClientUpdated = () => {
      fetchClients();
    };
    window.addEventListener('kpr_registered_clients_updated', handleLocalClientUpdated);

    return () => {
      supabase.removeChannel(channel);
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
      fetchClients(); // Revert on failure
    }
  };

  const handleDeleteClient = async (client) => {
    if (!client) return;
    setDeleting(true);

    const emailToDelete = (client.email || '').toLowerCase().trim();

    // 1. Optimistic removal from UI state
    setClients(prev => prev.filter(c => c.id !== client.id && c.email.toLowerCase() !== emailToDelete));

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

    // 3. Remove from Supabase
    try {
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
                    <th className="px-6 py-3.5">Date Added</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8EB]">
                  {filteredClients.map((client) => {
                    const isActive = client.status !== 'disabled';
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
                          <div className="flex items-center justify-end gap-3">
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

                      <div className="flex items-center gap-3">
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
