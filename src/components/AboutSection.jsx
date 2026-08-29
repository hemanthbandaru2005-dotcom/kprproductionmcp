import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Award, Clock, Heart, Users } from 'lucide-react';
import kprLogo from '../assets/kpr_logo.png';
import kprProductionsLogo from '../assets/kpr_productions_logo.png';

export default function AboutSection() {
  return (
    <section id="about" className="w-full min-h-[75vh] bg-[#0D0B08] text-white py-16 sm:py-24 px-4 sm:px-8 lg:px-12 flex flex-col justify-center select-none">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Header Badge & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#C5A880]/30 text-[#E8D4B8] text-xs font-semibold uppercase tracking-[0.3em]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>KPR PRODUCTIONS</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-white font-light tracking-wide">
            About Us
          </h1>

          <div className="w-20 h-0.5 bg-[#C5A880] mx-auto my-3" />

          <p className="text-sm sm:text-base text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
            Preserving sacred celebrations, fine art cinematic storytelling, master colour lab printing, and royal event productions across generations.
          </p>
        </motion.div>

        {/* Clean Luxury Content Area (Ready for Information) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-[#14120E] border border-white/10 rounded-2xl p-8 sm:p-14 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Watermark */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 opacity-80 flex items-center justify-center">
            <img
              src={kprProductionsLogo}
              alt="KPR Productions"
              className="w-full h-full object-contain filter brightness-110 drop-shadow-md"
            />
          </div>

          <div className="space-y-4 max-w-xl mx-auto">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#E8D4B8] font-light">
              Our Story & Heritage
            </h3>
            <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
              Information and full studio story will be presented here.
            </p>
          </div>

          {/* Feature Highlights Placeholder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 pt-10 border-t border-white/10">
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <Camera className="w-6 h-6 text-[#C5A880] mx-auto" />
              <h4 className="text-xs uppercase font-bold tracking-widest text-white">Fine Art Photography</h4>
              <p className="text-[11px] text-white/40 font-light">Cinematic wedding coverage</p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <Award className="w-6 h-6 text-[#C5A880] mx-auto" />
              <h4 className="text-xs uppercase font-bold tracking-widest text-white">Master Colour Lab</h4>
              <p className="text-[11px] text-white/40 font-light">Museum-grade archival prints</p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <Sparkles className="w-6 h-6 text-[#C5A880] mx-auto" />
              <h4 className="text-xs uppercase font-bold tracking-widest text-white">Event Production</h4>
              <p className="text-[11px] text-white/40 font-light">Grand mandap & stage decor</p>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
