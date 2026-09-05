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
    <div ref={ref} className="page-wrapper select-none bg-[#FCFBF9] shadow-lg relative overflow-hidden" data-density="soft">
      <div className="w-full h-full p-2 sm:p-3.5 flex flex-col items-center justify-center relative bg-gradient-to-r from-[#ECE4D8]/80 via-[#FAF7F2] to-[#FAF7F2] border border-[#DCD2C3]">
        {/* Full Image Container — object-contain ensures no photo is cropped or cut */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xs bg-black/5">
          <img
            src={src}
            alt={`Album page ${pageIndex + 1}`}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xs shadow-xs select-none"
            draggable={false}
          />
        </div>

        {/* Top-Right Page Flagging Overlay Button */}
        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFlag(pageIndex + 1);
            }}
            className={`absolute top-3.5 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isFlagged
                ? 'bg-[#DC2626] text-white shadow-rose-500/40 ring-2 ring-white'
                : 'bg-[#141414]/85 hover:bg-[#141414] text-white backdrop-blur-xs'
            }`}
          >
            <Flag className={`w-3 h-3 ${isFlagged ? 'fill-current' : ''}`} />
            <span>{isFlagged ? 'Flagged' : 'Flag Page'}</span>
          </button>
        )}

        {readOnly && isFlagged && (
          <div className="absolute top-3.5 right-4 px-3 py-1 rounded-full text-[10px] font-bold bg-[#DC2626] text-white flex items-center gap-1.5 shadow-md">
            <Flag className="w-3 h-3 fill-current" />
            <span>Flagged</span>
          </div>
        )}

        {/* Page Number Watermark */}
        <span className="absolute bottom-2.5 right-3.5 text-[9.5px] text-[#4A3B2C]/80 font-mono select-none bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs border border-[#D5C9B8]">
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

  const getAllFlaggedItems = () => {
    const list = [];
    flaggedPages.forEach(p => list.push(`Page ${p}`));
    flaggedPhotoIds.forEach(id => {
      const pObj = verification.photo_items?.find(p => p.id === id);
      list.push(pObj ? `Photo: ${pObj.title}` : `Photo ID: ${id}`);
    });
    return list;
  };

  // 1. APPROVE FLOW
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

  // 2. REQUEST CHANGES FLOW
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

  const topPad = 64;
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
        className="fixed inset-0 z-[9999] flex flex-col bg-black/70 backdrop-blur-xs text-[#111111]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* ═══════ 1. TOP HEADER TOOLBAR ═══════ */}
        <div className="w-full h-16 border-b border-[#E7E8EB] px-4 sm:px-8 flex items-center justify-between bg-white shrink-0 z-20 shadow-xs">
          
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
              {hasAlbum ? <BookOpen className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#111111] tracking-tight truncate max-w-xs sm:max-w-md">
                  {verification?.album_title || verification?.event_title || 'Color Lab Proofing'}
                </h3>
                {verification?.album_size && (
                  <span className="px-2 py-0.5 bg-[#C5A880]/20 text-[#8B6B38] border border-[#C5A880]/40 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                    {verification.album_size}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B7280]">{verification?.event_title}</p>
            </div>
          </div>

          {/* Center: Tab Switcher */}
          {hasAlbum && hasPhotos && (
            <div className="hidden sm:flex items-center p-1 bg-[#F7F8FA] rounded-full border border-[#E7E8EB]">
              <button
                onClick={() => setActiveTab('album')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'album' ? 'bg-[#141414] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Album Flipbook</span>
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'photos' ? 'bg-[#141414] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Reference Photos ({verification.photo_items.length})</span>
              </button>
            </div>
          )}

          {/* Right: Close button */}
          <div className="flex items-center gap-2.5">
            {(verification?.verification_link || verification?.drive_link) && (
              <a
                href={verification.verification_link || verification.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full bg-[#1E74FF] hover:bg-blue-600 text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verification Link ↗</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══════ 2. MAIN REVIEW CONTENT ═══════ */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 relative bg-[#F3F4F6]">

          {/* SUCCESS TOAST */}
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 z-50 px-6 py-3 rounded-full bg-[#13A52D] text-white font-bold text-xs shadow-xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{successToast}</span>
            </motion.div>
          )}

          {/* ──── TAB A: ALBUM FLIPBOOK ──── */}
          {activeTab === 'album' && hasAlbum && (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
              
              {/* Flip navigation arrow left */}
              <button
                onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                className="absolute left-2 sm:left-6 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-[#111111] border border-[#E7E8EB] flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer backdrop-blur-xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Mobile Touch Half-Screen Tap Zones for 1-Tap Page Turning */}
              {isMobile && (
                <>
                  <div
                    onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
                    className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer"
                    title="Tap for previous page"
                  />
                  <div
                    onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                    className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer"
                    title="Tap for next page"
                  />
                </>
              )}

              {/* Flipbook Container */}
              <div className="flex items-center justify-center drop-shadow-2xl">
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={bookWidth}
                  height={bookHeight}
                  size="fixed"
                  minWidth={180}
                  maxWidth={800}
                  minHeight={260}
                  maxHeight={800}
                  maxShadowOpacity={0.5}
                  showCover={true}
                  mobileScrollSupport={false}
                  usePortrait={isMobile}
                  startPage={0}
                  swipeDistance={15}
                  flippingTime={650}
                  onFlip={(e) => setCurrentPage(e.data)}
                  className="shadow-2xl rounded-sm overflow-hidden"
                >
                  {pages.map((p, idx) => (
                    <ProofPage
                      key={p.id || idx}
                      src={p.url || p.file_path || p}
                      pageIndex={idx}
                      isFlagged={flaggedPages.includes(idx + 1)}
                      onToggleFlag={togglePageFlag}
                      readOnly={isApproved}
                    />
                  ))}
                </HTMLFlipBook>
              </div>

              {/* Flip navigation arrow right */}
              <button
                onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
                className="absolute right-2 sm:right-6 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-[#111111] border border-[#E7E8EB] flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer backdrop-blur-xs"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Page Counter & Controls */}
              <div className="mt-4 flex items-center gap-3 bg-white px-4 py-1.5 sm:py-2 rounded-full shadow-xs border border-[#E7E8EB] text-xs z-30">
                <span className="font-mono text-[#6B7280]">
                  {isMobile ? 'Page' : 'Spread'} <strong className="text-[#111111]">{currentPage + 1}</strong> of <strong className="text-[#111111]">{totalPages}</strong>
                </span>
                {verification?.album_size && (
                  <span className="text-[#C5A880] font-bold font-mono">
                    ({verification.album_size})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ──── TAB B: REFERENCE PHOTOS GRID ──── */}
          {activeTab === 'photos' && hasPhotos && (
            <div className="w-full max-w-5xl h-full p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {verification.photo_items.map((photo) => {
                  const isFlagged = flaggedPhotoIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => togglePhotoFlag(photo.id)}
                      className={`relative rounded-2xl overflow-hidden bg-white border-2 p-1.5 transition-all cursor-pointer shadow-xs ${
                        isFlagged
                          ? 'border-[#DC2626] ring-2 ring-[#DC2626]/30'
                          : 'border-[#E7E8EB] hover:border-[#141414]'
                      }`}
                    >
                      <div className="h-44 rounded-xl overflow-hidden bg-[#F7F8FA]">
                        <img
                          src={photo.url || photo.file_path}
                          alt={photo.title || 'Photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#111111] truncate">{photo.title || 'Photo item'}</span>
                        {!isApproved && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFlagged ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F2F4] text-[#6B7280]'
                          }`}>
                            {isFlagged ? 'Flagged' : 'Flag'}
                          </span>
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
        <div className="w-full border-t border-[#E7E8EB] bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-20 shadow-xs">
          
          {/* Left status / flag counters */}
          <div className="flex items-center gap-3">
            {isApproved ? (
              <div className="flex items-center gap-2 text-[#13A52D] font-bold text-xs bg-[#DFF5E3] px-3.5 py-1.5 rounded-full border border-[#BBF7D0]">
                <CheckCircle className="w-4 h-4" />
                <span>Verification Approved & Finalized</span>
              </div>
            ) : totalFlaggedCount > 0 ? (
              <div className="flex items-center gap-2 text-[#DC2626] font-bold text-xs bg-[#FEF2F2] px-3.5 py-1.5 rounded-full border border-[#FCA5A5]">
                <Flag className="w-3.5 h-3.5 fill-current" />
                <span>{totalFlaggedCount} item(s) flagged for changes</span>
              </div>
            ) : (
              <span className="text-xs text-[#6B7280]">
                Review pages above and mark any items that need changes.
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          {!isApproved ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChangeModalOpen(true)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <span>Request Changes</span>
              </button>

              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-7 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-[#13A52D]" />}
                <span>{hasAlbum ? 'Approve Album' : 'Approve All'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#9CA0A6]">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-only finalized mode</span>
            </div>
          )}
        </div>

        {/* ═══════ 4. REQUEST CHANGES MODAL ═══════ */}
        {changeModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border border-[#E7E8EB] rounded-[24px] sm:rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-[#111111]">
              
              <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3">
                <div className="flex items-center gap-2 text-[#DC2626] font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Request Revisions</span>
                </div>
                <button
                  onClick={() => setChangeModalOpen(false)}
                  className="p-1.5 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Flagged items summary */}
              {totalFlaggedCount > 0 ? (
                <div className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] space-y-1">
                  <p className="text-[11px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-[#DC2626]" />
                    Items Attached for Fixes ({totalFlaggedCount}):
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {getAllFlaggedItems().map((flag, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[10px] font-mono border border-[#FCA5A5] font-bold">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#6B7280]">
                  Tip: You can flag specific pages in the flipbook so our designers know exactly which photos to update.
                </p>
              )}

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                  What changes or retouching would you like? <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please swap the photo on page 4 with the sunset portrait, and warm up the tone on the mandap photo..."
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  className="w-full p-3.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-2xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] resize-none"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-[#DC2626] font-semibold">{errorMsg}</p>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChangeModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitChanges}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-2"
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
