import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { FLEXY_ALBUM_PHOTOS } from '../data/albumPhotosData';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper for 3D Photobook
   Aspect ratio: 1.50 (Exact 3:2 Landscape Photobook Spread Format)
   Matches all 1500x1000 album photos with zero letterboxing:
   - Closed: Balanced luxury photobook cover
   - Open: 2 facing pages creating a seamless, edge-to-edge spread
   - Compact sizing: ~19% smaller for a sleek, balanced fit
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { singlePageW: 345, singlePageH: 230 };
  }
  const w = window.innerWidth;
  const h = window.innerHeight || 800;

  let baseW = 345;
  let baseH = 230;

  // 1. MOBILE VIEW: 100% UNTOUCHED ("dont touch mobile")
  if (w < 380) {
    baseW = 144;
    baseH = 96;
  } else if (w < 480) {
    baseW = 156;
    baseH = 104;
  } else if (w < 640) {
    baseW = 180;
    baseH = 120;
  } else if (w < 768) {
    baseW = 210;
    baseH = 140;
  } else if (w < 1024) {
    // Tablet landscape
    baseW = 264;
    baseH = 176;
  } else if (w < 1366) {
    // Compact laptop (e.g. 1280x800)
    baseW = 300;
    baseH = 200;
  } else if (w < 1440) {
    // 1366px laptop (1366x768) - Enriched sizing
    baseW = 318;
    baseH = 212;
  } else if (w < 1600) {
    // 1440px laptop (1440x900 reference laptop) - ENLARGED (+21%)
    baseW = 345;
    baseH = 230;
  } else if (w < 1920) {
    // 1600px desktop monitor - ENLARGED
    baseW = 375;
    baseH = 250;
  } else {
    // 1920px+ Full HD / QHD desktop computer view - ENLARGED (+23%)
    baseW = 405;
    baseH = 270;
  }

  // Height-constraint protection: on shorter viewports (e.g. 720p or 768p laptops with browser toolbars)
  // Allows up to ~28% of viewport height on desktop, maintaining exact 1.50 (3:2) aspect ratio
  if (w >= 1024 && h < 850) {
    const maxAllowedH = Math.max(150, Math.floor(h * 0.28));
    if (baseH > maxAllowedH) {
      baseH = maxAllowedH;
      baseW = Math.round(baseH * 1.5);
    }
  }

  return { singlePageW: baseW, singlePageH: baseH };
}

/* ─────────────────────────────────────────────────────
   3D HARDCOVER CLOSED BOOK MOCKUP
   Directly reproduces the user's Adobe Stock reference photo:
   - 3D perspective isometric angle (lying flat on studio tabletop)
   - Thick, cylindrical rounded spine with woven headband cloth ribbons
   - Top & bottom hardcover boards with overhang ("the square")
   - Thick stacked archival paper block recessed inside the boards
   - Debossed French groove on front cover (hinge joint indentation)
   - Real high-res Bride cover photo (front_cover.jpg)
   - Realistic contact and diffuse studio shadows
   ───────────────────────────────────────────────────── */
function ThreeDClosedBookMockup({
  coverSrc,
  width,
  height,
  onOpen,
  isBackCover = false
}) {
  const w = width;
  const h = height;
  const depth = Math.max(16, Math.round(w * 0.08)); // Realistic ~18-24px book block thickness

  return (
    <div
      onClick={onOpen}
      className="relative flex items-center justify-center cursor-pointer select-none group py-3 sm:py-5"
      style={{ perspective: '1200px' }}
      title="Click or swipe to open photobook"
    >
      {/* ── Realistic Diffuse Studio Ground Contact Shadow ── */}
      <div
        className="absolute pointer-events-none transition-all duration-300 group-hover:scale-105"
        style={{
          width: `${w * 1.35}px`,
          height: `${h * 1.15}px`,
          bottom: '-14px',
          left: isBackCover ? '44%' : '52%',
          transform: 'translateX(-50%) skewX(-14deg)',
          background: 'radial-gradient(ellipse at 46% 56%, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.06) 66%, transparent 80%)',
          filter: 'blur(12px)',
          zIndex: 0
        }}
      />

      {/* ── 3D Isometric Book Assembly matching Adobe Stock #1502582528 ── */}
      <div
        className="relative transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]"
        style={{
          width: `${w}px`,
          height: `${h}px`,
          transformStyle: 'preserve-3d',
          transform: isBackCover
            ? 'rotateX(46deg) rotateZ(32deg) rotateY(-6deg)'
            : 'rotateX(46deg) rotateZ(-32deg) rotateY(6deg)',
          zIndex: 10
        }}
      >
        {/* 1. Bottom Hardcover Board (Lies flat on tabletop at Z=0) */}
        <div
          className="absolute inset-0 rounded-[2px] pointer-events-none"
          style={{
            transform: 'translateZ(0px)',
            background: '#FAF8F5',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            border: '1px solid rgba(74,60,40,0.2)'
          }}
        />

        {/* 2. Stacked Archival Paper Block (Fore-Edge - Right side) */}
        <div
          className="absolute top-[2px] bottom-[2px] right-0 pointer-events-none"
          style={{
            width: `${depth}px`,
            transformOrigin: 'right center',
            transform: 'rotateY(90deg)',
            background: 'repeating-linear-gradient(to bottom, #FAF7F2 0px, #EFECE6 1px, #E4DFD5 2px, #D5CDC0 3px)',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.28), inset -2px 0 3px rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(74,60,40,0.18)',
            borderBottom: '1px solid rgba(74,60,40,0.18)'
          }}
        />

        {/* 3. Stacked Archival Paper Block (Tail - Bottom edge) */}
        <div
          className="absolute left-[3px] right-[2px] bottom-0 pointer-events-none"
          style={{
            height: `${depth}px`,
            transformOrigin: 'center bottom',
            transform: 'rotateX(-90deg)',
            background: 'repeating-linear-gradient(to right, #FAF7F2 0px, #EFECE6 1px, #E4DFD5 2px, #D5CDC0 3px)',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.32), inset 0 -2px 3px rgba(0,0,0,0.2)',
            borderLeft: '1px solid rgba(74,60,40,0.18)',
            borderRight: '1px solid rgba(74,60,40,0.18)'
          }}
        />

        {/* 4. Rounded Backbone Spine & Headband (Left edge) */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none"
          style={{
            width: `${depth}px`,
            transformOrigin: 'left center',
            transform: 'rotateY(-90deg)',
            background: 'linear-gradient(to bottom, #8C7862 0px, #FAF8F5 3px, #E8E2D8 50%, #FAF8F5 calc(100% - 3px), #8C7862 100%)',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.45)',
            borderLeft: '1px solid rgba(0,0,0,0.2)'
          }}
        >
          {/* Headband ribbons (striped cloth edge at top & bottom of spine) */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(to_right,#8C7862_0px,#FAF8F5_2px,#C5A880_4px)] opacity-90" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(to_right,#8C7862_0px,#FAF8F5_2px,#C5A880_4px)] opacity-90" />
        </div>

        {/* 5. Top Luxury Hardcover Board (Sits on top of the paper block at translateZ(depth)) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[2px]"
          style={{
            transform: `translateZ(${depth}px)`,
            background: '#FAF8F5',
            boxShadow: isBackCover
              ? 'inset -1px 0 2px rgba(255,255,255,0.4), -1px 1px 3px rgba(0,0,0,0.25)'
              : 'inset 1px 0 2px rgba(255,255,255,0.4), 1px 1px 3px rgba(0,0,0,0.25)',
            border: '1px solid rgba(74,60,40,0.22)'
          }}
        >
          {/* Cover Photo */}
          <img
            src={coverSrc}
            alt="Wedding Photobook Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="eager"
            draggable={false}
          />

          {/* Realistic Debossed French Groove (Hinge Indentation) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? 'auto' : 'clamp(12px, 6%, 20px)',
              right: isBackCover ? 'clamp(12px, 6%, 20px)' : 'auto',
              width: '3.5px',
              background: isBackCover
                ? 'linear-gradient(to left, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.3) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.3) 100%)',
              boxShadow: isBackCover
                ? 'inset -1px 0 2px rgba(0,0,0,0.4)'
                : 'inset 1px 0 2px rgba(0,0,0,0.4)'
            }}
          />

          {/* Soft Spine Roll Lighting Highlight */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? 'auto' : '0px',
              right: isBackCover ? '0px' : 'auto',
              width: 'clamp(12px, 6%, 20px)',
              background: isBackCover
                ? 'linear-gradient(to left, rgba(0,0,0,0.24) 0%, rgba(255,255,255,0.22) 45%, rgba(0,0,0,0.08) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.24) 0%, rgba(255,255,255,0.22) 45%, rgba(0,0,0,0.08) 100%)'
            }}
          />

          {/* Crisp Hardcover Outer Bevel Highlight */}
          <div className="absolute inset-0 pointer-events-none z-20 border border-white/30 shadow-[inset_0_0_6px_rgba(0,0,0,0.14)]" />

          {/* Fore-Edge Lip Thickness Highlight */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? '0px' : 'auto',
              right: isBackCover ? 'auto' : '0px',
              width: '3px',
              background: isBackCover
                ? 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.35) 40%, transparent 100%)'
                : 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.35) 40%, transparent 100%)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE 0: LUXURY FINE-ART HARDCOVER FRONT COVER
   - data-density="hard" (rigid physical book cover)
   - Real bride cover photo loaded from /images/album/front_cover.jpg
   - Debossed French groove / spine hinge indentation on the left
   ───────────────────────────────────────────────────── */
const HeroFrontCover = forwardRef(({ onCoverClick, coverSrc, ...props }, ref) => {
  const imgSrc = coverSrc || "/images/album/front_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to open album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r border-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src={imgSrc}
          alt="Photobook Front Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="eager"
          draggable={false}
        />

        {/* ── Realistic Debossed French Groove / Spine Hinge Indentation ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            left: 'clamp(12px, 6%, 20px)',
            width: '3px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.05) 45%, rgba(255,255,255,0.3) 100%)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.35)'
          }}
        />

        {/* ── Soft Spine Lighting Highlight (Left of groove) ── */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none z-20"
          style={{
            width: 'clamp(12px, 6%, 20px)',
            background: 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(255,255,255,0.18) 45%, rgba(0,0,0,0.08) 100%)'
          }}
        />

        {/* ── Crisp Hardcover Bevel Edge ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/20 shadow-[inset_0_0_5px_rgba(0,0,0,0.12)]"
        />

        {/* ── Right Fore-Edge Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.3) 40%, transparent 100%)',
            borderLeft: '1px solid rgba(0,0,0,0.06)'
          }}
        />
      </div>
    </div>
  );
});
HeroFrontCover.displayName = 'HeroFrontCover';

/* ─────────────────────────────────────────────────────
   PHOTO PAGE HELPER (Archival Mounted: Photos Inserted Into Pages)
   - Photos are neatly inserted into the pages with archival matting
   - Seamless at center spine so 12x36 panoramic spreads meet perfectly
   - Authentic fine-art album page folio (album title & page numbers)
   - 1.50 aspect ratio matches 1500x1000 photos with zero cutting
   ───────────────────────────────────────────────────── */
const HeroPhotoPage = forwardRef(({ src, isLeftPage, pageNumber, totalPhotos, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF7F2] ${props.className || ''}`}
      data-density="soft"
    >
      <div className="w-full h-full relative overflow-hidden bg-[#FAF7F2]">
        {/* Full Bleed Image Edge-to-Edge with centered balance — fills page completely */}
        <img
          src={src}
          alt={`Photobook Page ${pageNumber || ''}`}
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          style={{
            imageRendering: 'high-quality',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)'
          }}
          loading="lazy"
          draggable={false}
        />

        {/* Subtle archival matte print sheen */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/5 via-transparent to-white/10" />

        {/* Center Layflat Spine Crease Depth Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-6 bg-gradient-to-l from-black/28 via-black/8 to-transparent'
              : 'left-0 w-3 sm:w-6 bg-gradient-to-r from-black/28 via-black/8 to-transparent'
          }`}
        />

        {/* Outer Fore-Edge Paper Thickness Highlight */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'left-0 w-1 bg-gradient-to-r from-black/10 to-transparent'
              : 'right-0 w-1 bg-gradient-to-l from-black/10 to-transparent'
          }`}
        />
      </div>
    </div>
  );
});
HeroPhotoPage.displayName = 'HeroPhotoPage';

/* ─────────────────────────────────────────────────────
   PAGE: LUXURY FINE-ART HARDCOVER BACK COVER
   - data-density="hard" (rigid physical book cover)
   - Real back cover photo loaded from /images/album/back_cover.jpg
   - Symmetrical debossed French groove on right side (spine hinge)
   ───────────────────────────────────────────────────── */
const HeroBackCover = forwardRef(({ onCoverClick, backCoverSrc, ...props }, ref) => {
  const imgSrc = backCoverSrc || "/images/album/back_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to reopen album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l border-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src={imgSrc}
          alt="Photobook Back Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* ── Realistic Debossed French Groove on Right Side (Hinge) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            right: 'clamp(12px, 6%, 20px)',
            width: '3px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.05) 45%, rgba(255,255,255,0.3) 100%)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.35)'
          }}
        />

        {/* ── Soft Spine Lighting Highlight (Right of groove) ── */}
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none z-20"
          style={{
            width: 'clamp(12px, 6%, 20px)',
            background: 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(255,255,255,0.18) 45%, rgba(0,0,0,0.08) 100%)'
          }}
        />

        {/* ── Crisp Hardcover Bevel Edge ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/20 shadow-[inset_0_0_5px_rgba(0,0,0,0.12)]"
        />

        {/* ── Left Fore-Edge Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.3) 40%, transparent 100%)',
            borderRight: '1px solid rgba(0,0,0,0.06)'
          }}
        />
      </div>
    </div>
  );
});
HeroBackCover.displayName = 'HeroBackCover';

/* ─────────────────────────────────────────────────────
   Main Export: HeroInteractiveAlbum
   - Direct reproduction of the Adobe Stock 3D physical photobook mockup
   - 3D perspective closed state with rounded spine, thick stacked paper block & shadows
   - Smooth opening to 2-page interactive spread where photos are inserted into the pages
   - Seamless 12x36 panoramic center fold
   - Dedicated [ ⛶ Full View ] and [ ✕ Close Album ] controls
   ───────────────────────────────────────────────────── */
export default function HeroInteractiveAlbum({
  onOpenUpload,
  onOpenFullscreen,
  showFullscreenButton = true,
  customCoverImage = null,
  customPhotos = null
}) {
  const flipBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState(getBookDimensions);

  useEffect(() => {
    const handleResize = () => setDims(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Demo Photobook: Always pristine default demo with full storytelling sequence
  const activePhotos = FLEXY_ALBUM_PHOTOS;
  const activeCover = '/images/album/front_cover.jpg';
  const activeBackCover = '/images/album/back_cover.jpg';

  // 1 (Front Cover) + 66 (Photos) + 1 (Back Cover) = 68 pages (EVEN total, closes cleanly to back cover)
  const totalPages = 1 + activePhotos.length + 1;

  const handleFlipNext = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flipNext();
    } catch (e) {
      console.warn('flipNext error:', e);
    }
  }, []);

  const handleFlipPrev = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flipPrev();
    } catch (e) {
      console.warn('flipPrev error:', e);
    }
  }, []);

  const handleOpenBook = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flip(1);
      setCurrentPage(1);
    } catch (e) {
      handleFlipNext();
    }
  }, [handleFlipNext]);

  const handleReopenBook = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flip(totalPages - 2);
      setCurrentPage(totalPages - 2);
    } catch (e) {
      handleFlipPrev();
    }
  }, [totalPages, handleFlipPrev]);

  const handleCloseBook = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flip(0);
      setCurrentPage(0);
    } catch (e) {
      console.warn('handleCloseBook error:', e);
    }
  }, []);

  const handlePageFlip = useCallback((e) => {
    if (e && typeof e.data === 'number') {
      setCurrentPage(e.data);
    }
  }, []);

  const handleChangeState = useCallback((e) => {
    if (e && e.data === 'read') {
      try {
        const idx = flipBookRef.current?.pageFlip()?.getCurrentPageIndex();
        if (typeof idx === 'number') {
          setCurrentPage(idx);
        }
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const isCover = currentPage === 0;
  const isBackCover = currentPage >= totalPages - 1;
  const isOpen = !isCover && !isBackCover;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-1 sm:my-2 w-full max-w-full px-2"
    >
      {/* ── 3D Stage with Natural Ambient Contact Shadow ── */}
      <div
        className="relative flex items-center justify-center select-none transition-all duration-500 ease-out"
        style={{
          width: isOpen ? dims.singlePageW * 2 : dims.singlePageW + 60,
          height: dims.singlePageH + 20,
          minHeight: `${dims.singlePageH + 16}px`,
          '--album-half-w': `${Math.round(dims.singlePageW / 2)}px`
        }}
      >
        {/* ── 3D CLOSED BOOK MOCKUP (Visible on Front Cover, matches Adobe Stock reference) ── */}
        <AnimatePresence>
          {isCover && (
            <motion.div
              key="closed-front-cover-mockup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35 }}
              className="absolute z-30 flex items-center justify-center pointer-events-auto"
            >
              <ThreeDClosedBookMockup
                coverSrc={activeCover}
                width={dims.singlePageW}
                height={dims.singlePageH}
                onOpen={handleOpenBook}
                isBackCover={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3D CLOSED BOOK MOCKUP (Visible on Back Cover) ── */}
        <AnimatePresence>
          {isBackCover && (
            <motion.div
              key="closed-back-cover-mockup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35 }}
              className="absolute z-30 flex items-center justify-center pointer-events-auto"
            >
              <ThreeDClosedBookMockup
                coverSrc={activeBackCover}
                width={dims.singlePageW}
                height={dims.singlePageH}
                onOpen={handleReopenBook}
                isBackCover={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "Swipe to open" Callout (Positioned in open space to the right of the book cover) ── */}
        <AnimatePresence>
          {isCover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: 0.15 }}
              onClick={handleOpenBook}
              className="hero-swipe-callout absolute top-[16%] xs:top-[20%] sm:top-[24%] z-50 flex flex-col items-start cursor-pointer select-none pointer-events-auto group max-w-[85px] sm:max-w-none"
              title="Click or swipe to open"
            >
              <span className="font-serif italic font-semibold text-[10px] xs:text-[11px] sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap -rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Swipe to open
              </span>
              <svg
                width="28"
                height="20"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 ml-0.5 group-hover:-translate-x-1 transition-all sm:w-8 sm:h-5"
              >
                <path
                  d="M26 4C18 4 12 8 5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 9L4 15L11 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "Tap to reopen" Callout (Positioned in open space to the left of the closed back cover) ── */}
        <AnimatePresence>
          {isBackCover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: 0.15 }}
              onClick={handleReopenBook}
              className="hero-reopen-callout absolute top-[16%] xs:top-[20%] sm:top-[24%] z-50 flex flex-col items-end cursor-pointer select-none pointer-events-auto group max-w-[85px] sm:max-w-none"
              title="Click or swipe to reopen album"
            >
              <span className="font-serif italic font-semibold text-[10px] xs:text-[11px] sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Tap to reopen
              </span>
              <svg
                width="28"
                height="20"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 mr-0.5 group-hover:translate-x-1 transition-all sm:w-8 sm:h-5"
              >
                <path
                  d="M6 4C14 4 20 8 27 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 9L28 15L21 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Discreet Outside Navigation Arrows (When Open) ── */}
        {isOpen && (
          <button
            type="button"
            onClick={handleFlipPrev}
            className="absolute -left-8 sm:-left-11 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(20,20,22,0.92)',
              color: '#C5A880',
              borderColor: 'rgba(197,168,128,0.5)'
            }}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {isOpen && (
          <button
            type="button"
            onClick={handleFlipNext}
            className="absolute -right-8 sm:-right-11 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(20,20,22,0.92)',
              color: '#C5A880',
              borderColor: 'rgba(197,168,128,0.5)'
            }}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* ── Smooth Container for Open 2-Page Spread ── */}
        <div
          className="relative transition-all duration-500 ease-out"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            visibility: isOpen ? 'visible' : 'hidden'
          }}
        >
          {/* Hardcover Casing Underplate & Fore-Edge Framing Beneath Open Pages */}
          {isOpen && (
            <div
              className="absolute -inset-1 sm:-inset-1.5 rounded-xs pointer-events-none z-0"
              style={{
                background: '#EAE5DC',
                boxShadow: '0 20px 48px -8px rgba(0,0,0,0.3), 0 8px 20px -4px rgba(0,0,0,0.16)'
              }}
            >
              {/* Visible Paper Block Fore-Edges on Left and Right */}
              <div className="absolute top-1 bottom-1 left-0.5 w-1 bg-gradient-to-r from-[#EFE9DF] to-[#FAF7F2] border-r border-black/10" />
              <div className="absolute top-1 bottom-1 right-0.5 w-1 bg-gradient-to-l from-[#EFE9DF] to-[#FAF7F2] border-l border-black/10" />
            </div>
          )}

          {/* ── REAL 3D PAGE-FLIP ENGINE (HTMLFlipBook) ── */}
          <HTMLFlipBook
            key={`hero-flipbook-${dims.singlePageW}-${dims.singlePageH}-${activePhotos.length}-${activeCover}`}
            ref={flipBookRef}
            width={dims.singlePageW}
            height={dims.singlePageH}
            size="fixed"
            minWidth={130}
            maxWidth={800}
            minHeight={120}
            maxHeight={800}
            maxShadowOpacity={0.6}
            showCover={true}
            mobileScrollSupport={true}
            flippingTime={550}
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
            onChangeState={handleChangeState}
            className="album-flipbook-shadow"
          >
            {/* Page 0: Front Cover */}
            <HeroFrontCover
              coverSrc={activeCover}
              onCoverClick={handleFlipNext}
            />

            {/* Photo Pages: Archival mounted, photos inserted into the pages with folios */}
            {activePhotos.map((photo, idx) => (
              <HeroPhotoPage
                key={photo.id}
                src={photo.src}
                isLeftPage={idx % 2 === 0}
                pageNumber={idx + 1}
                totalPhotos={activePhotos.length}
              />
            ))}

            {/* Final Page: Luxury Hardcover Back Cover (Closes directly to single-page mode) */}
            <HeroBackCover
              backCoverSrc={activeBackCover}
              onCoverClick={handleFlipPrev}
            />
          </HTMLFlipBook>
        </div>
      </div>

      {/* ── CONTROLS TOOLBAR: FULL VIEW BUTTON ── */}
      <div className="flex items-center justify-center gap-2 mt-2 sm:mt-2.5 select-none z-20">
        {onOpenFullscreen && showFullscreenButton && (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="group inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#161412]/95 hover:bg-black text-[#F4ECD8] text-[9.5px] sm:text-xs font-serif tracking-widest uppercase border border-[#C5A880]/60 hover:border-[#C5A880] shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_18px_rgba(197,168,128,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Open in Full View 3D Photobook"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover:scale-110 transition-transform" />
            <span>Full View</span>
          </button>
        )}
      </div>
    </div>
  );
}
