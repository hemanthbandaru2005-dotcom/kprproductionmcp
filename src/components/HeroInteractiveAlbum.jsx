import React, { useState, useRef, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  BookOpen,
  Upload,
  Camera,
  RotateCcw,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Hardcover Component: Front Cover and Back Cover
   Uses data-density="hard" for authentic rigid 3D board flip
   ───────────────────────────────────────────────────── */
const AlbumCoverPage = forwardRef(({ children, className = '', isBack = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden ${className}`}
      data-density="hard"
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center">
        {children}

        {/* Hardcover Perimeter Bevel Rim */}
        <div className="absolute inset-0 pointer-events-none border border-[#C5A880]/30 shadow-inner" />
      </div>
    </div>
  );
});
AlbumCoverPage.displayName = 'AlbumCoverPage';

/* ─────────────────────────────────────────────────────
   Single Inside Page Component:
   Soft layflat silk photo paper with spine binding crease
   ───────────────────────────────────────────────────── */
const AlbumPage = forwardRef(({ children, className = '', isLeft = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${className}`}
      data-density="soft"
    >
      {/* Page Content Container */}
      <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-1 sm:p-1.5">
        {children}

        {/* Photorealistic Spine Binding Crease Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-20 ${
            isLeft
              ? 'right-0 w-3 sm:w-5 bg-gradient-to-l from-black/25 via-black/8 to-transparent'
              : 'left-0 w-3 sm:w-5 bg-gradient-to-r from-black/25 via-black/8 to-transparent'
          }`}
        />

        {/* Paper texture subtle sheen */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-tr from-black/[0.04] via-transparent to-white/[0.08]" />
      </div>
    </div>
  );
});
AlbumPage.displayName = 'AlbumPage';

/* ─────────────────────────────────────────────────────
   Helper to compute responsive single-page dimensions
   ensuring the album fits cleanly in Hero section
   ───────────────────────────────────────────────────── */
function getHeroPageDimensions() {
  if (typeof window === 'undefined') return { width: 195, height: 138 };
  const w = window.innerWidth;
  if (w < 370) {
    // Ultra-compact mobile
    return { width: 122, height: 88 };
  } else if (w < 480) {
    // Standard mobile
    return { width: 138, height: 98 };
  } else if (w < 640) {
    // Large mobile
    return { width: 152, height: 108 };
  } else if (w < 768) {
    // Small tablet
    return { width: 168, height: 118 };
  } else if (w < 1024) {
    // Tablet / Small Laptop
    return { width: 180, height: 128 };
  } else if (w < 1280) {
    // Standard Desktop / Laptop
    return { width: 195, height: 138 };
  } else {
    // Large Desktop
    return { width: 208, height: 146 };
  }
}

export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen }) {
  const flipBookRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const [dimensions, setDimensions] = useState(getHeroPageDimensions);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Keep dimensions synced with window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getHeroPageDimensions());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Flipping controls
  const flipNext = () => {
    try {
      flipBookRef.current?.pageFlip()?.flipNext();
    } catch (err) {
      console.warn('FlipNext failed:', err);
    }
  };

  const flipPrev = () => {
    try {
      flipBookRef.current?.pageFlip()?.flipPrev();
    } catch (err) {
      console.warn('FlipPrev failed:', err);
    }
  };

  const goToSpread = (spreadIdx) => {
    try {
      // Spread 0 -> Page 0 (Front Cover)
      // Spread 1 -> Page 1 (Spread 1)
      // Spread 2 -> Page 3 (Spread 2)
      // Spread 3 -> Page 5 (Spread 3)
      // Spread 4 -> Page 7 (Spread 4)
      // Spread 5 -> Page 9 (Back Cover)
      const targetPage =
        spreadIdx === 0 ? 0 : spreadIdx === 5 ? 9 : spreadIdx * 2 - 1;
      flipBookRef.current?.pageFlip()?.flip(targetPage);
    } catch (err) {
      console.warn('GoToSpread failed:', err);
    }
  };

  // Touch Swipe Handlers for Mobile Phones
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold: 24px and mostly horizontal
    if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
      if (deltaX < 0) {
        if (currentPage < 9) flipNext();
      } else {
        if (currentPage > 0) flipPrev();
      }
    }
  };

  // Current Spread Index calculation:
  // Page 0 -> Spread 0 (Closed Front Cover)
  // Page 1, 2 -> Spread 1 (First Open Spread)
  // Page 3, 4 -> Spread 2
  // Page 5, 6 -> Spread 3
  // Page 7, 8 -> Spread 4
  // Page 9 -> Spread 5 (Closed Back Cover)
  const currentSpread =
    currentPage === 0
      ? 0
      : currentPage >= 9
      ? 5
      : Math.ceil(currentPage / 2);

  const totalSpreads = 6;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-0.5 sm:my-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── 'Swipe to explore' Cue (Desktop / Tablet) ── */}
      <div
        className={`absolute -left-10 xs:-left-12 sm:-left-16 md:-left-20 top-1/2 -translate-y-1/2 pointer-events-none select-none z-30 hidden xs:block transition-opacity duration-300 ${
          currentSpread === 0 ? 'opacity-90' : 'opacity-60'
        }`}
      >
        <img
          src="/images/swipe_to_explore.png"
          alt="Swipe to explore"
          className="w-10 xs:w-12 sm:w-15 md:w-18 h-auto object-contain drop-shadow-xs -rotate-3 transition-transform duration-300 hover:scale-105"
          draggable="false"
        />
      </div>

      {/* ── 3D Physical Photobook Stage Container with Smooth Centering Transform ── */}
      <div
        className="relative flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          transform:
            currentSpread === 0
              ? 'translateX(-25%)'
              : currentSpread === 5
              ? 'translateX(25%)'
              : 'translateX(0%)',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Stacked Layflat Pages Bottom Thickness Edge (Follows closed/open state) */}
        <div
          className={`absolute -bottom-1 sm:-bottom-1.5 h-1 sm:h-1.5 bg-gradient-to-r from-[#D5CABB] via-[#FAF7F2] to-[#D5CABB] rounded-b-2xs opacity-85 pointer-events-none transition-all duration-500 shadow-sm ${
            currentSpread === 0
              ? 'right-1 w-1/2'
              : currentSpread === 5
              ? 'left-1 w-1/2'
              : 'left-2 right-2'
          }`}
        />

        {/* Top-Right Fullscreen Expand Action Badge */}
        {onOpenFullscreen && (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-3 z-40 p-1 sm:p-1.5 rounded-full bg-[#1A1A1A]/90 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/50 shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Open Fullscreen 3D Photobook Viewer"
            aria-label="Open Fullscreen Viewer"
          >
            <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        )}

        {/* ── Left Navigation Arrow ── */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={currentPage === 0}
          className={`absolute -left-3 sm:-left-4.5 top-1/2 -translate-y-1/2 z-35 p-1 sm:p-1.5 rounded-full bg-[#1A1A1A]/90 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/50 shadow-md transition-all duration-200 cursor-pointer ${
            currentPage === 0
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Previous page (Swipe or Click)"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ── Right Navigation Arrow ── */}
        <button
          type="button"
          onClick={flipNext}
          disabled={currentPage >= 9}
          className={`absolute -right-3 sm:-right-4.5 top-1/2 -translate-y-1/2 z-35 p-1 sm:p-1.5 rounded-full bg-[#1A1A1A]/90 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/50 shadow-md transition-all duration-200 cursor-pointer ${
            currentPage >= 9
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Next page (Swipe or Click)"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ── HTMLFlipBook Core Engine with Full Cover Support ── */}
        <HTMLFlipBook
          key={`hero-flipbook-${dimensions.width}-${dimensions.height}`}
          ref={flipBookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={100}
          maxWidth={420}
          minHeight={75}
          maxHeight={320}
          maxShadowOpacity={0.55}
          showCover={true}
          mobileScrollSupport={false}
          flippingTime={500}
          usePortrait={false}
          startPage={0}
          drawShadow={true}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={14}
          showPageCorners={true}
          disableFlipByClick={false}
          onFlip={(e) => setCurrentPage(e.data)}
          className="album-flipbook-shadow cursor-grab active:cursor-grabbing rounded-xs shadow-[0_20px_45px_rgba(0,0,0,0.45),0_6px_18px_rgba(0,0,0,0.3)]"
        >
          {/* ════════ PAGE 0: FRONT COVER (KPR PRODUCTIONS LUXURY COVER) ════════ */}
          <AlbumCoverPage isBack={false}>
            <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#1A1612] via-[#262019] to-[#100D0A] flex flex-col items-center justify-between p-2 sm:p-3 text-center border-r-2 border-r-[#C5A880]/50 shadow-2xl">
              {/* Leather Grain Texture & Specular Sheen */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5C4A6_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />

              {/* Left Spine Joint Hinge Channel & Embossed Stitching */}
              <div className="absolute top-0 bottom-0 left-0 w-3 sm:w-4 bg-gradient-to-r from-black/65 via-black/35 to-transparent pointer-events-none border-r border-[#C5A880]/30 z-10 flex flex-col justify-around items-center py-2 opacity-80">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-0.5 h-1.5 bg-[#C5A880]/60 rounded-full" />
                ))}
              </div>

              {/* Double Gold Hot-Stamped Foil Borders */}
              <div className="absolute inset-1.5 sm:inset-2.5 border border-[#C5A880]/60 rounded-2xs pointer-events-none" />
              <div className="absolute inset-2 sm:inset-3.5 border border-[#C5A880]/25 rounded-2xs pointer-events-none" />

              {/* Royal Filigree Corner Accents */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-l-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-r-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-l-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-r-2 border-[#E5D3B3]/90 pointer-events-none" />

              {/* ── Top Crest & Subtitle ── */}
              <div className="relative z-10 pt-0.5 sm:pt-1">
                <div className="flex items-center justify-center gap-1 text-[#E5D3B3]">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C5A880]" />
                  <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.25em] text-[#C5A880]">
                    ROYAL HEIRLOOM COLLECTION
                  </span>
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C5A880]" />
                </div>
              </div>

              {/* ── Centerpiece: Prominent KPR PRODUCTIONS Typography ── */}
              <div className="relative z-10 my-auto px-2 space-y-1 sm:space-y-1.5">
                {/* Ornate Gold Camera Medallion Crest */}
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#C5A880]/30 to-[#1A1612] border border-[#E5D3B3]/70 flex items-center justify-center mx-auto shadow-inner">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-[#F5E6D0]" />
                </div>

                <div className="space-y-0.5">
                  <h2 className="font-serif text-[11px] sm:text-[14px] md:text-[15.5px] font-bold tracking-[0.22em] uppercase leading-tight bg-gradient-to-b from-[#FFF7E8] via-[#E8CE9B] to-[#B8935C] bg-clip-text text-transparent drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]">
                    KPR PRODUCTIONS
                  </h2>
                  <div className="flex items-center justify-center gap-1 py-0.5">
                    <div className="w-4 sm:w-7 h-px bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
                    <span className="text-[6px] sm:text-[7px] text-[#C5A880]">✦</span>
                    <div className="w-4 sm:w-7 h-px bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
                  </div>
                  <p className="font-serif text-[7px] sm:text-[9px] text-[#F0E6D2] tracking-[0.16em] uppercase font-medium">
                    Wedding Photobook
                  </p>
                  <p className="text-[5.5px] sm:text-[7px] text-[#C5A880]/90 font-mono tracking-wider uppercase">
                    12×36 Layflat Silk Edition
                  </p>
                </div>

                {/* Interactive Click to Open Prompt */}
                <div className="pt-0.5 sm:pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flipNext();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-[#C5A880] via-[#DFBA73] to-[#C5A880] text-[#120F0D] text-[6.5px] sm:text-[8px] font-bold uppercase tracking-wider shadow-[0_2px_8px_rgba(197,168,128,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Open Album</span>
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* ── Bottom Footnote ── */}
              <div className="relative z-10 pb-0.5">
                <p className="text-[5.5px] sm:text-[6.5px] text-[#C5A880]/70 uppercase tracking-[0.25em] font-medium">
                  KPR COLOUR LAB & STUDIO · HYDERABAD
                </p>
              </div>
            </div>
          </AlbumCoverPage>

          {/* ════════ SPREAD 1: EX LIBRIS DEDICATION & BRIDAL PORTRAIT ════════ */}
          {/* Page 1 (Spread 1 Left): Archival Dedication & Ex Libris Endpaper */}
          <AlbumPage isLeft={true} className="bg-gradient-to-br from-[#FAF8F5] via-[#F4EFE6] to-[#EAE0D0]">
            <div className="w-full h-full flex flex-col items-center justify-between p-1.5 sm:p-2 text-center relative overflow-hidden border border-[#D5C9B8]/70 rounded-2xs">
              <div className="absolute top-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-l border-[#8C6D3F]/40" />
              <div className="absolute top-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-r border-[#8C6D3F]/40" />
              <div className="absolute bottom-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-l border-[#8C6D3F]/40" />
              <div className="absolute bottom-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-r border-[#8C6D3F]/40" />

              <div className="pt-0.5">
                <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.22em] text-[#8C6D3F]">
                  EX LIBRIS · WEDDING HEIRLOOM
                </span>
              </div>

              <div className="my-auto px-1 space-y-0.5 sm:space-y-1">
                <div className="w-6 sm:w-10 h-px bg-[#8C6D3F]/40 mx-auto" />
                <h3 className="font-serif text-[8.5px] sm:text-[11px] text-[#2A231C] font-normal tracking-wide uppercase leading-tight">
                  A Lifetime of Cherished Vows
                </h3>
                <p className="font-serif italic text-[5.5px] sm:text-[7px] text-[#6A5A4A] leading-relaxed max-w-[140px] mx-auto">
                  “Every glance a sacred memory, every smile an eternal treasure preserved for generations.”
                </p>
                <div className="w-6 sm:w-10 h-px bg-[#8C6D3F]/40 mx-auto" />
                <p className="text-[5.5px] sm:text-[6.5px] text-[#8C6D3F] font-mono tracking-widest uppercase">
                  Mastercrafted by KPR Colour Lab
                </p>
              </div>

              <div className="pb-0.5">
                <span className="text-[5px] sm:text-[6.5px] text-[#8C6D3F]/80 tracking-wider uppercase font-medium bg-[#8C6D3F]/10 px-1.5 py-0.5 rounded-full border border-[#8C6D3F]/20">
                  Turn Page →
                </span>
              </div>
            </div>
          </AlbumPage>

          {/* Page 2 (Spread 1 Right): Bridal Portrait Photo */}
          <AlbumPage isLeft={false} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_1.jpg"
                alt="Bridal Elegance"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="eager"
                draggable="false"
              />
              <span className="absolute bottom-1 right-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                01 · The Royal Bride
              </span>
            </div>
          </AlbumPage>

          {/* ════════ SPREAD 2: COUPLE PORTRAIT & MANDAP CEREMONY ════════ */}
          {/* Page 3 (Spread 2 Left): Couple Royal Portrait */}
          <AlbumPage isLeft={true} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_2.jpg"
                alt="Couple Portrait"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="lazy"
                draggable="false"
              />
              <span className="absolute bottom-1 left-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                02 · Couple Portrait
              </span>
            </div>
          </AlbumPage>

          {/* Page 4 (Spread 2 Right): Mandap & Traditional Vows */}
          <AlbumPage isLeft={false} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_3.jpg"
                alt="Mandap Vows Ceremony"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="lazy"
                draggable="false"
              />
              <span className="absolute bottom-1 right-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                03 · Sacred Mandap
              </span>
            </div>
          </AlbumPage>

          {/* ════════ SPREAD 3: HALDI JOY & CANDID MOMENTS ════════ */}
          {/* Page 5 (Spread 3 Left): Haldi Ceremony Celebrations */}
          <AlbumPage isLeft={true} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_4.jpg"
                alt="Joyful Haldi Celebrations"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="lazy"
                draggable="false"
              />
              <span className="absolute bottom-1 left-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                04 · Vibrant Haldi
              </span>
            </div>
          </AlbumPage>

          {/* Page 6 (Spread 3 Right): Cinematic Sunset Couple Candid */}
          <AlbumPage isLeft={false} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_6.jpg"
                alt="Cinematic Sunset Moments"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="lazy"
                draggable="false"
              />
              <span className="absolute bottom-1 right-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                05 · Sunset Romance
              </span>
            </div>
          </AlbumPage>

          {/* ════════ SPREAD 4: GRAND RECEPTION & ARCHIVAL CERTIFICATE ════════ */}
          {/* Page 7 (Spread 4 Left): Grand Reception Evening */}
          <AlbumPage isLeft={true} className="bg-[#FAF8F5]">
            <div className="w-full h-full relative flex items-center justify-center p-0.5 rounded-2xs overflow-hidden bg-[#111111]/[0.03]">
              <img
                src="/images/wedding/photo_7.jpg"
                alt="Grand Wedding Reception"
                className="w-full h-full object-cover rounded-2xs pointer-events-none select-none"
                loading="lazy"
                draggable="false"
              />
              <span className="absolute bottom-1 left-1.5 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/90 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs font-bold">
                06 · Grand Reception
              </span>
            </div>
          </AlbumPage>

          {/* Page 8 (Spread 4 Right): Certificate of Archival Authenticity & Upload CTA */}
          <AlbumPage isLeft={false} className="bg-gradient-to-br from-[#FAF8F5] via-[#F4EFE6] to-[#EAE0D0]">
            <div className="w-full h-full flex flex-col items-center justify-between p-1.5 sm:p-2 text-center relative overflow-hidden border border-[#D5C9B8]/70 rounded-2xs">
              <div className="absolute top-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-l border-[#8C6D3F]/40" />
              <div className="absolute top-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-r border-[#8C6D3F]/40" />
              <div className="absolute bottom-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-l border-[#8C6D3F]/40" />
              <div className="absolute bottom-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-r border-[#8C6D3F]/40" />

              <div className="pt-0.5">
                <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.22em] text-[#8C6D3F]">
                  ARCHIVAL CERTIFICATE
                </span>
              </div>

              <div className="my-auto px-1 space-y-0.5 sm:space-y-1">
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#8C6D3F]/15 border border-[#8C6D3F]/40 flex items-center justify-center mx-auto text-[#8C6D3F]">
                  <BookOpen className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </div>
                <h4 className="font-serif text-[8px] sm:text-[10.5px] text-[#2A231C] font-normal tracking-wide uppercase leading-tight">
                  Preserve Your Story
                </h4>
                <p className="text-[5.5px] sm:text-[6.5px] text-[#6A5A4A] leading-snug max-w-[140px] mx-auto">
                  100% Layflat Flushmount Binding with Ultra-HD 4K Chromogenic Silk Printing
                </p>

                {onOpenUpload && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUpload();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#181410] hover:bg-black text-[#E8D4B8] hover:text-white border border-[#C5A880]/50 text-[6.5px] sm:text-[7.5px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer mt-0.5"
                  >
                    <Upload className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span>Upload Photos</span>
                  </button>
                )}
              </div>

              <div className="pb-0.5">
                <span className="text-[5px] sm:text-[6.5px] text-[#8C6D3F]/80 tracking-widest uppercase font-mono">
                  Turn to Close Album →
                </span>
              </div>
            </div>
          </AlbumPage>

          {/* ════════ PAGE 9: BACK COVER (KPR PRODUCTIONS STUDIO SEAL) ════════ */}
          <AlbumCoverPage isBack={true}>
            <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#1A1612] via-[#262019] to-[#100D0A] flex flex-col items-center justify-between p-2 sm:p-3 text-center border-l-2 border-l-[#C5A880]/50 shadow-2xl">
              {/* Leather Grain Texture & Lighting */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#D5C4A6_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />

              {/* Right Spine Joint Hinge Groove & Stitching */}
              <div className="absolute top-0 bottom-0 right-0 w-3 sm:w-4 bg-gradient-to-l from-black/65 via-black/35 to-transparent pointer-events-none border-l border-[#C5A880]/30 z-10 flex flex-col justify-around items-center py-2 opacity-80">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-0.5 h-1.5 bg-[#C5A880]/60 rounded-full" />
                ))}
              </div>

              {/* Double Gold Borders */}
              <div className="absolute inset-1.5 sm:inset-2.5 border border-[#C5A880]/60 rounded-2xs pointer-events-none" />
              <div className="absolute inset-2 sm:inset-3.5 border border-[#C5A880]/25 rounded-2xs pointer-events-none" />

              {/* Royal Filigree Corners */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-l-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-t-2 border-r-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-l-2 border-[#E5D3B3]/90 pointer-events-none" />
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-b-2 border-r-2 border-[#E5D3B3]/90 pointer-events-none" />

              <div className="relative z-10 pt-0.5 sm:pt-1">
                <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.25em] text-[#C5A880]">
                  ARCHIVAL EDITION
                </span>
              </div>

              {/* Center Seal */}
              <div className="relative z-10 my-auto px-2 space-y-1 sm:space-y-1.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-[#C5A880]/25 to-[#1A1612] border border-[#E5D3B3]/70 flex items-center justify-center mx-auto shadow-inner text-[#E8D4B8]">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#C5A880]" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-serif text-[10px] sm:text-[13px] font-bold tracking-[0.22em] uppercase leading-tight bg-gradient-to-b from-[#FFF7E8] via-[#E8CE9B] to-[#B8935C] bg-clip-text text-transparent">
                    KPR PRODUCTIONS
                  </h3>
                  <p className="text-[6px] sm:text-[7px] text-[#C5A880] tracking-[0.18em] uppercase font-semibold">
                    Luxury Wedding Storytelling
                  </p>
                  <div className="w-6 sm:w-10 h-0.5 bg-[#C5A880]/50 mx-auto" />
                  <p className="text-[5.5px] sm:text-[6.5px] text-[#D5C4A6]/70 tracking-wider uppercase">
                    Digital Color Lab · Hyderabad
                  </p>
                </div>

                {/* Reopen CTA */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSpread(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-black/60 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#120F0D] border border-[#C5A880]/50 text-[6px] sm:text-[7px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span>Reopen Album</span>
                  </button>
                </div>
              </div>

              <div className="relative z-10 pb-0.5">
                <p className="text-[5.5px] sm:text-[6.5px] text-[#C5A880]/60 uppercase tracking-[0.2em] font-mono">
                  100% LAYFLAT CERTIFIED
                </p>
              </div>
            </div>
          </AlbumCoverPage>
        </HTMLFlipBook>
      </div>

      {/* ── Page Indicator Dots & Navigation Control Bar ── */}
      <div className="flex items-center justify-center gap-1.5 mt-1 sm:mt-1.5 select-none z-20">
        <div className="flex items-center gap-1 bg-[#141414]/85 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 rounded-full border border-[#D5C9B8]/30 shadow-xs">
          {[0, 1, 2, 3, 4, 5].map((spread) => (
            <button
              key={spread}
              type="button"
              onClick={() => goToSpread(spread)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentSpread === spread
                  ? 'w-3.5 sm:w-4.5 h-1 sm:h-1.5 bg-[#C5A880]'
                  : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/35 hover:bg-white/70'
              }`}
              title={
                spread === 0
                  ? 'Front Cover (Closed)'
                  : spread === 5
                  ? 'Back Cover (Closed)'
                  : `Spread ${spread} of 4`
              }
              aria-label={
                spread === 0
                  ? 'Front Cover'
                  : spread === 5
                  ? 'Back Cover'
                  : `Spread ${spread}`
              }
            />
          ))}
          <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-mono text-[#F5E6D0] ml-1 font-bold tracking-wider">
            {currentSpread === 0
              ? 'COVER'
              : currentSpread === 5
              ? 'BACK'
              : `${currentSpread}/4`}
          </span>
        </div>

        <span className="text-[7px] xs:text-[8px] sm:text-[9px] text-[#666666] font-medium hidden xs:inline">
          • Click or swipe to turn
        </span>
      </div>
    </div>
  );
}

