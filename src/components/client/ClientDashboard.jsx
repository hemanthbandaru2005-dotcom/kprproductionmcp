import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import {
  Sparkles, Heart, CheckCircle, RefreshCw,
  ChevronRight, Check, X, BookOpen,
  Palette, HardDrive, ExternalLink, Bell, LogOut,
  Clock, ShieldCheck, Image as ImageIcon, Link2, Copy,
  MessageSquare, AlertTriangle, Send, Loader2
} from 'lucide-react';
import ColorLabVerificationViewer from './ColorLabVerificationViewer';
import ClientUploadSection from './ClientUploadSection';
import { fetchVerificationsForClient, updateVerificationStatus } from '../../utils/verificationService';
import { fetchClientUploads } from '../../utils/clientUploadsService';

const VERIF_BADGES = {
  pending: {
    label: 'Action Required',
    sub: 'Awaiting Your Review',
    bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-400 animate-pulse'
  },
  changes_requested: {
    label: 'Changes Sent',
    sub: 'Studio Processing Revision',
    bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    dot: 'bg-rose-400'
  },
  approved: {
    label: 'Approved & Finalized',
    sub: 'Sent to Print Production',
    bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-400'
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
  }, [user, profile]);

  const handleLogout = async () => {
    await signOut();
    if (onLogout) onLogout();
  };

  // Direct approve link
  const handleApproveLink = async (verifId) => {
    setSubmittingAction(true);
    try {
      await updateVerificationStatus(verifId, {
        status: 'approved',
        client_note: 'Approved directly from Client Portal Link Review.',
        flagged_items: []
      });
      setActionSuccessMsg('Link & Proof Approved! Studio has been notified in real time.');
      await loadVerifications();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Direct submit revision note for link
  const handleSubmitRevision = async (e) => {
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
    <div className="min-h-screen bg-[#111827] text-[#F7F3EE] selection:bg-[#C5A880] selection:text-white">
      
      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-30 bg-[#0F1623]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 flex items-center justify-center shadow-lg shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880]" />
          </div>
          <div>
            <h1 className="font-serif text-lg sm:text-xl text-white font-light flex items-center gap-2">
              <span>KPR</span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.3em] font-sans font-bold uppercase text-[#C5A880] bg-[#C5A880]/10 px-2 py-0.5 rounded border border-[#C5A880]/20">
                CLIENT PORTAL
              </span>
            </h1>
            <p className="text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[#A09585] hidden sm:block">
              FINE ART & LUXURY WEDDING PROOFING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 text-white/60 hover:text-[#C5A880] hover:bg-white/5 rounded-full transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {pendingVerificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-[#0F1623]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1C2433] border border-[#C5A880]/30 rounded-2xl shadow-2xl p-4 z-40 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Updates</span>
                  <span className="text-[10px] text-[#C5A880]">
                    {pendingVerificationsCount > 0 ? `${pendingVerificationsCount} pending review` : 'All caught up'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {pendingVerificationsCount > 0 ? (
                    <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-300">
                      <p className="font-bold">Album Verification Ready</p>
                      <p className="text-[10px] text-white/70">You have an album proof awaiting your review.</p>
                    </div>
                  ) : (
                    <p className="text-white/40 text-[11px] text-center py-2">No new notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border border-[#C5A880]/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fadeIn">

        {/* HERO & WELCOME CARD */}
        <div className="relative bg-gradient-to-r from-[#18202F] to-[#0F1623] border border-[#C5A880]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[#C5A880] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Private Client Suite</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl text-white font-light leading-tight">
              Welcome back, <span className="text-[#C5A880] italic">{clientName}</span>
            </h2>

            <p className="text-xs sm:text-sm text-white/60 font-light max-w-xl">
              Review your handcrafted album proofs, upload project documents and wedding media mirrored to Google Drive, or access your full wedding photo & video library.
            </p>

            {/* Quick Navigation Tabs */}
            <div className="flex flex-wrap gap-2.5 pt-4">
              <button
                onClick={() => setActiveTab('proofs')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'proofs'
                    ? 'bg-[#C5A880] text-black shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Album Proofs ({verifications.length})</span>
                {pendingVerificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'links'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <Link2 className="w-4 h-4 text-blue-400" />
                <span>Verification Links ({linkVerifications.length})</span>
                {pendingLinksCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[9px] font-bold rounded-full animate-pulse">
                    {pendingLinksCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('uploads')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'uploads'
                    ? 'bg-[#C5A880] text-black shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Upload Assets & Drive Sync ({uploadsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Action Success Toast */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-2xl animate-fadeIn">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ═══════ ACTIVE TAB CONTENT ═══════ */}
        {activeTab === 'uploads' ? (
          <ClientUploadSection
            clientUser={user}
            clientProfile={profile}
          />
        ) : activeTab === 'links' ? (
          /* ═══════ DEDICATED VERIFICATION LINKS & APPROVALS SECTION ═══════ */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide">
                    Verification & Approval Links
                  </h3>
                  <p className="text-xs text-white/50">
                    Review digital album layouts, Canva proofs, video edits, and cloud media sent by the studio.
                  </p>
                </div>
              </div>

              <button
                onClick={loadVerifications}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Refresh links"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingVerifications ? (
              <div className="bg-[#18202F] rounded-2xl p-16 text-center text-white/40 border border-white/5 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                <p className="text-xs">Loading verification links…</p>
              </div>
            ) : linkVerifications.length === 0 ? (
              <div className="bg-[#18202F] rounded-2xl p-10 sm:p-14 text-center border border-white/5 space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Link2 className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="font-serif text-lg sm:text-xl text-white">No Verification Links Sent Yet</h4>
                  <p className="text-xs text-white/50 leading-relaxed">
                    When the studio sends a proofing URL, Canva layout, album presentation, or video link for your review and approval, it will appear here with one-click review and approval buttons.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="https://wa.me/919849390876?text=Hello%20KPR%20Productions!%20Checking%20on%20my%20verification%20links."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg"
                  >
                    <span>Contact Studio on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {linkVerifications.map((verif) => {
                  const badge = VERIF_BADGES[verif.status] || VERIF_BADGES.pending;
                  const activeUrl = verif.verification_link || verif.drive_link;

                  return (
                    <div
                      key={verif.id}
                      className="bg-[#18202F] border border-blue-500/20 hover:border-blue-500/50 rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl transition-all"
                    >
                      {/* Top status bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-white/50 ml-2">
                            Sent {new Date(verif.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <span className="text-xs text-[#C5A880] font-semibold">
                          {verif.event_title}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h4 className="font-serif text-xl sm:text-2xl text-white font-medium">
                          {verif.album_title || verif.link_title || 'Color Lab Proofing Link'}
                        </h4>
                        <p className="text-xs text-white/60">
                          Please click the link below to review all photos, layouts, or video presentations, then approve or send your revision feedback directly.
                        </p>
                      </div>

                      {/* Full URL Box with Copy & Open */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
                          <Link2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <a
                            href={activeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-300 hover:text-blue-200 underline truncate max-w-full sm:max-w-md"
                            title={activeUrl}
                          >
                            {activeUrl}
                          </a>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeUrl, verif.id)}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                          >
                            {copiedId === verif.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={activeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Revision Feedback Notice if changes were requested */}
                      {verif.status === 'changes_requested' && verif.client_note && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1">
                          <p className="font-bold text-rose-300 text-[10px] uppercase flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Your Revision Feedback to Studio:</span>
                          </p>
                          <p className="text-white/90 italic">"{verif.client_note}"</p>
                        </div>
                      )}

                      {/* Approval Status Notice if approved */}
                      {verif.status === 'approved' && (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>You have approved and finalized this work. Sent to studio print production.</span>
                        </div>
                      )}

                      {/* Interactive Approval & Feedback Controls */}
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-3">
                        {verif.status !== 'approved' ? (
                          <>
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => handleApproveLink(verif.id)}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve & Finalize Work</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRevisionModalItem(verif);
                                setRevisionNote(verif.client_note || '');
                              }}
                              className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Request Changes / Feedback</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRevisionModalItem(verif);
                              setRevisionNote(verif.client_note || '');
                            }}
                            className="text-xs text-white/50 hover:text-white underline cursor-pointer"
                          >
                            Send additional comments or update note
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ═══════ VERIFICATIONS & ALBUM PROOFS SECTION ═══════ */
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif text-xl sm:text-2xl text-white font-light tracking-wide">
                  Album & Proof Verification
                </h3>
              {pendingVerificationsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold font-mono animate-pulse">
                  {pendingVerificationsCount} Action Required
                </span>
              )}
            </div>

            <button
              onClick={loadVerifications}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Refresh verifications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingVerifications ? (
            <div className="bg-[#18202F] rounded-2xl p-16 text-center text-white/40 border border-white/5 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880]" />
              <p className="text-xs">Loading verification requests…</p>
            </div>
          ) : verifications.length === 0 ? (
            <div className="bg-[#18202F] rounded-2xl p-10 sm:p-14 text-center border border-white/5 space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/20 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif text-lg sm:text-xl text-white">Your Album Layouts are in Production</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Our color lab and design studio are currently crafting your fine art wedding album layouts and retouching proofs. Once ready, your interactive flipbook verification will appear here.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://wa.me/919849390876?text=Hello%20KPR%20Productions!%20Checking%20in%20on%20my%20wedding%20album%20proofing%20status."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg"
                >
                  <span>WhatsApp Studio</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {verifications.map((verif) => {
                const badge = VERIF_BADGES[verif.status] || VERIF_BADGES.pending;
                const hasAlbum = Boolean(verif.album_pages?.length > 0 || verif.album_title);
                const hasPhotos = Boolean(verif.photo_items?.length > 0);

                return (
                  <div
                    key={verif.id}
                    className="bg-[#18202F] border border-[#C5A880]/20 rounded-2xl sm:rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between shadow-2xl hover:border-[#C5A880]/50 transition-all duration-300 group"
                  >
                    {/* Top status header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <p className="text-[11px] text-[#A09585]">{badge.sub}</p>
                      </div>

                      <span className="text-[10px] font-mono text-white/40">
                        {new Date(verif.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Main Title & Assets details */}
                    <div className="space-y-3">
                      <h4 className="font-serif text-xl sm:text-2xl text-white font-medium group-hover:text-[#C5A880] transition-colors">
                        {verif.album_title || verif.event_title || 'Color Lab Proofing'}
                      </h4>
                      <p className="text-xs text-white/60">{verif.event_title}</p>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-white/70">
                        {hasAlbum && (
                          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                            <BookOpen className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>{verif.album_pages?.length || 0} Pages (Flipbook)</span>
                          </div>
                        )}

                        {hasPhotos && (
                          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>{verif.photo_items?.length || 0} Proof Photos</span>
                          </div>
                        )}

                        {(verif.verification_link || verif.drive_link) && (
                          <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-lg animate-pulse">
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <span>Verification Link Attached</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client Note / Revisions Notice if any */}
                    {verif.status === 'changes_requested' && verif.client_note && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-rose-300 text-[10px] uppercase">Your Revision Note:</p>
                        <p className="text-white/80 italic line-clamp-2">"{verif.client_note}"</p>
                        {verif.flagged_items?.length > 0 && (
                          <p className="text-[10px] text-rose-400 font-mono">
                            {verif.flagged_items.length} item(s) flagged for revision
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-2">
                      {/* 1. Direct Verification Link Button */}
                      {(verif.verification_link || verif.drive_link) && (
                        <a
                          href={verif.verification_link || verif.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98] group/link"
                        >
                          <ExternalLink className="w-4 h-4 text-white group-hover/link:scale-110 transition-transform" />
                          <span>Open Verification / Approval Link</span>
                          <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">OPEN ↗</span>
                        </a>
                      )}

                      {/* 2. In-App Flipbook Proof Viewer Button */}
                      {(hasAlbum || hasPhotos) && (
                        <button
                          onClick={() => setActiveVerification(verif)}
                          className={`w-full py-3 px-5 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                            verif.status === 'approved'
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                              : 'bg-[#C5A880] hover:bg-[#D4BC9A] text-black'
                          }`}
                        >
                          {verif.status === 'approved' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>View Approved Proof</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4" />
                              <span>Review & Proof Album</span>
                            </>
                          )}
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ═══════ REVISION FEEDBACK MODAL ═══════ */}
        {revisionModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <MessageSquare className="w-5 h-5" />
                  <span>Request Changes / Send Feedback</span>
                </div>
                <button
                  onClick={() => setRevisionModalItem(null)}
                  className="p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-white/70">
                    What changes or adjustments would you like the studio to make?
                  </label>
                  <textarea
                    rows={4}
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    placeholder="e.g. Please swap photo #3 on page 2, brighten the family portraits, or adjust the cover typography..."
                    className="w-full p-3 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevisionModalItem(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send to Studio</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══════ COLOR LAB VERIFICATION VIEWER MODAL ═══════ */}
        {activeVerification && (
          <ColorLabVerificationViewer
            verification={activeVerification}
            onClose={() => setActiveVerification(null)}
            onStatusUpdated={(updated) => {
              setVerifications(verifications.map(v => v.id === updated.id ? updated : v));
            }}
          />
        )}



      </main>

    </div>
  );
}
