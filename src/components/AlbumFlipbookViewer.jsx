import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Grid3X3, Play, Pause,
  ZoomIn, ZoomOut, BookOpen, Sparkles
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Helper to compute single-page aspect ratio from physical size
   ───────────────────────────────────────────────────── */
function getPageAspectRatio(sizeStr) {
  if (!sizeStr) return 0.75;
  const clean = String(sizeStr).toLowerCase().replace(/\s+/g, '');
  if (clean === '12x36') return 1.5;   // 18w / 12h per page (36x12 full spread)
  if (clean === '13x39') return 1.5;   // 19.5w / 13h per page (39x13 full spread)
  if (clean === '14x40') return 1.43;  // 20w / 14h per page (40x14 full spread)
  if (clean === '16x24') return 0.75;  // 12w / 16h per page (portrait)
  if (clean === '18x24') return 0.67;  // 12w / 18h per page (portrait)
  if (clean === '12x24') return 1.0;   // 12w / 12h per page (square)
  return 0.75;
}

/* ─────────────────────────────────────────────────────
   Luxury Leatherette Front Cover Page
   ───────────────────────────────────────────────────── */
const CoverPage = forwardRef(({ title, size, totalPhotos, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden ${props.className || ''}`}
      data-density="hard"
    >
      <div className="w-full h-full bg-gradient-to-br from-[#1C1814] via-[#26201A] to-[#120F0C] flex flex-col items-center justify-center p-3 sm:p-8 relative overflow-hidden shadow-2xl border-r-2 border-r-[#C5A880]/40">
        {/* Leather grain subtle texture */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none" />

        {/* Gold hot-stamped ornate borders */}
        <div className="absolute inset-2 sm:inset-4 border border-[#C5A880]/40 rounded-xs pointer-events-none" />
        <div className="absolute inset-3 sm:inset-5.5 border border-[#C5A880]/20 rounded-xs pointer-events-none" />

        {/* Corner filigree accents */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-3.5 h-3.5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-[#C5A880]/70" />
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-3.5 h-3.5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-[#C5A880]/70" />
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-3.5 h-3.5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-[#C5A880]/70" />
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-3.5 h-3.5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-[#C5A880]/70" />

        {/* Cover Content */}
        <div className="text-center z-10 space-y-1.5 sm:space-y-4 px-2">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[#C5A880]/80">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#C5A880]" />
            <span className="text-[8px] sm:text-[11px] uppercase font-bold tracking-[0.2em] text-[#C5A880]">
              Heirloom Photobook
            </span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#C5A880]" />
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-[#C5A880]/60 mx-auto" />

          <h2 className="font-serif text-xs sm:text-2xl md:text-3xl text-[#F7F1E5] tracking-wide leading-tight drop-shadow-md uppercase px-1 line-clamp-2">
            {title || 'Luxury Wedding Album'}
          </h2>

          {size && (
            <div className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#C5A880]/25 border border-[#C5A880]/50 text-[#F5E6D0] text-[9px] sm:text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
              {size} LAYFLAT SPREAD
            </div>
          )}

          <div className="w-8 sm:w-16 h-0.5 bg-[#C5A880]/60 mx-auto" />

          <p className="text-[#D5C4A6]/70 text-[7.5px] sm:text-[10px] tracking-widest uppercase">
            {totalPhotos} {totalPhotos === 1 ? 'Page' : 'Pages'} · Archival Silk Print
          </p>

          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[7.5px] sm:text-[10px] text-[#C5A880] font-semibold tracking-wider bg-black/40 px-2 py-0.5 rounded-full border border-[#C5A880]/30 animate-pulse">
              Tap / Swipe to Open →
            </span>
          </div>
        </div>

        {/* Footer branding */}
        <div className="absolute bottom-1.5 sm:bottom-4 text-center">
          <p className="text-[#C5A880]/50 text-[6.5px] sm:text-[8px] tracking-[0.3em] uppercase font-bold select-none">
            KPR COLOR LAB & STUDIO
          </p>
        </div>
      </div>
    </div>
  );
});
CoverPage.displayName = 'CoverPage';

/* ─────────────────────────────────────────────────────
   Inside Photo Page with Spine Shadow & No-Crop Containment
   ───────────────────────────────────────────────────── */
const PhotoPage = forwardRef(({ src, pageIndex, totalPhotos, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FCFBF9] shadow-md ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className={`w-full h-full p-1 sm:p-2.5 flex flex-col items-center justify-center relative border border-[#DCD2C3] ${
          isLeftPage
            ? 'bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5] to-[#E5DACB]/80 border-r-2 border-r-[#BFB19E]'
            : 'bg-gradient-to-r from-[#E5DACB]/80 via-[#FAF8F5] to-[#FAF8F5] border-l-2 border-l-[#BFB19E]'
        }`}
      >
        {/* Center Spine Crease / Binding Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-6 bg-gradient-to-l from-black/20 via-black/5 to-transparent'
              : 'left-0 w-3 sm:w-6 bg-gradient-to-r from-black/20 via-black/5 to-transparent'
          }`}
        />

        {/* Photo Canvas Area — object-contain guarantees full photo is visible without cutting */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xs bg-[#111111]/[0.02] border border-[#EBE4D8]/80">
          <img
            src={src}
            alt={`Album page ${pageIndex + 1}`}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xs select-none pointer-events-none transition-transform duration-300 drop-shadow-xs"
            draggable={false}
          />
        </div>

        {/* Page Number Watermark Badge */}
        <span
          className={`absolute bottom-1 sm:bottom-2 text-[7.5px] sm:text-[9.5px] text-[#5A4836] font-mono select-none bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs z-20 ${
            isLeftPage ? 'left-1.5 sm:left-3' : 'right-1.5 sm:right-3'
          }`}
        >
          {pageIndex + 1}
        </span>
      </div>
    </div>
  );
});
PhotoPage.displayName = 'PhotoPage';

/* ─────────────────────────────────────────────────────
   Endsheet Page (Balances odd spreads)
   ───────────────────────────────────────────────────── */
const EndsheetPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] shadow-md ${props.className || ''}`}
      data-density="soft"
    >
      <div className="w-full h-full p-3 sm:p-6 flex flex-col items-center justify-center relative bg-gradient-to-r from-[#E5DACB]/80 via-[#FAF8F5] to-[#FAF8F5] border-l-2 border-l-[#BFB19E] border border-[#DCD2C3]">
        <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-6 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none z-10" />
        <div className="text-center space-y-1.5 sm:space-y-2 z-10">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center mx-auto text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-serif text-xs sm:text-base text-[#4A3B2C] tracking-wide">
            Cherished Memories
          </h4>
          <p className="text-[7.5px] sm:text-[9.5px] text-[#7A6B5C] font-mono uppercase tracking-widest">
            Preserved for Generations
          </p>
        </div>
      </div>
    </div>
  );
});
EndsheetPage.displayName = 'EndsheetPage';

/* ─────────────────────────────────────────────────────
   Luxury Leatherette Back Cover Page
   ───────────────────────────────────────────────────── */
const BackCoverPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden ${props.className || ''}`}
      data-density="hard"
    >
      <div className="w-full h-full bg-gradient-to-br from-[#1C1814] via-[#26201A] to-[#120F0C] flex flex-col items-center justify-center p-3 sm:p-8 relative overflow-hidden shadow-2xl border-l-2 border-l-[#C5A880]/40">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none" />
        <div className="absolute inset-2 sm:inset-4 border border-[#C5A880]/40 rounded-xs pointer-events-none" />

        <div className="text-center z-10 space-y-1.5 sm:space-y-3">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center mx-auto text-[#E8D4B8] shadow-inner">
            <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-[#C5A880]" />
          </div>
          <h3 className="font-serif text-[11px] sm:text-lg text-[#F4ECD8] tracking-widest uppercase">
            KPR Color Lab
          </h3>
          <p className="text-[#C5A880] text-[7.5px] sm:text-[9.5px] tracking-[0.25em] uppercase font-semibold">
            Archival Quality Certified
          </p>
          <div className="w-6 sm:w-12 h-0.5 bg-[#C5A880]/50 mx-auto" />
          <p className="text-[#D5C4A6]/60 text-[6.5px] sm:text-[8.5px] tracking-wider uppercase">
            100% Layflat · HD Color Proof
          </p>
        </div>
      </div>
    </div>
  );
});
BackCoverPage.displayName = 'BackCoverPage';

/* ─────────────────────────────────────────────────────
   useWindowSize hook — tracks viewport dimensions live
   ───────────────────────────────────────────────────── */
function useWindowSize() {
  const [size, setSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1400,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

/* ─────────────────────────────────────────────────────
   AlbumFlipbookViewer — Full-Page Modal Component
   ───────────────────────────────────────────────────── */
export default function AlbumFlipbookViewer({ images = [], title = 'Luxury Wedding Album', size = '', onClose }) {
  const flipBook = useRef(null);
  const autoplayTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  const { w: vw, h: vh } = useWindowSize();
  const safeImages = Array.isArray(images)
    ? images.filter(img => typeof img === 'string' && img.trim().length > 0)
    : [];
  const totalPhotos = safeImages.length;

  /* ── Lock body scroll when viewer is open ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevMinW = document.body.style.minWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.minWidth = '0';
    return () => {
      document.body.style.overflow = prev;
      document.body.style.minWidth = prevMinW;
    };
  }, []);

  /* ── Autoplay logic — flips by 2 pages in 2-page spread mode ── */
  useEffect(() => {
    if (autoplay) {
      autoplayTimer.current = setInterval(() => {
        try {
          const pageFlip = flipBook.current?.pageFlip?.();
          if (pageFlip) {
            const current = pageFlip.getCurrentPageIndex();
            const total = pageFlip.getPageCount();
            if (current >= total - 2) {
              pageFlip.flip(0);
            } else {
              pageFlip.flipNext();
            }
          }
        } catch (e) {
          console.warn('PageFlip autoplay tick note:', e);
        }
      }, 3400);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [autoplay]);

  /* ── Pause autoplay on manual interaction ── */
  const pauseAutoplay = useCallback(() => {
    if (autoplay) {
      setAutoplay(false);
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    }
  }, [autoplay]);

  /* ── Page flip handlers ── */
  const handleFlipPrev = () => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flipPrev();
    } catch (e) {
      console.warn('flipPrev note:', e);
    }
  };

  const handleFlipNext = () => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flipNext();
    } catch (e) {
      console.warn('flipNext note:', e);
    }
  };

  const handlePageFlip = (e) => {
    if (e && typeof e.data === 'number') {
      setCurrentPage(e.data);
    }
  };

  const goToPage = (pageNum) => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flip(pageNum);
    } catch (e) {
      console.warn('goToPage note:', e);
    }
    setShowThumbnails(false);
  };

  /* ── Mobile Touch Swipe Listeners ── */
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        handleFlipNext();
      } else {
        handleFlipPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  /* ── Dynamic Page Counter Label ── */
  const getPageLabel = () => {
    if (currentPage === 0) {
      return 'Cover · Tap or swipe to open';
    }
    const maxPhoto = totalPhotos;
    const leftPhoto = currentPage;
    const rightPhoto = currentPage + 1;

    if (leftPhoto > maxPhoto) {
      return 'Back Cover · Archival Quality';
    }
    if (rightPhoto > maxPhoto) {
      return `Page ${leftPhoto} of ${maxPhoto}`;
    }
    return `Pages ${leftPhoto} & ${rightPhoto} of ${maxPhoto}`;
  };

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') handleFlipPrev();
      else if (e.key === 'ArrowRight') handleFlipNext();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [autoplay]);

  if (!safeImages || safeImages.length === 0) return null;

  /* ── Responsive Dimensions Calculation for 2-Page Open Book Spread ── */
  const topPad = 52;
  const bottomPad = showThumbnails ? (isMobile ? 120 : 140) : 54;
  const sidePad = isMobile ? 8 : 40;

  const availW = Math.max(vw - sidePad * 2, 200);
  const availH = Math.max(vh - topPad - bottomPad, 180);

  const pageRatio = getPageAspectRatio(size);

  // In 2-page spread: total spread width = 2 * singlePageWidth
  let singlePageW = Math.floor(availW / 2);
  let singlePageH = Math.round(singlePageW / pageRatio);

  if (singlePageH > availH) {
    singlePageH = availH;
    singlePageW = Math.round(singlePageH * pageRatio);
    if (singlePageW * 2 > availW) {
      singlePageW = Math.floor(availW / 2);
      singlePageH = Math.round(singlePageW / pageRatio);
    }
  }

  singlePageW = Math.max(isNaN(singlePageW) ? 300 : singlePageW, 130);
  singlePageH = Math.max(isNaN(singlePageH) ? 200 : singlePageH, 140);

  /* Build guaranteed valid non-falsy children for HTMLFlipBook */
  const flipbookPages = [
    <CoverPage
      key="flip-cover"
      title={title}
      size={size}
      totalPhotos={totalPhotos}
    />,
    ...safeImages.map((src, i) => (
      <PhotoPage
        key={`flip-photo-${i}`}
        src={src}
        pageIndex={i}
        totalPhotos={totalPhotos}
        isLeftPage={i % 2 === 0}
      />
    )),
    ...(totalPhotos % 2 !== 0 ? [<EndsheetPage key="flip-endsheet" />] : []),
    <BackCoverPage key="flip-backcover" />
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden bg-black/95 select-none"
        style={{ width: '100vw', height: '100vh', minWidth: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Backdrop dismiss */}
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* ═══════ FULL-PAGE CONTENT ═══════ */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-between"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >

          {/* ── Top Toolbar ── */}
          <div className="w-full flex items-center justify-between px-3 sm:px-6 py-2.5 shrink-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10" style={{ height: `${topPad}px` }}>
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-5 h-5 text-[#C5A880] shrink-0" />
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider truncate">
                  {title}
                </span>
                {size && (
                  <span className="px-2 py-0.5 bg-[#C5A880] text-black text-[10px] font-bold font-mono rounded uppercase tracking-wider shadow-xs shrink-0">
                    {size}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Thumbnail toggle */}
              <button
                onClick={() => setShowThumbnails(t => !t)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showThumbnails
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                }`}
                title="Toggle thumbnails"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>

              {/* Zoom toggle */}
              <button
                onClick={() => setZoomed(z => !z)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  zoomed
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                }`}
                title={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>

              {/* Autoplay toggle */}
              <button
                onClick={() => setAutoplay(a => !a)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  autoplay
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                }`}
                title={autoplay ? 'Pause autoplay' : 'Start autoplay'}
              >
                {autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white transition-colors cursor-pointer ml-1 sm:ml-1.5"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Book Area — fills remaining vertical space ── */}
          <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden px-1 sm:px-2" style={{ minHeight: 0 }}>

            {/* Left Navigation Arrow */}
            <button
              onClick={handleFlipPrev}
              className="absolute left-1 sm:left-6 z-30 p-2 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm shadow-xl"
              title="Previous page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Mobile Touch Half-Screen Tap Zones for 1-Tap Page Turning */}
            {isMobile && (
              <>
                <div
                  onClick={handleFlipPrev}
                  className="absolute left-0 top-0 bottom-0 w-1/5 z-20 cursor-pointer"
                  title="Tap for previous page"
                />
                <div
                  onClick={handleFlipNext}
                  className="absolute right-0 top-0 bottom-0 w-1/5 z-20 cursor-pointer"
                  title="Tap for next page"
                />
              </>
            )}

            {/* 3D Physical Book Outer Casing Backdrop */}
            <motion.div
              animate={{ scale: zoomed ? 1.35 : 1 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="origin-center relative flex items-center justify-center p-1 sm:p-2 bg-[#171410] rounded-xs sm:rounded-md border border-[#C5A880]/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]"
              style={{ willChange: 'transform' }}
            >
              {/* Stacked Pages Thickness Edge shadow at bottom */}
              <div className="absolute -bottom-1 sm:-bottom-1.5 left-2 right-2 h-1 sm:h-1.5 bg-gradient-to-r from-[#D8CEBF] via-[#FAF7F2] to-[#D8CEBF] rounded-b-xs opacity-75 pointer-events-none" />

              <HTMLFlipBook
                key={`flipbook-${safeImages.length}-${isMobile}-${size}-${singlePageW}`}
                ref={flipBook}
                width={singlePageW}
                height={singlePageH}
                size="fixed"
                minWidth={130}
                maxWidth={1400}
                minHeight={140}
                maxHeight={1400}
                maxShadowOpacity={0.6}
                showCover={true}
                mobileScrollSupport={false}
                flippingTime={500}
                usePortrait={false}
                startPage={0}
                drawShadow={true}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={15}
                showPageCorners={true}
                disableFlipByClick={false}
                onFlip={handlePageFlip}
                className="album-flipbook-shadow"
              >
                {flipbookPages}
              </HTMLFlipBook>
            </motion.div>

            {/* Right Navigation Arrow */}
            <button
              onClick={handleFlipNext}
              className="absolute right-1 sm:right-6 z-30 p-2 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm shadow-xl"
              title="Next page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* ── Page Counter & Navigation Tip ── */}
          <div className="shrink-0 py-2 flex flex-col items-center gap-1 z-30">
            <div className="bg-black/70 backdrop-blur-md text-white text-xs sm:text-sm px-4 sm:px-5 py-1 sm:py-1.5 rounded-full border border-white/15 font-mono tracking-wider select-none shadow-sm flex items-center gap-2">
              <span>{getPageLabel()}</span>
              {size && (
                <span className="text-[#C5A880] text-[11px] font-bold">
                  ({size})
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 select-none">
              {isMobile ? 'Tap edges or swipe to flip · Rotate for wider view' : '← → arrow keys · click page edges to flip'}
            </p>
          </div>

          {/* ── Thumbnail Filmstrip ── */}
          <AnimatePresence>
            {showThumbnails && (
              <motion.div
                className="shrink-0 w-full bg-black/90 backdrop-blur-lg border-t border-white/10 z-40"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="flex gap-2.5 px-4 py-3 overflow-x-auto no-scrollbar">
                  {/* Cover thumbnail */}
                  <button
                    onClick={() => goToPage(0)}
                    className={`shrink-0 w-14 h-18 sm:w-20 sm:h-26 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-[#1C1814] flex flex-col items-center justify-center p-1 ${
                      currentPage === 0
                        ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/30 ring-2 ring-[#C5A880]/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    title="Cover"
                  >
                    <BookOpen className="w-4 h-4 text-[#C5A880]" />
                    <span className="text-[8px] text-[#C5A880] font-bold uppercase mt-1">Cover</span>
                  </button>

                  {/* Photo thumbnails */}
                  {safeImages.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i + 1)}
                      className={`shrink-0 w-14 h-18 sm:w-20 sm:h-26 rounded-md overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 bg-[#141414] ${
                        currentPage === i + 1 || (currentPage > 0 && Math.floor((currentPage - 1) / 2) === Math.floor(i / 2))
                          ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/30 ring-2 ring-[#C5A880]/50'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      title={`Page ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

