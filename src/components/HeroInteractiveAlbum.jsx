import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  Upload,
  RotateCcw
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper for 3D Physical Book
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { closedW: 240, closedH: 180, openW: 460, openH: 180 };
  }
  const w = window.innerWidth;
  if (w < 380) return { closedW: 165, closedH: 130, openW: 310, openH: 125 };
  if (w < 480) return { closedW: 190, closedH: 145, openW: 345, openH: 135 };
  if (w < 640) return { closedW: 215, closedH: 165, openW: 395, openH: 152 };
  if (w < 768) return { closedW: 235, closedH: 178, openW: 435, openH: 168 };
  if (w < 1024) return { closedW: 255, closedH: 192, openW: 480, openH: 182 };
  if (w < 1280) return { closedW: 270, closedH: 204, openW: 515, openH: 194 };
  return { closedW: 290, closedH: 218, openW: 550, openH: 206 };
}

/* ─────────────────────────────────────────────────────
   MINIMAL LUXURY FRONT COVER — Matte Charcoal Leatherette
   Requirement:
   - NO text ("Archival Certified Edition", etc.)
   - ONLY centered KPR Productions logo
   - Solid dark premium matte black / deep charcoal
   - Real leather/linen physical spine on left + page thickness layers
   ───────────────────────────────────────────────────── */
function MinimalFrontCover({ onOpen, dimensions }) {
  return (
    <motion.div
      key="front-cover"
      initial={{ rotateY: 0 }}
      exit={{
        rotateY: -180,
        transition: { duration: 0.7, ease: [0.35, 0, 0.15, 1] }
      }}
      onClick={onOpen}
      className="w-full h-full relative cursor-pointer select-none group origin-left"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: '3px 6px 6px 3px'
      }}
    >
      {/* ── Outer Physical Leather Cover Casing ── */}
      <div
        className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #1C1C20 0%, #151518 45%, #0F0F12 100%)',
          borderRadius: '3px 6px 6px 3px',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)'
        }}
      >
        {/* Subtle Matte Linen Sheen */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '4px 4px'
          }}
        />

        {/* Left Spine Groove / Hinge Indentation */}
        <div
          className="absolute top-0 bottom-0 left-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(255,255,255,0.06) 75%, transparent 100%)',
            borderRight: '1px solid rgba(0,0,0,0.4)'
          }}
        />

        {/* ── ONLY KPR Productions Logo Centered on Cover ── */}
        <div className="relative z-10 flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
          <div
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-2"
            style={{
              background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.5) 100%)',
              border: '1px solid rgba(197,168,128,0.3)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <img
              src="/images/kpr_logo.png"
              alt="KPR Productions"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* ── Minimal Click / Tap Indicator (Clean, non-intrusive) ── */}
        <div className="absolute bottom-2.5 sm:bottom-3.5 right-2.5 sm:right-3.5 z-20">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] sm:text-[9.5px] font-sans font-medium tracking-wider uppercase text-[#E2D4C0] bg-black/60 border border-white/15 backdrop-blur-xs group-hover:border-[#C5A880]/70 group-hover:text-[#F5E6D0] transition-colors shadow-md"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#C5A880] animate-pulse" />
            <span>Open Book</span>
          </span>
        </div>

        {/* Hover light sheen */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
          style={{
            background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.04) 50%, transparent 80%)'
          }}
        />
      </div>

      {/* ── Right-Edge Stacked Page Thickness Layers (Physical Book Depth) ── */}
      <div
        className="absolute top-1 bottom-1 -right-1 w-1 rounded-r-xs pointer-events-none z-[-1]"
        style={{ background: '#FAF7F2', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)' }}
      />
      <div
        className="absolute top-1.5 bottom-1.5 -right-2 w-1 rounded-r-xs pointer-events-none z-[-2]"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.25)' }}
      />
      <div
        className="absolute top-2 bottom-2 -right-3 w-1 rounded-r-xs pointer-events-none z-[-3]"
        style={{ background: '#DDD3C4', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.3)' }}
      />

      {/* ── Bottom Stacked Page Rim ── */}
      <div
        className="absolute -bottom-1 left-2 right-1 h-1 rounded-b-xs pointer-events-none z-[-1]"
        style={{ background: 'linear-gradient(to right, #FAF7F2, #EDE5D8)', opacity: 0.85 }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   MINIMAL LUXURY BACK COVER — Matte Charcoal Leatherette
   Requirement:
   - Solid matte black/charcoal matching front cover
   - Only centered KPR Productions logo
   - Tap to Reopen
   ───────────────────────────────────────────────────── */
function MinimalBackCover({ onReopen }) {
  return (
    <motion.div
      key="back-cover"
      initial={{ rotateY: 180 }}
      animate={{
        rotateY: 0,
        transition: { duration: 0.7, ease: [0.35, 0, 0.15, 1] }
      }}
      onClick={onReopen}
      className="w-full h-full relative cursor-pointer select-none group origin-right"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: '6px 3px 3px 6px'
      }}
    >
      <div
        className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #0F0F12 0%, #151518 55%, #1C1C20 100%)',
          borderRadius: '6px 3px 3px 6px',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 25px 60px -10px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)'
        }}
      >
        {/* Subtle Matte Linen Sheen */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '4px 4px'
          }}
        />

        {/* Right Spine Hinge Groove */}
        <div
          className="absolute top-0 bottom-0 right-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, rgba(255,255,255,0.06) 75%, transparent 100%)',
            borderLeft: '1px solid rgba(0,0,0,0.4)'
          }}
        />

        {/* Centered KPR Logo Only */}
        <div className="relative z-10 flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
          <div
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-2"
            style={{
              background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.5) 100%)',
              border: '1px solid rgba(197,168,128,0.3)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <img
              src="/images/kpr_logo.png"
              alt="KPR Productions"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Reopen Action Badge */}
        <div className="absolute bottom-2.5 sm:bottom-3.5 left-2.5 sm:left-3.5 z-20">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] sm:text-[9.5px] font-sans font-medium tracking-wider uppercase text-[#E2D4C0] bg-black/60 border border-white/15 backdrop-blur-xs group-hover:border-[#C5A880]/70 group-hover:text-[#F5E6D0] transition-colors shadow-md"
          >
            <RotateCcw className="w-2.5 h-2.5 text-[#C5A880]" />
            <span>Reopen Book</span>
          </span>
        </div>
      </div>

      {/* Left-Edge Stacked Page Thickness Layers */}
      <div
        className="absolute top-1 bottom-1 -left-1 w-1 rounded-l-xs pointer-events-none z-[-1]"
        style={{ background: '#FAF7F2', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)' }}
      />
      <div
        className="absolute top-1.5 bottom-1.5 -left-2 w-1 rounded-l-xs pointer-events-none z-[-2]"
        style={{ background: '#EDE5D8', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.25)' }}
      />
      <div
        className="absolute top-2 bottom-2 -left-3 w-1 rounded-l-xs pointer-events-none z-[-3]"
        style={{ background: '#DDD3C4', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.3)' }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   INTERIOR TWO-PAGE SPREAD WITH 3D PAGE-FLIP MOTION
   ───────────────────────────────────────────────────── */
function OpenSpread({
  spreadIndex,
  onPrev,
  onNext,
  onClose,
  onOpenUpload,
  direction
}) {
  return (
    <motion.div
      key={`spread-${spreadIndex}`}
      initial={{
        rotateY: direction > 0 ? 30 : -30,
        opacity: 0.9,
        scale: 0.98
      }}
      animate={{
        rotateY: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] }
      }}
      exit={{
        rotateY: direction > 0 ? -30 : 30,
        opacity: 0.85,
        scale: 0.98,
        transition: { duration: 0.45, ease: [0.5, 0, 0.75, 0] }
      }}
      className="w-full h-full overflow-hidden flex relative select-none"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: '3px 4px 4px 3px',
        background: '#FAF8F5',
        border: '1.5px solid #D5C9B8',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.35)'
      }}
    >
      {/* ── Deep Center Spine Binding Crease Shadow ── */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-10 z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 35%, transparent 50%, rgba(0,0,0,0.08) 65%, rgba(0,0,0,0.28) 100%)'
        }}
      />
      <div
        className="absolute top-0 bottom-0 left-1/2 w-px z-20 pointer-events-none opacity-40 bg-[#8C7A64]"
      />

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

      {/* ── Touch tap zones for mobile (Left half = prev, Right half = next) ── */}
      <div
        onClick={onPrev}
        className="absolute left-0 top-0 bottom-0 w-1/2 z-30 cursor-pointer"
        title="Tap to turn left"
      />
      <div
        onClick={onNext}
        className="absolute right-0 top-0 bottom-0 w-1/2 z-30 cursor-pointer"
        title="Tap to turn right"
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

      {/* ── Spread 5: Closing Spread ── */}
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

          <div
            className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden bg-[#FAF8F5]"
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
      className="relative flex flex-col items-center justify-center select-none my-1 sm:my-1.5 w-full max-w-full px-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 3D Book Stage ── */}
      <div className="relative flex items-center justify-center select-none">
        {/* Soft Ambient Desk Drop Shadow (Rests grounded on the table, not floating) */}
        <div
          className="absolute -bottom-3.5 sm:-bottom-5 h-6 sm:h-9 bg-black/75 blur-lg rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dimensions.openW * 0.94 : dimensions.closedW * 0.95,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Fullscreen Expand Trigger (44px+ touch-friendly target) */}
        {onOpenFullscreen && (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="absolute -top-3 -right-2.5 sm:-top-3.5 sm:-right-3.5 z-40 p-2 sm:p-2.5 rounded-full border shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            style={{
              background: 'rgba(20,20,22,0.92)',
              color: '#C5A880',
              borderColor: 'rgba(197,168,128,0.5)'
            }}
            title="Open Fullscreen 3D Photobook Viewer"
            aria-label="Open Fullscreen Viewer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Left Navigation Arrow (44px+ touch friendly) */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={spreadIndex === 0}
          className={`absolute -left-3 sm:-left-7 top-1/2 -translate-y-1/2 z-35 min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-full border shadow-lg transition-all duration-200 cursor-pointer ${
            spreadIndex === 0
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          style={{
            background: 'rgba(20,20,22,0.95)',
            color: '#C5A880',
            borderColor: 'rgba(197,168,128,0.6)'
          }}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Right Navigation Arrow (44px+ touch friendly) */}
        <button
          type="button"
          onClick={flipNext}
          disabled={spreadIndex >= totalSpreads}
          className={`absolute -right-3 sm:-right-7 top-1/2 -translate-y-1/2 z-35 min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-full border shadow-lg transition-all duration-200 cursor-pointer ${
            spreadIndex >= totalSpreads
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          style={{
            background: 'rgba(20,20,22,0.95)',
            color: '#C5A880',
            borderColor: 'rgba(197,168,128,0.6)'
          }}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

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
            {/* 1. FRONT COVER (Closed) */}
            {isCover && (
              <MinimalFrontCover key="front" onOpen={flipNext} dimensions={dimensions} />
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
              />
            )}

            {/* 3. BACK COVER (Closed) */}
            {isBackCover && (
              <MinimalBackCover key="back" onReopen={() => goToSpread(0)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Page Indicator & Navigation Dots ── */}
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
              className={`transition-all duration-300 rounded-full cursor-pointer min-h-[16px] flex items-center justify-center ${
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
          className="text-[#888888] font-medium hidden xs:inline tracking-wide"
          style={{ fontSize: 'clamp(7px, 1.4vw, 9.5px)' }}
        >
          • Tap book to turn pages
        </span>
      </div>
    </div>
  );
}
