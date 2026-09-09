import React, { forwardRef } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * BackCover Component
 * Renders the user-supplied back cover artwork exactly as supplied,
 * representing the closing of the physical photobook.
 */
const BackCover = forwardRef(({ onReopen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#E8E2D8] ${props.className || ''}`}
      data-density="hard"
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l-2 border-l-[#8A7862]/40 bg-[#FAF7F2]">

        {/* ── User-Provided Artwork Back Cover Image ── */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#E8E2D8]">
          <img
            src="/images/album/back_cover.jpg"
            alt="KPR Productions Wedding Photobook Back Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* ── Realistic Physical Book Hardcover Overlays ── */}

        {/* 1. Right Spine Hinge Crease Shadow & Depth */}
        <div
          className="absolute top-0 bottom-0 right-0 w-5 sm:w-8 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(255,255,255,0.1) 70%, transparent 100%)',
            borderLeft: '1px solid rgba(0,0,0,0.18)'
          }}
        />

        {/* 2. Embossed Linen Cloth Texture Sheen */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-overlay"
          style={{
            background: 'linear-gradient(225deg, rgba(255,255,255,0.4) 0%, transparent 45%, rgba(0,0,0,0.25) 100%)'
          }}
        />

        {/* 3. Hardcover Outer Bevel Edge */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_8px_rgba(0,0,0,0.35)]" />

        {/* 4. Left Edge Thickness */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 sm:w-3 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
          }}
        />

        {/* ── Subtle Re-open Navigation Badge ── */}
        <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 z-20">
          <button
            type="button"
            onClick={onReopen}
            className="group/btn flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#1A1815]/90 hover:bg-black text-[#F4ECD8] text-[9.5px] sm:text-xs font-serif tracking-widest uppercase border border-[#C5A880]/60 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover/btn:-translate-x-0.5 transition-transform" />
            <span>Turn Back</span>
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880]" />
          </button>
        </div>

      </div>
    </div>
  );
});

BackCover.displayName = 'BackCover';
export default BackCover;
