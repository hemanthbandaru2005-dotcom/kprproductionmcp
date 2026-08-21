import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, BookOpen, Sparkles } from 'lucide-react';
import kprLogo from '../assets/kpr_logo.png';
import kprColorLabLogo from '../assets/kpr_colorlab_logo.png';
import kprEventsLogo from '../assets/kpr_events_logo.png';
import cardAperture from '../assets/card_aperture.jpg';
import cardAlbum from '../assets/card_album.jpg';
import cardEvent from '../assets/card_event.jpg';

const SERVICES = [
  {
    id: 'photography',
    route: 'media',
    title: 'PHOTOGRAPHY',
    accentColor: '#EF4444', // Red
    logoSrc: kprLogo,
    invertLogo: false,
    cardImage: cardAperture,
    cardAlt: 'DSLR Multi-Blade Aperture Lens',
    description: 'Fine art wedding, portrait & cinematic celebration photography.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'colorlab',
    route: 'colorlab',
    title: 'COLOUR LAB',
    accentColor: '#EF4444', // Consistent with Photography
    logoSrc: kprColorLabLogo,
    invertLogo: true,
    cardImage: cardAlbum,
    cardAlt: 'Luxury Layflat Telugu Wedding Album',
    description: 'Master printing, luxury photobooks & acrylic mandap laser craft.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'events',
    route: 'events',
    title: 'EVENTS',
    accentColor: '#EF4444', // Consistent with Photography
    logoSrc: kprEventsLogo,
    invertLogo: true,
    cardImage: cardEvent,
    cardAlt: 'Royal Wedding Mandap & Stage Decor',
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
                className="group relative bg-[#12192A] border border-white/[0.08] hover:border-white/30 rounded-[16px] p-8 sm:p-10 flex flex-col items-center text-center justify-between transition-all duration-400 cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(0,0,0,0.6)] shadow-xl"
              >
                {/* Subtle card corner glow on hover */}
                <div
                  className="absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12)_0%,transparent_70%)]"
                />

                {/* 1. Official Logo Badge Asset */}
                <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-full border-2 border-white/80 flex items-center justify-center mb-6 shadow-xl bg-black/60 group-hover:scale-105 transition-transform duration-300 overflow-hidden p-3.5">
                  <img
                    src={service.logoSrc}
                    alt={service.title}
                    className={`w-full h-full object-contain relative z-10 ${
                      service.invertLogo
                        ? 'brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                        : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                    }`}
                    loading="eager"
                  />
                </div>

                {/* 2. Bold Uppercase Title */}
                <h3 className="text-2xl sm:text-[26px] font-extrabold tracking-widest text-white uppercase font-sans mb-3">
                  {service.title}
                </h3>

                {/* 3. Short Horizontal Accent Underline */}
                <div
                  className="w-10 h-[2.5px] rounded-full mb-4 transition-all duration-300 group-hover:w-16"
                  style={{ backgroundColor: service.accentColor }}
                />

                {/* 4. One-Line Description */}
                <p className="text-[15px] sm:text-[16px] text-[#A0A5B0] font-normal leading-relaxed mb-6 max-w-[280px]">
                  {service.description}
                </p>

                {/* 5. Fixed-Size Real Supporting Visual Image */}
                <div className="w-full h-32 my-2 relative overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-inner">
                  <img
                    src={service.cardImage}
                    alt={service.cardAlt}
                    className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 select-none"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                </div>

                {/* 6. "EXPLORE →" Button */}
                <div className="w-full pt-6">
                  <div className="w-full py-3 px-6 rounded-full border border-white/80 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group-hover:bg-white group-hover:text-[#0D1420] shadow-md">
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
