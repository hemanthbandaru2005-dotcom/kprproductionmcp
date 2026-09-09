import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  BookOpen,
  Sparkles
} from 'lucide-react';
import FrontCover from './FrontCover';
import BackCover from './BackCover';
import AlbumPage from './AlbumPage';

/**
 * Archival Endsheet Page (Balances odd spreads)
 */
const EndsheetPage = forwardRef((props, ref) => (
  <div
    ref={ref}
    {...props}
    style={{ ...props.style }}
    className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] shadow-md ${
      props.className || ''
    }`}
    data-density="soft"
  >
    <div className="w-full h-full p-4 sm:p-8 flex flex-col items-center justify-center relative bg-gradient-to-r from-[#EDE5D8] via-[#FAF8F5] to-[#FBF9F6] border-l-2 border-l-[#BFB19E] border border-[#E2D9CC]">
      <div className="absolute top-0 bottom-0 left-0 w-4 sm:w-8 bg-gradient-to-r from-black/25 via-black/8 to-transparent pointer-events-none z-10" />
      <div className="text-center space-y-2 z-10">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center mx-auto text-[#C5A880]">
          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <h4 className="font-serif text-sm sm:text-lg text-[#3D3327] tracking-wider uppercase">
          Cherished Forever
        </h4>
        <p className="text-[8px] sm:text-[10px] text-[#7A6B5C] font-mono uppercase tracking-widest">
          Archival Quality Layflat Bound
        </p>
      </div>
    </div>
  </div>
));
EndsheetPage.displayName = 'EndsheetPage';

/**
 * useWindowDimensions hook
 */
function useWindowDimensions() {
  const [dims, setDims] = useState({
    w: typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 1280,
    h: typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
  });

  useEffect(() => {
    const update = () => {
      setDims({
        w: typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 1280,
        h: typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
      });
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', update);
      }
    };
  }, []);

  return dims;
}

/**
 * AlbumViewerModal Component
 * Fullscreen luxury digital photobook viewer with physical 3D page turns.
 */
export default function AlbumViewerModal({ album, isOpen = false, onClose }) {
  const flipBook = useRef(null);
  const containerRef = useRef(null);
  const autoplayTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { w: vw, h: vh } = useWindowDimensions();
  const isMobile = vw < 768;

  const pages = album?.pages || [];
  const totalInnerPages = pages.length;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Fullscreen exit failed:', err);
      });
    }
  };

  // Autoplay functionality
  useEffect(() => {
    if (autoplay) {
      autoplayTimer.current = setInterval(() => {
        try {
          const pageFlip = flipBook.current?.pageFlip?.();
          if (pageFlip) {
            const cur = pageFlip.getCurrentPageIndex();
            const total = pageFlip.getPageCount();
            if (cur >= total - 2) {
              pageFlip.flip(0);
            } else {
              pageFlip.flipNext();
            }
          }
        } catch (e) {
          console.warn('Flip autoplay error:', e);
        }
      }, 3500);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [autoplay]);

  const pauseAutoplay = useCallback(() => {
    if (autoplay) {
      setAutoplay(false);
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    }
  }, [autoplay]);

  const handleFlipPrev = () => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flipPrev();
    } catch (e) {
      console.warn('flipPrev error:', e);
    }
  };

  const handleFlipNext = () => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flipNext();
    } catch (e) {
      console.warn('flipNext error:', e);
    }
  };

  const handlePageFlip = (e) => {
    if (e && typeof e.data === 'number') {
      setCurrentPage(e.data);
    }
  };

  const goToPage = (idx) => {
    pauseAutoplay();
    try {
      flipBook.current?.pageFlip?.()?.flip(idx);
    } catch (e) {
      console.warn('goToPage error:', e);
    }
    setShowThumbnails(false);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleFlipNext();
      } else {
        handleFlipPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleFlipNext();
      else if (e.key === 'ArrowLeft') handleFlipPrev();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Responsive Book Sizing (Square format 1:1 single page ratio for luxury photobooks)
  const topPad = 56;
  const bottomPad = showThumbnails ? (isMobile ? 120 : 130) : 56;
  const sidePad = isMobile ? 10 : 48;

  const availW = Math.max(220, vw - sidePad * 2);
  const availH = Math.max(160, vh - topPad - bottomPad - 20);

  // Single page aspect ratio (square photobook = 1.0; 12x36 spread = 1.5)
  const pageRatio = 1.0;

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

  singlePageW = Math.max(140, Math.min(singlePageW, 680));
  singlePageH = Math.max(140, Math.min(singlePageH, 680));

  // Dynamic Page Label
  const totalPagesInFlipbook = totalInnerPages + 2 + (totalInnerPages % 2 !== 0 ? 1 : 0);
  const getPageLabel = () => {
    if (currentPage === 0) {
      return 'Front Cover · Tap to Open';
    }
    if (currentPage >= totalPagesInFlipbook - 1) {
      return 'Back Cover · Archival Quality';
    }
    const leftNum = currentPage;
    const rightNum = currentPage + 1;
    if (leftNum > totalInnerPages) {
      return 'Endsheet';
    }
    if (rightNum > totalInnerPages) {
      return `Page ${leftNum} of ${totalInnerPages}`;
    }
    return `Pages ${leftNum} & ${rightNum} of ${totalInnerPages}`;
  };

  // Flipbook Pages array
  const flipbookPages = [
    <FrontCover key="album-front-cover" onOpen={handleFlipNext} />,
    ...pages.map((p, idx) => (
      <AlbumPage
        key={`album-page-${p.id || idx}`}
        pageData={p}
        pageIndex={idx}
        totalPages={totalInnerPages}
        isLeftPage={idx % 2 === 0}
        isEditable={false}
      />
    )),
    ...(totalInnerPages % 2 !== 0 ? [<EndsheetPage key="album-endsheet" />] : []),
    <BackCover key="album-back-cover" onReopen={handleFlipPrev} />
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-[9999] overflow-hidden bg-[#0A0908] select-none flex flex-col justify-between"
        style={{ width: '100vw', height: '100vh', minWidth: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient Dark Velvet Backdrop Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#231D16_0%,_#0B0907_80%)] pointer-events-none" />

        {/* ── Top Bar ── */}
        <div
          className="w-full flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10"
          style={{ height: `${topPad}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center shrink-0 text-[#C5A880]">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="text-white text-xs sm:text-sm font-serif font-bold uppercase tracking-wider truncate">
                {album?.title || 'Wedding Album'}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-[#C5A880]/20 text-[#C5A880] text-[10px] font-mono font-bold rounded uppercase tracking-wider border border-[#C5A880]/40 shrink-0">
                {album?.size || '12x36'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Filmstrip Thumbnail toggle */}
            <button
              type="button"
              onClick={() => setShowThumbnails((t) => !t)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showThumbnails
                  ? 'bg-[#C5A880] text-black'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title="Toggle Spreads Filmstrip"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            {/* Zoom toggle */}
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                zoomed
                  ? 'bg-[#C5A880] text-black'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title={zoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {/* Autoplay toggle */}
            <button
              type="button"
              onClick={() => setAutoplay((a) => !a)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                autoplay
                  ? 'bg-[#C5A880] text-black'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title={autoplay ? 'Pause Auto-Flip' : 'Start Auto-Flip'}
            >
              {autoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer hidden sm:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-red-600/80 text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Album Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 3D Book Interactive Center Stage ── */}
        <div
          className="flex-1 flex items-center justify-center w-full relative overflow-hidden px-1 sm:px-2"
          style={{ minHeight: 0 }}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handleFlipPrev}
            className="absolute left-1 sm:left-6 z-30 p-2.5 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-[#F5E6D0] hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* 3D Physical Photobook Container */}
          <motion.div
            animate={{ scale: zoomed ? 1.3 : 1 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="origin-center relative flex items-center justify-center p-1 sm:p-2.5 bg-[#14110D] rounded-xs sm:rounded-md border border-[#C5A880]/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.98)]"
            style={{ willChange: 'transform' }}
          >
            {/* Paper Stack Edge Shadow (Underneath Book) */}
            <div className="absolute -bottom-1.5 sm:-bottom-2 left-3 right-3 h-1.5 sm:h-2 bg-gradient-to-r from-[#D8CEBF] via-[#FAF7F2] to-[#D8CEBF] rounded-b-xs opacity-75 pointer-events-none shadow-md" />

            <HTMLFlipBook
              key={`flipbook-${totalInnerPages}-${singlePageW}-${singlePageH}`}
              ref={flipBook}
              width={singlePageW}
              height={singlePageH}
              size="fixed"
              minWidth={140}
              maxWidth={1200}
              minHeight={140}
              maxHeight={1200}
              maxShadowOpacity={0.65}
              showCover={true}
              mobileScrollSupport={false}
              flippingTime={600}
              usePortrait={false}
              startPage={0}
              drawShadow={true}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={20}
              showPageCorners={true}
              disableFlipByClick={false}
              onFlip={handlePageFlip}
              className="album-flipbook-shadow"
            >
              {flipbookPages}
            </HTMLFlipBook>
          </motion.div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleFlipNext}
            className="absolute right-1 sm:right-6 z-30 p-2.5 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-[#F5E6D0] hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-2xl hover:scale-105 active:scale-95"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* ── Bottom Controls & Page Counter ── */}
        <div className="shrink-0 py-2 flex flex-col items-center gap-1 z-30 bg-black/40 backdrop-blur-xs">
          <div className="bg-black/80 backdrop-blur-md text-[#F4ECD8] text-xs sm:text-sm px-4 sm:px-6 py-1.5 rounded-full border border-white/15 font-serif tracking-wider select-none shadow-md flex items-center gap-2.5">
            <Sparkles className="w-3 h-3 text-[#C5A880]" />
            <span>{getPageLabel()}</span>
            <span className="text-[#C5A880]/60 text-[11px] font-mono">
              ({currentPage}/{totalPagesInFlipbook - 1})
            </span>
          </div>

          {/* Mobile Tap Tip */}
          {isMobile && (
            <span className="text-[9.5px] text-[#A69989] font-sans tracking-wide">
              Tap left/right edges or swipe to flip pages
            </span>
          )}
        </div>

        {/* ── Optional Filmstrip Thumbnail Drawer ── */}
        <AnimatePresence>
          {showThumbnails && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="w-full shrink-0 bg-black/90 backdrop-blur-lg border-t border-white/15 p-2 sm:p-3 overflow-x-auto z-40"
              style={{ maxHeight: '110px' }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mx-auto justify-start sm:justify-center min-w-max px-2">
                {/* Front Cover Thumb */}
                <button
                  type="button"
                  onClick={() => goToPage(0)}
                  className={`flex flex-col items-center p-1 rounded transition-all cursor-pointer ${
                    currentPage === 0
                      ? 'ring-2 ring-[#C5A880] bg-white/10 scale-105'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                  }`}
                >
                  <img
                    src="/images/album/front_cover.jpg"
                    alt="Cover Thumb"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xs border border-white/20"
                  />
                  <span className="text-[9px] text-[#C5A880] mt-0.5 font-mono">Cover</span>
                </button>

                {/* Spreads Thumbs */}
                {Array.from({ length: Math.ceil(totalInnerPages / 2) }).map((_, spreadIdx) => {
                  const p1 = pages[spreadIdx * 2];
                  const p2 = pages[spreadIdx * 2 + 1];
                  const p1Photo = p1 ? Object.values(p1.photos || {})[0]?.src : null;
                  const p2Photo = p2 ? Object.values(p2.photos || {})[0]?.src : null;
                  const targetPage = spreadIdx * 2 + 1;
                  const isActive = currentPage === targetPage || currentPage === targetPage + 1;

                  return (
                    <button
                      key={`spread-thumb-${spreadIdx}`}
                      type="button"
                      onClick={() => goToPage(targetPage)}
                      className={`flex flex-col items-center p-1 rounded transition-all cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-[#C5A880] bg-white/10 scale-105'
                          : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex w-16 sm:w-20 h-10 sm:h-12 border border-white/20 rounded-xs overflow-hidden bg-white/5">
                        <div className="w-1/2 h-full bg-[#FAF8F5] border-r border-black/20 flex items-center justify-center overflow-hidden">
                          {p1Photo ? (
                            <img src={p1Photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-black/50 font-mono">
                              {spreadIdx * 2 + 1}
                            </span>
                          )}
                        </div>
                        <div className="w-1/2 h-full bg-[#FAF8F5] flex items-center justify-center overflow-hidden">
                          {p2Photo ? (
                            <img src={p2Photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-black/50 font-mono">
                              {spreadIdx * 2 + 2}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-white/80 mt-0.5 font-mono">
                        {spreadIdx * 2 + 1}-{spreadIdx * 2 + 2}
                      </span>
                    </button>
                  );
                })}

                {/* Back Cover Thumb */}
                <button
                  type="button"
                  onClick={() => goToPage(totalPagesInFlipbook - 1)}
                  className={`flex flex-col items-center p-1 rounded transition-all cursor-pointer ${
                    currentPage >= totalPagesInFlipbook - 1
                      ? 'ring-2 ring-[#C5A880] bg-white/10 scale-105'
                      : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                  }`}
                >
                  <img
                    src="/images/album/back_cover.jpg"
                    alt="Back Thumb"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xs border border-white/20"
                  />
                  <span className="text-[9px] text-[#C5A880] mt-0.5 font-mono">Back</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
}
