import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Camera, Clock, Heart,
  Printer, CheckCircle2
} from 'lucide-react';
import founderPortrait from '../assets/founder_portrait.jpg';

const STATS = [
  {
    number: '20+',
    label: 'Years Experience',
    sublabel: 'Founded in 2007',
    icon: Clock,
  },
  {
    number: '2000+',
    label: 'Weddings',
    sublabel: 'Documented with Soul',
    icon: Heart,
  },
  {
    number: '2500+',
    label: 'Corporate Shoots',
    sublabel: 'Commercial & Brand Shoots',
    icon: Camera,
  },
  {
    number: '5+',
    label: 'Printing Media',
    sublabel: 'Archival Lab Technologies',
    icon: Printer,
  },
];

export default function AboutSection() {
  return (
    <div id="about" className="w-full bg-[#F7F3EE] transition-all duration-300">
      <div className="w-full bg-white border-b border-[#E2D9CC] overflow-hidden transition-all duration-500">
        
        {/* 1. Header Banner Bar */}
        <div className="w-full bg-[#1A1A1A] text-white p-8 sm:p-14 md:p-16 flex flex-col items-center justify-center relative border-b border-black text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.12)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#C5A880]/40 text-[#E8D4B8] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>ESTABLISHED IN 2007 • 20 YEARS OF EXCELLENCE</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-light tracking-wide max-w-3xl">
            About KPR Productions
          </h1>

          <div className="w-20 h-0.5 bg-[#C5A880] mx-auto my-4" />

          <p className="text-xs sm:text-sm md:text-base text-white/70 font-light max-w-2xl leading-relaxed">
            From intimate rituals to majestic celebrations, we bring together two decades of visual mastery, fine-art printing, and grand event production under one roof.
          </p>
        </div>

        {/* 2. Main Story & Founder Section */}
        <div className="p-6 sm:p-12 lg:p-16 bg-[#FAF8F5] border-b border-[#E2D9CC] w-full">
          <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Left: Founder Portrait with Luxury Frame */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 flex flex-col items-center"
            >
              <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-[#151515] group">
                <img
                  src={founderPortrait}
                  alt="Founder & Creative Director - KPR Productions"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 select-none"
                />
                
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                {/* Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-3 sm:p-4 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-medium text-[#E8D4B8]">
                        Founder & Creative Director
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-white/70 tracking-wider uppercase font-light">
                        KPR Productions • Est. 2007
                      </p>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-[#C5A880] text-black font-bold text-[11px] uppercase tracking-widest">
                      20+ YRS
                    </div>
                  </div>
                </div>

                {/* Corner accent */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#C5A880]/80 pointer-events-none" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#C5A880]/80 pointer-events-none" />
              </div>
            </motion.div>

            {/* Right: The KPR Brand Story (Concise & Compact) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:col-span-7 space-y-5 text-[#1A1A1A]"
            >
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#C5A880] block">
                  THE JOURNEY BEHIND THE LENS
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1A1A1A] font-light leading-tight">
                  Crafting Timeless Legacies Since 2007
                </h2>
              </div>

              <div className="space-y-3 text-xs sm:text-[13px] text-[#555555] font-light leading-relaxed">
                <p>
                  Started in <strong className="text-[#1A1A1A] font-semibold">2007</strong> with over <strong className="text-[#1A1A1A] font-semibold">20+ years of mastery</strong>, <strong className="text-[#1A1A1A] font-semibold">KPR Productions</strong> is South India's premier integrated creative house dedicated to immortalizing sacred milestones.
                </p>
                
                <p>
                  With <strong className="text-[#1A1A1A] font-semibold">2,000+ weddings</strong> and <strong className="text-[#1A1A1A] font-semibold">2,500+ corporate shoots</strong> delivered, we seamlessly unite fine art photography with our in-house <strong className="text-[#1A1A1A] font-semibold">Master Colour Lab</strong> and grand event production.
                </p>
              </div>

              {/* Key Bullet Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-medium text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span>20+ Years Dedicated Mastery</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span>2,000+ Royal Telugu Weddings</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span>2,500+ Corporate Shoot Projects</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#333333]">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                  <span>In-House Master Colour Lab</span>
                </div>
              </div>

            </motion.div>

          </div>
        </div>

        {/* 3. Milestone Numbers Banner (4 Core Stats) */}
        <div className="p-6 sm:p-12 lg:p-16 bg-white w-full">
          <div className="w-full max-w-[1920px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                PROVEN TRACK RECORD
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">
                Two Decades in Numbers
              </h3>
              <div className="w-12 h-0.5 bg-[#C5A880] mx-auto mt-2" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-[#FAF8F5] border border-[#E2D9CC] rounded-xl p-5 sm:p-6 text-center hover:border-[#C5A880] hover:shadow-lg transition-all duration-300 group flex flex-col items-center justify-between"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-[#E8D4B8] flex items-center justify-center mb-3 group-hover:bg-[#C5A880] group-hover:text-black transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] font-semibold group-hover:text-[#C5A880] transition-colors">
                      {stat.number}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mt-1">
                      {stat.label}
                    </p>
                    <p className="text-[10.5px] text-[#777777] font-light mt-0.5">
                      {stat.sublabel}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
