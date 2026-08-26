import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import {
  Sparkles, Heart, CheckCircle, RefreshCw,
  ChevronRight, Check, X, BookOpen,
  Palette, HardDrive, ExternalLink, Bell, LogOut,
  Clock, ShieldCheck, Image as ImageIcon, Link2, Copy,
  MessageSquare, AlertTriangle, Send, Loader2, ArrowUpRight
} from 'lucide-react';
import ColorLabVerificationViewer from './ColorLabVerificationViewer';
import ClientUploadSection from './ClientUploadSection';
import { fetchVerificationsForClient, updateVerificationStatus } from '../../utils/verificationService';
import { fetchClientUploads } from '../../utils/clientUploadsService';

const VERIF_BADGES = {
  pending: {
    label: 'Action Required',
    sub: 'Awaiting Your Review',
    bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    dot: 'bg-[#D97706] animate-pulse'
  },
  changes_requested: {
    label: 'Changes Sent',
    sub: 'Studio Processing Revision',
    bg: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
    dot: 'bg-[#DC2626]'
  },
  approved: {
    label: 'Approved & Finalized',
    sub: 'Sent to Print Production',
    bg: 'bg-[#DFF5E3] text-[#13A52D] border-[#BBF7D0]',
    dot: 'bg-[#13A52D]'
  }
};

export default function ClientDashboard({ onLogout }) {
  const { user, profile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState('proofs'); // 'proofs' | 'links' | 'uploads'
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Color Lab Verifications State ──
  const [verifications, setVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [activeVerification, setActiveVerification] = useState(null);

  // ── Link Revision Modal State ──
  const [revisionModalItem, setRevisionModalItem] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // ── Client Uploads Count ──
  const [uploadsCount, setUploadsCount] = useState(0);

  const loadVerifications = async () => {
    if (!user) return;
    setLoadingVerifications(true);
    const clientEmail = user.email || profile?.email || '';
    const data = await fetchVerificationsForClient(user.id, clientEmail);
    setVerifications(data || []);
    setLoadingVerifications(false);
  };

  const loadUploadsCount = async () => {
    if (!user) return;
    const ups = await fetchClientUploads(user.id);
    setUploadsCount(ups?.length || 0);
  };

  useEffect(() => {
    loadVerifications();
    loadUploadsCount();
  }, [user, profile]);

  // Realtime subscription & BroadcastChannel for instant verifications and uploads
  useEffect(() => {
    const channelName = `verifications-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        loadVerifications();
      })
      .subscribe();

    const handleUploadsUpdated = () => {
      loadUploadsCount();
    };

    const handleVerificationsUpdated = () => {
      loadVerifications();
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('kpr_verifications_bc_v1');
        bc.onmessage = () => {
          loadVerifications();
        };
      }
    } catch (e) {}

    window.addEventListener('kpr_client_uploads_updated', handleUploadsUpdated);
    window.addEventListener('kpr_verifications_updated', handleVerificationsUpdated);

    return () => {
      supabase.removeChannel(channel);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      window.removeEventListener('kpr_client_uploads_updated', handleUploadsUpdated);
      window.removeEventListener('kpr_verifications_updated', handleVerificationsUpdated);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  // Direct 1-Click Approve for Link Verifications
  const handleApproveLink = async (verifId) => {
    if (!window.confirm('Are you sure you want to approve this digital preview and send it to print production?')) return;
    setSubmittingAction(true);
    try {
      await updateVerificationStatus(verifId, {
        status: 'approved',
        client_note: 'Approved digitally via client verification link portal'
      });
      setActionSuccessMsg('Album presentation approved! Studio notified to proceed.');
      await loadVerifications();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Feedback / Changes for Link Verifications
  const handleSendLinkRevision = async (e) => {
    e.preventDefault();
    if (!revisionModalItem || !revisionNote.trim()) return;

    setSubmittingAction(true);
    try {
      await updateVerificationStatus(revisionModalItem.id, {
        status: 'changes_requested',
        client_note: revisionNote.trim(),
        flagged_items: []
      });
      setActionSuccessMsg('Revision note sent to Studio design team!');
      setRevisionModalItem(null);
      setRevisionNote('');
      await loadVerifications();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const rawName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Valued Client');
  const nameWords = rawName.split(/[\._\-]+/).filter(Boolean);
  const clientName = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Valued Client';

  const linkVerifications = verifications.filter(v => Boolean(v.verification_link || v.drive_link));
  const pendingVerificationsCount = verifications.filter(v => v.status === 'pending').length;
  const pendingLinksCount = linkVerifications.filter(v => v.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111111] font-sans antialiased p-2 sm:p-5 lg:p-8 flex flex-col items-center justify-start selection:bg-[#141414] selection:text-white">
      
      {/* ════════════════════════════════════════════════════════════════════════════
          OUTER CONTAINER (32PX RADIUS FLOATING CANVAS)
          ════════════════════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-[1440px] bg-[#F7F8FA] border border-[#E7E8EB] rounded-[20px] sm:rounded-[32px] p-3.5 sm:p-6 md:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] space-y-4 sm:space-y-6">

        {/* ════════════════════════════════════════════════════════════════════════════
            1. TOP NAVBAR: UNCLUTTERED BRAND & PROFILE BAR
            ════════════════════════════════════════════════════ */}
        <header className="w-full bg-white rounded-2xl sm:rounded-full border border-[#E7E8EB] px-4 sm:px-6 py-3 shadow-xs flex items-center justify-between gap-3">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#141414] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              C
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold text-[#111111] tracking-tight block leading-tight">
                KPR Client Suite
              </span>
              <span className="text-[10px] text-[#9CA0A6] font-medium tracking-wider uppercase">
                Proofing & Media Portal
              </span>
            </div>
          </div>

          {/* Right Action Icons: Notifications, Profile, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {pendingVerificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#13A52D] ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E7E8EB] rounded-2xl shadow-xl p-4 z-40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-2">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">Updates</span>
                    <span className="text-[11px] text-[#1E74FF] font-semibold">
                      {pendingVerificationsCount > 0 ? `${pendingVerificationsCount} pending review` : 'All caught up'}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {pendingVerificationsCount > 0 ? (
                      <div className="p-2.5 bg-[#FEF3C7] rounded-xl border border-[#FDE68A] text-[#D97706]">
                        <p className="font-bold">Album Verification Ready</p>
                        <p className="text-[10px] text-[#6B7280]">You have an album proof awaiting your review.</p>
                      </div>
                    ) : (
                      <p className="text-[#9CA0A6] text-[11px] text-center py-2">No new notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#FEF2F2] text-[#6B7280] hover:text-[#DC2626] border border-[#E7E8EB] hover:border-[#FCA5A5] text-xs font-semibold transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════════════════
            2. SPACIOUS SEGMENTED NAVIGATION TABS (UNCLUTTERED)
            ════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3 bg-white p-1.5 rounded-2xl sm:rounded-full border border-[#E7E8EB] shadow-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('proofs')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                activeTab === 'proofs'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F7F8FA] sm:bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EEF0F2]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Album Proofs ({verifications.length})</span>
              {pendingVerificationsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#13A52D] animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`relative px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                activeTab === 'links'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F7F8FA] sm:bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EEF0F2]'
              }`}
            >
              <Link2 className="w-4 h-4 text-[#1E74FF]" />
              <span>Approval Links ({linkVerifications.length})</span>
              {pendingLinksCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#FF4D94] text-white text-[10px] font-bold rounded-full font-mono">
                  {pendingLinksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                activeTab === 'uploads'
                  ? 'bg-[#141414] text-white shadow-xs'
                  : 'bg-[#F7F8FA] sm:bg-transparent text-[#6B7280] hover:text-[#111111] hover:bg-[#EEF0F2]'
              }`}
            >
              <HardDrive className="w-4 h-4 text-[#13A52D]" />
              <span>Upload Assets ({uploadsCount})</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 pr-3 text-xs text-[#9CA0A6]">
            <span>Client Suite · <strong className="text-[#111111]">{clientName}</strong></span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════════
            3. TITLE ROW WITH REFRESH ACTION
            ════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#111111] tracking-tight leading-tight">
              Welcome back, <span className="text-[#1E74FF]">{clientName}</span>
            </h2>
            <p className="text-xs sm:text-[13px] text-[#9CA0A6] font-normal mt-0.5">
              Review your handcrafted album proofs, upload project media, or approve digital deliverables.
            </p>
          </div>

          <button
            onClick={loadVerifications}
            className="self-start sm:self-auto px-4 py-2 rounded-full bg-white hover:bg-[#F1F2F4] text-[#111111] border border-[#E7E8EB] text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingVerifications ? 'animate-spin' : ''}`} />
            <span>Refresh Proofs</span>
          </button>
        </div>

        {/* Global Action Success Toast */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-[20px] bg-[#DFF5E3] border border-[#BBF7D0] text-[#13A52D] text-xs font-bold flex items-center gap-3 shadow-xs animate-fadeIn">
            <CheckCircle className="w-5 h-5 shrink-0 text-[#13A52D]" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════════
            4. ACTIVE TAB CONTENT
            ════════════════════════════════════════════════════ */}
        {activeTab === 'uploads' ? (
          <ClientUploadSection
            clientUser={user}
            clientProfile={profile}
          />
        ) : activeTab === 'links' ? (
          /* ═══════ DEDICATED VERIFICATION LINKS SECTION ═══════ */
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] border border-[#E7E8EB] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E8EB]">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Verification & Approval Links</h3>
                  <p className="text-xs text-[#6B7280]">Review digital album layouts, Canva proofs, video edits, and cloud media</p>
                </div>
                <span className="text-xs font-semibold text-[#1E74FF]">{linkVerifications.length} links</span>
              </div>

              {loadingVerifications ? (
                <div className="p-16 text-center text-[#9CA0A6]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
                  <p className="text-xs">Loading verification links…</p>
                </div>
              ) : linkVerifications.length === 0 ? (
                <div className="p-12 text-center text-[#9CA0A6] space-y-2">
                  <Link2 className="w-12 h-12 text-[#9CA0A6] mx-auto mb-2" />
                  <h4 className="text-base font-bold text-[#111111]">No Verification Links Sent Yet</h4>
                  <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                    When the studio sends a proofing URL or video link for review, it will appear here with one-click review and approval buttons.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {linkVerifications.map((verif) => {
                    const badge = VERIF_BADGES[verif.status] || VERIF_BADGES.pending;
                    const activeUrl = verif.verification_link || verif.drive_link;

                    return (
                      <div
                        key={verif.id}
                        className="bg-[#F7F8FA] border border-[#E7E8EB] hover:border-[#141414] rounded-2xl p-5 space-y-4 transition-all shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-[#9CA0A6] ml-2">
                              Sent {new Date(verif.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <span className="text-xs text-[#111111] font-semibold">
                            {verif.event_title}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-[#111111]">
                            {verif.album_title || verif.link_title || 'Color Lab Proofing Link'}
                          </h4>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Please click the link below to review all photos and video presentations, then approve or send your revision feedback directly.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-[#E7E8EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
                            <Link2 className="w-4 h-4 text-[#1E74FF] shrink-0" />
                            <a
                              href={activeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-[#1E74FF] hover:underline truncate max-w-full sm:max-w-md font-semibold"
                            >
                              {activeUrl}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activeUrl, verif.id)}
                              className="px-3 py-1.5 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold flex items-center gap-1.5 border border-[#E7E8EB] transition-colors"
                            >
                              {copiedId === verif.id ? <Check className="w-3.5 h-3.5 text-[#13A52D]" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === verif.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <a
                              href={activeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Approval / Revision Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#E7E8EB]">
                          {verif.status === 'approved' ? (
                            <span className="text-xs font-bold text-[#13A52D] flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" />
                              <span>Approved & Sent to Print</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => handleApproveLink(verif.id)}
                                disabled={submittingAction}
                                className="px-4 py-2 rounded-full bg-[#13A52D] hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve Digital Proof</span>
                              </button>

                              <button
                                onClick={() => setRevisionModalItem(verif)}
                                className="px-4 py-2 rounded-full bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Request Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══════ TAB 1: ALBUM PROOFS (COGNIFY CARDS) ═══════ */
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] border border-[#E7E8EB] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E8EB]">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Interactive Flipbook Proofs</h3>
                  <p className="text-xs text-[#6B7280]">Review your wedding albums and photo galleries page by page</p>
                </div>
                <span className="text-xs font-semibold text-[#1E74FF]">{verifications.length} available</span>
              </div>

              {loadingVerifications ? (
                <div className="p-16 text-center text-[#9CA0A6]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
                  <p className="text-xs">Loading album proofs…</p>
                </div>
              ) : verifications.length === 0 ? (
                <div className="p-12 text-center text-[#9CA0A6] space-y-2">
                  <BookOpen className="w-12 h-12 text-[#9CA0A6] mx-auto mb-2" />
                  <h4 className="text-base font-bold text-[#111111]">No Album Proofs Available Yet</h4>
                  <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                    Once the studio design team completes your album layout, the digital flipbook will appear here for your interactive proofing and page-by-page review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {verifications.map((item) => {
                    const badge = VERIF_BADGES[item.status] || VERIF_BADGES.pending;
                    const pageCount = item.album_pages?.length || item.photo_items?.length || 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveVerification(item)}
                        className="bg-[#F7F8FA] border border-[#E7E8EB] hover:border-[#141414] rounded-2xl p-5 space-y-4 transition-all cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E74FF] bg-[#DCE9FF] px-2.5 py-0.5 rounded-full">
                              {item.event_title || 'Wedding Album'}
                            </span>
                            <h4 className="text-base font-bold text-[#111111] mt-2 group-hover:text-[#1E74FF] transition-colors">
                              {item.album_title || 'Album Design Layout'}
                            </h4>
                          </div>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#6B7280] pt-3 border-t border-[#E7E8EB]">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-[#1E74FF]" />
                            <span>{pageCount} Layout Pages</span>
                          </span>

                          <span className="text-[#1E74FF] font-bold text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>Open Flipbook</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ═══════ INTERACTIVE FLIPBOOK VIEWER MODAL ═══════ */}
      {activeVerification && (
        <ColorLabVerificationViewer
          verification={activeVerification}
          onClose={() => setActiveVerification(null)}
          onStatusUpdated={() => {
            loadVerifications();
          }}
        />
      )}

      {/* ═══════ REVISION REQUEST MODAL ═══════ */}
      {revisionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3">
              <div className="flex items-center gap-2 text-[#DC2626] font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Request Changes & Revisions</span>
              </div>
              <button
                onClick={() => setRevisionModalItem(null)}
                className="p-1.5 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-[#6B7280]">Project: <strong className="text-[#111111]">{revisionModalItem.event_title}</strong></p>
              <p className="text-xs text-[#6B7280]">Presentation: <strong className="text-[#111111]">{revisionModalItem.album_title || 'Design Link'}</strong></p>
            </div>

            <form onSubmit={handleSendLinkRevision} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1.5 block">
                  Describe the requested adjustments / replacements:
                </label>
                <textarea
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="e.g. Please replace photo on Slide 4 with the sunset portrait, and brighten skin tones on the ceremony layout…"
                  className="w-full p-3.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalItem(null)}
                  className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !revisionNote.trim()}
                  className="px-5 py-2 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Feedback</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
