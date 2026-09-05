import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, ChevronLeft, ChevronRight, Grid3X3,
  Play, Pause, ZoomIn, ZoomOut, BookOpen, ImagePlus,
  ShieldCheck, RotateCcw, Trash2, Sparkles, Check
} from 'lucide-react';
import { ALBUM_SIZES } from '../utils/albumsService';

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
  <div ref={ref} className={`page-wrapper select-none ${className}`} data-density="soft">
    {children}
  </div>
));
Page.displayName = 'Page';

/* ─── Cover Page ─── */
const CoverPage = forwardRef(({ totalPhotos, size, ...props }, ref) => (
  <div ref={ref} {...props} style={{ ...props.style }} className={`page-wrapper select-none ${props.className || ''}`} data-density="hard">
    <div className="w-full h-full bg-gradient-to-br from-[#1A1510] via-[#221D15] to-[#0D0B08] flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden shadow-2xl border-r border-[#C5A880]/30">
      {/* Decorative border */}
      <div className="absolute inset-3 sm:inset-5 border border-[#C5A880]/30 rounded pointer-events-none" />
      <div className="absolute inset-4 sm:inset-6 border border-[#C5A880]/15 rounded pointer-events-none" />

      {/* Decorative corner accents */}
      <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-6 h-6 border-t-2 border-l-2 border-[#C5A880]/50 rounded-tl" />
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-6 h-6 border-t-2 border-r-2 border-[#C5A880]/50 rounded-tr" />
      <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 w-6 h-6 border-b-2 border-l-2 border-[#C5A880]/50 rounded-bl" />
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 w-6 h-6 border-b-2 border-r-2 border-[#C5A880]/50 rounded-br" />

      <div className="text-center z-10 space-y-3 sm:space-y-5">
        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#F4ECD8] tracking-wide leading-tight drop-shadow-sm">
          Your Wedding Album
        </h2>
        <p className="text-[#C5A880] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-semibold">
          Luxury Layflat Heirloom
        </p>

        {size && (
          <div className="inline-block px-3 py-1 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#E8D4B8] text-xs font-mono font-bold tracking-widest uppercase">
            {size}
          </div>
        )}

        <div className="w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <p className="text-[#DED0B4]/50 text-[9px] sm:text-[10px] tracking-widest uppercase mt-3">
          {totalPhotos} {totalPhotos === 1 ? 'Page' : 'Pages'} · Archival Print
        </p>
      </div>

      {/* KPR Productions watermark */}
      <div className="absolute bottom-5 sm:bottom-7 text-center">
        <p className="text-[#C5A880]/40 text-[8px] sm:text-[9px] tracking-[0.4em] uppercase font-bold select-none">
          KPR Color Lab & Studio
        </p>
      </div>
    </div>
  </div>
));
CoverPage.displayName = 'CoverPage';

/* ─── Photo Page (USES object-contain SO NO CROPPING) ─── */
const PhotoPage = forwardRef(({ src, pageIndex, totalPhotos, isLeftPage, ...props }, ref) => (
  <div ref={ref} {...props} style={{ ...props.style }} className={`page-wrapper select-none bg-[#FCFBF9] shadow-lg ${props.className || ''}`} data-density="soft">
    <div
      className={`w-full h-full p-1.5 sm:p-3.5 flex flex-col items-center justify-center relative border border-[#DCD2C3] ${
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

      {/* Photo display area — object-contain keeps the complete image intact without cutting */}
      <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-xs bg-black/5">
        <img
          src={src}
          alt={`Album page ${pageIndex + 1}`}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded-xs shadow-xs select-none drop-shadow-sm"
          draggable={false}
        />
      </div>

      {/* Page Number Badge */}
      <span
        className={`absolute bottom-1.5 sm:bottom-2.5 text-[8px] sm:text-[9.5px] text-[#4A3B2C]/80 font-mono select-none bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs z-20 ${
          isLeftPage ? 'left-2 sm:left-3' : 'right-2 sm:right-3'
        }`}
      >
        {pageIndex + 1} / {totalPhotos}
      </span>
    </div>
  </div>
));
PhotoPage.displayName = 'PhotoPage';

/* ─── Balancer Endsheet ─── */
const EndsheetPage = forwardRef((props, ref) => (
  <div ref={ref} {...props} style={{ ...props.style }} className={`page-wrapper select-none ${props.className || ''}`} data-density="soft">
    <div className="w-full h-full p-4 sm:p-8 flex flex-col items-center justify-center relative bg-gradient-to-r from-[#E5DACB]/80 via-[#FAF8F5] to-[#FAF8F5] border-l-2 border-l-[#BFB19E] border border-[#DCD2C3]">
      <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-6 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none z-10" />
      <div className="text-center space-y-2 z-10">
        <Sparkles className="w-5 h-5 text-[#C5A880] mx-auto" />
        <h4 className="font-serif text-sm sm:text-base text-[#4A3B2C] tracking-wide">
          Heirloom Memories
        </h4>
        <p className="text-[8px] sm:text-[10px] text-[#7A6B5C] font-mono uppercase tracking-widest">
          Preserved for Generations
        </p>
      </div>
    </div>
  </div>
));
EndsheetPage.displayName = 'EndsheetPage';

/* ─── Back Page ─── */
const BackPage = forwardRef((props, ref) => (
  <div ref={ref} {...props} style={{ ...props.style }} className={`page-wrapper select-none ${props.className || ''}`} data-density="hard">
    <div className="w-full h-full bg-gradient-to-br from-[#1A1510] via-[#221D15] to-[#0D0B08] flex flex-col items-center justify-center p-4 sm:p-10 relative overflow-hidden shadow-2xl border-l-2 border-l-[#C5A880]/40">
      <div className="absolute inset-2 sm:inset-5 border border-[#C5A880]/30 rounded pointer-events-none" />
      <div className="text-center z-10 space-y-2 sm:space-y-4">
        <div className="w-8 sm:w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
        <p className="text-[#DED0B4]/70 text-[10px] sm:text-sm tracking-[0.25em] uppercase font-light">
          Handcrafted with Love
        </p>
        <p className="text-[#C5A880] text-xs sm:text-sm font-serif italic">
          KPR Productions Color Lab
        </p>
        <div className="w-8 sm:w-12 h-0.5 bg-[#C5A880]/60 mx-auto" />
      </div>
      <div className="absolute bottom-3 sm:bottom-7 text-center">
        <p className="text-[#C5A880]/30 text-[7px] sm:text-[9px] tracking-[0.4em] uppercase font-bold select-none">
          www.kprproductions.com
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
  const [photos, setPhotos] = useState([]);
  const [selectedSize, setSelectedSize] = useState('12x36');
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
        <div className="text-center mb-8 sm:mb-10 space-y-3">
          <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block">
            KPR COLOR LAB · LIVE ALBUM PROOFING
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-light">
            Preview Your Wedding Album
          </h1>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-2" />
          <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed max-w-xl mx-auto">
            Select your physical album size, upload your photo spreads, and experience a realistic 3D page-turning book flipbook without image cropping.
          </p>
        </div>

        {/* ═══ 1. Size Selector Bar ═══ */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#C5A880]" />
                Select Physical Album Size:
              </span>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Choose the print dimensions for your luxury layflat album.
              </p>
            </div>

            <div className="text-xs font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-3 py-1 rounded-full border border-[#C5A880]/30 self-start sm:self-auto">
              Selected: {selectedSize}
            </div>
          </div>

          {/* Size Pill Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {ALBUM_SIZES.map(s => {
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md ring-2 ring-[#C5A880]/50 scale-[1.02]'
                      : 'bg-[#FAF8F5] text-[#4A3B2C] border-[#E2D9CC] hover:bg-white hover:border-[#C5A880]'
                  }`}
                >
                  <span>{s}</span>
                  <span className="text-[9px] font-sans font-normal opacity-75">
                    {s === '12x36' ? 'Panoramic' : s === '13x39' ? 'Grand Royal' : s === '14x40' ? 'Master Spread' : s === '16x24' ? 'Gallery' : s === '18x24' ? 'Imperial' : 'Classic'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ 2. Upload Zone ═══ */}
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

          <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center">
            <div className={`p-4 rounded-2xl mb-3 transition-all duration-300 ${
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
              {isDragOver ? 'Drop your photos here' : 'Drag & drop your photos or album pages'}
            </h3>
            <p className="text-xs text-[#888888] mb-3">
              or <span className="text-[#C5A880] font-semibold underline underline-offset-2">browse files</span> — JPG, PNG, WebP up to {MAX_FILES} photos
            </p>
            {photos.length > 0 && (
              <p className="text-[11px] text-[#C5A880] font-mono font-bold">
                {photos.length} / {MAX_FILES} photos ready for size {selectedSize}
              </p>
            )}
          </div>
        </div>

        {/* ═══ 3. Uploaded Photos Thumbnails & View Action ═══ */}
        {photos.length > 0 && (
          <div className="mt-6 sm:mt-8 space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2D9CC] shadow-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C5A880]" />
                <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A]">
                  {photos.length} {photos.length === 1 ? 'Page' : 'Pages'} Ready ({selectedSize})
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open 3D Flipbook ({selectedSize})</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#E2D9CC] group bg-[#FAF7F2] shadow-xs hover:shadow-md transition-shadow flex items-center justify-center p-1"
                >
                  <img
                    src={photo.objectUrl}
                    alt={photo.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                  {/* Page number badge */}
                  <span className="absolute top-1 left-1 text-[8px] bg-black/70 text-white/90 px-1.5 py-0.5 rounded font-mono select-none">
                    {i + 1}
                  </span>
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Flipbook Viewer Modal ═══ */}
      <AnimatePresence>
        {viewerOpen && photos.length > 0 && (
          <FlipbookViewer
            images={photos.map(p => p.objectUrl)}
            size={selectedSize}
            onClose={closeViewer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FlipbookViewer — Realistic 3D Book Page Flip Engine
   ═══════════════════════════════════════════════════════ */
function FlipbookViewer({ images = [], size = '12x36', onClose }) {
  const flipBook = useRef(null);
  const autoplayTimer = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [autoplay, setAutoplay] = useState(false);

  const { w: vw, h: vh } = useWindowSize();
  const isMobile = vw < 768;
  const reducedMotion = prefersReducedMotion();

  // Total pages = Cover + Photos + Back Cover
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
      }, 3200);
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
    if (currentPage === 0) return 'Front Cover';
    if (currentPage >= totalPages - 1) return 'Back Cover';
    if (isMobile) return `Page ${currentPage} of ${images.length}`;
    const left = currentPage;
    const right = Math.min(currentPage + 1, images.length);
    if (currentPage + 1 >= totalPages - 1) return `Page ${left} of ${images.length}`;
    return left === right ? `Page ${left} of ${images.length}` : `Pages ${left} - ${right} of ${images.length}`;
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

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  /* Touch swipe listeners for mobile */
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

  /* Helper to compute page aspect ratio from physical size */
  const getPageAspectRatio = (sizeStr) => {
    if (!sizeStr) return 0.85;
    const clean = String(sizeStr).toLowerCase().replace(/\s+/g, '');
    if (clean === '12x36') return 1.5;   // 18w / 12h
    if (clean === '13x39') return 1.5;   // 19.5w / 13h
    if (clean === '14x40') return 1.43;  // 20w / 14h
    if (clean === '16x24') return 0.75;  // 12w / 16h (portrait)
    if (clean === '18x24') return 0.67;  // 12w / 18h (portrait)
    if (clean === '12x24') return 1.0;   // 12w / 12h (square)
    return 0.85;
  };

  /* Dimensions calculation for 2-page open book spread */
  const topPad = 52;
  const bottomPad = showThumbnails ? (isMobile ? 120 : 140) : 54;
  const sidePad = isMobile ? 8 : 40;

  const availW = Math.max(vw - sidePad * 2, 200);
  const availH = Math.max(vh - topPad - bottomPad, 180);

  const pageRatio = getPageAspectRatio(size);

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

  singlePageW = Math.max(singlePageW, 130);
  singlePageH = Math.max(singlePageH, 140);

  return (
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
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xs" onClick={onClose} />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-between"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
      >
        {/* ── Top Toolbar ── */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 py-2.5 shrink-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/10" style={{ height: `${topPad}px` }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C5A880]" />
            <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
              Album Proof Preview
            </span>
            {size && (
              <span className="px-2 py-0.5 bg-[#C5A880] text-black text-[10px] font-bold font-mono rounded uppercase tracking-wider shadow-xs">
                {size}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
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

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-red-500/90 text-white/80 hover:text-white transition-colors cursor-pointer ml-1 sm:ml-1.5"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Book Area ── */}
        <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden px-1 sm:px-2" style={{ minHeight: 0 }}>
          <button
            onClick={handleFlipPrev}
            className="absolute left-1 sm:left-6 z-30 p-2 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm shadow-xl"
            title="Previous page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Mobile Tap Zones */}
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

          <motion.div
            animate={{ scale: zoomed ? 1.35 : 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeInOut' }}
            className="origin-center relative flex items-center justify-center p-1 sm:p-2 bg-[#171410] rounded-xs sm:rounded-md border border-[#C5A880]/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]"
            style={{ willChange: 'transform' }}
          >
            {/* Stacked Pages Thickness Edge shadow at bottom */}
            <div className="absolute -bottom-1 sm:-bottom-1.5 left-2 right-2 h-1 sm:h-1.5 bg-gradient-to-r from-[#D8CEBF] via-[#FAF7F2] to-[#D8CEBF] rounded-b-xs opacity-75 pointer-events-none" />

            <HTMLFlipBook
              key={`preview-flip-${images.length}-${isMobile}-${size}-${singlePageW}`}
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
              flippingTime={reducedMotion ? 0 : 500}
              usePortrait={false}
              startPage={0}
              drawShadow={!reducedMotion}
              autoSize={false}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={15}
              showPageCorners={!reducedMotion}
              disableFlipByClick={false}
              onFlip={handlePageFlip}
              className="album-flipbook-shadow"
            >
              {/* Cover */}
              <CoverPage totalPhotos={images.length} size={size} />

              {/* Photo pages */}
              {images.map((src, i) => (
                <PhotoPage
                  key={i}
                  src={src}
                  pageIndex={i}
                  totalPhotos={images.length}
                  isLeftPage={i % 2 === 0}
                />
              ))}

              {/* Endsheet balancer if odd */}
              {images.length % 2 !== 0 && <EndsheetPage />}

              {/* Back cover */}
              <BackPage />
            </HTMLFlipBook>
          </motion.div>

          <button
            onClick={handleFlipNext}
            className="absolute right-1 sm:right-6 z-30 p-2 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-sm shadow-xl"
            title="Next page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* ── Page Counter ── */}
        <div className="shrink-0 py-2.5 flex flex-col items-center gap-1 z-30">
          <div className="bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm px-4 sm:px-5 py-1 sm:py-1.5 rounded-full border border-white/15 font-mono tracking-wider select-none shadow-sm flex items-center gap-2">
            <span>{getPageLabel()}</span>
            {size && (
              <span className="text-[#C5A880] text-[11px] font-bold">
                ({size})
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/40 select-none hidden sm:block">
            ← → arrow keys · click page edges · swipe on mobile
          </p>
        </div>

        {/* ── Thumbnail Filmstrip ── */}
        <AnimatePresence>
          {showThumbnails && (
            <motion.div
              className="shrink-0 w-full bg-black/85 backdrop-blur-lg border-t border-white/10 z-40"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            >
              <div className="flex gap-2.5 px-4 py-3 overflow-x-auto no-scrollbar">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`shrink-0 w-14 h-18 sm:w-20 sm:h-26 rounded-md overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 bg-[#141414] ${
                      currentPage === i + 1
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
  );
}
