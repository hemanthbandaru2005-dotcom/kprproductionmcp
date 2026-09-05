import React, { useState, useEffect } from 'react';
import { Palette, Send, Plus, RefreshCw, Clock, CheckCircle, AlertTriangle, BookOpen, Image as ImageIcon, Layers, MessageSquare, Flag, Search, Filter, ExternalLink, Trash2, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { fetchVerificationsForAdmin, deleteVerification } from '../../utils/verificationService';
import SendVerificationModal from './SendVerificationModal';

const STATUS_BADGES = {
  pending: {
    label: 'Awaiting Client Review',
    bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    icon: Clock
  },
  approved: {
    label: 'Approved by Client',
    bg: 'bg-[#DFF5E3] text-[#13A52D] border-[#BBF7D0]',
    icon: CheckCircle
  },
  changes_requested: {
    label: 'Changes Requested',
    bg: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
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
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteVerification = async (item) => {
    if (!item) return;
    setDeleting(true);

    // Optimistic UI update
    setVerifications(prev => prev.filter(v => v.id !== item.id));

    await deleteVerification(item.id);
    setDeleting(false);
    setDeleteConfirmItem(null);
  };

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
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E7E8EB] rounded-[20px] p-5 sm:p-6 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#13A52D]" />
            Color Lab & Proofing Verifications
          </h2>
          <p className="text-xs sm:text-[13px] text-[#6B7280] mt-1">
            Send digital flipbook album proofs and approval links to clients for review and print approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send New Verification</span>
          </button>
        </div>
      </div>

      {/* 2. Pipeline Summary Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-[#FEF3C7] border-[#D97706] shadow-sm ring-1 ring-[#D97706]'
              : 'bg-white border-[#E7E8EB] hover:bg-[#F7F8FA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706]">Awaiting Review</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#D97706] mt-2">{countPending}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">Pending client decision</p>
        </div>

        {/* Changes Requested */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'changes_requested' ? 'all' : 'changes_requested')}
          className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
            statusFilter === 'changes_requested'
              ? 'bg-[#FEF2F2] border-[#DC2626] shadow-sm ring-1 ring-[#DC2626]'
              : 'bg-white border-[#E7E8EB] hover:bg-[#F7F8FA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">Changes Requested</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#DC2626] mt-2">{countChanges}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">Requires design adjustment</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          className={`p-4 sm:p-5 rounded-[20px] border transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-[#DFF5E3] border-[#13A52D] shadow-sm ring-1 ring-[#13A52D]'
              : 'bg-white border-[#E7E8EB] hover:bg-[#F7F8FA]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#13A52D]">Ready for Print</span>
            <div className="w-8 h-8 rounded-full bg-[#DFF5E3] text-[#13A52D] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#13A52D] mt-2">{countApproved}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">Ready for color lab binding</p>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by client or event title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#141414] text-white'
                : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            All ({verifications.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Pending ({countPending})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-[#13A52D] text-white'
                : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            Approved ({countApproved})
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Table Section */}
      <div className="bg-white border border-[#E7E8EB] rounded-[20px] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
            <p className="text-xs">Loading verification pipeline…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-[#9CA0A6] space-y-3">
            <Palette className="w-12 h-12 text-[#9CA0A6] mx-auto" />
            <h4 className="text-base font-bold text-[#111111]">No Verifications Found</h4>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Click "Send New Verification" above to dispatch an album layout or proof link to a client.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Verification</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F8FA] text-[#6B7280] uppercase font-semibold text-[10px] tracking-wider border-b border-[#E7E8EB]">
                  <tr>
                    <th className="px-6 py-4">Client & Project</th>
                    <th className="px-6 py-4">Review Content</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Sent At</th>
                    <th className="px-6 py-4">Client Feedback</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8EB]">
                  {filteredItems.map(item => {
                    const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
                    const BadgeIcon = badge.icon;
                    const hasAlbum = Boolean(item.album_id || item.album_title);
                    const hasPhotos = Boolean(item.photo_ids?.length > 0 || item.photo_items?.length > 0);

                    return (
                      <tr key={item.id} className="hover:bg-[#F7F8FA] transition-colors">
                        {/* Client & Project */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#111111] text-sm">{item.client_name}</div>
                          <div className="text-[#6B7280] text-[11px] mt-0.5">{item.event_title}</div>
                        </td>

                        {/* Content Type */}
                        <td className="px-6 py-4">
                          {hasAlbum && hasPhotos ? (
                            <div className="flex items-center flex-wrap gap-1.5 text-[#111111]">
                              <Layers className="w-4 h-4 text-[#1E74FF]" />
                              <span>Album ({item.album_pages?.length || 0} pgs) + {item.photo_ids?.length || 0} proofs</span>
                              {item.album_size && (
                                <span className="px-1.5 py-0.5 bg-[#C5A880]/15 text-[#8B6B38] border border-[#C5A880]/30 rounded text-[9.5px] font-mono font-semibold">
                                  {item.album_size}
                                </span>
                              )}
                            </div>
                          ) : hasAlbum ? (
                            <div className="flex items-center flex-wrap gap-1.5 text-[#111111]">
                              <BookOpen className="w-4 h-4 text-[#1E74FF]" />
                              <span>{item.album_title || 'Wedding Album'} ({item.album_pages?.length || 0} pgs)</span>
                              {item.album_size && (
                                <span className="px-1.5 py-0.5 bg-[#C5A880]/15 text-[#8B6B38] border border-[#C5A880]/30 rounded text-[9.5px] font-mono font-semibold">
                                  {item.album_size}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[#111111]">
                              <ImageIcon className="w-4 h-4 text-[#1E74FF]" />
                              <span>{item.photo_ids?.length || 0} Proof Photos</span>
                            </div>
                          )}

                          {(item.verification_link || item.drive_link) && (
                            <a
                              href={item.verification_link || item.drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-[#1E74FF] hover:underline font-semibold bg-[#DCE9FF] px-2.5 py-0.5 rounded-full"
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
                        <td className="px-6 py-4 text-[#6B7280] font-mono text-[11px]">
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
                              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEE2E2] transition-colors font-medium cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>View Note ({item.flagged_items?.length || 0} flagged)</span>
                            </button>
                          ) : item.status === 'approved' ? (
                            <span className="text-[#13A52D] font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          ) : (
                            <span className="text-[#9CA0A6] italic">No response yet</span>
                          )}
                        </td>

                        {/* Actions: Delete Button */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-2 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer"
                            title="Delete verification permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[#E7E8EB]">
              {filteredItems.map(item => {
                const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
                const BadgeIcon = badge.icon;
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#111111]">{item.client_name}</h4>
                        <p className="text-[11px] text-[#6B7280]">{item.event_title}</p>
                      </div>

                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 text-[#9CA0A6] hover:text-[#DC2626] rounded-full"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      <span className="text-[11px] text-[#9CA0A6]">
                        {new Date(item.sent_at).toLocaleDateString()}
                      </span>
                    </div>

                    {(item.verification_link || item.drive_link) && (
                      <a
                        href={item.verification_link || item.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#1E74FF] font-semibold"
                      >
                        <span>Open Preview Link ↗</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 5. Client Note View Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3">
              <div className="flex items-center gap-2 text-[#DC2626] font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Client Revision Request</span>
              </div>
              <button
                onClick={() => setActiveNoteModal(null)}
                className="p-1.5 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB]"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-[#6B7280]">Client: <strong className="text-[#111111]">{activeNoteModal.client_name}</strong></p>
              <p className="text-xs text-[#6B7280]">Project: <strong className="text-[#111111]">{activeNoteModal.event_title}</strong></p>
            </div>

            {/* Flagged pages / photos */}
            {activeNoteModal.flagged_items && activeNoteModal.flagged_items.length > 0 && (
              <div className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] space-y-1">
                <p className="text-[11px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-[#DC2626]" />
                  Flagged Items:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeNoteModal.flagged_items.map((flag, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[10px] font-mono border border-[#FCA5A5]">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note text */}
            <div className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] text-xs text-[#111111] leading-relaxed max-h-48 overflow-y-auto">
              <p className="font-semibold text-[#6B7280] text-[10px] uppercase mb-1">Feedback Note:</p>
              "{activeNoteModal.client_note || 'Please review the flagged pages for retouching adjustments.'}"
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-5 py-2 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#DC2626] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="p-1 rounded-full text-[#9CA0A6] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111111]">Delete Verification Record</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Are you sure you want to permanently delete the verification for <strong className="text-[#111111]">{deleteConfirmItem.client_name} - {deleteConfirmItem.event_title}</strong>? This file will be removed permanently and will not reappear on refresh.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVerification(deleteConfirmItem)}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Send Verification Modal */}
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
