import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import showcasePhotoLogoExact from '../assets/showcase_photo_logo_exact.png';
import showcaseColorLabLogoExact from '../assets/showcase_colorlab_logo_exact.png';
import showcaseEventsLogoExact from '../assets/showcase_events_logo_exact.png';
import cardApertureReal from '../assets/card_aperture_lens_real.jpg';
import cardAlbumReal from '../assets/card_album_photobook_real.jpg';
import cardStageReal from '../assets/card_event_stage_real.jpg';

const SERVICES = [
  {
    id: 'photography',
    route: 'media',
    title: 'PHOTOGRAPHY',
    accentColor: '#EF4444', // Red
    logoSrc: showcasePhotoLogoExact,
    cardImage: cardApertureReal,
    cardAlt: 'High-Clarity DSLR Lens & Professional Camera',
    description: 'Fine art wedding, portrait & cinematic celebration photography.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'colorlab',
    route: 'colorlab',
    title: 'COLOUR LAB',
    accentColor: '#3B82F6', // Blue Accent
    logoSrc: showcaseColorLabLogoExact,
    cardImage: cardAlbumReal,
    cardAlt: 'High-Clarity Luxury Layflat Telugu Wedding Photobook Album',
    description: 'Master printing, luxury photobooks & acrylic mandap laser craft.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'events',
    route: 'events',
    title: 'EVENTS',
    accentColor: '#EF4444', // Red Accent
    logoSrc: showcaseEventsLogoExact,
    cardImage: cardStageReal,
    cardAlt: 'High-Clarity Grand Wedding Mandap & Stage Production',
    description: 'Bespoke stage decor, mandap lighting & complete event production.',
    buttonText: 'EXPLORE',
  }
];

export default function ServicesShowcase({ onSelectPage }) {
  const handleCardClick = (route) => {
    if (typeof onSelectPage === 'function') {
      onSelectPage(route);
    } else if (typeof window !== 'undefined') {
      window.location.hash = `#${route}`;
      const elem = document.getElementById(route);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="services-showcase"
      className="relative w-full py-20 sm:py-28 bg-[#0D1420] text-white overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14 sm:mb-20 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>KPR PRODUCTIONS ECOSYSTEM</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans uppercase">
            OUR CORE DISCIPLINES
          </h2>
          <p className="text-sm sm:text-base text-[#A0A5B0] font-normal max-w-xl mx-auto">
            Three pillars of creative excellence dedicated to immortalizing your most sacred celebrations.
          </p>
        </motion.div>

        {/* 3-Column Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {SERVICES.map((service, index) => {
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.55, delay: index * 0.1, ease: 'easeOut' }}
                onClick={() => handleCardClick(service.route)}
                className="group relative bg-[#12192A] border border-white/[0.12] hover:border-white/40 rounded-[18px] p-6 sm:p-8 flex flex-col items-center text-center justify-between transition-all duration-400 cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] shadow-xl"
              >
                {/* Subtle card corner glow on hover */}
                <div
                  className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12)_0%,transparent_70%)]"
                />

                {/* 1. Official Logo Badge Asset (Original Crisp Colors) */}
                <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-2xl border border-white/20 flex items-center justify-center mb-5 shadow-xl bg-[#0B101B]/80 backdrop-blur-md group-hover:scale-105 transition-transform duration-300 overflow-hidden p-3">
                  <img
                    src={service.logoSrc}
                    alt={service.title}
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                    loading="eager"
                  />
                </div>

                {/* 2. Bold Uppercase Title */}
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-widest text-white uppercase font-sans mb-2">
                  {service.title}
                </h3>

                {/* 3. Short Horizontal Accent Underline */}
                <div
                  className="w-10 h-[2.5px] rounded-full mb-3.5 transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: service.accentColor }}
                />

                {/* 4. One-Line Description */}
                <p className="text-sm text-[#A0A5B0] font-normal leading-relaxed mb-5 max-w-[280px]">
                  {service.description}
                </p>

                {/* 5. High-Clarity Real Supporting Visual Image (Generous Aspect Ratio) */}
                <div className="w-full aspect-[16/10] my-2 relative overflow-hidden rounded-xl bg-black/60 border border-white/15 shadow-md">
                  <img
                    src={service.cardImage}
                    alt={service.cardAlt}
                    className="w-full h-full object-cover object-center transform group-hover:scale-106 transition-transform duration-700 select-none"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* 6. Outline Action Button */}
                <div className="w-full pt-4 mt-1">
                  <div className="w-full py-2.5 px-4 rounded-xl border border-white/20 group-hover:border-white group-hover:bg-white text-white group-hover:text-black font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-md">
                    <span>{service.buttonText}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
