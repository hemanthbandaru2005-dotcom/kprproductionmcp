import React, { useState, useRef, useEffect, forwardRef, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  Flag, MessageSquare, BookOpen, Image as ImageIcon, Layers,
  Send, Loader2, ZoomIn, ZoomOut, Check, Lock, Sparkles,
  HardDrive, ExternalLink
} from 'lucide-react';
import { updateVerificationStatus } from '../../utils/verificationService';

/* ─────────────────────────────────────────────────────
   Individual Page Component for Flipbook Proofing
   ───────────────────────────────────────────────────── */
const ProofPage = forwardRef(({ src, pageIndex, isFlagged, onToggleFlag, readOnly }, ref) => {
  return (
    <div ref={ref} className="page-wrapper select-none" data-density="soft">
      <div className="w-full h-full bg-white p-2 sm:p-3 overflow-hidden relative shadow-md">
        <img
          src={src}
          alt={`Album page ${pageIndex + 1}`}
          className="w-full h-full object-cover rounded-sm"
          draggable={false}
        />

        {/* Top-Right Page Flagging Overlay Button */}
        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFlag(pageIndex + 1);
            }}
            className={`absolute top-4 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              isFlagged
                ? 'bg-rose-500 text-white shadow-rose-500/40 ring-2 ring-white'
                : 'bg-black/60 hover:bg-black text-white/80 hover:text-white backdrop-blur-md'
            }`}
          >
            <Flag className={`w-3 h-3 ${isFlagged ? 'fill-current' : ''}`} />
            <span>{isFlagged ? 'Flagged' : 'Flag Page'}</span>
          </button>
        )}

        {readOnly && isFlagged && (
          <div className="absolute top-4 right-5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1.5 shadow-md">
            <Flag className="w-3 h-3 fill-current" />
            <span>Flagged</span>
          </div>
        )}

        {/* Page Number Watermark */}
        <span className="absolute bottom-4 right-5 text-[10px] text-white/70 font-mono select-none drop-shadow-md bg-black/40 px-2 py-0.5 rounded">
          Page {pageIndex + 1}
        </span>
      </div>
    </div>
  );
});

ProofPage.displayName = 'ProofPage';

function useWindowSize() {
  const [size, setSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

export default function ColorLabVerificationViewer({ verification, onClose, onStatusUpdated }) {
  const flipBookRef = useRef(null);
  const { w: vw, h: vh } = useWindowSize();
  const isMobile = vw < 768;

  const hasAlbum = Boolean(verification?.album_pages && verification.album_pages.length > 0);
  const hasPhotos = Boolean(verification?.photo_items && verification.photo_items.length > 0);

  // Active View Tab: 'album' | 'photos'
  const [activeTab, setActiveTab] = useState(hasAlbum ? 'album' : 'photos');

  // Flagged tracking
  const [flaggedPages, setFlaggedPages] = useState([]);
  const [flaggedPhotoIds, setFlaggedPhotoIds] = useState([]);

  // Flipbook state
  const [currentPage, setCurrentPage] = useState(0);

  // Modals & submission state
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const isApproved = verification?.status === 'approved';

  // Load any previously saved flags
  useEffect(() => {
    if (verification?.flagged_items) {
      const pageFlags = [];
      const photoFlags = [];
      verification.flagged_items.forEach(item => {
        if (typeof item === 'string' && item.startsWith('Page ')) {
          const num = parseInt(item.replace('Page ', ''), 10);
          if (!isNaN(num)) pageFlags.push(num);
        } else {
          photoFlags.push(item);
        }
      });
      setFlaggedPages(pageFlags);
      setFlaggedPhotoIds(photoFlags);
    }
  }, [verification]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const togglePageFlag = (pageNumber) => {
    if (isApproved) return;
    if (flaggedPages.includes(pageNumber)) {
      setFlaggedPages(flaggedPages.filter(p => p !== pageNumber));
    } else {
      setFlaggedPages([...flaggedPages, pageNumber]);
    }
  };

  const togglePhotoFlag = (photoId) => {
    if (isApproved) return;
    if (flaggedPhotoIds.includes(photoId)) {
      setFlaggedPhotoIds(flaggedPhotoIds.filter(id => id !== photoId));
    } else {
      setFlaggedPhotoIds([...flaggedPhotoIds, photoId]);
    }
  };

  // Compile all flagged items
  const getAllFlaggedItems = () => {
    const list = [];
    flaggedPages.forEach(p => list.push(`Page ${p}`));
    flaggedPhotoIds.forEach(id => {
      const pObj = verification.photo_items?.find(p => p.id === id);
      list.push(pObj ? `Photo: ${pObj.title}` : `Photo ID: ${id}`);
    });
    return list;
  };

  // ── 1. APPROVE FLOW ──
  const handleApprove = async () => {
    if (isApproved) return;
    setSubmitting(true);
    setErrorMsg('');

    const res = await updateVerificationStatus(verification.id, {
      status: 'approved',
      client_note: null,
      flagged_items: []
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessToast('Album successfully approved! Our Color Lab is finalizing your prints.');
      if (onStatusUpdated) onStatusUpdated(res.data);
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  // ── 2. REQUEST CHANGES FLOW ──
  const handleSubmitChanges = async (e) => {
    e.preventDefault();
    if (!clientNote || clientNote.trim().length < 5) {
      setErrorMsg('Please write a brief note explaining the requested adjustments.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const allFlags = getAllFlaggedItems();

    const res = await updateVerificationStatus(verification.id, {
      status: 'changes_requested',
      client_note: clientNote.trim(),
      flagged_items: allFlags
    });

    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setChangeModalOpen(false);
      setSuccessToast('Revision request sent to the studio! Our design team will update your proof.');
      if (onStatusUpdated) onStatusUpdated(res.data);
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  // Dimensions for Flipbook
  const pages = verification?.album_pages || [];
  const totalPages = pages.length;

  const topPad = 60;
  const bottomPad = 80;
  const availH = vh - topPad - bottomPad;
  const availW = vw - (isMobile ? 32 : 120);

  let bookWidth, bookHeight;
  if (isMobile) {
    bookWidth = availW;
    bookHeight = Math.min(Math.round(bookWidth * 1.35), availH);
  } else {
    bookHeight = Math.min(availH, 620);
    bookWidth = Math.round(bookHeight * 0.72);
    if (bookWidth * 2 > availW) {
      bookWidth = Math.floor(availW / 2);
      bookHeight = Math.round(bookWidth / 0.72);
    }
  }

  bookWidth = Math.max(bookWidth, 180);
  bookHeight = Math.max(bookHeight, 260);

  const totalFlaggedCount = flaggedPages.length + flaggedPhotoIds.length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col bg-black/95 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* ═══════ 1. TOP HEADER TOOLBAR ═══════ */}
        <div className="w-full h-16 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between bg-[#111827] shrink-0 z-20">
          
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center">
              {hasAlbum ? <BookOpen className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {verification?.album_title || verification?.event_title || 'Color Lab Proofing'}
              </h3>
              <p className="text-[10px] text-white/50">{verification?.event_title}</p>
            </div>
          </div>

          {/* Center: Tab Switcher (if both album + reference photos exist) */}
          {hasAlbum && hasPhotos && (
            <div className="hidden sm:flex items-center p-1 bg-white/5 rounded-full border border-white/10">
              <button
                onClick={() => setActiveTab('album')}
                className={`px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'album' ? 'bg-[#C5A880] text-black shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Album Flipbook</span>
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'photos' ? 'bg-[#C5A880] text-black shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Reference Photos ({verification.photo_items.length})</span>
              </button>
            </div>
          )}

          {/* Right: Verification / Drive Link Access (if included) + Close button */}
          <div className="flex items-center gap-2.5">
            {(verification?.verification_link || verification?.drive_link) && (
              <a
                href={verification.verification_link || verification.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg group/link"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover/link:scale-110 transition-transform" />
                <span>Open Verification Link ↗</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════ 2. MAIN REVIEW CONTENT ═══════ */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 relative">

          {/* SUCCESS TOAST */}
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 z-50 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{successToast}</span>
            </motion.div>
          )}

          {/* ──── TAB A: ALBUM FLIPBOOK ──── */}
          {activeTab === 'album' && hasAlbum && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              
              {/* Flip navigation arrow left */}
              {!isMobile && (
                <button
                  onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                  className="absolute left-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Flipbook Container */}
              <div className="flex items-center justify-center">
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={bookWidth}
                  height={bookHeight}
                  size="fixed"
                  minWidth={180}
                  maxWidth={700}
                  minHeight={260}
                  maxHeight={900}
                  showCover={true}
                  flippingTime={800}
                  usePortrait={isMobile}
                  startZIndex={1}
                  autoSize={true}
                  maxShadowOpacity={0.5}
                  showPageCorners={true}
                  className="shadow-2xl rounded-sm"
                  onFlip={(e) => setCurrentPage(e.data)}
                >
                  {pages.map((pageSrc, idx) => (
                    <ProofPage
                      key={idx}
                      src={pageSrc}
                      pageIndex={idx}
                      isFlagged={flaggedPages.includes(idx + 1)}
                      onToggleFlag={togglePageFlag}
                      readOnly={isApproved}
                    />
                  ))}
                </HTMLFlipBook>
              </div>

              {/* Flip navigation arrow right */}
              {!isMobile && (
                <button
                  onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                  className="absolute right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Page Indicator */}
              <div className="mt-3 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs font-mono text-white/70">
                {isMobile ? `Page ${currentPage + 1} of ${totalPages}` : `Page ${currentPage + 1}-${Math.min(currentPage + 2, totalPages)} of ${totalPages}`}
              </div>
            </div>
          )}

          {/* ──── TAB B: LOOSE REFERENCE PHOTOS GRID ──── */}
          {activeTab === 'photos' && hasPhotos && (
            <div className="w-full max-w-5xl mx-auto py-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Select or Flag Individual Proofs
                </h4>
                <span className="text-xs text-[#C5A880]">
                  {flaggedPhotoIds.length} flagged for adjustment
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {verification.photo_items.map((photo) => {
                  const isFlagged = flaggedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className="group relative bg-[#1E2937] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-black">
                        <img
                          src={photo.src}
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-white truncate max-w-[130px]">
                          {photo.title}
                        </span>

                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => togglePhotoFlag(photo.id)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              isFlagged
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
                            }`}
                            title={isFlagged ? 'Flagged for changes' : 'Flag this photo'}
                          >
                            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ═══════ 3. BOTTOM APPROVAL & ACTION BAR ═══════ */}
        <div className="w-full border-t border-white/10 bg-[#111827] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-20">
          
          {/* Left status / flag counters */}
          <div className="flex items-center gap-3">
            {isApproved ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
                <span>Verification Approved & Finalized</span>
              </div>
            ) : totalFlaggedCount > 0 ? (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                <Flag className="w-3.5 h-3.5 fill-current" />
                <span>{totalFlaggedCount} item(s) flagged for changes</span>
              </div>
            ) : (
              <span className="text-xs text-white/50">
                Review pages above and mark any items that need changes.
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          {!isApproved ? (
            <div className="flex items-center gap-3">
              {/* Request Changes Button */}
              <button
                onClick={() => setChangeModalOpen(true)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 border border-white/15 hover:border-rose-500/40 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Request Changes</span>
              </button>

              {/* Approve Button */}
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-7 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>{hasAlbum ? 'Approve Album' : 'Approve All'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-only mode</span>
            </div>
          )}
        </div>

        {/* ═══════ 4. REQUEST CHANGES MODAL ═══════ */}
        {changeModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-white">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Request Revisions</span>
                </div>
                <button
                  onClick={() => setChangeModalOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Flagged items summary */}
              {totalFlaggedCount > 0 ? (
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 space-y-1">
                  <p className="text-[11px] font-bold text-[#C5A880] uppercase tracking-wider flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5" />
                    Items Attached for Fixes ({totalFlaggedCount}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {getAllFlaggedItems().map((flag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/50">
                  Tip: You can flag specific pages in the flipbook so our designers know exactly which photos to update.
                </p>
              )}

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                  What changes or retouching would you like? <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please swap the photo on page 4 with the sunset portrait, and warm up the tone on the mandap photo..."
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  className="w-full p-3.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880] resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChangeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitChanges}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Changes
                </button>
              </div>

            </div>
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}
