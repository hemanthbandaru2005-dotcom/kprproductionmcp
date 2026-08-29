import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, ChevronLeft, ChevronRight, Grid3X3,
  Play, Pause, ZoomIn, ZoomOut, BookOpen, ImagePlus,
  ShieldCheck, RotateCcw, Trash2
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Constants & helpers
   ═══════════════════════════════════════════════════════ */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 50;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════
   Page component for react-pageflip (forwardRef required)
   ═══════════════════════════════════════════════════════ */
const Page = forwardRef(({ children, className = '' }, ref) => (
  <div ref={ref} className={`page-wrapper ${className}`} data-density="soft">
    {children}
  </div>
));
Page.displayName = 'Page';

/* ─── Cover Page ─── */
const CoverPage = forwardRef(({ totalPhotos }, ref) => (
  <div ref={ref} className="page-wrapper" data-density="hard">
    <div className="w-full h-full bg-gradient-to-br from-[#1A1510] via-[#221D15] to-[#0D0B08] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative border */}
      <div className="absolute inset-3 sm:inset-5 border border-[#C5A880]/30 rounded pointer-events-none" />
      <div className="absolute inset-4 sm:inset-6 border border-[#C5A880]/15 rounded pointer-events-none" />

      {/* Decorative corner accents */}
      <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-6 h-6 border-t-2 border-l-2 border-[#C5A880]/50 rounded-tl" />
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-6 h-6 border-t-2 border-r-2 border-[#C5A880]/50 rounded-tr" />
      <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 w-6 h-6 border-b-2 border-l-2 border-[#C5A880]/50 rounded-bl" />
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 w-6 h-6 border-b-2 border-r-2 border-[#C5A880]/50 rounded-br" />

      <div className="text-center z-10 space-y-4 sm:space-y-6">
        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F4ECD8] tracking-wide leading-tight">
          Your Album
        </h2>
        <p className="text-[#C5A880] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-semibold">
          Preview
        </p>
        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <p className="text-[#DED0B4]/50 text-[9px] sm:text-[10px] tracking-widest uppercase mt-4">
          {totalPhotos} {totalPhotos === 1 ? 'Photo' : 'Photos'}
        </p>
      </div>

      {/* KPR Productions watermark */}
      <div className="absolute bottom-5 sm:bottom-7 text-center">
        <p className="text-[#C5A880]/30 text-[8px] sm:text-[9px] tracking-[0.4em] uppercase font-bold select-none">
          KPR Productions
        </p>
      </div>
    </div>
  </div>
));
CoverPage.displayName = 'CoverPage';

/* ─── Photo Page ─── */
const PhotoPage = forwardRef(({ src, pageIndex, totalPhotos }, ref) => (
  <div ref={ref} className="page-wrapper" data-density="soft">
    <div className="w-full h-full bg-white p-2 sm:p-3 overflow-hidden relative">
      <img
        src={src}
        alt={`Album page ${pageIndex + 1}`}
        className="w-full h-full object-cover rounded-sm"
        draggable={false}
      />
      <span className="absolute bottom-3 right-4 text-[9px] text-white/40 font-mono select-none drop-shadow-md">
        {pageIndex + 1} / {totalPhotos}
      </span>
    </div>
  </div>
));
PhotoPage.displayName = 'PhotoPage';

/* ─── Back Page ─── */
const BackPage = forwardRef((_, ref) => (
  <div ref={ref} className="page-wrapper" data-density="hard">
    <div className="w-full h-full bg-gradient-to-br from-[#1A1510] via-[#221D15] to-[#0D0B08] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
      <div className="absolute inset-3 sm:inset-5 border border-[#C5A880]/30 rounded pointer-events-none" />
      <div className="text-center z-10 space-y-4">
        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <p className="text-[#DED0B4]/60 text-xs sm:text-sm tracking-[0.2em] uppercase font-light">
          Thank you
        </p>
        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
      </div>
      <div className="absolute bottom-5 sm:bottom-7 text-center">
        <p className="text-[#C5A880]/30 text-[8px] sm:text-[9px] tracking-[0.4em] uppercase font-bold select-none">
          KPR Productions
        </p>
      </div>
    </div>
  </div>
));
BackPage.displayName = 'BackPage';

/* ═══════════════════════════════════════════════════════
   useWindowSize hook
   ═══════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════
   AlbumPreviewPage — Main Component
   ═══════════════════════════════════════════════════════ */
export default function AlbumPreviewPage() {
  // ─── State ───
  const [photos, setPhotos] = useState([]);        // { id, objectUrl, name }
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Cleanup object URLs on unmount or when photos change
  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.objectUrl));
    };
  }, []);

  /* ─── File handlers ─── */
  const processFiles = useCallback((fileList) => {
    const validFiles = Array.from(fileList).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (validFiles.length === 0) return;

    setPhotos(prev => {
      const remaining = MAX_FILES - prev.length;
      const toAdd = validFiles.slice(0, remaining);
      const newPhotos = toAdd.map((f, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        objectUrl: URL.createObjectURL(f),
        name: f.name,
      }));
      return [...prev, ...newPhotos];
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  }, [processFiles]);

  const removePhoto = useCallback((id) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.objectUrl);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    photos.forEach(p => URL.revokeObjectURL(p.objectUrl));
    setPhotos([]);
    setViewerOpen(false);
  }, [photos]);

  const openViewer = useCallback(() => {
    if (photos.length > 0) setViewerOpen(true);
  }, [photos]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  return (
    <div className="w-full min-h-[80vh] bg-[#F7F3EE]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ═══ Page Header ═══ */}
        <div className="text-center mb-8 sm:mb-12 space-y-3">
          <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block">
            Album Preview Tool
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-light">
            Preview Your Album
          </h1>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-3" />
          <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed max-w-xl mx-auto">
            Upload your photos and experience them as a beautiful page-turning album. 
            See how your memories would look in a KPR luxury handcrafted album.
          </p>
        </div>



        {/* ═══ Upload Zone ═══ */}
        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group ${
            isDragOver
              ? 'border-[#C5A880] bg-[#C5A880]/10 scale-[1.01]'
              : 'border-[#E2D9CC] hover:border-[#C5A880]/60 bg-white hover:bg-[#FAF8F5]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload photos for album preview"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); }}}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4">
            <div className={`p-4 rounded-2xl mb-4 transition-all duration-300 ${
              isDragOver
                ? 'bg-[#C5A880] text-white scale-110'
                : 'bg-[#F7F3EE] text-[#C5A880] group-hover:bg-[#C5A880]/15 group-hover:scale-105'
            }`}>
              {isDragOver ? (
                <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10" />
              ) : (
                <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
              )}
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[#1A1A1A] mb-1">
              {isDragOver ? 'Drop your photos here' : 'Drag & drop your photos'}
            </h3>
            <p className="text-xs text-[#888888] mb-4">
              or <span className="text-[#C5A880] font-semibold underline underline-offset-2">browse files</span> — JPG, PNG, WebP up to {MAX_FILES} photos
            </p>
            {photos.length > 0 && (
              <p className="text-[10px] text-[#999999] font-mono">
                {photos.length} / {MAX_FILES} photos uploaded
              </p>
            )}
          </div>
        </div>

        {/* ═══ Uploaded Photos Thumbnails ═══ */}
        {photos.length > 0 && (
          <div className="mt-6 sm:mt-8 space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C5A880]" />
                <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A]">
                  {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); clearAll(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openViewer(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  View Album
                </button>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#E2D9CC] group bg-[#F7F3EE] shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={photo.objectUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Page number badge */}
                  <span className="absolute top-1 left-1 text-[8px] bg-black/60 text-white/80 px-1.5 py-0.5 rounded font-mono select-none">
                    {i + 1}
                  </span>
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Privacy reminder */}
            <p className="text-center text-[9px] sm:text-[10px] text-[#999999] font-light italic mt-2">
              These photos exist only in your browser memory. Refreshing will clear everything.
            </p>
          </div>
        )}
      </div>

      {/* ═══ Flipbook Viewer Modal ═══ */}
      <AnimatePresence>
        {viewerOpen && photos.length > 0 && (
          <FlipbookViewer
            images={photos.map(p => p.objectUrl)}
            onClose={closeViewer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FlipbookViewer — reuses the same patterns as the
   existing AlbumFlipbookViewer but with cover/back pages
   ═══════════════════════════════════════════════════════ */
function FlipbookViewer({ images = [], onClose }) {
  const flipBook = useRef(null);
  const autoplayTimer = useRef(null);
  const touchStart = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  const { w: vw, h: vh } = useWindowSize();
  const isMobile = vw < 768;
  const reducedMotion = prefersReducedMotion();

  // total pages = cover + photos + back
  const totalPages = images.length + 2;

  /* Lock body scroll */
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

  /* Autoplay */
  useEffect(() => {
    if (autoplay) {
      autoplayTimer.current = setInterval(() => {
        const pf = flipBook.current?.pageFlip();
        if (pf) {
          const cur = pf.getCurrentPageIndex();
          const tot = pf.getPageCount();
          if (cur >= tot - (isMobile ? 1 : 2)) {
            pf.flip(0);
          } else {
            pf.flipNext();
          }
        }
      }, 3000);
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [autoplay, isMobile]);

  const pauseAutoplay = useCallback(() => {
    if (autoplay) {
      setAutoplay(false);
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    }
  }, [autoplay]);

  const handleFlipPrev = () => { pauseAutoplay(); flipBook.current?.pageFlip()?.flipPrev(); };
  const handleFlipNext = () => { pauseAutoplay(); flipBook.current?.pageFlip()?.flipNext(); };
  const handlePageFlip = (e) => setCurrentPage(e.data);

  const goToPage = (pageNum) => {
    pauseAutoplay();
    flipBook.current?.pageFlip()?.flip(pageNum);
    setShowThumbnails(false);
  };

  /* Page counter */
  const getPageLabel = () => {
    if (currentPage === 0) return 'Cover';
    if (currentPage >= totalPages - 1) return 'Back Cover';
    if (isMobile) return `Page ${currentPage} of ${images.length}`;
    const left = currentPage;
    const right = Math.min(currentPage + 1, images.length);
    if (currentPage + 1 >= totalPages - 1) return `Page ${left} of ${images.length}`;
    return left === right ? `Page ${left} of ${images.length}` : `Pages ${left}-${right} of ${images.length}`;
  };

  /* Keyboard nav */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') handleFlipPrev();
      else if (e.key === 'ArrowRight') handleFlipNext();
      else if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [autoplay]);

  /* Touch swipe support */
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleFlipNext();
      else handleFlipPrev();
    }
    touchStart.current = null;
  };

  /* Book dimensions */
  const topPad = 48;
  const bottomPad = showThumbnails ? 130 : 40;
  const sidePad = isMobile ? 16 : 56;

  const availH = vh - topPad - bottomPad;
  const availW = vw - sidePad * 2;

  let bookWidth, bookHeight;
  if (isMobile) {
    bookWidth = availW;
    bookHeight = Math.min(Math.round(bookWidth * 1.4), availH);
    if (bookHeight < Math.round(bookWidth * 1.4)) {
      bookWidth = Math.round(bookHeight / 1.4);
    }
  } else {
    bookHeight = availH;
    bookWidth = Math.round(bookHeight * (5 / 7));
    if (bookWidth * 2 > availW) {
      bookWidth = Math.floor(availW / 2);
      bookHeight = Math.round(bookWidth * (7 / 5));
    }
  }
  bookWidth = Math.max(bookWidth, 200);
  bookHeight = Math.max(bookHeight, 300);

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      style={{ width: '100vw', height: '100vh', minWidth: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95" onClick={onClose} />

      <motion.div
        className="absolute inset-0 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Top Toolbar ── */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-2 shrink-0" style={{ height: `${topPad}px` }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C5A880]" />
            <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] hidden sm:inline">
              Album Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
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

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white/70 hover:text-white transition-colors cursor-pointer ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Book Area ── */}
        <div className="flex-1 flex items-center justify-center w-full relative" style={{ minHeight: 0 }}>
          <button
            onClick={handleFlipPrev}
            className="absolute left-2 sm:left-6 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/60"
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <motion.div
            animate={{ scale: zoomed ? 1.4 : 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeInOut' }}
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
              flippingTime={reducedMotion ? 0 : 700}
              usePortrait={isMobile}
              startPage={0}
              drawShadow={!reducedMotion}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={!reducedMotion}
              disableFlipByClick={false}
              onFlip={handlePageFlip}
              className="album-flipbook-shadow"
            >
              {/* Cover */}
              <CoverPage totalPhotos={images.length} />

              {/* Photo pages */}
              {images.map((src, i) => (
                <PhotoPage key={i} src={src} pageIndex={i} totalPhotos={images.length} />
              ))}

              {/* Back cover */}
              <BackPage />
            </HTMLFlipBook>
          </motion.div>

          <button
            onClick={handleFlipNext}
            className="absolute right-2 sm:right-6 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#C5A880]/60"
            title="Next page"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* ── Page Counter ── */}
        <div className="shrink-0 py-3 flex flex-col items-center gap-1">
          <div className="bg-black/60 backdrop-blur-md text-white text-sm px-5 py-1.5 rounded-full border border-white/10 font-mono tracking-wider select-none">
            {getPageLabel()}
          </div>
          <p className="text-[9px] text-white/30 select-none">
            ← → arrow keys · click pages · swipe on mobile
          </p>
        </div>

        {/* ── Thumbnail Filmstrip ── */}
        <AnimatePresence>
          {showThumbnails && (
            <motion.div
              className="shrink-0 w-full bg-black/80 backdrop-blur-lg border-t border-white/10"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
            >
              <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                {/* Cover thumbnail */}
                <button
                  onClick={() => goToPage(0)}
                  className={`shrink-0 w-16 h-20 sm:w-20 sm:h-28 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 flex items-center justify-center ${
                    currentPage === 0
                      ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/30'
                      : 'border-white/20 hover:border-white/40'
                  } bg-[#1A1510]`}
                  title="Cover"
                >
                  <BookOpen className="w-5 h-5 text-[#C5A880]/60" />
                </button>

                {/* Photo thumbnails */}
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`shrink-0 w-16 h-20 sm:w-20 sm:h-28 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                      (isMobile ? currentPage === i + 1 : (currentPage === i + 1 || currentPage + 1 === i + 1))
                        ? 'border-[#C5A880] shadow-lg shadow-[#C5A880]/30 ring-1 ring-[#C5A880]/50'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    title={`Page ${i + 1}`}
                  >
                    <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
