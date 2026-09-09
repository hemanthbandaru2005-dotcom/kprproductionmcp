import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Upload
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper for 3D Photobook
   Aspect ratio: 967 / 881 = 1.097 (Square/Album Format)
   ───────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper for 3D Photobook
   Aspect ratio: 967 / 881 = 1.097 (Square/Album Format)
   Generous sizing to fill hero showcase area with zero empty side voids
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { singlePageW: 340, singlePageH: 310 };
  }
  const w = window.innerWidth;
  if (w < 380) {
    const sw = 155;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  if (w < 480) {
    const sw = 175;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  if (w < 640) {
    const sw = 215;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  if (w < 768) {
    const sw = 260;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  if (w < 1024) {
    const sw = 300;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  if (w < 1280) {
    const sw = 340;
    return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
  }
  const sw = 360;
  return { singlePageW: sw, singlePageH: Math.round(sw / 1.097) };
}

/* ─────────────────────────────────────────────────────
   PAGE 0: LUXURY HARDCOVER FRONT COVER
   - data-density="hard" (rigid physical book cover)
   - Zero black borders, 100% full uncropped artwork
   ───────────────────────────────────────────────────── */
const HeroFrontCover = forwardRef(({ onCoverClick, ...props }, ref) => {
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
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r-2 border-r-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src="/images/album/front_cover.jpg"
          alt="KPR Productions Wedding Photobook Front Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="eager"
          draggable={false}
        />

        {/* Hardcover Outer Bevel Highlight */}
        <div
          className="absolute inset-0 pointer-events-none border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]"
        />

        {/* Right Stacked Paper Margin Highlight */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
});
HeroFrontCover.displayName = 'HeroFrontCover';

/* ─────────────────────────────────────────────────────
   PAGE 1: DEDICATION / EX LIBRIS (Left Page)
   ───────────────────────────────────────────────────── */
const HeroDedicationPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-2.5 sm:p-4 relative overflow-hidden border-r-2 border-r-[#BFB19E]"
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
        }}
      >
        {/* Spine Crease Shadow on Right Edge */}
        <div
          className="absolute top-0 bottom-0 right-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)'
          }}
        />

        <div>
          <span
            className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
          >
            EX LIBRIS · WEDDING HEIRLOOM
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 px-1">
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
          <h3
            className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.7vw, 12px)' }}
          >
            A Lifetime of Cherished Vows
          </h3>
          <p
            className="font-serif italic text-[#6A5A4A] leading-relaxed line-clamp-2"
            style={{ fontSize: 'clamp(6px, 1.1vw, 8px)' }}
          >
            "Every glance a sacred memory, every smile an eternal treasure."
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
        </div>

        <span
          className="font-mono tracking-wider uppercase text-[#8C6D3F]/80 self-center"
          style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}
        >
          Spread 1 of 5
        </span>
      </div>
    </div>
  );
});
HeroDedicationPage.displayName = 'HeroDedicationPage';

/* ─────────────────────────────────────────────────────
   PHOTO PAGE HELPER (Pages 2 to 8)
   ───────────────────────────────────────────────────── */
const HeroPhotoPage = forwardRef(({ src, label, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className={`w-full h-full p-1 sm:p-2 flex items-center justify-center relative ${
          isLeftPage ? 'border-r-2 border-r-[#BFB19E]' : 'border-l-2 border-l-[#BFB19E]'
        }`}
        style={{ background: '#FAF8F5' }}
      >
        {/* Center Spine Crease Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-5 bg-gradient-to-l from-black/20 via-black/5 to-transparent'
              : 'left-0 w-3 sm:w-5 bg-gradient-to-r from-black/20 via-black/5 to-transparent'
          }`}
        />

        <div
          className="w-full h-full relative overflow-hidden rounded-xs border"
          style={{ background: 'rgba(0,0,0,0.06)', borderColor: 'rgba(213,201,184,0.7)' }}
        >
          <img
            src={src}
            alt={label}
            className="w-full h-full object-cover pointer-events-none select-none"
            loading="eager"
            draggable={false}
          />
          <span
            className={`absolute bottom-1 font-mono text-[#5A4836] rounded-full border shadow-xs font-bold bg-white/95 px-1.5 py-0.5 ${
              isLeftPage ? 'left-1' : 'right-1'
            }`}
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)', borderColor: '#D5C9B8' }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
});
HeroPhotoPage.displayName = 'HeroPhotoPage';

/* ─────────────────────────────────────────────────────
   PAGE 9: STUDIO CTA (Left Page)
   ───────────────────────────────────────────────────── */
const HeroStudioPage = forwardRef(({ onOpenUpload, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-2.5 sm:p-4 relative overflow-hidden border-r-2 border-r-[#BFB19E]"
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 50%, #EAE0D0 100%)'
        }}
      >
        <span
          className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
          style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
        >
          CUSTOM ALBUM STUDIO
        </span>
        <div className="space-y-1 sm:space-y-1.5">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center mx-auto text-[#8C6D3F]"
            style={{
              background: 'rgba(140,109,63,0.15)',
              border: '1px solid rgba(140,109,63,0.3)'
            }}
          >
            <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <h4
            className="font-serif text-[#2A231C] font-semibold leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.6vw, 11px)' }}
          >
            Design Your Album
          </h4>
          <p
            className="text-[#6A5A4A] leading-tight"
            style={{ fontSize: 'clamp(5.5px, 1vw, 7.5px)' }}
          >
            Create custom spreads or arrange high-res photo proofs.
          </p>
          {onOpenUpload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenUpload();
              }}
              className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer border shadow-xs"
              style={{
                fontSize: 'clamp(6px, 1.1vw, 8px)',
                padding: '3px 10px',
                background: '#181410',
                color: '#E8D4B8',
                borderColor: 'rgba(197,168,128,0.5)'
              }}
            >
              <Upload className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span>Open Studio</span>
            </button>
          )}
        </div>
        <span
          className="font-mono tracking-wider text-[#8C6D3F]"
          style={{ fontSize: 'clamp(5px, 0.9vw, 6.5px)' }}
        >
          KPR Colour Lab
        </span>
      </div>
    </div>
  );
});
HeroStudioPage.displayName = 'HeroStudioPage';

/* ─────────────────────────────────────────────────────
   PAGE 10: ENDSHEET / CHERISHED FOREVER (Right Page)
   ───────────────────────────────────────────────────── */
const HeroEndsheetPage = forwardRef(({ onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-2.5 sm:p-4 relative overflow-hidden border-l-2 border-l-[#BFB19E]"
        style={{ background: '#FAF8F5' }}
      >
        <span
          className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
          style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
        >
          END OF PREVIEW
        </span>
        <div className="space-y-1 sm:space-y-1.5">
          <h4
            className="font-serif text-[#2A231C] font-semibold leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.6vw, 11px)' }}
          >
            Cherished Forever
          </h4>
          <p
            className="text-[#6A5A4A] leading-tight"
            style={{ fontSize: 'clamp(5.5px, 1vw, 7.5px)' }}
          >
            100% Layflat Archival Binding with Ultra-HD Silk Printing
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            style={{
              fontSize: 'clamp(6px, 1.1vw, 8px)',
              padding: '3px 10px',
              background: '#C5A880',
              color: '#120F0C'
            }}
          >
            <span>Close Book</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
        <span
          className="font-mono tracking-widest uppercase text-[#8C6D3F]/70"
          style={{ fontSize: 'clamp(5px, 0.9vw, 6.5px)' }}
        >
          Tap to Close →
        </span>
      </div>
    </div>
  );
});
HeroEndsheetPage.displayName = 'HeroEndsheetPage';

/* ─────────────────────────────────────────────────────
   PAGE 11: LUXURY HARDCOVER BACK COVER
   - data-density="hard" (rigid physical book cover)
   ───────────────────────────────────────────────────── */
const HeroBackCover = forwardRef(({ onCoverClick, ...props }, ref) => {
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
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l-2 border-l-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src="/images/album/back_cover.jpg"
          alt="KPR Productions Wedding Photobook Back Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Hardcover Outer Bevel Highlight */}
        <div
          className="absolute inset-0 pointer-events-none border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]"
        />

        {/* Left Stacked Paper Margin Highlight */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />
      </div>
    </div>
  );
});
HeroBackCover.displayName = 'HeroBackCover';

/* ─────────────────────────────────────────────────────
   Main Export: HeroInteractiveAlbum
   - Uses real HTMLFlipBook engine (zero shaking, real 3D page curls)
   - Smoothly centers closed cover and open spreads
   - Dedicated [ ⛶ Full View ] button
   ───────────────────────────────────────────────────── */
export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen }) {
  const flipBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState(getBookDimensions);

  useEffect(() => {
    const handleResize = () => setDims(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = 12;

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
  const isBackCover = currentPage >= totalPages - 2;
  const isOpen = !isCover && !isBackCover;

  return (
    <div className="relative flex flex-col items-center justify-center select-none my-1 sm:my-1.5 w-full max-w-full px-2">
      {/* ── 3D Stage with Outer Drop Shadow ── */}
      <div
        className="relative flex items-center justify-center select-none transition-all duration-500 ease-out"
        style={{
          width: isOpen ? dims.singlePageW * 2 : dims.singlePageW,
          height: dims.singlePageH
        }}
      >
        {/* Soft Grounding Ambient Contact Shadow */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 h-5 sm:h-6 bg-black/60 blur-md rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dims.singlePageW * 1.85 : dims.singlePageW * 0.92,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* ── Discreet Outside Navigation Arrows (Visible ONLY when open) ── */}
        {isOpen && (
          <>
            <button
              type="button"
              onClick={handleFlipPrev}
              className="absolute -left-9 sm:-left-12 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
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

            <button
              type="button"
              onClick={handleFlipNext}
              className="absolute -right-9 sm:-right-12 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
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
          </>
        )}

        {/* ── Smooth Horizontal Translation Container (Centers Closed Cover & Open Spread) ── */}
        <div
          className="relative transition-transform duration-500 ease-out"
          style={{
            transform:
              currentPage === 0
                ? `translateX(-${Math.round(dims.singlePageW / 2)}px)`
                : isBackCover
                ? `translateX(${Math.round(dims.singlePageW / 2)}px)`
                : 'translateX(0px)'
          }}
        >
          {/* ── REAL 3D PAGE-FLIP ENGINE (HTMLFlipBook) ── */}
          <HTMLFlipBook
            key={`hero-flipbook-${dims.singlePageW}-${dims.singlePageH}`}
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
            mobileScrollSupport={false}
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
            <HeroFrontCover onCoverClick={handleFlipNext} />

            {/* Page 1: Dedication (Left) */}
            <HeroDedicationPage />

            {/* Page 2: Photo 1 (Right) */}
            <HeroPhotoPage src="/images/wedding/photo_1.jpg" label="01 · Royal Bride" isLeftPage={false} />

            {/* Page 3: Photo 2 (Left) */}
            <HeroPhotoPage src="/images/wedding/photo_2.jpg" label="02 · Eternal Couple" isLeftPage={true} />

            {/* Page 4: Photo 3 (Right) */}
            <HeroPhotoPage src="/images/wedding/photo_3.jpg" label="03 · Mandap Vows" isLeftPage={false} />

            {/* Page 5: Photo 4 (Left) */}
            <HeroPhotoPage src="/images/wedding/photo_4.jpg" label="04 · Haldi Splendor" isLeftPage={true} />

            {/* Page 6: Photo 5 (Right) */}
            <HeroPhotoPage src="/images/wedding/photo_5.jpg" label="05 · Twilight Romance" isLeftPage={false} />

            {/* Page 7: Photo 6 (Left) */}
            <HeroPhotoPage src="/images/wedding/photo_6.jpg" label="06 · Royal Traditions" isLeftPage={true} />

            {/* Page 8: Photo 7 (Right) */}
            <HeroPhotoPage src="/images/wedding/photo_7.jpg" label="07 · Grand Reception" isLeftPage={false} />

            {/* Page 9: Studio CTA (Left) */}
            <HeroStudioPage onOpenUpload={onOpenUpload} />

            {/* Page 10: Endsheet & Close (Right) */}
            <HeroEndsheetPage onClose={handleFlipNext} />

            {/* Page 11: Back Cover */}
            <HeroBackCover onCoverClick={handleFlipPrev} />
          </HTMLFlipBook>
        </div>
      </div>

      {/* ── FULL VIEW BUTTON (Dedicated Luxury Launcher) ── */}
      {onOpenFullscreen && (
        <div className="flex items-center justify-center mt-2 sm:mt-2.5 select-none z-20">
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="group inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#161412]/95 hover:bg-black text-[#F4ECD8] text-[9.5px] sm:text-xs font-serif tracking-widest uppercase border border-[#C5A880]/60 hover:border-[#C5A880] shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_18px_rgba(197,168,128,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Open in Full View 3D Photobook"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover:scale-110 transition-transform" />
            <span>Full View</span>
          </button>
        </div>
      )}
    </div>
  );
}
