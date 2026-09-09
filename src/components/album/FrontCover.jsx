import React, { forwardRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * FrontCover Component
 * Renders the user-supplied front cover artwork exactly as supplied,
 * embedded into a physical luxury hardcover casing with 3D spine hinge,
 * paper stack edge, and realistic lighting.
 */
const FrontCover = forwardRef(({ onOpen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#E8E2D8] ${props.className || ''}`}
      data-density="hard"
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r-2 border-r-[#8A7862]/40 bg-[#FAF7F2]">

        {/* ── User-Provided Artwork Cover Image ── */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#E8E2D8]">
          <img
            src="/images/album/front_cover.jpg"
            alt="KPR Productions Wedding Photobook Front Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </div>

        {/* ── Realistic Physical Book Hardcover Overlays (Lighting & Spine) ── */}

        {/* 1. Left Spine Hinge Crease Shadow & Depth */}
        <div
          className="absolute top-0 bottom-0 left-0 w-5 sm:w-8 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(255,255,255,0.1) 70%, transparent 100%)',
            borderRight: '1px solid rgba(0,0,0,0.18)'
          }}
        />

        {/* 2. Embossed Linen Cloth Texture Sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 45%, rgba(0,0,0,0.25) 100%)'
          }}
        />

        {/* 3. Hardcover Outer Bevel Edge & Gold Trim Hint */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.35)]" />

        {/* 4. Right Edge Thickness & Gilt Page Stack Highlight */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 sm:w-3 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
          }}
        />

        {/* ── Interactive "Click to Open" luxury invitation badge ── */}
        <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 z-20">
          <button
            type="button"
            onClick={onOpen}
            className="group/btn flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1A1815]/90 hover:bg-black text-[#F4ECD8] text-[9.5px] sm:text-xs font-serif tracking-widest uppercase border border-[#C5A880]/60 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] animate-pulse" />
            <span>Open Album</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
});

FrontCover.displayName = 'FrontCover';
export default FrontCover;
