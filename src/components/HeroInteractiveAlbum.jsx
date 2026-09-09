import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  BookOpen
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Exact Physical Aspect Ratio: 737 / 1024 = 0.720 (Portrait Photobook)
   Maintains true uncropped physical album proportions across all devices
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { closedW: 198, closedH: 275, openW: 396, openH: 275 };
  }
  const w = window.innerWidth;
  if (w < 360) {
    const h = 190;
    const cw = Math.round(h * 0.72);
    return { closedW: cw, closedH: h, openW: cw * 2, openH: h };
  }
  if (w < 480) {
    const h = 210;
    const cw = Math.round(h * 0.72);
    return { closedW: cw, closedH: h, openW: cw * 2, openH: h };
  }
  if (w < 640) {
    const h = 230;
    const cw = Math.round(h * 0.72);
    return { closedW: cw, closedH: h, openW: cw * 2, openH: h };
  }
  if (w < 1024) {
    const h = 255;
    const cw = Math.round(h * 0.72);
    return { closedW: cw, closedH: h, openW: cw * 2, openH: h };
  }
  const h = 275;
  const cw = Math.round(h * 0.72);
  return { closedW: cw, closedH: h, openW: cw * 2, openH: h };
}

/* ─────────────────────────────────────────────────────
   AUTHENTIC LUXURY FRONT COVER (CLOSED STATE)
   - Zero distracting buttons or badges on top of artwork
   - 100% full uncropped display of gold filigree corners, KPR logo & couple details
   - Physical hardcover bevel, rounded spine hinge, stacked paper edge & contact shadow
   ───────────────────────────────────────────────────── */
function FrontCoverLeaf({ onOpen, dimensions }) {
  return (
    <motion.div
      key="front-cover-leaf"
      initial={{ rotateY: 0, opacity: 1 }}
      exit={{
        rotateY: -180,
        opacity: 0,
        transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
      }}
      onClick={onOpen}
      className="relative cursor-pointer select-none group origin-left"
      style={{
        width: dimensions.closedW,
        height: dimensions.closedH,
        transformStyle: 'preserve-3d',
        perspective: 1200
      }}
      title="Click to Open Photobook"
    >
      {/* ── Outer Physical Hardcover Casing ── */}
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#FAF8F5] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.015]"
        style={{
          borderRadius: '3px 7px 7px 3px',
          boxShadow:
            '0 24px 50px -12px rgba(0,0,0,0.7), 0 8px 18px rgba(0,0,0,0.3), inset 0 0 1px rgba(255,255,255,0.5)'
        }}
      >
        {/* User-Supplied Exact Artwork Cover Image (Full, 100% Uncropped) */}
        <img
          src="/images/album/front_cover.jpg"
          alt="KPR Productions Wedding Photobook Front Cover"
          className="w-full h-full object-fill select-none pointer-events-none"
          loading="eager"
          draggable={false}
        />

        {/* Subtle Natural Hardcover Outer Bevel */}
        <div
          className="absolute inset-0 pointer-events-none border border-[#4A3C28]/25"
          style={{
            borderRadius: '3px 7px 7px 3px',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.18)'
          }}
        />

        {/* Silky ambient sheen on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)'
          }}
        />
      </div>

      {/* ── Right-Edge Stacked Archival Page Thickness Layers (Physical Depth) ── */}
      <div
        className="absolute top-1 bottom-1 -right-1 w-1 rounded-r-xs pointer-events-none"
        style={{ background: '#FAF7F2', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.25)' }}
      />
      <div
        className="absolute top-1.5 bottom-1.5 -right-2 w-1 rounded-r-xs pointer-events-none"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.3)' }}
      />
      <div
        className="absolute top-2 bottom-2 -right-3 w-1 rounded-r-xs pointer-events-none"
        style={{ background: '#DDD3C4', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.35)' }}
      />

      {/* ── Bottom Stacked Paper Margin ── */}
      <div
        className="absolute -bottom-1 left-2 right-1 h-1 rounded-b-xs pointer-events-none"
        style={{ background: 'linear-gradient(to right, #FAF7F2, #EDE5D8)', opacity: 0.9 }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   AUTHENTIC LUXURY BACK COVER (CLOSED STATE)
   - Zero distracting buttons or badges
   - 100% full uncropped display of matching cream linen back cover
   - Spine on the right, stacked page layers on the left
   ───────────────────────────────────────────────────── */
function BackCoverLeaf({ onReopen, dimensions }) {
  return (
    <motion.div
      key="back-cover-leaf"
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{
        rotateY: 0,
        opacity: 1,
        transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
      }}
      onClick={onReopen}
      className="relative cursor-pointer select-none group origin-right"
      style={{
        width: dimensions.closedW,
        height: dimensions.closedH,
        transformStyle: 'preserve-3d',
        perspective: 1200
      }}
      title="Click to Reopen Photobook"
    >
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#FAF8F5] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-[1.015]"
        style={{
          borderRadius: '7px 3px 3px 7px',
          boxShadow:
            '0 24px 50px -12px rgba(0,0,0,0.7), 0 8px 18px rgba(0,0,0,0.3), inset 0 0 1px rgba(255,255,255,0.5)'
        }}
      >
        {/* Matching Back Cover Image (Full, 100% Uncropped) */}
        <img
          src="/images/album/back_cover.jpg"
          alt="KPR Productions Wedding Photobook Back Cover"
          className="w-full h-full object-fill select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Subtle Hardcover Outer Bevel */}
        <div
          className="absolute inset-0 pointer-events-none border border-[#4A3C28]/25"
          style={{
            borderRadius: '7px 3px 3px 7px',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.18)'
          }}
        />

        {/* Silky ambient sheen on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(225deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)'
          }}
        />
      </div>

      {/* Left-Edge Stacked Page Thickness Layers */}
      <div
        className="absolute top-1 bottom-1 -left-1 w-1 rounded-l-xs pointer-events-none"
        style={{ background: '#FAF7F2', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.25)' }}
      />
      <div
        className="absolute top-1.5 bottom-1.5 -left-2 w-1 rounded-l-xs pointer-events-none"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.3)' }}
      />
      <div
        className="absolute top-2 bottom-2 -left-3 w-1 rounded-l-xs pointer-events-none"
        style={{ background: '#DDD3C4', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.35)' }}
      />

      {/* Bottom Stacked Paper Margin */}
      <div
        className="absolute -bottom-1 left-1 right-2 h-1 rounded-b-xs pointer-events-none"
        style={{ background: 'linear-gradient(to right, #EDE5D8, #FAF7F2)', opacity: 0.9 }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   INTERIOR TWO-PAGE SPREAD WITH 3D PAGE-FLIP MOTION
   - Left Page + Right Page with authentic center binding seam
   - Click left half to go back / close
   - Click right half to go forward / close
   ───────────────────────────────────────────────────── */
function OpenSpread({
  spreadIndex,
  onPrev,
  onNext,
  onClose,
  onOpenUpload,
  direction,
  dimensions
}) {
  return (
    <motion.div
      key={`spread-${spreadIndex}`}
      initial={{
        rotateY: direction > 0 ? 18 : -18,
        opacity: 0.92,
        scale: 0.985
      }}
      animate={{
        rotateY: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
      }}
      exit={{
        rotateY: direction > 0 ? -18 : 18,
        opacity: 0.9,
        scale: 0.985,
        transition: { duration: 0.35, ease: [0.5, 0, 0.75, 0] }
      }}
      className="relative overflow-hidden flex select-none"
      style={{
        width: dimensions.openW,
        height: dimensions.openH,
        transformStyle: 'preserve-3d',
        borderRadius: '3px 4px 4px 3px',
        background: '#FAF8F5',
        border: '1.5px solid #D5C9B8',
        boxShadow:
          '0 22px 55px -10px rgba(0,0,0,0.65), 0 8px 20px rgba(0,0,0,0.35), inset 0 0 1px rgba(255,255,255,0.4)'
      }}
    >
      {/* ── Deep Center Spine Binding Crease Shadow ── */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-10 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 35%, transparent 50%, rgba(0,0,0,0.08) 65%, rgba(0,0,0,0.3) 100%)'
        }}
      />
      <div className="absolute top-0 bottom-0 left-1/2 w-px z-20 pointer-events-none opacity-40 bg-[#8C7A64]" />

      {/* ── Left & Right Page Thickness Stack Margins ── */}
      <div
        className="absolute top-1 bottom-1 -left-1.5 w-1.5 rounded-l-xs pointer-events-none z-[-1]"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)' }}
      />
      <div
        className="absolute top-1 bottom-1 -right-1.5 w-1.5 rounded-r-xs pointer-events-none z-[-1]"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)' }}
      />

      {/* ── Stacked Paper Bottom Edge ── */}
      <div
        className="absolute -bottom-1 left-2 right-2 h-1 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #D5CABB, #FAF7F2, #D5CABB)',
          opacity: 0.85
        }}
      />

      {/* ── Touch tap zones (Left half = prev, Right half = next) ── */}
      <div
        onClick={onPrev}
        className="absolute left-0 top-0 bottom-0 w-1/2 z-30 cursor-pointer"
        title="Click left page to turn back"
      />
      <div
        onClick={onNext}
        className="absolute right-0 top-0 bottom-0 w-1/2 z-30 cursor-pointer"
        title="Click right page to turn next"
      />

      {/* ── Spread 1: Dedication & Royal Bride ── */}
      {spreadIndex === 1 && (
        <>
          <div
            className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden border-r border-[#D5C9B8]"
            style={{
              background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
            }}
          >
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
                style={{ fontSize: 'clamp(8px, 1.7vw, 12px)' }}
              >
                A Lifetime of Cherished Vows
              </h3>
              <p
                className="font-serif italic text-[#6A5A4A] leading-relaxed line-clamp-2"
                style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
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
          <PhotoHalf src="/images/wedding/photo_1.jpg" label="01 · Royal Bride" side="right" />
        </>
      )}

      {/* ── Spread 2 ── */}
      {spreadIndex === 2 && (
        <>
          <PhotoHalf src="/images/wedding/photo_2.jpg" label="02 · Eternal Couple" side="left" />
          <PhotoHalf src="/images/wedding/photo_3.jpg" label="03 · Mandap Vows" side="right" />
        </>
      )}

      {/* ── Spread 3 ── */}
      {spreadIndex === 3 && (
        <>
          <PhotoHalf src="/images/wedding/photo_4.jpg" label="04 · Haldi Splendor" side="left" />
          <PhotoHalf src="/images/wedding/photo_5.jpg" label="05 · Twilight Romance" side="right" />
        </>
      )}

      {/* ── Spread 4 ── */}
      {spreadIndex === 4 && (
        <>
          <PhotoHalf src="/images/wedding/photo_6.jpg" label="06 · Royal Traditions" side="left" />
          <PhotoHalf src="/images/wedding/photo_7.jpg" label="07 · Grand Reception" side="right" />
        </>
      )}

      {/* ── Spread 5: Studio CTA & Close ── */}
      {spreadIndex === 5 && (
        <>
          <div
            className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden border-r border-[#D5C9B8]"
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
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-[#8C6D3F]"
                style={{
                  background: 'rgba(140,109,63,0.15)',
                  border: '1px solid rgba(140,109,63,0.3)'
                }}
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <h4
                className="font-serif text-[#2A231C] font-semibold leading-tight"
                style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
              >
                Design Your Album
              </h4>
              <p
                className="text-[#6A5A4A] leading-tight"
                style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}
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
                  className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer border"
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

          <div className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden bg-[#FAF8F5]">
            <span
              className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
              style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
            >
              END OF PREVIEW
            </span>
            <div className="space-y-1 sm:space-y-1.5">
              <h4
                className="font-serif text-[#2A231C] font-semibold leading-tight"
                style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
              >
                Cherished Forever
              </h4>
              <p
                className="text-[#6A5A4A] leading-tight"
                style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}
              >
                100% Layflat Archival Binding with Ultra-HD Silk Printing
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  fontSize: 'clamp(6px, 1.1vw, 8px)',
                  padding: '3px 10px',
                  background: '#C5A880',
                  color: '#120F0C',
                  boxShadow: '0 2px 8px rgba(197,168,128,0.4)'
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
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Photo Half-Page Helper
   ───────────────────────────────────────────────────── */
function PhotoHalf({ src, label, side }) {
  return (
    <div
      className={`w-1/2 h-full relative overflow-hidden flex items-center justify-center p-1 sm:p-1.5 ${
        side === 'left' ? 'border-r' : ''
      }`}
      style={{ background: '#FAF8F5', borderColor: '#D5C9B8' }}
    >
      <div
        className="w-full h-full relative overflow-hidden rounded-sm border"
        style={{ background: 'rgba(0,0,0,0.08)', borderColor: 'rgba(213,201,184,0.7)' }}
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
            side === 'left' ? 'left-1' : 'right-1'
          }`}
          style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)', borderColor: '#D5C9B8' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main Export — Hero Interactive Album
   - Pristine physical photobook structure
   - True 737x1024 portrait ratio (Zero cropping)
   - Zero distracting buttons or chevrons on top of the book
   - 3D physical book opening animation
   ───────────────────────────────────────────────────── */
export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen }) {
  /*
   Spread index states:
     0  →  Front Hardcover (closed)
     1  →  Spread 1: Dedication + Royal Bride
     2  →  Spread 2: Couple + Mandap
     3  →  Spread 3: Haldi + Romance
     4  →  Spread 4: Traditions + Reception
     5  →  Spread 5: Studio CTA + Close
     6  →  Back Hardcover (closed)
  */
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dimensions, setDimensions] = useState(getBookDimensions);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setDimensions(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSpreads = 6;

  const goToSpread = useCallback(
    (n) => {
      if (n < 0 || n > totalSpreads) return;
      setDirection(n >= spreadIndex ? 1 : -1);
      setSpreadIndex(n);
    },
    [spreadIndex]
  );

  const flipNext = useCallback(() => {
    if (spreadIndex < totalSpreads) {
      setDirection(1);
      setSpreadIndex((p) => p + 1);
    }
  }, [spreadIndex]);

  const flipPrev = useCallback(() => {
    if (spreadIndex > 0) {
      setDirection(-1);
      setSpreadIndex((p) => p - 1);
    }
  }, [spreadIndex]);

  const handleTouchStart = (e) => {
    if (e.touches?.[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches?.[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dx < 0 ? flipNext() : flipPrev();
    }
  };

  const isCover = spreadIndex === 0;
  const isBackCover = spreadIndex === totalSpreads;
  const isOpen = !isCover && !isBackCover;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-1 sm:my-2 w-full max-w-full px-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 3D Physical Book Stage ── */}
      <div className="relative flex items-center justify-center select-none">
        {/* Soft Grounding Ambient Contact Shadow (Rests flat on the table, not floating) */}
        <div
          className="absolute -bottom-3 sm:-bottom-4.5 h-5 sm:h-7 bg-black/65 blur-md rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dimensions.openW * 0.94 : dimensions.closedW * 0.95,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* ── Discreet Outside Navigation Arrows (Shown ONLY when book is open, positioned completely clear of pages) ── */}
        {isOpen && (
          <>
            <button
              type="button"
              onClick={flipPrev}
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
              onClick={flipNext}
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

        {/* ── 3D Book Container with Preserved Perspective ── */}
        <div
          className="relative flex items-center justify-center transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dimensions.openW : dimensions.closedW,
            height: isOpen ? dimensions.openH : dimensions.closedH,
            perspective: 1400
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* 1. FRONT COVER (Closed, pristine, zero overlay distractions) */}
            {isCover && (
              <FrontCoverLeaf key="front" onOpen={flipNext} dimensions={dimensions} />
            )}

            {/* 2. OPEN TWO-PAGE SPREAD (Interactive) */}
            {isOpen && (
              <OpenSpread
                key={`spread-${spreadIndex}`}
                spreadIndex={spreadIndex}
                direction={direction}
                onPrev={flipPrev}
                onNext={flipNext}
                onClose={flipNext}
                onOpenUpload={onOpenUpload}
                dimensions={dimensions}
              />
            )}

            {/* 3. BACK COVER (Closed, matching luxury back) */}
            {isBackCover && (
              <BackCoverLeaf
                key="back"
                onReopen={() => goToSpread(0)}
                dimensions={dimensions}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Page Indicator & Navigation Dots (Clean & Discreet Below Book) ── */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5 select-none z-20">
        <div
          className="flex items-center gap-1.5 backdrop-blur-xs px-3 py-1 rounded-full border shadow-sm"
          style={{
            background: 'rgba(18,18,20,0.92)',
            borderColor: 'rgba(213,201,184,0.25)'
          }}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => goToSpread(s)}
              className={`transition-all duration-300 rounded-full cursor-pointer min-h-[14px] flex items-center justify-center ${
                spreadIndex === s ? 'w-4 bg-[#C5A880]' : 'w-1.5 bg-white/35 hover:bg-white/75'
              }`}
              style={{ height: '4px' }}
              title={s === 0 ? 'Front Cover' : s === 6 ? 'Back Cover' : `Spread ${s} of 5`}
              aria-label={s === 0 ? 'Front Cover' : s === 6 ? 'Back Cover' : `Spread ${s}`}
            />
          ))}
          <span
            className="font-mono text-[#F5E6D0] ml-1 font-bold tracking-wider"
            style={{ fontSize: 'clamp(7px, 1.4vw, 9.5px)' }}
          >
            {spreadIndex === 0 ? 'COVER' : spreadIndex === 6 ? 'BACK' : `${spreadIndex}/5`}
          </span>
        </div>

        <span
          className="text-[#888888] font-medium tracking-wide ml-1 text-[8px] xs:text-[9.5px]"
        >
          • {isCover ? 'Click book to open' : isBackCover ? 'Click to reopen' : 'Click page to flip'}
        </span>
      </div>
    </div>
  );
}
