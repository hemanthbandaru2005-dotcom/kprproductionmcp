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
   Aspect ratio: 1.0 (1:1 Square Album Format)
   Generous sizing to fill hero showcase area with zero empty side voids
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { singlePageW: 320, singlePageH: 320 };
  }
  const w = window.innerWidth;
  if (w < 380) {
    const sw = 140;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 480) {
    const sw = 160;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 640) {
    const sw = 200;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 768) {
    const sw = 240;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 1024) {
    const sw = 275;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 1280) {
    const sw = 315;
    return { singlePageW: sw, singlePageH: sw };
  }
  const sw = 335;
  return { singlePageW: sw, singlePageH: sw };
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
          Spread 1 of 4
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
          className="w-full h-full relative overflow-hidden rounded-xs border flex items-center justify-center bg-[#FAF8F5]"
          style={{ borderColor: 'rgba(213,201,184,0.7)' }}
        >
          <img
            src={src}
            alt={label}
            className="w-full h-full object-contain object-center pointer-events-none select-none drop-shadow-xs"
            loading="lazy"
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
   PAGE 35: LUXURY ENDSHEET HEIRLOOM (Left Page)
   ───────────────────────────────────────────────────── */
const HeroEndsheetPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-3 sm:p-5 relative overflow-hidden border-r-2 border-r-[#BFB19E]"
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
        }}
      >
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
            KPR PRODUCTIONS · TIMELESS MEMORIES
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 px-1">
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
          <h3
            className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.7vw, 12px)' }}
          >
            Preserved for Generations
          </h3>
          <p
            className="font-serif italic text-[#6B5A47] leading-relaxed"
            style={{ fontSize: 'clamp(6.5px, 1.25vw, 8.5px)' }}
          >
            Every smile, ceremony, and sacred blessing bound forever in luxury layflat print.
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
        </div>

        <div>
          <span
            className="font-mono text-[#8C6D3F]/80 uppercase tracking-widest"
            style={{ fontSize: 'clamp(5.5px, 1vw, 7px)' }}
          >
            Warangal & Hyderabad
          </span>
        </div>
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
export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen, showFullscreenButton = true }) {
  const flipBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState(getBookDimensions);

  useEffect(() => {
    const handleResize = () => setDims(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = 1 + FLEXY_ALBUM_PHOTOS.length + 2;

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
  const isBackCover = currentPage >= totalPages - 1;
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
        {/* ── "Swipe to open" Callout (Positioned in open space to the right of the book cover) ── */}
        <AnimatePresence>
          {isCover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: 0.15 }}
              onClick={handleFlipNext}
              className="absolute top-[18%] xs:top-[22%] sm:top-[25%] left-full ml-2 xs:ml-3 sm:ml-4 z-50 flex flex-col items-start cursor-pointer select-none pointer-events-auto group"
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
            <HeroFrontCover onCoverClick={handleFlipNext} />

            {/* Pages 1..64: Real Album Photo Pages (Split so each image is large & prominent) */}
            {FLEXY_ALBUM_PHOTOS.map((photo, idx) => (
              <HeroPhotoPage
                key={photo.id}
                src={photo.src}
                label={photo.label}
                isLeftPage={idx % 2 === 0}
              />
            ))}

            {/* Page 65: Luxury Endsheet (Left) */}
            <HeroEndsheetPage />

            {/* Page 66: Back Cover */}
            <HeroBackCover onCoverClick={handleFlipPrev} />
          </HTMLFlipBook>
        </div>
      </div>

      {/* ── FULL VIEW BUTTON (Dedicated Luxury Launcher) ── */}
      {onOpenFullscreen && showFullscreenButton && (
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
