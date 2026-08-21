import React, { useState, useRef } from 'react';
import { Sliders, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RetouchSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <section className="py-10 sm:py-24 bg-[#121212] text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <p className="text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#C5A880] font-medium mb-2 sm:mb-3">
            FINE ART POST-PRODUCTION
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-white font-light tracking-wide mb-4 sm:mb-6">
            THE RETOUCHING ARTISTRY
          </h2>
          <p className="text-white/70 text-xs sm:text-sm font-light leading-relaxed">
            Drag the interactive slider below to witness how our signature color grading transforms raw unedited captures into warm, timeless cinematic heirlooms.
          </p>
        </div>

        {/* Interactive Comparison Container */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={(e) => {
            if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
          }}
          onTouchMove={handleTouchMove}
          className="relative aspect-[16/10] sm:aspect-[16/9] max-w-5xl mx-auto overflow-hidden rounded-sm select-none border border-white/10 shadow-2xl cursor-ew-resize touch-none"
        >
          {/* AFTER (Color Graded Masterpiece) - Full background */}
          <img
            src="/images/21/photo_1.jpg"
            alt="Master Color Graded Photo"
            className="absolute inset-0 w-full h-full object-cover filter contrast-[1.05] brightness-105"
          />
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 bg-black/70 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] font-medium tracking-wider text-[#C5A880] uppercase flex items-center gap-1.5 border border-[#C5A880]/30">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880]" />
            <span>Color Graded</span>
          </div>

          {/* BEFORE (Raw Flat Capture) - Clipped Overlay */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src="/images/21/photo_1.jpg"
              alt="Raw Unedited Photo"
              className="absolute inset-0 w-full h-full object-cover filter grayscale-[50%] brightness-75 contrast-80 max-w-none"
              style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw' }}
            />
            <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 bg-black/70 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded text-[9px] sm:text-[11px] font-medium tracking-wider text-white/80 uppercase border border-white/20 whitespace-nowrap">
              Unedited RAW
            </div>
          </div>

          {/* Vertical Split Line & Handle */}
          <div
            className="absolute inset-y-0 z-30 w-0.5 sm:w-1 bg-white/80 backdrop-blur-xs cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C5A880] text-white shadow-xl flex items-center justify-center border-2 border-white">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

        </div>

        {/* Editing Features Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 pt-8 border-t border-white/10 text-center md:text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Custom Skin Tone Palette</h4>
              <p className="text-xs text-white/60 mt-1">Preserving natural skin undertones with glowing film contrast.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Bespoke Light Emulation</h4>
              <p className="text-xs text-white/60 mt-1">Enhanced highlights & specular bokeh without harsh digital glare.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Permanent Archival Quality</h4>
              <p className="text-xs text-white/60 mt-1">Exported in 16-bit TIFF for museum-grade fine art printing.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
