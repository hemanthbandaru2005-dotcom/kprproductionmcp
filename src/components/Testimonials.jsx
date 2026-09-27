import React, { useState } from 'react';
import { TESTIMONIALS } from '../data/testimonialsData';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function Testimonials() {
  const [activeIdx, setActiveIdx] = useState(0);

  const handlePrev = () => {
    setActiveIdx((activeIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const handleNext = () => {
    setActiveIdx((activeIdx + 1) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[activeIdx];

  return (
    <section className="py-24 bg-[#F7F3EE] relative overflow-hidden border-t border-[#E8E1D5]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        
        <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase text-[#666666] font-medium mb-3">
          LOVE NOTES & PRAISE
        </p>
        <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1A1A] font-light tracking-wide mb-12">
          CLIENT EXPERIENCES
        </h2>

        {/* Testimonial Card */}
        <div className="relative bg-white p-8 md:p-14 border border-[#E2D9CC] shadow-xl">
          <Quote className="w-10 h-10 text-[#C5A880]/30 mx-auto mb-6" />

          {/* 5 Stars */}
          <div className="flex justify-center space-x-1 text-[#C5A880] mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>

          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-[#1A1A1A] font-light italic leading-relaxed mb-8">
            "{current.quote}"
          </p>

          <div>
            <h4 className="font-serif text-lg text-[#1A1A1A] font-semibold">{current.couple}</h4>
            <p className="text-xs uppercase tracking-widest text-[#C5A880] mt-1 font-medium">{current.venue}</p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-[#E8E1D5]">
            <button
              onClick={handlePrev}
              className="p-2.5 border border-[#E2D9CC] text-[#555555] hover:border-[#C5A880] hover:text-[#C5A880] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs text-[#888888] font-mono">
              0{activeIdx + 1} / 0{TESTIMONIALS.length}
            </span>

            <button
              onClick={handleNext}
              className="p-2.5 border border-[#E2D9CC] text-[#555555] hover:border-[#C5A880] hover:text-[#C5A880] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
