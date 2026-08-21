import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Experience({ onOpenInquire }) {
  const featuredCards = [
    {
      id: 'hangar',
      image: '/images/hangar_couple.png',
      alt: 'Hangar Aviation Shoot',
      title: 'High Fashion Editorial',
      location: 'Industrial & Aviation Venues'
    },
    {
      id: 'estate',
      image: '/images/stone_estate.png',
      alt: 'Limestone Estate Walk',
      title: 'Estate & Historic Manors',
      location: 'European & Tuscan Architecture'
    },
    {
      id: 'chandelier',
      image: '/images/chandelier_dance.png',
      alt: 'Chandelier Sparkle First Dance',
      title: 'Candid Ballroom Romance',
      location: 'Luxury Grand Ballrooms'
    }
  ];

  return (
    <section id="experience" className="py-24 md:py-32 bg-[#F7F3EE] relative overflow-hidden">
      
      {/* Container */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
        
        {/* Experience Header Category */}
        <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase text-[#666666] font-medium mb-3">
          EXPERIENCE
        </p>

        {/* Main Headline matching image typography */}
        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#1A1A1A] font-light tracking-wide leading-tight mb-16">
          TIMELESS <span className="italic font-normal font-playfair">Elegance</span> <br className="hidden sm:inline" />
          <span className="text-[0.9em] lowercase font-serif italic text-[#444444]">and</span> UNPARALLELED <span className="italic font-normal font-playfair">Artistry</span>
        </h2>

        {/* 3 Featured Image Cards with Double Framed Borders (as seen in screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-16">
          {featuredCards.map((card, idx) => (
            <div
              key={card.id}
              className={`group cursor-pointer ${
                idx === 1 ? 'md:-translate-y-4' : '' /* Center card slightly prominent as in screenshot */
              }`}
            >
              {/* Framing box wrapper matching screenshot frame */}
              <div className="p-3.5 bg-white border border-[#E2D9CC] shadow-lg transition-transform duration-500 group-hover:-translate-y-2">
                <div className="border border-[#EFE8DD] p-1.5 bg-[#F9F7F3] overflow-hidden">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 text-left">
                      <div className="text-white">
                        <p className="font-serif text-lg font-light">{card.title}</p>
                        <p className="text-[10px] tracking-widest uppercase text-[#E8D4B8]">{card.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Studio Philosophy Text matching reference image paragraph */}
        <div className="max-w-2xl mx-auto space-y-4 mb-12 text-[#444444] text-[13px] md:text-[14px] leading-relaxed font-light">
          <p>
            Our award-winning team captures the essence of your love story with precision and creativity, 
            using state-of-the-art equipment to ensure every moment is immortalized in stunning detail.
          </p>
          <p>
            From personalized consultations to custom-tailored packages, we provide a seamless, 
            luxurious experience that transforms your special day into a visual masterpiece, 
            <strong className="font-semibold text-[#1A1A1A]"> preserving your most cherished memories with sophistication and heart.</strong>
          </p>
        </div>

        {/* Investment Link Button matching screenshot */}
        <a
          href="#investment"
          className="inline-flex items-center gap-2 text-[11px] md:text-[12px] tracking-[0.35em] uppercase font-medium text-[#1A1A1A] hover:text-[#C5A880] pb-1 border-b border-[#1A1A1A] hover:border-[#C5A880] transition-colors"
        >
          <span>THE INVESTMENT</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>

      </div>
    </section>
  );
}
