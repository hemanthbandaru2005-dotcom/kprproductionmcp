import React, { forwardRef } from 'react';

/**
 * BackCover Component
 * Renders the matching luxury back cover artwork cleanly,
 * representing the closing of the physical photobook with zero distractions.
 */
const BackCover = forwardRef(({ onReopen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      onClick={onReopen}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click to Reopen Album"
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l-2 border-l-[#8A7862]/30 bg-[#FAF8F5]">

        {/* ── User-Provided Artwork Back Cover Image (Full & Pristine) ── */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#FAF8F5]">
          <img
            src="/images/album/back_cover.jpg"
            alt="KPR Productions Wedding Photobook Back Cover"
            className="w-full h-full object-contain object-center select-none pointer-events-none"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* ── Subtle Hardcover Outer Bevel (No heavy dark overlays) ── */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]" />

        {/* ── Left Edge Stacked Page Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />

      </div>
    </div>
  );
});

BackCover.displayName = 'BackCover';
export default BackCover;
