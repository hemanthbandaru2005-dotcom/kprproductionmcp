import React, { useState, useEffect } from 'react';
import { Palette, Send, Plus, RefreshCw, Clock, CheckCircle, AlertTriangle, BookOpen, Image as ImageIcon, Layers, MessageSquare, Flag, Search, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { fetchVerificationsForAdmin } from '../../utils/verificationService';
import SendVerificationModal from './SendVerificationModal';

const STATUS_BADGES = {
  pending: {
    label: 'Awaiting Client Review',
    bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Clock
  },
  approved: {
    label: 'Approved by Client',
    bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle
  },
  changes_requested: {
    label: 'Changes Requested',
    bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: AlertTriangle
  }
};

export default function ColorLabVerificationsPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'changes_requested'
  const [activeNoteModal, setActiveNoteModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchVerificationsForAdmin();
    setVerifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates on verifications table
    const channelName = `verifications-admin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        loadData();
      })
      .subscribe();

    const handleUpdated = () => {
      loadData();
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('kpr_verifications_bc_v1');
        bc.onmessage = () => {
          loadData();
        };
      }
    } catch (e) {}

    window.addEventListener('kpr_verifications_updated', handleUpdated);

    return () => {
      supabase.removeChannel(channel);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      window.removeEventListener('kpr_verifications_updated', handleUpdated);
    };
  }, []);

  const filteredItems = verifications.filter(item => {
    const matchSearch =
      (item.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.event_title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.album_title || '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countPending = verifications.filter(v => v.status === 'pending').length;
  const countChanges = verifications.filter(v => v.status === 'changes_requested').length;
  const countApproved = verifications.filter(v => v.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider uppercase text-white flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#C5A880]" />
            Client Verifications
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Track album flipbook reviews, proofing feedback, and client approvals in real time.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Send for Verification
        </button>
      </div>

      {/* 2. Status Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1623] border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Pending Review</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{countPending}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1623] border border-rose-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Changes Requested</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{countChanges}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1623] border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Approved</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{countApproved}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#0F1623] rounded-xl border border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search client, event, or album..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#1A2333] border border-white/10 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#1A2333] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#C5A880]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved Only</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Verifications Table */}
      <div className="bg-[#0F1623] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-white/40 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading verifications…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-white/40 text-xs space-y-2">
            <Palette className="w-8 h-8 mx-auto text-white/20" />
            <p>No verification requests found.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-[#C5A880] font-bold hover:underline cursor-pointer"
            >
              Send your first album or proofing request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827] text-white/50 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Client & Project</th>
                  <th className="px-6 py-4">Review Content</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sent At</th>
                  <th className="px-6 py-4">Client Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map(item => {
                  const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
                  const BadgeIcon = badge.icon;
                  const hasAlbum = Boolean(item.album_id || item.album_title);
                  const hasPhotos = Boolean(item.photo_ids?.length > 0 || item.photo_items?.length > 0);

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Client & Project */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{item.client_name}</div>
                        <div className="text-white/50 text-[11px] mt-0.5">{item.event_title}</div>
                      </td>

                      {/* Content Type */}
                      <td className="px-6 py-4">
                        {hasAlbum && hasPhotos ? (
                          <div className="flex items-center gap-1.5 text-white/80">
                            <Layers className="w-4 h-4 text-[#C5A880]" />
                            <span>Album ({item.album_pages?.length || 0} pgs) + {item.photo_ids?.length || 0} proofs</span>
                          </div>
                        ) : hasAlbum ? (
                          <div className="flex items-center gap-1.5 text-white/80">
                            <BookOpen className="w-4 h-4 text-[#C5A880]" />
                            <span>{item.album_title || 'Wedding Album'} ({item.album_pages?.length || 0} pgs)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-white/80">
                            <ImageIcon className="w-4 h-4 text-[#C5A880]" />
                            <span>{item.photo_ids?.length || 0} Proof Photos</span>
                          </div>
                        )}

                        {(item.verification_link || item.drive_link) && (
                          <a
                            href={item.verification_link || item.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open Sent Link ↗</span>
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      {/* Sent At */}
                      <td className="px-6 py-4 text-white/50 font-mono text-[11px]">
                        {new Date(item.sent_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Client Feedback / Notes */}
                      <td className="px-6 py-4">
                        {item.status === 'changes_requested' ? (
                          <button
                            onClick={() => setActiveNoteModal(item)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>View Note ({item.flagged_items?.length || 0} flagged)</span>
                          </button>
                        ) : item.status === 'approved' ? (
                          <span className="text-emerald-400/80 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        ) : (
                          <span className="text-white/30 italic">No response yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Client Note View Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Client Revision Request</span>
              </div>
              <button
                onClick={() => setActiveNoteModal(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-white/50">Client: <strong className="text-white">{activeNoteModal.client_name}</strong></p>
              <p className="text-xs text-white/50">Project: <strong className="text-white">{activeNoteModal.event_title}</strong></p>
            </div>

            {/* Flagged pages / photos */}
            {activeNoteModal.flagged_items && activeNoteModal.flagged_items.length > 0 && (
              <div className="p-3 bg-black/30 rounded-xl border border-white/10 space-y-1">
                <p className="text-[11px] font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5" />
                  Flagged Items:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeNoteModal.flagged_items.map((flag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note text */}
            <div className="p-3.5 bg-[#111827] rounded-xl border border-white/10 text-xs text-white/90 leading-relaxed max-h-48 overflow-y-auto">
              <p className="font-semibold text-white/50 text-[10px] uppercase mb-1">Feedback Note:</p>
              "{activeNoteModal.client_note || 'Please review the flagged pages for retouching adjustments.'}"
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Send Verification Modal */}
      <SendVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          loadData();
        }}
      />

    </div>
  );
}
