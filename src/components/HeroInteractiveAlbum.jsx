import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  BookOpen,
  Upload,
  Camera,
  RotateCcw,
  CheckCircle2,
  Heart
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper
   Calculates optimal book dimensions so it fits comfortably
   on any screen without horizontal overflow or jitter
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return {
      closedW: 240,
      closedH: 175,
      openW: 460,
      openH: 175,
    };
  }
  const w = window.innerWidth;
  if (w < 380) {
    // Small mobile (e.g. iPhone SE, 360px phones)
    return {
      closedW: 170,
      closedH: 125,
      openW: 310,
      openH: 120,
    };
  } else if (w < 480) {
    // Standard mobile (e.g. 390px - 430px)
    return {
      closedW: 195,
      closedH: 140,
      openW: 345,
      openH: 130,
    };
  } else if (w < 640) {
    // Large mobile
    return {
      closedW: 215,
      closedH: 155,
      openW: 390,
      openH: 145,
    };
  } else if (w < 768) {
    // Small tablet
    return {
      closedW: 235,
      closedH: 168,
      openW: 430,
      openH: 160,
    };
  } else if (w < 1024) {
    // Tablet
    return {
      closedW: 250,
      closedH: 180,
      openW: 470,
      openH: 175,
    };
  } else if (w < 1280) {
    // Laptop / Standard Desktop
    return {
      closedW: 265,
      closedH: 190,
      openW: 500,
      openH: 185,
    };
  } else {
    // Large Desktop
    return {
      closedW: 280,
      closedH: 200,
      openW: 530,
      openH: 195,
    };
  }
}

export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen }) {
  // Spreads:
  // 0: Front Hardcover ("Atta" closed)
  // 1: Inside Spread 1 (Ex Libris Dedication & Royal Bride)
  // 2: Inside Spread 2 (Couple Royal Portrait & Mandap Rituals)
  // 3: Inside Spread 3 (Haldi Celebration & Sunset Romance)
  // 4: Inside Spread 4 (Saree Function & Grand Reception)
  // 5: Inside Spread 5 (Heirloom Preservation & Closing Page)
  // 6: Back Hardcover ("Atta" closed)
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [dimensions, setDimensions] = useState(getBookDimensions);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setDimensions(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSpreads = 6; // 0 to 6 (7 distinct states)

  const goToSpread = useCallback((newSpread) => {
    if (newSpread < 0 || newSpread > totalSpreads) return;
    setDirection(newSpread >= spreadIndex ? 1 : -1);
    setSpreadIndex(newSpread);
  }, [spreadIndex, totalSpreads]);

  const flipNext = useCallback(() => {
    if (spreadIndex < totalSpreads) {
      setDirection(1);
      setSpreadIndex(prev => prev + 1);
    }
  }, [spreadIndex, totalSpreads]);

  const flipPrev = useCallback(() => {
    if (spreadIndex > 0) {
      setDirection(-1);
      setSpreadIndex(prev => prev - 1);
    }
  }, [spreadIndex]);

  // Touch Swipe Handlers for smooth mobile swiping
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

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        flipNext();
      } else {
        flipPrev();
      }
    }
  };

  const isCover = spreadIndex === 0;
  const isBackCover = spreadIndex === totalSpreads;
  const isOpen = !isCover && !isBackCover;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-0.5 sm:my-1 w-full max-w-full px-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 'Swipe / Click to explore' Hint Badge ── */}
      <div
        className={`absolute -left-3 xs:-left-8 sm:-left-14 top-1/2 -translate-y-1/2 pointer-events-none select-none z-30 hidden xs:block transition-opacity duration-300 ${
          isCover ? 'opacity-90' : 'opacity-40'
        }`}
      >
        <img
          src="/images/swipe_to_explore.png"
          alt="Swipe to explore"
          className="w-9 xs:w-11 sm:w-14 md:w-16 h-auto object-contain drop-shadow-xs -rotate-6"
          draggable="false"
        />
      </div>

      {/* ── Book Presentation Stage: Absolutely Centered, ZERO lateral movement ── */}
      <div className="relative flex items-center justify-center select-none">

        {/* Realistic Desk Shadow Underneath */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 h-5 sm:h-7 bg-black/40 blur-md rounded-full pointer-events-none transition-all duration-400"
          style={{
            width: isOpen ? dimensions.openW * 0.92 : dimensions.closedW * 0.95,
          }}
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
            <Maximize2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>
        )}

        {/* ── Left Navigation Arrow ── */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={spreadIndex === 0}
          className={`absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-35 p-1.5 sm:p-2 rounded-full bg-[#1A1A1A]/95 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/60 shadow-lg transition-all duration-200 cursor-pointer ${
            spreadIndex === 0
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Previous page (Swipe or Click)"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* ── Right Navigation Arrow ── */}
        <button
          type="button"
          onClick={flipNext}
          disabled={spreadIndex >= totalSpreads}
          className={`absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-35 p-1.5 sm:p-2 rounded-full bg-[#1A1A1A]/95 hover:bg-[#000000] text-[#C5A880] hover:text-white border border-[#C5A880]/60 shadow-lg transition-all duration-200 cursor-pointer ${
            spreadIndex >= totalSpreads
              ? 'opacity-0 pointer-events-none'
              : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'
          }`}
          title="Next page (Swipe or Click)"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* ── Dynamic 3D Book Container with Animated Transition ── */}
        <div
          className="relative flex items-center justify-center transition-all duration-400 ease-out"
          style={{
            width: isOpen ? dimensions.openW : dimensions.closedW,
            height: isOpen ? dimensions.openH : dimensions.closedH,
            perspective: 1200,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* ═══════════════════════════════════════════════════
                STATE 0: FRONT HARDCOVER ("ATTA" CLOSED)
                With Official KPR PRODUCTIONS Logo & Leather Texture
                ═══════════════════════════════════════════════════ */}
            {isCover && (
              <motion.div
                key="front-cover"
                initial={{ opacity: 0, rotateY: direction > 0 ? 0 : -25, scale: 0.97 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -75, scale: 0.95 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                onClick={flipNext}
                className="w-full h-full rounded-xs sm:rounded-sm relative overflow-hidden bg-gradient-to-br from-[#1C1712] via-[#241D17] to-[#120F0C] border-2 border-[#C5A880]/70 shadow-[0_16px_36px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-between p-2 sm:p-3.5 text-center cursor-pointer group"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Genuine Leather Grain Specular Surface */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D8C4A4_1px,transparent_1px)] [background-size:7px_7px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none" />

                {/* Left Hardcover Spine Joint Hinge Channel with Realistic Stitching */}
                <div className="absolute top-0 bottom-0 left-0 w-3.5 sm:w-5 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none border-r border-[#C5A880]/40 z-20 flex flex-col justify-around items-center py-2 opacity-85">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-0.5 sm:w-1 h-1.5 sm:h-2 bg-[#C5A880]/70 rounded-full shadow-xs" />
                  ))}
                </div>

                {/* Stacked Gold-gilt Page Thickness Edge on Right & Bottom */}
                <div className="absolute top-1 bottom-1 right-0 w-1.5 bg-gradient-to-l from-[#FAF7F2] via-[#D5CABB] to-[#8C7A64] rounded-r-2xs opacity-90 pointer-events-none shadow-xs" />
                <div className="absolute left-3.5 right-1 bottom-0 h-1.5 bg-gradient-to-t from-[#FAF7F2] via-[#D5CABB] to-[#8C7A64] rounded-b-2xs opacity-90 pointer-events-none shadow-xs" />

                {/* Double Gold Hot-Stamped Foil Borders */}
                <div className="absolute inset-2 sm:inset-3 border border-[#C5A880]/65 rounded-2xs pointer-events-none" />
                <div className="absolute inset-2.5 sm:inset-4 border border-[#C5A880]/30 rounded-2xs pointer-events-none" />

                {/* Ornate Gold Filigree Corner Accents */}
                <div className="absolute top-2.5 left-4 sm:top-3.5 sm:left-5.5 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute bottom-2.5 left-4 sm:bottom-3.5 sm:left-5.5 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-[#E5D3B3] pointer-events-none" />

                {/* Top Header: Royal Crest */}
                <div className="relative z-10 pt-0.5 sm:pt-1">
                  <div className="flex items-center justify-center gap-1 text-[#C5A880]">
                    <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-[0.28em] text-[#C5A880]">
                      ROYAL HEIRLOOM COLLECTION
                    </span>
                    <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  </div>
                </div>

                {/* ── Official KPR PRODUCTIONS Logo & Masterpiece Title ── */}
                <div className="relative z-10 my-auto px-2 space-y-1 sm:space-y-1.5 flex flex-col items-center">
                  {/* Official KPR Logo Display */}
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-black/50 border border-[#C5A880]/60 p-1 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img
                      src="/images/kpr_logo.png"
                      alt="KPR Productions Logo"
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(197,168,128,0.5)]"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <h2 className="font-serif text-[12px] sm:text-[15px] md:text-[17px] font-bold tracking-[0.22em] uppercase leading-tight bg-gradient-to-b from-[#FFF7E8] via-[#E8CE9B] to-[#B8935C] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      KPR PRODUCTIONS
                    </h2>
                    <div className="flex items-center justify-center gap-1 py-0.5">
                      <div className="w-5 sm:w-8 h-px bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
                      <span className="text-[6px] sm:text-[7px] text-[#C5A880]">✦</span>
                      <div className="w-5 sm:w-8 h-px bg-gradient-to-r from-transparent via-[#C5A880] to-transparent" />
                    </div>
                    <p className="font-serif text-[7.5px] sm:text-[9.5px] text-[#F0E6D2] tracking-[0.18em] uppercase font-medium">
                      Wedding Photobook
                    </p>
                    <p className="text-[6px] sm:text-[7.5px] text-[#C5A880]/90 font-mono tracking-widest uppercase">
                      Layflat Silk Edition
                    </p>
                  </div>

                  {/* Open Album CTA Button */}
                  <div className="pt-0.5 sm:pt-1">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-[#C5A880] via-[#DFBA73] to-[#C5A880] text-[#120F0C] text-[7px] sm:text-[8.5px] font-bold uppercase tracking-wider shadow-[0_2px_10px_rgba(197,168,128,0.5)] group-hover:scale-105 active:scale-95 transition-transform duration-200">
                      <span>Open Album</span>
                      <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </span>
                  </div>
                </div>

                {/* Footer Subtitle */}
                <div className="relative z-10 pb-0.5">
                  <p className="text-[5.5px] sm:text-[7px] text-[#C5A880]/75 uppercase tracking-[0.25em] font-medium">
                    KPR COLOUR LAB & STUDIO · HYDERABAD
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                STATES 1 TO 5: OPEN 2-PAGE LAYFLAT PHOTOBOOK SPREADS
                Left Page + Right Page with Authentic Spine Crease
                ═══════════════════════════════════════════════════ */}
            {isOpen && (
              <motion.div
                key={`spread-${spreadIndex}`}
                initial={{
                  opacity: 0,
                  rotateY: direction > 0 ? 15 : -15,
                  scale: 0.98,
                }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  rotateY: direction > 0 ? -15 : 15,
                  scale: 0.98,
                }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full rounded-xs sm:rounded-sm overflow-hidden bg-[#FAF8F5] border border-[#D5C9B8] shadow-[0_16px_36px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)] flex relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Center Spine Crease Binding Shadow */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 sm:w-7 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none z-20" />
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-[#8C7A64]/40 z-20 pointer-events-none" />

                {/* Stacked Pages Thickness Bottom Edge */}
                <div className="absolute -bottom-0.5 left-2 right-2 h-1 bg-gradient-to-r from-[#D5CABB] via-[#FAF7F2] to-[#D5CABB] opacity-80 pointer-events-none" />

                {/* ─── SPREAD 1: Ex Libris Dedication (Left) & Royal Bride (Right) ─── */}
                {spreadIndex === 1 && (
                  <>
                    {/* Left Page: Dedication */}
                    <div className="w-1/2 h-full bg-gradient-to-br from-[#FAF8F5] via-[#F5EFE6] to-[#EAE2D2] border-r border-[#D5C9B8] p-2 sm:p-3.5 flex flex-col justify-between text-center relative overflow-hidden">
                      <div className="pt-0.5">
                        <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.22em] text-[#8C6D3F]">
                          EX LIBRIS · WEDDING HEIRLOOM
                        </span>
                      </div>
                      <div className="my-auto px-1 space-y-1 sm:space-y-1.5">
                        <div className="w-6 sm:w-10 h-px bg-[#8C6D3F]/40 mx-auto" />
                        <h3 className="font-serif text-[9px] sm:text-[12px] text-[#2A231C] font-semibold tracking-wide uppercase leading-tight">
                          A Lifetime of Cherished Vows
                        </h3>
                        <p className="font-serif italic text-[6px] sm:text-[7.5px] text-[#6A5A4A] leading-relaxed max-w-[170px] mx-auto">
                          “Every glance a sacred memory, every smile an eternal treasure preserved for generations.”
                        </p>
                        <div className="w-6 sm:w-10 h-px bg-[#8C6D3F]/40 mx-auto" />
                        <p className="text-[5.5px] sm:text-[7px] text-[#8C6D3F] font-mono tracking-widest uppercase">
                          Mastercrafted by KPR Colour Lab
                        </p>
                      </div>
                      <div className="pb-0.5">
                        <span className="text-[5.5px] sm:text-[7px] text-[#8C6D3F]/80 tracking-wider uppercase font-medium bg-[#8C6D3F]/10 px-2 py-0.5 rounded-full border border-[#8C6D3F]/20">
                          Spread 1 of 4
                        </span>
                      </div>
                    </div>

                    {/* Right Page: Royal Bride */}
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_1.jpg"
                          alt="The Royal Bride"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 right-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          01 · Royal Bride
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ─── SPREAD 2: Royal Couple (Left) & Mandap Ceremony (Right) ─── */}
                {spreadIndex === 2 && (
                  <>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center border-r border-[#D5C9B8]">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_2.jpg"
                          alt="Couple Elegance"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 left-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          02 · Eternal Couple
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_3.jpg"
                          alt="Mandap Blessings"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 right-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          03 · Mandap Vows
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ─── SPREAD 3: Haldi Joy (Left) & Sunset Romance (Right) ─── */}
                {spreadIndex === 3 && (
                  <>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center border-r border-[#D5C9B8]">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_4.jpg"
                          alt="Haldi Ceremony"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 left-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          04 · Haldi Splendor
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_5.jpg"
                          alt="Sunset Romance"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 right-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          05 · Twilight Romance
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ─── SPREAD 4: Saree Function (Left) & Reception Grandeur (Right) ─── */}
                {spreadIndex === 4 && (
                  <>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center border-r border-[#D5C9B8]">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_6.jpg"
                          alt="Saree Ceremony"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 left-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          06 · Royal Traditions
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2 h-full p-1 sm:p-1.5 relative overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                      <div className="w-full h-full relative rounded-xs overflow-hidden bg-black/10 border border-[#D5C9B8]/80">
                        <img
                          src="/images/wedding/photo_7.jpg"
                          alt="Grand Reception"
                          className="w-full h-full object-cover pointer-events-none"
                          loading="eager"
                        />
                        <span className="absolute bottom-1 right-1 text-[6px] sm:text-[7.5px] font-mono text-[#5A4836] bg-white/95 px-1.5 py-0.5 rounded-full border border-[#D5C9B8] shadow-xs font-bold">
                          07 · Grand Reception
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* ─── SPREAD 5: Preserve Your Story & Close Album CTA ─── */}
                {spreadIndex === 5 && (
                  <>
                    {/* Left Page: Upload CTA */}
                    <div className="w-1/2 h-full bg-gradient-to-br from-[#FAF8F5] via-[#F4EFE6] to-[#EAE0D0] border-r border-[#D5C9B8] p-2 sm:p-3 flex flex-col justify-between text-center relative overflow-hidden">
                      <div className="pt-0.5">
                        <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.2em] text-[#8C6D3F]">
                          CREATE YOUR ALBUM
                        </span>
                      </div>
                      <div className="my-auto px-1 space-y-1 sm:space-y-1.5">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#8C6D3F]/15 border border-[#8C6D3F]/30 flex items-center justify-center mx-auto text-[#8C6D3F]">
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <h4 className="font-serif text-[9px] sm:text-[11px] text-[#2A231C] font-semibold leading-tight">
                          Upload Your Own Photos
                        </h4>
                        <p className="text-[5.5px] sm:text-[7px] text-[#6A5A4A] leading-tight max-w-[150px] mx-auto">
                          Upload finished spreads or photos of any dimensions to generate your 3D proof.
                        </p>
                        {onOpenUpload && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenUpload();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#181410] hover:bg-black text-[#E8D4B8] hover:text-white border border-[#C5A880]/50 text-[6.5px] sm:text-[8px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer mt-0.5"
                          >
                            <Upload className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            <span>Upload Album</span>
                          </button>
                        )}
                      </div>
                      <div className="pb-0.5">
                        <span className="text-[5px] sm:text-[6.5px] text-[#8C6D3F] font-mono tracking-wider">
                          KPR Colour Lab
                        </span>
                      </div>
                    </div>

                    {/* Right Page: Turn to Close Album */}
                    <div className="w-1/2 h-full bg-[#FAF8F5] p-2 sm:p-3 flex flex-col justify-between text-center relative overflow-hidden">
                      <div className="pt-0.5">
                        <span className="text-[6px] sm:text-[7.5px] uppercase font-bold tracking-[0.2em] text-[#8C6D3F]">
                          END OF PREVIEW
                        </span>
                      </div>
                      <div className="my-auto px-1 space-y-1 sm:space-y-1.5">
                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A880] mx-auto fill-[#C5A880]/20" />
                        <h4 className="font-serif text-[9px] sm:text-[11px] text-[#2A231C] font-semibold leading-tight">
                          Preserved for Generations
                        </h4>
                        <p className="text-[5.5px] sm:text-[7px] text-[#6A5A4A] leading-tight max-w-[150px] mx-auto">
                          100% Layflat Flushmount Binding with Ultra-HD 4K Chromogenic Silk Printing
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            flipNext();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-[6.5px] sm:text-[8px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer mt-0.5"
                        >
                          <span>Close Album</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="pb-0.5">
                        <span className="text-[5px] sm:text-[6.5px] text-[#8C6D3F]/80 tracking-widest uppercase font-mono">
                          Turn to Close Atta →
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════
                STATE 6: BACK HARDCOVER ("ATTA" CLOSED)
                Embossed Gold KPR Seal & Certified Layflat Stamp
                ═══════════════════════════════════════════════════ */}
            {isBackCover && (
              <motion.div
                key="back-cover"
                initial={{ opacity: 0, rotateY: 25, scale: 0.97 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 75, scale: 0.95 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full rounded-xs sm:rounded-sm relative overflow-hidden bg-gradient-to-br from-[#1C1712] via-[#241D17] to-[#120F0C] border-2 border-[#C5A880]/70 shadow-[0_16px_36px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.4)] flex flex-col items-center justify-between p-2 sm:p-3.5 text-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Leather Grain Texture */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D8C4A4_1px,transparent_1px)] [background-size:7px_7px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none" />

                {/* Right Hardcover Spine Joint Hinge Channel with Stitching */}
                <div className="absolute top-0 bottom-0 right-0 w-3.5 sm:w-5 bg-gradient-to-l from-black/80 via-black/45 to-transparent pointer-events-none border-l border-[#C5A880]/40 z-20 flex flex-col justify-around items-center py-2 opacity-85">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-0.5 sm:w-1 h-1.5 sm:h-2 bg-[#C5A880]/70 rounded-full shadow-xs" />
                  ))}
                </div>

                {/* Double Gold Foil Borders */}
                <div className="absolute inset-2 sm:inset-3 border border-[#C5A880]/65 rounded-2xs pointer-events-none" />
                <div className="absolute inset-2.5 sm:inset-4 border border-[#C5A880]/30 rounded-2xs pointer-events-none" />

                {/* Royal Filigree Corners */}
                <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute top-2.5 right-4 sm:top-3.5 sm:right-5.5 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-[#E5D3B3] pointer-events-none" />
                <div className="absolute bottom-2.5 right-4 sm:bottom-3.5 sm:right-5.5 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-[#E5D3B3] pointer-events-none" />

                {/* Top Badge */}
                <div className="relative z-10 pt-0.5 sm:pt-1">
                  <span className="text-[6.5px] sm:text-[8px] uppercase font-bold tracking-[0.25em] text-[#C5A880]">
                    ARCHIVAL EDITION SEAL
                  </span>
                </div>

                {/* Center Seal */}
                <div className="relative z-10 my-auto px-2 space-y-1 sm:space-y-1.5 flex flex-col items-center">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#C5A880]/30 to-[#1A1612] border border-[#E5D3B3]/70 flex items-center justify-center mx-auto shadow-inner text-[#E8D4B8]">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880]" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-serif text-[11px] sm:text-[14px] font-bold tracking-[0.22em] uppercase leading-tight bg-gradient-to-b from-[#FFF7E8] via-[#E8CE9B] to-[#B8935C] bg-clip-text text-transparent">
                      KPR PRODUCTIONS
                    </h3>
                    <p className="text-[6.5px] sm:text-[8px] text-[#C5A880] tracking-[0.18em] uppercase font-semibold">
                      Luxury Wedding Storytelling
                    </p>
                    <div className="w-6 sm:w-10 h-0.5 bg-[#C5A880]/50 mx-auto" />
                    <p className="text-[5.5px] sm:text-[7px] text-[#D5C4A6]/70 tracking-wider uppercase">
                      Digital Color Lab · Hyderabad
                    </p>
                  </div>

                  {/* Reopen Button */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSpread(0);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full bg-black/70 hover:bg-[#C5A880] text-[#C5A880] hover:text-[#120F0C] border border-[#C5A880]/60 text-[6.5px] sm:text-[8px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Reopen Album</span>
                    </button>
                  </div>
                </div>

                {/* Footer Stamp */}
                <div className="relative z-10 pb-0.5">
                  <p className="text-[5.5px] sm:text-[7px] text-[#C5A880]/70 uppercase tracking-[0.2em] font-mono">
                    100% LAYFLAT CERTIFIED
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Page Indicator Dots & Quick Jump Navigation Bar ── */}
      <div className="flex items-center justify-center gap-1.5 mt-2 select-none z-20">
        <div className="flex items-center gap-1 bg-[#141414]/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#D5C9B8]/35 shadow-sm">
          {[0, 1, 2, 3, 4, 5, 6].map((spread) => (
            <button
              key={spread}
              type="button"
              onClick={() => goToSpread(spread)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                spreadIndex === spread
                  ? 'w-4 sm:w-5 h-1 sm:h-1.5 bg-[#C5A880]'
                  : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/75'
              }`}
              title={
                spread === 0
                  ? 'Front Cover ("Atta")'
                  : spread === 6
                  ? 'Back Cover ("Atta")'
                  : `Spread ${spread} of 5`
              }
              aria-label={
                spread === 0
                  ? 'Front Cover'
                  : spread === 6
                  ? 'Back Cover'
                  : `Spread ${spread}`
              }
            />
          ))}
          <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-mono text-[#F5E6D0] ml-1 font-bold tracking-wider">
            {spreadIndex === 0
              ? 'COVER'
              : spreadIndex === 6
              ? 'BACK'
              : `${spreadIndex}/5`}
          </span>
        </div>

        <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] text-[#666666] font-medium hidden xs:inline">
          • Click or swipe to turn
        </span>
      </div>
    </div>
  );
}
