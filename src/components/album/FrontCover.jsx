import React, { forwardRef } from 'react';

/**
 * FrontCover Component
 * Renders the user-supplied front cover artwork cleanly,
 * embedded into a physical luxury hardcover casing with zero distractions.
 */
const FrontCover = forwardRef(({ onOpen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      onClick={onOpen}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click to Open Album"
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r-2 border-r-[#8A7862]/30 bg-[#FAF8F5]">

        {/* ── User-Provided Artwork Cover Image (Full & Pristine) ── */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[#FAF8F5]">
          <img
            src="/images/album/front_cover.jpg"
            alt="KPR Productions Wedding Photobook Front Cover"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </div>

        {/* ── Subtle Physical Hardcover Outer Bevel (No heavy dark overlays) ── */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-[#4A3C28]/20 shadow-[inset_0_0_6px_rgba(0,0,0,0.15)]" />

        {/* ── Right Edge Stacked Page Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 100%)'
          }}
        />

      </div>
    </div>
  );
});

FrontCover.displayName = 'FrontCover';
export default FrontCover;
