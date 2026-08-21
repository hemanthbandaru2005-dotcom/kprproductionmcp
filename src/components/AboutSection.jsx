import React from 'react';
import { Award, Camera, ShieldCheck, Heart } from 'lucide-react';

export default function AboutSection({ onOpenInquire }) {
  return (
    <section id="about" className="relative bg-[#121212] text-white overflow-hidden">
      
      {/* Banner Section matching bottom image in screenshot */}
      <div className="relative h-[450px] md:h-[550px] w-full flex items-center justify-center overflow-hidden">
        <img
          src="/images/bride_portrait.png"
          alt="We are known for our expertise"
          className="w-full h-full object-cover object-center scale-105 filter brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/50 to-black/60" />
        
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase text-[#C5A880] font-medium mb-3">
            WE ARE KNOWN FOR OUR
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-[0.18em] uppercase text-white font-extralight mb-6 leading-none">
            EXPERTISE & ELEGANCE
          </h2>
          <p className="text-[#E2D9CC] font-serif italic text-lg md:text-xl font-light">
            "We don't just take photographs; we compose heirlooms for generations to come."
          </p>
        </div>
      </div>

      {/* Photographer Profile & Studio Philosophy */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Bio Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#C5A880] font-medium block">
              BEHIND THE LENS
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-light leading-snug">
              Meet Leo Spin, Master Photographer
            </h3>
            <p className="text-white/80 text-[14px] leading-relaxed font-light">
              With over 12 years of capturing worldwide celebrations across Paris, Amalfi, New York, and Houston, 
              Leo Spin leads a studio built on discretion, artistic perfection, and genuine human connection.
            </p>
            <p className="text-white/70 text-[14px] leading-relaxed font-light">
              Combining classic medium format film aesthetic with state-of-the-art 100MP digital cinema cameras, 
              we curate moments of unscripted tenderness into iconic, editorial artwork.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <p className="font-serif text-3xl md:text-4xl text-[#C5A880]">350+</p>
                <p className="text-[10px] tracking-widest uppercase text-white/60 mt-1">Weddings Captured</p>
              </div>
              <div>
                <p className="font-serif text-3xl md:text-4xl text-[#C5A880]">18</p>
                <p className="text-[10px] tracking-widest uppercase text-white/60 mt-1">Countries Visited</p>
              </div>
              <div>
                <p className="font-serif text-3xl md:text-4xl text-[#C5A880]">100%</p>
                <p className="text-[10px] tracking-widest uppercase text-white/60 mt-1">Client Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Gear & Quality Highlights */}
          <div className="lg:col-span-5 bg-[#1E1E1E] p-8 border border-white/10 space-y-6">
            <h4 className="font-serif text-2xl text-[#C5A880]">The Studio Standard</h4>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#2A2A2A] text-[#C5A880] rounded">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white">State-of-the-Art Gear</h5>
                  <p className="text-xs text-white/60 mt-0.5">Dual-slot redundancy, Leica & Hasselblad 100MP optics.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#2A2A2A] text-[#C5A880] rounded">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white">Triple Cloud Backup</h5>
                  <p className="text-xs text-white/60 mt-0.5">Instant offsite and encrypted physical drive backups.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-[#2A2A2A] text-[#C5A880] rounded">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-white">Award-Winning Colorist</h5>
                  <p className="text-xs text-white/60 mt-0.5">Bespoke film emulation tones tailored to your skin tone.</p>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenInquire}
              className="w-full py-3 bg-[#C5A880] hover:bg-[#A4865E] text-white text-[11px] tracking-[0.25em] uppercase font-medium transition-colors text-center block mt-4"
            >
              SCHEDULE A CONSULTATION
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
