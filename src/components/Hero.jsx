import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, BookOpen, Sparkles } from 'lucide-react';
import heroBanner from '../assets/hero_kpr_banner.jpg';
import heroMobileBanner from '../assets/hero_kpr_mobile_banner.jpg';
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

export default function Hero({ onOpenPage }) {
  const handleCardClick = (route) => {
    if (typeof onOpenPage === 'function') {
      onOpenPage(route);
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
      id="hero"
      className="relative w-full h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden flex flex-col justify-end bg-[#07090D] text-white pb-3 sm:pb-4 lg:pb-5 px-4 sm:px-8 lg:px-12 select-none"
    >
      {/* ── 1. Desktop Background Image (For Laptops & Desktops Only) ── */}
      <img
        src={heroBanner}
        alt="KPR Productions"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        draggable="false"
      />

      {/* ── 1b. Mobile-Only Background Image (For Mobile Screens Only) ── */}
      <img
        src={heroMobileBanner}
        alt="KPR Productions Mobile"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        draggable="false"
      />

      {/* ── 2. Responsive 3-Column Services Showcase Cards (Compact Swipeable Carousel on Mobile, 3-Col on Desktop) ── */}
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-2.5 sm:gap-4 lg:gap-5 z-10 mb-1 sm:mb-2 py-1 px-1 scrollbar-none">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="min-w-[68vw] sm:min-w-[280px] md:min-w-0 snap-center shrink-0 md:shrink group relative bg-[#12192A]/90 hover:bg-[#12192A] backdrop-blur-md border border-white/[0.08] hover:border-white/35 rounded-[14px] sm:rounded-[16px] p-2.5 sm:p-4 lg:p-5 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_15px_35px_rgba(0,0,0,0.7)] shadow-xl"
            >
              {/* Card hover background glow */}
              <div
                className="absolute inset-0 rounded-[14px] sm:rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.15)_0%,transparent_70%)]"
              />

              {/* 1. Official Logo Badge Asset */}
              <div className="relative w-11 h-11 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border border-white/70 sm:border-2 sm:border-white/80 flex items-center justify-center mb-1 sm:mb-2 shadow-xl bg-black/60 group-hover:scale-105 transition-transform duration-300 overflow-hidden p-1.5 sm:p-2.5">
                <img
                  src={service.logoSrc}
                  alt={service.title}
                  className={`w-full h-full object-contain relative z-10 ${
                    service.invertLogo
                      ? 'brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                      : 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
                  }`}
                  loading="eager"
                />
              </div>

              {/* 2. Bold Uppercase Title */}
              <h3 className="text-xs sm:text-base lg:text-xl font-extrabold tracking-widest text-white uppercase font-sans mb-0.5 sm:mb-1">
                {service.title}
              </h3>

              {/* 3. Short Horizontal Accent Underline */}
              <div
                className="w-5 sm:w-8 h-[1.5px] sm:h-[2px] rounded-full mb-1 sm:mb-2 transition-all duration-300 group-hover:w-14"
                style={{ backgroundColor: service.accentColor }}
              />

              {/* 4. One-Line Description */}
              <p className="text-[9.5px] sm:text-xs text-[#A0A5B0] font-normal leading-tight sm:leading-relaxed mb-1 sm:mb-2.5 max-w-[200px] sm:max-w-[240px] line-clamp-1 sm:line-clamp-2">
                {service.description}
              </p>

              {/* 5. Fixed-Size Real Supporting Visual Image */}
              <div className="w-full h-14 sm:h-20 lg:h-24 my-0.5 relative overflow-hidden rounded-lg sm:rounded-xl bg-black/40 border border-white/10 shadow-inner">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-700 select-none"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              </div>

              {/* 6. "EXPLORE →" Button */}
              <div className="w-full pt-1 sm:pt-2">
                <div className="w-full py-1 sm:py-2 px-2.5 sm:px-3 rounded-full border border-white/80 text-white font-bold text-[9px] sm:text-[11px] uppercase tracking-widest flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300 group-hover:bg-white group-hover:text-[#0D1420] shadow-sm">
                  <span>{service.buttonText}</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile Swipe Hint */}
      <div className="flex md:hidden items-center justify-center gap-1.5 mb-1 z-10">
        <span className="text-[9px] uppercase tracking-widest text-white/60 font-medium">
          Swipe to Explore Disciplines ➔
        </span>
      </div>

      {/* ── 3. Bottom Minimal Footer Brand Label ── */}
      <div className="text-center shrink-0 text-[9px] sm:text-[10px] text-white/30 uppercase tracking-[0.25em] z-10">
        © KPR Productions • All Rights Reserved
      </div>
    </section>
  );
}
