import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Grid3X3, Play, Pause, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Individual Page Component (forwardRef required by react-pageflip)
   ───────────────────────────────────────────────────── */
const Page = forwardRef(({ src, pageIndex }, ref) => {
  return (
    <div ref={ref} className="page-wrapper" data-density="soft">
      <div className="w-full h-full bg-white p-2 sm:p-3 overflow-hidden relative">
        <img
          src={src}
          alt={`Album page ${pageIndex + 1}`}
          className="w-full h-full object-cover rounded-sm"
          draggable={false}
        />
        {/* Subtle page number watermark */}
        <span className="absolute bottom-4 right-5 text-[10px] text-white/50 font-mono select-none drop-shadow-md">
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
   AlbumFlipbookViewer — Full-Page Modal Component
   Props:
     images: string[]    — array of image URLs
     onClose: () => void — callback to close the viewer
   ───────────────────────────────────────────────────── */
export default function AlbumFlipbookViewer({ images = [], onClose }) {
  const flipBook = useRef(null);
  const autoplayTimer = useRef(null);

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
    document.body.style.minWidth = '0'; // override the min-w-[1200px]
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
      }, 3000);
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

  /* ── Page counter display ── */
  const getPageLabel = () => {
    if (isMobile) {
      return `${currentPage + 1} / ${totalPages}`;
    }
    const left = currentPage + 1;
    const right = Math.min(currentPage + 2, totalPages);
    return left === right ? `${left} / ${totalPages}` : `${left}-${right} / ${totalPages}`;
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

  /* ── Full-page book dimensions — MAXIMUM SIZE ── */
  const topPad = 48;   // slim toolbar
  const bottomPad = showThumbnails ? 130 : 40; // minimal counter
  const sidePad = isMobile ? 16 : 56; // tight arrow space

  const availH = vh - topPad - bottomPad;
  const availW = vw - sidePad * 2;

  let bookWidth, bookHeight;
  if (isMobile) {
    // Single page — fill width, constrain height
    bookWidth = availW;
    bookHeight = Math.min(Math.round(bookWidth * 1.4), availH);
    if (bookHeight < Math.round(bookWidth * 1.4)) {
      bookWidth = Math.round(bookHeight / 1.4);
    }
  } else {
    // Double spread — each page side by side, maximize height first
    bookHeight = availH;
    bookWidth = Math.round(bookHeight * (5 / 7));
    // If two-page spread is wider than screen, constrain by width instead
    if (bookWidth * 2 > availW) {
      bookWidth = Math.floor(availW / 2);
      bookHeight = Math.round(bookWidth * (7 / 5));
    }
  }

  // Ensure minimum
  bookWidth = Math.max(bookWidth, 200);
  bookHeight = Math.max(bookHeight, 300);

  return (
    <AnimatePresence>
      {/* Portal-like full viewport overlay — uses fixed positioning + own stacking context */}
      <motion.div
        className="fixed inset-0 z-[9999]"
        style={{ width: '100vw', height: '100vh', minWidth: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Dark Backdrop */}
        <div
          className="absolute inset-0 bg-black/95"
          onClick={onClose}
        />

        {/* ═══════ FULL-PAGE CONTENT ═══════ */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >

          {/* ── Top Toolbar ── */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-2 shrink-0" style={{ height: `${topPad}px` }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C5A880]" />
              <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] hidden sm:inline">
                Album Viewer
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Thumbnail toggle */}
              <button
                onClick={() => setShowThumbnails(t => !t)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                  showThumbnails
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                }`}
                title="Toggle thumbnails"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>

              {/* Zoom toggle */}
              <button
                onClick={() => setZoomed(z => !z)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                  zoomed
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                }`}
                title={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>

              {/* Autoplay toggle */}
              <button
                onClick={() => setAutoplay(a => !a)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                  autoplay
                    ? 'bg-[#C5A880] text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                }`}
                title={autoplay ? 'Pause autoplay' : 'Start autoplay'}
              >
                {autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white/70 hover:text-white transition-colors cursor-pointer ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Book Area — fills remaining vertical space ── */}
          <div className="flex-1 flex items-center justify-center w-full relative" style={{ minHeight: 0 }}>

            {/* Left Navigation Arrow */}
            <button
              onClick={handleFlipPrev}
              className="absolute left-2 sm:left-6 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Flipbook */}
            <motion.div
              animate={{ scale: zoomed ? 1.4 : 1 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="origin-center"
              style={{ willChange: 'transform' }}
            >
              <HTMLFlipBook
                ref={flipBook}
                width={bookWidth}
                height={bookHeight}
                size="fixed"
                minWidth={200}
                maxWidth={1200}
                minHeight={300}
                maxHeight={1400}
                maxShadowOpacity={0.6}
                showCover={true}
                mobileScrollSupport={true}
                flippingTime={700}
                usePortrait={isMobile}
                startPage={0}
                drawShadow={true}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
                onFlip={handlePageFlip}
                className="album-flipbook-shadow"
              >
                {images.map((src, i) => (
                  <Page
                    key={i}
                    src={src}
                    pageIndex={i}
                  />
                ))}
              </HTMLFlipBook>
            </motion.div>

            {/* Right Navigation Arrow */}
            <button
              onClick={handleFlipNext}
              className="absolute right-2 sm:right-6 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* ── Page Counter ── */}
          <div className="shrink-0 py-3 flex justify-center">
            <div className="bg-black/60 backdrop-blur-md text-white text-sm px-5 py-1.5 rounded-full border border-white/10 font-mono tracking-wider select-none">
              {getPageLabel()}
            </div>
          </div>

          {/* ── Thumbnail Filmstrip ── */}
          <AnimatePresence>
            {showThumbnails && (
              <motion.div
                className="shrink-0 w-full bg-black/80 backdrop-blur-lg border-t border-white/10"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`shrink-0 w-16 h-20 sm:w-20 sm:h-28 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                        (isMobile ? currentPage === i : (currentPage === i || currentPage + 1 === i))
                          ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/30 ring-1 ring-[#C5A880]/50'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      title={`Page ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`Thumb ${i + 1}`}
                        className="w-full h-full object-cover"
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
