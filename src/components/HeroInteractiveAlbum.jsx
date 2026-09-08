import React, { useState, useRef, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, BookOpen, Upload } from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Single Page Shell: Required by react-pageflip
   Must forward ref and spread props.style and className
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
   ensuring the 2-page spread fits cleanly in Hero section
   ───────────────────────────────────────────────────── */
function getHeroPageDimensions() {
  if (typeof window === 'undefined') return { width: 195, height: 138 };
  const w = window.innerWidth;
  if (w < 370) {
    // Ultra-compact mobile (e.g. Galaxy Fold folded, small screens)
    return { width: 122, height: 88 };
  } else if (w < 480) {
    // Standard mobile (iPhone 12/13/14/15, Galaxy S22/S23)
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
      flipBookRef.current?.pageFlip()?.flip(spreadIdx * 2);
    } catch (err) {
      console.warn('GoToSpread failed:', err);
    }
  };

  // Touch Swipe Handlers for Mobile Phones (Hand swipe gestures)
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
        flipNext();
      } else {
        flipPrev();
      }
    }
  };

  const currentSpread = Math.floor(currentPage / 2);
  const totalSpreads = 4; // 8 pages total = 4 spreads

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-0.5 sm:my-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── 'Swipe to explore' Handwritten Cue (Positioned dynamically on the side) ── */}
      <div className="absolute -left-10 xs:-left-12 sm:-left-16 md:-left-20 top-1/2 -translate-y-1/2 pointer-events-none select-none z-30 hidden xs:block">
        <img
          src="/images/swipe_to_explore.png"
          alt="Swipe to explore"
          className="w-10 xs:w-12 sm:w-15 md:w-18 h-auto object-contain drop-shadow-xs -rotate-3 transition-transform duration-300 hover:scale-105"
          draggable="false"
        />
      </div>

      {/* ── 3D Physical Photobook Container ── */}
      <div
        className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-xs sm:rounded-sm bg-[#181410] border border-[#C5A880]/35 shadow-[0_16px_36px_rgba(0,0,0,0.32),0_4px_12px_rgba(0,0,0,0.2)] transition-shadow duration-300 hover:shadow-[0_22px_45px_rgba(0,0,0,0.4)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Stacked Layflat Pages Bottom Thickness Edge */}
        <div className="absolute -bottom-1 sm:-bottom-1.5 left-2 right-2 h-1 sm:h-1.5 bg-gradient-to-r from-[#D5CABB] via-[#FAF7F2] to-[#D5CABB] rounded-b-2xs opacity-80 pointer-events-none" />

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

        {/* ── Left Navigation Arrow (Mouse click & Phone tap) ── */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={currentPage === 0}
          className={`absolute -left-3 sm:-left-4.5 top-1/2 -translate-y-1/2 z-35 p-1 sm:p-1.5 rounded-full bg-[#1A1A1A]/90 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/50 shadow-md transition-all duration-200 cursor-pointer ${
            currentPage === 0 ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Previous page (Swipe or Click)"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ── Right Navigation Arrow (Mouse click & Phone tap) ── */}
        <button
          type="button"
          onClick={flipNext}
          disabled={currentPage >= 6}
          className={`absolute -right-3 sm:-right-4.5 top-1/2 -translate-y-1/2 z-35 p-1 sm:p-1.5 rounded-full bg-[#1A1A1A]/90 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/50 shadow-md transition-all duration-200 cursor-pointer ${
            currentPage >= 6 ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Next page (Swipe or Click)"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ── HTMLFlipBook Core Engine ── */}
        <HTMLFlipBook
          key={`hero-flipbook-${dimensions.width}-${dimensions.height}`}
          ref={flipBookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={100}
          maxWidth={400}
          minHeight={75}
          maxHeight={300}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport={false}
          flippingTime={450}
          usePortrait={false}
          startPage={0}
          drawShadow={true}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={12}
          showPageCorners={true}
          disableFlipByClick={false}
          onFlip={(e) => setCurrentPage(e.data)}
          className="album-flipbook-shadow cursor-grab active:cursor-grabbing"
        >
          {/* ════════ SPREAD 1: TITLE PAGE & BRIDAL PORTRAIT ════════ */}
          {/* Page 1 (Spread 1 Left): Archival Heirloom Title Spread */}
          <AlbumPage isLeft={true} className="bg-gradient-to-br from-[#1C1814] via-[#241F1A] to-[#120F0D]">
            <div className="w-full h-full flex flex-col items-center justify-between p-1.5 sm:p-2 border border-[#C5A880]/40 rounded-2xs text-center relative overflow-hidden">
              {/* Corner filigree */}
              <div className="absolute top-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-l border-[#C5A880]/70" />
              <div className="absolute top-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-t border-r border-[#C5A880]/70" />
              <div className="absolute bottom-1 left-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-l border-[#C5A880]/70" />
              <div className="absolute bottom-1 right-1 w-2 sm:w-3 h-2 sm:h-3 border-b border-r border-[#C5A880]/70" />

              <div className="pt-0.5 sm:pt-1">
                <div className="flex items-center justify-center gap-1 text-[#C5A880]">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  <span className="text-[6.5px] sm:text-[7.5px] uppercase font-bold tracking-[0.2em] text-[#C5A880]">
                    KPR PRODUCTIONS
                  </span>
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                </div>
              </div>

              <div className="my-auto px-1 space-y-0.5">
                <div className="w-5 sm:w-8 h-px bg-[#C5A880]/60 mx-auto" />
                <h3 className="font-serif text-[8.5px] sm:text-[11px] md:text-[12px] text-[#F5EFE6] font-normal tracking-wide uppercase leading-tight line-clamp-2">
                  Royal Wedding Heirloom
                </h3>
                <p className="text-[6px] sm:text-[7.5px] text-[#C5A880]/90 font-mono tracking-wider uppercase">
                  12×36 Layflat Silk
                </p>
                <div className="w-5 sm:w-8 h-px bg-[#C5A880]/60 mx-auto" />
              </div>

              <div className="pb-0.5">
                <span className="text-[5.5px] sm:text-[7px] text-[#C5A880]/80 tracking-widest uppercase bg-black/40 px-1.5 py-0.5 rounded-full border border-[#C5A880]/30 font-medium">
                  Swipe / Click to Turn →
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
                01
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
                02
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
                03
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
                04
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
                05
              </span>
            </div>
          </AlbumPage>

          {/* ════════ SPREAD 4: GRAND RECEPTION & HEIRLOOM CLOSING ════════ */}
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
                06
              </span>
            </div>
          </AlbumPage>

          {/* Page 8 (Spread 4 Right): Heirloom Guarantee & Create Album CTA */}
          <AlbumPage isLeft={false} className="bg-gradient-to-br from-[#1C1814] via-[#241F1A] to-[#120F0D]">
            <div className="w-full h-full flex flex-col items-center justify-between p-1.5 sm:p-2 border border-[#C5A880]/40 rounded-2xs text-center relative overflow-hidden">
              <div className="pt-0.5">
                <span className="text-[6px] sm:text-[7px] text-[#C5A880]/80 tracking-[0.2em] uppercase font-bold">
                  KPR COLOUR LAB
                </span>
              </div>

              <div className="my-auto px-1 space-y-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-[#C5A880] mx-auto" />
                <h4 className="font-serif text-[8px] sm:text-[10.5px] text-[#F5EFE6] font-normal tracking-wide uppercase leading-tight">
                  Your Memories, Preserved Forever
                </h4>
                <p className="text-[5.5px] sm:text-[6.5px] text-[#D5C4A6]/80 leading-snug max-w-[140px] mx-auto">
                  Ultra HD Archival Silk Layflat Printing & Custom Italian Leather Cases
                </p>

                {onOpenUpload && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUpload();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-[#C5A880] hover:bg-[#D8BE96] text-[#120F0D] text-[6.5px] sm:text-[8px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer mt-0.5"
                  >
                    <Upload className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span>Upload Photos</span>
                  </button>
                )}
              </div>

              <div className="pb-0.5">
                <span className="text-[5.5px] sm:text-[6.5px] text-[#C5A880]/60 tracking-widest uppercase font-mono">
                  100% Layflat Guarantee
                </span>
              </div>
            </div>
          </AlbumPage>
        </HTMLFlipBook>
      </div>

      {/* ── Page Indicator Dots & Navigation Control Bar ── */}
      <div className="flex items-center justify-center gap-1.5 mt-1 sm:mt-1.5 select-none z-20">
        <div className="flex items-center gap-1 bg-[#141414]/85 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 rounded-full border border-[#D5C9B8]/30 shadow-xs">
          {[0, 1, 2, 3].map((spread) => (
            <button
              key={spread}
              type="button"
              onClick={() => goToSpread(spread)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentSpread === spread
                  ? 'w-3.5 sm:w-4.5 h-1 sm:h-1.5 bg-[#C5A880]'
                  : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/35 hover:bg-white/70'
              }`}
              title={`Jump to spread ${spread + 1}`}
              aria-label={`Jump to spread ${spread + 1}`}
            />
          ))}
          <span className="text-[7px] xs:text-[8px] sm:text-[9px] font-mono text-[#F5E6D0] ml-1 font-bold">
            {currentSpread + 1}/{totalSpreads}
          </span>
        </div>

        <span className="text-[7px] xs:text-[8px] sm:text-[9px] text-[#555555] font-medium hidden xs:inline">
          • Drag corner or swipe with hand
        </span>
      </div>
    </div>
  );
}
