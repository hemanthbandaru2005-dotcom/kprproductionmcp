import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Grid3X3, Play, Pause,
  ZoomIn, ZoomOut, BookOpen, Sparkles
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Individual Page Component (forwardRef required by react-pageflip)
   ───────────────────────────────────────────────────── */
const Page = forwardRef(({ src, pageIndex, totalPages, isMobile }, ref) => {
  const isLeftPage = pageIndex % 2 === 1; // In 2-page spread: odd index is left, even is right
  const isCover = pageIndex === 0;
  const isBackCover = pageIndex === totalPages - 1;

  return (
    <div
      ref={ref}
      className="page-wrapper select-none relative overflow-hidden bg-[#FBF9F5] shadow-2xl"
      data-density={isCover || isBackCover ? 'hard' : 'soft'}
    >
      {/* Realistic luxury archival page border & book spine depth */}
      <div
        className={`w-full h-full p-1.5 sm:p-3 flex flex-col items-center justify-center relative border border-[#D8CEBF] ${
          isMobile
            ? 'bg-gradient-to-r from-[#D5C7B2]/40 via-[#FAF7F2] to-[#F3EEE6]/60'
            : isLeftPage
            ? 'bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2] to-[#E3D8C8]/70 border-r-2 border-r-[#C9BCAB]'
            : 'bg-gradient-to-r from-[#E3D8C8]/70 via-[#FAF7F2] to-[#FAF7F2] border-l-2 border-l-[#C9BCAB]'
        }`}
      >
        {/* Spine Crease / Binding Line (Left edge on mobile/right page, Right edge on left page) */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isMobile || !isLeftPage
              ? 'left-0 w-3 bg-gradient-to-r from-black/15 via-black/5 to-transparent'
              : 'right-0 w-3 bg-gradient-to-l from-black/15 via-black/5 to-transparent'
          }`}
        />

        {/* Paper Fine Grain Texture & Embossed Border */}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xs bg-[#111111]/[0.02] border border-[#EBE4D8]">
          <img
            src={src}
            alt={`Album page ${pageIndex + 1}`}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-xs select-none pointer-events-none transition-transform duration-300"
            draggable={false}
          />
        </div>

        {/* Page Number Watermark Badge */}
        <span className="absolute bottom-2 right-3 text-[9px] text-[#5A4836] font-mono select-none bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs z-20">
          {pageIndex + 1}
        </span>
      </div>
    </div>
  );
});

Page.displayName = 'Page';

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
   Helper to compute page aspect ratio from physical size
   ───────────────────────────────────────────────────── */
function getPageAspectRatio(sizeStr) {
  if (!sizeStr) return 0.85;
  const clean = String(sizeStr).toLowerCase().replace(/\s+/g, '');
  if (clean === '12x36') return 1.5;   // 18w / 12h
  if (clean === '13x39') return 1.5;   // 19.5w / 13h
  if (clean === '14x40') return 1.43;  // 20w / 14h
  if (clean === '16x24') return 0.75;  // 12w / 16h (portrait)
  if (clean === '18x24') return 0.67;  // 12w / 18h (portrait)
  if (clean === '12x24') return 1.0;   // 12w / 12h (square)
  return 0.85;
}

/* ─────────────────────────────────────────────────────
   AlbumFlipbookViewer — Full-Page Modal Component
   Props:
     images: string[]    — array of image URLs
     title?: string      — album title
     size?: string       — album size (e.g. '12x36', '16x24')
     onClose: () => void — callback to close the viewer
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
  const isMobile = vw < 768;
  const totalPages = images.length;

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

  /* ── Autoplay logic ── */
  useEffect(() => {
    if (autoplay) {
      autoplayTimer.current = setInterval(() => {
        const pageFlip = flipBook.current?.pageFlip();
        if (pageFlip) {
          const current = pageFlip.getCurrentPageIndex();
          const total = pageFlip.getPageCount();
          if (current >= total - (isMobile ? 1 : 2)) {
            pageFlip.flip(0);
          } else {
            pageFlip.flipNext();
          }
        }
      }, 3200);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [autoplay, isMobile]);

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
    flipBook.current?.pageFlip()?.flipPrev();
  };

  const handleFlipNext = () => {
    pauseAutoplay();
    flipBook.current?.pageFlip()?.flipNext();
  };

  const handlePageFlip = (e) => {
    setCurrentPage(e.data);
  };

  const goToPage = (pageNum) => {
    pauseAutoplay();
    flipBook.current?.pageFlip()?.flip(pageNum);
    setShowThumbnails(false);
  };

  /* ── Direct Mobile Touch Swipe Listeners ── */
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
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleFlipNext();
      } else {
        handleFlipPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  /* ── Page counter display ── */
  const getPageLabel = () => {
    if (isMobile) {
      return `Page ${currentPage + 1} of ${totalPages}`;
    }
    const left = currentPage + 1;
    const right = Math.min(currentPage + 2, totalPages);
    return left === right ? `Page ${left} of ${totalPages}` : `Pages ${left} - ${right} of ${totalPages}`;
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

  if (!images || images.length === 0) return null;

  /* ── Responsive Dimensions Calculation ── */
  const topPad = 52;
  const bottomPad = showThumbnails ? 140 : 54;
  const sidePad = isMobile ? 8 : 48;

  const availH = Math.max(vh - topPad - bottomPad, 200);
  const availW = Math.max(vw - sidePad * 2, 200);

  const pageRatio = getPageAspectRatio(size);

  let bookWidth, bookHeight;
  if (isMobile) {
    // Single page on mobile
    bookWidth = Math.min(availW, 420);
    bookHeight = Math.round(bookWidth / pageRatio);
    if (bookHeight > availH) {
      bookHeight = availH;
      bookWidth = Math.round(bookHeight * pageRatio);
    }
  } else {
    // Double spread on desktop — bookWidth is for a single page (total spread is 2 * bookWidth)
    bookHeight = Math.min(availH, 740);
    bookWidth = Math.round(bookHeight * pageRatio);
    if (bookWidth * 2 > availW) {
      bookWidth = Math.floor(availW / 2);
      bookHeight = Math.round(bookWidth / pageRatio);
    }
  }

  bookWidth = Math.max(bookWidth, 160);
  bookHeight = Math.max(bookHeight, 220);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden"
        style={{ width: '100vw', height: '100vh', minWidth: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dark Backdrop */}
        <div
          className="absolute inset-0 bg-black/95 backdrop-blur-xs"
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
          <div className="w-full flex items-center justify-between px-3 sm:px-6 py-2.5 shrink-0 z-30 bg-black/50 backdrop-blur-md border-b border-white/10" style={{ height: `${topPad}px` }}>
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
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white transition-colors cursor-pointer ml-1.5"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Book Area — fills remaining vertical space ── */}
          <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden px-2" style={{ minHeight: 0 }}>

            {/* Left Navigation Arrow */}
            <button
              onClick={handleFlipPrev}
              className="absolute left-1.5 sm:left-6 z-30 p-2.5 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-md"
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
                  className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer"
                  title="Tap for previous page"
                />
                <div
                  onClick={handleFlipNext}
                  className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-pointer"
                  title="Tap for next page"
                />
              </>
            )}

            {/* Flipbook Container */}
            <motion.div
              animate={{ scale: zoomed ? 1.3 : 1 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="origin-center drop-shadow-2xl flex items-center justify-center"
              style={{ willChange: 'transform' }}
            >
              <HTMLFlipBook
                ref={flipBook}
                width={bookWidth}
                height={bookHeight}
                size="fixed"
                minWidth={160}
                maxWidth={1400}
                minHeight={220}
                maxHeight={1400}
                maxShadowOpacity={0.6}
                showCover={true}
                mobileScrollSupport={false}
                flippingTime={600}
                usePortrait={isMobile}
                startPage={0}
                drawShadow={true}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={15}
                showPageCorners={true}
                disableFlipByClick={false}
                onFlip={handlePageFlip}
                className="album-flipbook-shadow rounded-sm"
              >
                {images.map((src, i) => (
                  <Page
                    key={i}
                    src={src}
                    pageIndex={i}
                    totalPages={totalPages}
                    isMobile={isMobile}
                  />
                ))}
              </HTMLFlipBook>
            </motion.div>

            {/* Right Navigation Arrow */}
            <button
              onClick={handleFlipNext}
              className="absolute right-1.5 sm:right-6 z-30 p-2.5 sm:p-4 rounded-full bg-white/15 hover:bg-white/30 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-sm shadow-md"
              title="Next page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* ── Page Counter & Navigation Tip ── */}
          <div className="shrink-0 py-2 flex flex-col items-center gap-1 z-30">
            <div className="bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm px-4 sm:px-5 py-1 sm:py-1.5 rounded-full border border-white/15 font-mono tracking-wider select-none shadow-sm flex items-center gap-2">
              <span>{getPageLabel()}</span>
              {size && (
                <span className="text-[#C5A880] text-[11px] font-bold">
                  ({size})
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 select-none">
              {isMobile ? 'Tap left/right or swipe to turn pages' : '← → arrow keys · click page edges to flip'}
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
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`shrink-0 w-14 h-18 sm:w-20 sm:h-26 rounded-md overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 bg-[#141414] ${
                        (isMobile ? currentPage === i : (currentPage === i || currentPage + 1 === i))
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
