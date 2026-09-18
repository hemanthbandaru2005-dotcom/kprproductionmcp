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
    return { singlePageW: 285, singlePageH: 190 };
  }
  const w = window.innerWidth;
  if (w < 380) {
    return { singlePageW: 144, singlePageH: 96 };
  }
  if (w < 480) {
    return { singlePageW: 156, singlePageH: 104 };
  }
  if (w < 640) {
    return { singlePageW: 180, singlePageH: 120 };
  }
  if (w < 768) {
    return { singlePageW: 210, singlePageH: 140 };
  }
  if (w < 1024) {
    return { singlePageW: 240, singlePageH: 160 };
  }
  if (w < 1280) {
    return { singlePageW: 264, singlePageH: 176 };
  }
  return { singlePageW: 285, singlePageH: 190 };
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
  const thickness = Math.max(16, Math.round(w * 0.095)); // ~26px on desktop, ~16px on mobile
  const overhang = Math.max(3, Math.round(w * 0.015)); // ~4px overhang
  const boardW = w + overhang;
  const boardH = h + overhang * 2;

  return (
    <div
      onClick={onOpen}
      className="relative flex items-center justify-center cursor-pointer select-none group py-3 sm:py-4 px-2"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 45%'
      }}
      title="Click or swipe to open photobook"
    >
      {/* ── Studio Ground Contact & Ambient Shadows (matching reference photo) ── */}
      <div
        className="absolute pointer-events-none transition-all duration-500 ease-out"
        style={{
          width: `${boardW * 1.18}px`,
          height: `${boardH * 0.95}px`,
          bottom: '6px',
          left: '50%',
          transform: isBackCover
            ? 'translateX(-50%) rotateX(42deg) rotateY(10deg) rotateZ(20deg) translateY(18px) scale(0.96)'
            : 'translateX(-50%) rotateX(42deg) rotateY(-8deg) rotateZ(-22deg) translateY(18px) scale(0.96)',
          background: 'radial-gradient(ellipse at 46% 46%, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.24) 42%, rgba(0,0,0,0.06) 68%, transparent 82%)',
          filter: 'blur(15px)',
          zIndex: 0
        }}
      />

      {/* ── 3D Isometric Hardcover Book Assembly ── */}
      <div
        className="relative transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-2"
        style={{
          width: `${w}px`,
          height: `${h}px`,
          transformStyle: 'preserve-3d',
          transform: isBackCover
            ? 'rotateX(38deg) rotateY(8deg) rotateZ(22deg)'
            : 'rotateX(38deg) rotateY(-8deg) rotateZ(-22deg)',
          zIndex: 10
        }}
      >
        {/* ── 1. BOTTOM HARDCOVER BOARD (Lies flat on ground) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${boardW}px`,
            height: `${boardH}px`,
            left: `-${overhang * 0.5}px`,
            top: `-${overhang}px`,
            transform: 'translateZ(0px)',
            background: '#F0ECE4',
            borderRadius: '2px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}
        />

        {/* ── 2. RECESSED STACKED PAPER BLOCK (Pages stacked between boards) ── */}
        {/* Front-Facing Bottom Edge of Paper Block (Visible in reference image) */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${w}px`,
            height: `${thickness}px`,
            left: '0px',
            top: `${h}px`,
            transform: 'translateY(-1px) rotateX(-90deg)',
            transformOrigin: 'top center',
            background: 'repeating-linear-gradient(to bottom, #FAF7F2 0px, #FAF7F2 1.5px, #D8CEC0 2px, #FAF7F2 2.5px)',
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.22), inset 0 -2px 4px rgba(0,0,0,0.16)'
          }}
        />

        {/* Right-Facing Fore-Edge of Paper Block (Visible in reference image) */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${thickness}px`,
            height: `${h}px`,
            left: `${w}px`,
            top: '0px',
            transform: 'translateX(-1px) rotateY(90deg)',
            transformOrigin: 'left center',
            background: 'repeating-linear-gradient(to right, #FAF7F2 0px, #FAF7F2 1.5px, #D8CEC0 2px, #FAF7F2 2.5px)',
            boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.22), inset -2px 0 4px rgba(0,0,0,0.16)'
          }}
        />

        {/* Top-Facing Rear Edge of Paper Block */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${w}px`,
            height: `${thickness}px`,
            left: '0px',
            top: '0px',
            transform: 'rotateX(90deg)',
            transformOrigin: 'top center',
            background: 'repeating-linear-gradient(to top, #FAF7F2 0px, #FAF7F2 1.5px, #D8CEC0 2px, #FAF7F2 2.5px)',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.2)'
          }}
        />

        {/* ── 3. ROUNDED HARDCOVER SPINE (Left edge, matching reference) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${thickness}px`,
            height: `${boardH}px`,
            left: '0px',
            top: `-${overhang}px`,
            transform: 'rotateY(-90deg)',
            transformOrigin: 'left center',
            background: 'linear-gradient(to bottom, #2C241C 0%, #4D4033 15%, #7D6B58 35%, #B39F88 50%, #7D6B58 65%, #4D4033 85%, #2C241C 100%)',
            borderRadius: '4px 0 0 4px',
            boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)'
          }}
        >
          {/* Top Spine Cloth Headband Ribbon */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: 'repeating-linear-gradient(45deg, #C5A880, #C5A880 2px, #8A2B1E 2px, #8A2B1E 4px)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
            }}
          />
          {/* Bottom Spine Cloth Headband Ribbon */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5"
            style={{
              background: 'repeating-linear-gradient(45deg, #C5A880, #C5A880 2px, #8A2B1E 2px, #8A2B1E 4px)',
              boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.4)'
            }}
          />
        </div>

        {/* ── 4. TOP HARDCOVER BOARD (With Bride photo and debossed groove) ── */}
        <div
          className="absolute overflow-hidden rounded-[2px] shadow-2xl transition-transform duration-300 group-hover:translate-z-[3px]"
          style={{
            width: `${boardW}px`,
            height: `${boardH}px`,
            left: `-${overhang * 0.5}px`,
            top: `-${overhang}px`,
            transform: `translateZ(${thickness}px)`,
            background: '#FAF8F5',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 10px 28px -4px rgba(0,0,0,0.35), inset 0 0 6px rgba(0,0,0,0.15)'
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

          {/* Realistic Debossed French Groove (Joint Indentation) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? 'auto' : 'clamp(14px, 7%, 22px)',
              right: isBackCover ? 'clamp(14px, 7%, 22px)' : 'auto',
              width: '3.5px',
              background: isBackCover
                ? 'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.3) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.3) 100%)',
              boxShadow: isBackCover
                ? 'inset -1px 0 2px rgba(0,0,0,0.45)'
                : 'inset 1px 0 2px rgba(0,0,0,0.45)'
            }}
          />

          {/* Soft Spine Roll Lighting Highlight */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? 'auto' : '0px',
              right: isBackCover ? '0px' : 'auto',
              width: 'clamp(14px, 7%, 22px)',
              background: isBackCover
                ? 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.08) 100%)'
                : 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0.2) 40%, rgba(0,0,0,0.08) 100%)'
            }}
          />

          {/* Hardcover Outer Bevel Highlight */}
          <div className="absolute inset-0 pointer-events-none z-20 border border-white/25 shadow-[inset_0_0_6px_rgba(0,0,0,0.18)]" />

          {/* Fore-Edge Lip Thickness Highlight */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: isBackCover ? '0px' : 'auto',
              right: isBackCover ? 'auto' : '0px',
              width: '2.5px',
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
      {/* ── Archival Fine-Art Album Page Structure ── */}
      <div
        className={`w-full h-full relative overflow-hidden flex flex-col justify-between bg-[#FAF7F2] ${
          isLeftPage
            ? 'p-2 sm:p-2.5 pr-0 sm:pr-0 pb-2.5 sm:pb-3'
            : 'p-2 sm:p-2.5 pl-0 sm:pl-0 pb-2.5 sm:pb-3'
        }`}
      >
        {/* ── Mounted Photo Frame (Inserted Into The Page) ── */}
        <div className="w-full flex-1 relative overflow-hidden rounded-[1.5px] bg-[#EDE6DC] shadow-[0_1px_4px_rgba(0,0,0,0.12),inset_0_0_1px_rgba(0,0,0,0.18)] border border-[#4A3C28]/10">
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
        </div>

        {/* ── Fine-Art Page Folio / Luxury Album Footer ── */}
        <div
          className={`flex items-center mt-1 px-1 select-none pointer-events-none ${
            isLeftPage ? 'justify-start' : 'justify-end'
          }`}
        >
          {isLeftPage ? (
            <span className="font-serif tracking-[0.18em] text-[7px] sm:text-[8.5px] uppercase text-[#7A6B58]/80 font-medium">
              KPR PRODUCTIONS • WEDDING ALBUM
            </span>
          ) : (
            <span className="font-serif tracking-[0.18em] text-[7px] sm:text-[8.5px] uppercase text-[#7A6B58]/80 font-medium">
              {pageNumber ? `PAGE ${String(pageNumber).padStart(2, '0')}` : 'FINE ART'}
            </span>
          )}
        </div>

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
        className="relative flex items-center justify-center select-none transition-all duration-500 ease-out min-h-[195px] sm:min-h-[220px]"
        style={{
          width: isOpen ? dims.singlePageW * 2 : dims.singlePageW + 60,
          height: dims.singlePageH + 20
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
              className="absolute top-[18%] xs:top-[22%] sm:top-[25%] left-full ml-1 xs:ml-2 sm:ml-3 z-50 flex flex-col items-start cursor-pointer select-none pointer-events-auto group"
              title="Click or swipe to open"
            >
              <span className="font-serif italic font-semibold text-[11px] xs:text-xs sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap -rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Swipe to open
              </span>
              <svg
                width="32"
                height="22"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 ml-1 group-hover:-translate-x-1 transition-all"
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
              className="absolute top-[18%] xs:top-[22%] sm:top-[25%] right-full mr-1 xs:mr-2 sm:mr-3 z-50 flex flex-col items-end cursor-pointer select-none pointer-events-auto group"
              title="Click or swipe to reopen album"
            >
              <span className="font-serif italic font-semibold text-[11px] xs:text-xs sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Tap to reopen
              </span>
              <svg
                width="32"
                height="22"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 mr-1 group-hover:translate-x-1 transition-all"
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

      {/* ── CONTROLS TOOLBAR: CLOSE ALBUM & FULL VIEW BUTTONS ── */}
      <div className="flex items-center justify-center gap-2 mt-2 sm:mt-2.5 select-none z-20">
        {isOpen && (
          <button
            type="button"
            onClick={handleCloseBook}
            className="group inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#2A241E]/90 hover:bg-[#1E1914] text-[#E8DEC8] text-[9.5px] sm:text-xs font-serif tracking-wider border border-[#8A7862]/40 hover:border-[#C5A880] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Close photobook to 3D cover"
          >
            <span>✕ Close Book</span>
          </button>
        )}

        {isOpen && (
          <span className="text-[10px] sm:text-[11px] font-serif italic text-[#6B5E4E]">
            Page {currentPage} of {totalPages - 2}
          </span>
        )}

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
