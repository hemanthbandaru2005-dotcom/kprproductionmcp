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
const CoverPage = forwardRef(({ title, size, totalPhotos, coverSrc, onOpen, ...props }, ref) => {
  const imgSrc = coverSrc || "/images/album/front_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#E8E2D8] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to open album"
      onClick={(e) => {
        props.onClick?.(e);
        onOpen?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r-2 border-r-[#8A7862]/40 bg-[#FAF7F2]">
        {/* Cover Artwork Image */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#FAF7F2]">
          <img
            src={imgSrc}
            alt="Wedding Photobook Front Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </div>

        {/* ── Realistic French Groove / Spine Hinge Indentation (Matches user sketch) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            left: 'clamp(14px, 7.5%, 22px)',
            width: '3.5px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.25) 100%)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.45)'
          }}
        />

        {/* ── Rounded Spine Backbone Lighting Roll (Left of groove) ── */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none z-20"
          style={{
            width: 'clamp(14px, 7.5%, 22px)',
            background: 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.45) 100%)'
          }}
        />

        {/* Hardcover Outer Bevel Edge */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]" />

        {/* Right Edge Stacked Page Thickness Highlight */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
});
CoverPage.displayName = 'CoverPage';

/* ─────────────────────────────────────────────────────
   Inside Photo Page: Full Bleed Edge-to-Edge with Spine Depth
   ───────────────────────────────────────────────────── */
const PhotoPage = forwardRef(({ src, pageIndex, totalPhotos, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] shadow-md ${props.className || ''}`}
      data-density="soft"
    >
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#FAF8F5]">
        {/* Full Bleed Image Edge-to-Edge with centered balance */}
        <img
          src={src}
          alt={`Album page ${pageIndex + 1}`}
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Center Spine Crease / Binding Depth Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-6 bg-gradient-to-l from-black/30 via-black/10 to-transparent'
              : 'left-0 w-3 sm:w-6 bg-gradient-to-r from-black/30 via-black/10 to-transparent'
          }`}
        />

        {/* Outer Fore-Edge Paper Highlight */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'left-0 w-1.5 bg-gradient-to-r from-black/15 to-transparent'
              : 'right-0 w-1.5 bg-gradient-to-l from-black/15 to-transparent'
          }`}
        />
      </div>
    </div>
  );
});
PhotoPage.displayName = 'PhotoPage';

/* ─────────────────────────────────────────────────────
   Endsheet Page (Balances odd spreads and creates luxury heirloom finish)
   ───────────────────────────────────────────────────── */
const EndsheetPage = forwardRef(({ isLeftPage = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] shadow-md ${props.className || ''}`}
      data-density="soft"
    >
      <div className={`w-full h-full p-3 sm:p-6 flex flex-col items-center justify-center relative bg-gradient-to-r from-[#E5DACB]/80 via-[#FAF8F5] to-[#FAF8F5] ${
        isLeftPage ? 'border-r-2 border-r-[#BFB19E]' : 'border-l-2 border-l-[#BFB19E]'
      } border border-[#DCD2C3]`}>
        <div className={`absolute top-0 bottom-0 ${isLeftPage ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} w-3 sm:w-6 from-black/20 via-black/5 to-transparent pointer-events-none z-10`} />
        <div className="text-center space-y-1.5 sm:space-y-2 z-10">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center mx-auto text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-serif text-xs sm:text-base text-[#4A3B2C] tracking-wide">
            {isLeftPage ? 'Cherished Memories' : 'Timeless Elegance'}
          </h4>
          <p className="text-[7.5px] sm:text-[9.5px] text-[#7A6B5C] font-mono uppercase tracking-widest">
            {isLeftPage ? 'Preserved for Generations' : 'KPR Productions · 2026'}
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
const BackCoverPage = forwardRef(({ onReopen, backCoverSrc, ...props }, ref) => {
  const imgSrc = backCoverSrc || "/images/album/back_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#E8E2D8] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to reopen album"
      onClick={(e) => {
        props.onClick?.(e);
        onReopen?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l-2 border-l-[#8A7862]/40 bg-[#FAF7F2]">
        {/* Back Cover Artwork Image */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#FAF7F2]">
          <img
            src={imgSrc}
            alt="Wedding Photobook Back Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* ── Realistic French Groove on Right Side (Hinge) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            right: 'clamp(14px, 7.5%, 22px)',
            width: '3.5px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.25) 100%)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.45)'
          }}
        />

        {/* ── Rounded Spine Backbone Lighting Roll (Right of groove) ── */}
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none z-20"
          style={{
            width: 'clamp(14px, 7.5%, 22px)',
            background: 'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.45) 100%)'
          }}
        />

        {/* Hardcover Outer Bevel Edge */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]" />

        {/* Left Edge Stacked Page Thickness Highlight */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />
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
    w: typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 1400,
    h: typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 900,
  });

  useEffect(() => {
    const onResize = () => {
      const w = typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 1400;
      const h = typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 900;
      setSize({ w, h });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
    };
  }, []);

  return size;
}

/* ─────────────────────────────────────────────────────
   AlbumFlipbookViewer — Full-Page Modal Component
   ───────────────────────────────────────────────────── */
export default function AlbumFlipbookViewer({
  images = [],
  coverImage = null,
  backCoverImage = null,
  title = 'Luxury Wedding Album',
  size = '',
  onClose
}) {
  const flipBook = useRef(null);
  const autoplayTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  const { w: vw, h: vh } = useWindowSize();
  const isMobile = vw < 768;
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

  // No endsheet pages when total photos is even; only 1 blank parity page if photo count is odd
  const endsheetPages = totalPhotos % 2 === 0
    ? []
    : [<div key="flip-parity-leaf" className="page-wrapper bg-[#FAF8F5]" data-density="soft" />];

  const totalPages = 1 + totalPhotos + endsheetPages.length + 1;

  /* ── Dynamic Page Counter Label ── */
  const getPageLabel = () => {
    if (currentPage === 0) {
      return 'Cover · Tap or swipe to open';
    }
    if (currentPage >= totalPages - 1) {
      return 'Back Cover · Archival Quality';
    }
    const maxPhoto = totalPhotos;
    const leftPhoto = currentPage;
    const rightPhoto = currentPage + 1;

    if (leftPhoto > maxPhoto) {
      return 'Heirloom · Timeless Memories';
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

  const [naturalRatio, setNaturalRatio] = useState(1.4);

  useEffect(() => {
    if (safeImages && safeImages.length > 0) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const r = img.naturalWidth / img.naturalHeight;
          const computed = r > 2.1 ? r / 2 : r;
          setNaturalRatio(Math.max(0.65, Math.min(computed, 1.8)));
        }
      };
      img.src = safeImages[0];
    }
  }, [safeImages]);

  const pageRatio = naturalRatio || getPageAspectRatio(size);

  // Compute available area for the book within the modal
  const availW = Math.max(200, vw - sidePad * 2);
  const availH = Math.max(150, vh - topPad - bottomPad - 20);

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

  // When custom images are uploaded, both front and back cover change to user images
  const activeCover = coverImage || safeImages[0] || '/images/album/front_cover.jpg';
  const activeBackCover = backCoverImage || (coverImage && coverImage !== '/images/album/front_cover.jpg' ? (safeImages.length > 1 ? safeImages[safeImages.length - 1] : activeCover) : '/images/album/back_cover.jpg');

  /* Build guaranteed valid non-falsy children for HTMLFlipBook */
  const flipbookPages = [
    <CoverPage
      key="flip-cover"
      title={title}
      size={size}
      totalPhotos={totalPhotos}
      coverSrc={activeCover}
      onOpen={handleFlipNext}
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
    ...endsheetPages,
    <BackCoverPage
      key="flip-backcover"
      backCoverSrc={activeBackCover}
      onReopen={handleFlipPrev}
    />
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

