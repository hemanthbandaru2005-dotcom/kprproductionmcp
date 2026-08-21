import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import AddClientModal from './AddClientModal';
import { Users, Plus, RefreshCw, Phone, Mail, ShieldAlert, ShieldCheck, Search, Trash2, AlertTriangle, X } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
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
          if (c.email && !c.email.includes('example.com')) {
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
            if (c && c.email && !c.email.includes('example.com')) {
              if (!clientMap.has(c.email.toLowerCase())) {
                clientMap.set(c.email.toLowerCase(), c);
              }
            }
          });
        }
      }
    } catch (e) {}

    // 3. Pre-add Nani if not already present
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

    setClients(Array.from(clientMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();

    // Subscribe to changes in profiles and local client registration events
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

    // 1. Optimistic removal from UI state
    setClients(prev => prev.filter(c => c.id !== client.id && c.email.toLowerCase() !== client.email.toLowerCase()));

    // 2. Remove from LocalStorage
    try {
      const raw = localStorage.getItem('kpr_registered_clients_v1');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.filter(c => c.id !== client.id && c.email.toLowerCase() !== client.email.toLowerCase());
        localStorage.setItem('kpr_registered_clients_v1', JSON.stringify(updated));
      }
    } catch (e) {}

    // 3. Remove from Supabase profiles
    try {
      await supabase.from('profiles').delete().eq('id', client.id);
      await supabase.from('profiles').delete().eq('email', client.email);
    } catch (err) {
      console.warn('Supabase profile deletion notice:', err);
    }

    setDeleting(false);
    setDeleteConfirmClient(null);
  };

  const filteredClients = clients.filter(c => 
    (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1E2433] border border-white/5 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880]/50"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A880] hover:bg-[#A4865E] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-[#1E2433] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C5A880]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Client Accounts Directory</h3>
              <p className="text-[10px] text-white/40">{clients.length} registered clients</p>
            </div>
          </div>
          <button
            onClick={fetchClients}
            className="p-2 text-white/40 hover:text-white transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-white/40">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C5A880]" />
            <p className="text-xs">Loading clients…</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            <Users className="w-10 h-10 mx-auto mb-3 text-white/10" />
            <p className="text-sm text-white/60 font-medium">No Clients Found</p>
            <p className="text-xs text-white/30 mt-1">Click "Add Client" above to provision a portal account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="px-6 py-3">Client Name</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Date Added</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isActive = client.status !== 'disabled';
                  return (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#C5A880]/15 text-[#C5A880] font-bold flex items-center justify-center text-xs">
                            {(client.full_name || client.email || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/90">{client.full_name || 'Unnamed Client'}</p>
                            <p className="text-[10px] text-white/40">{client.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <Mail className="w-3.5 h-3.5 text-white/30" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-white/40">
                            <Phone className="w-3.5 h-3.5 text-white/30" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-white/50">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : '—'}
                      </td>

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

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleClientStatus(client.id, client.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                              isActive ? 'bg-emerald-500' : 'bg-white/10'
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
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20"
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
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmClient(null)} />
          <div className="relative w-full max-w-md bg-[#1A1F2E] rounded-2xl shadow-2xl border border-rose-500/30 overflow-hidden p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Client Account?</h4>
                <p className="text-xs text-white/50">This action will remove the client from your studio directory.</p>
              </div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs space-y-1">
              <p className="font-semibold text-white">{deleteConfirmClient.full_name || 'Client'}</p>
              <p className="text-white/60 font-mono">{deleteConfirmClient.email}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmClient(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClient(deleteConfirmClient)}
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

      {/* Add Client Modal */}
      <AddClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onClientAdded={fetchClients} 
      />
    </div>
  );
}
