import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen } from 'lucide-react';
import CustomAlbumUploadModal from './CustomAlbumUploadModal';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import heroDesktop from '../assets/hero_flatlay_desktop.jpg';
import heroMobile from '../assets/hero_flatlay_mobile.jpg';
import showcasePhotoLogoExact from '../assets/showcase_photo_logo_exact.png';
import showcaseColorLabLogoExact from '../assets/showcase_colorlab_logo_exact.png';
import showcaseEventsLogoExact from '../assets/showcase_events_logo_exact.png';
import heroApertureSquare from '../assets/hero_aperture_lens_square.jpg';
import cardAlbumReal from '../assets/card_album_photobook_real.jpg';
import cardStageReal from '../assets/card_event_stage_real.jpg';

const SERVICES = [
  {
    id: 'photography',
    route: 'media',
    title: 'FOTOGRAPHY',
    showTitleText: true,
    accentColor: '#D32F2F', // Vibrant Red Accent
    logoSrc: showcasePhotoLogoExact,
    cardImage: heroApertureSquare,
    cardAlt: 'DSLR Multi-Blade Aperture Lens',
    description: 'Capturing emotions, moments and stories that last forever.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'colorlab',
    route: 'colorlab',
    title: 'COLOUR LAB',
    showTitleText: false, // Avoid redundant 'Colour Lab' font text below logo
    accentColor: '#1E88E5', // Royal Blue Accent
    logoSrc: showcaseColorLabLogoExact,
    cardImage: cardAlbumReal,
    cardAlt: 'High-Clarity Luxury Wedding Layflat Photobook Album',
    description: 'Bringing your memories to life with perfect colours.',
    buttonText: 'EXPLORE',
  },
  {
    id: 'events',
    route: 'events',
    title: 'EVENTS',
    showTitleText: true,
    accentColor: '#D32F2F', // Vibrant Red Accent
    logoSrc: showcaseEventsLogoExact,
    cardImage: cardStageReal,
    cardAlt: 'High-Clarity Grand Wedding Stage & Mandap Decor',
    description: 'Planning and executing events that leave a lasting impression.',
    buttonText: 'EXPLORE',
  }
];

export default function Hero({ onOpenPage }) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [flipbookImages, setFlipbookImages] = useState(null);
  const [flipbookSize, setFlipbookSize] = useState('12x36');

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
      className="relative w-full min-h-[100svh] md:h-[100svh] md:max-h-[100svh] overflow-y-auto md:overflow-hidden flex flex-col justify-between bg-[#07090D] text-white pt-20 sm:pt-22 pb-4 sm:pb-5 lg:pb-6 px-3 sm:px-8 lg:px-12 select-none"
      style={{ minHeight: 'var(--app-height, 100vh)' }}
    >
      {/* Semantic H1 for Search Engine Indexing */}
      <h1 className="sr-only">
        KPR Productions - Luxury Wedding Photography, Fine Art Storytelling, Digital Color Lab Photobooks & Live Stage Event Production
      </h1>

      {/* ── 1. Desktop Background Image (For Laptops & Desktops Only) ── */}
      <img
        src={heroDesktop}
        alt="KPR Productions Luxury Photography Flatlay Studio Scene with Cameras, Photo Album and Flora"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable="false"
      />

      {/* ── 1b. Mobile-Only Background Image (For Mobile Screens Only) ── */}
      <img
        src={heroMobile}
        alt="KPR Productions Luxury Photography Flatlay Studio Scene Mobile"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable="false"
      />

      {/* ── 2. Middle Section: Luxury 3D Printed Album Feature (Laptop & Mobile) ── */}
      <div className="w-full flex-1 flex flex-col items-center justify-center z-20 py-2 sm:py-4 pointer-events-auto max-w-4xl mx-auto">
        {/* Eyebrow Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-[#FAF7F2]/90 border border-[#D8CFC4] text-[#8C6D3F] text-[9.5px] sm:text-[11px] font-bold tracking-widest uppercase shadow-xs mb-1.5 sm:mb-2"
        >
          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C6D3F]" />
          <span>YOUR MEMORIES • YOUR ALBUM</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="font-serif text-lg sm:text-2xl md:text-3xl lg:text-[32px] font-normal text-[#1A1A1A] tracking-tight text-center leading-tight max-w-2xl px-2 mb-1"
        >
          Turn your memories into a beautiful printed album.
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-[10px] sm:text-xs md:text-sm text-[#555555] font-light text-center tracking-normal px-4 mb-2 sm:mb-3"
        >
          Upload your photos • Preview your album • Print & preserve your memories
        </motion.p>

        {/* 3D Open Photobook Album with 'Swipe to explore' annotation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative flex items-center justify-center w-full my-1 sm:my-2"
        >
          {/* Left 'Swipe to explore' handwritten callout */}
          <div className="absolute left-1 sm:left-4 md:left-8 lg:left-14 top-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
            <img
              src="/images/swipe_to_explore.png"
              alt="Swipe to explore"
              className="w-14 sm:w-18 md:w-22 h-auto object-contain drop-shadow-xs -rotate-2"
              draggable="false"
            />
          </div>

          {/* Clickable Open 3D Album Mockup */}
          <div
            onClick={() => setUploadModalOpen(true)}
            className="relative group cursor-pointer transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98]"
            title="Click to preview and explore your custom album"
          >
            <img
              src="/images/hero_open_album.png"
              alt="Turn your memories into a luxury printed photobook album"
              className="w-[270px] sm:w-[340px] md:w-[410px] lg:w-[450px] max-w-[84vw] h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.22)] group-hover:drop-shadow-[0_26px_45px_rgba(0,0,0,0.32)] transition-all duration-300"
              draggable="false"
            />
          </div>
        </motion.div>

        {/* Action Button: EXPLORE YOUR ALBUM */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex justify-center mt-2 sm:mt-3"
        >
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="group inline-flex items-center gap-2.5 sm:gap-3 px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-[#141414] hover:bg-[#000000] text-white border border-white/20 hover:border-[#C5A880] shadow-[0_8px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_28px_rgba(197,168,128,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:text-[#C5A880] transition-colors" />
            <span className="text-[10.5px] sm:text-xs font-bold tracking-[0.16em] uppercase font-sans">
              EXPLORE YOUR ALBUM
            </span>
            <span className="text-white group-hover:text-[#C5A880] text-sm transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </motion.div>
      </div>

      {/* ── 3. Unified 3-Column Services Showcase Cards (All 3 side-by-side on Mobile & Desktop) ── */}
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-5 lg:gap-6 z-10 mb-2 sm:mb-3 py-1 px-0.5 sm:px-1">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="group relative bg-[#FAF7F2]/95 hover:bg-[#FFFFFF] backdrop-blur-xl border border-[#D8CFC4]/90 hover:border-[#1A1A1A]/60 rounded-xl sm:rounded-2xl md:rounded-[24px] p-1.5 sm:p-4 md:p-5 lg:p-6 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)] shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
            >
              {/* Card hover background subtle glow */}
              <div
                className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04)_0%,transparent_70%)]"
              />

              {/* 1. Official Logo Badge Asset (Crystal Clear) */}
              <div className="h-9 sm:h-14 md:h-20 w-full flex items-center justify-center mb-0.5">
                <img
                  src={service.logoSrc}
                  alt={service.title}
                  className="max-h-9 sm:max-h-14 md:max-h-20 w-auto max-w-[92%] sm:max-w-[85%] object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300 select-none"
                  loading="eager"
                />
              </div>

              {/* 2. Title Text */}
              {service.showTitleText ? (
                <h3 className="text-[9px] sm:text-sm md:text-lg lg:text-xl font-black tracking-wide sm:tracking-wider text-[#1A1A1A] uppercase font-sans mt-0.5 sm:mt-1 truncate max-w-full">
                  {service.title}
                </h3>
              ) : (
                <div className="h-1 sm:h-2 md:h-3" />
              )}

              {/* 3. Color Divider Underline */}
              <div
                className="w-5 sm:w-8 md:w-12 h-[2px] sm:h-[2.5px] rounded-full my-1 sm:my-2 transition-all duration-300 group-hover:w-14"
                style={{ backgroundColor: service.accentColor }}
              />

              {/* 4. Readable Charcoal Description (Desktop / Tablet view) */}
              <p className="hidden sm:block text-[10px] sm:text-xs text-[#555555] font-medium leading-snug sm:leading-relaxed mb-1.5 sm:mb-2 px-1 max-w-[240px]">
                {service.description}
              </p>

              {/* 5. Supporting Visual Asset (High Clarity Full Frame Display) */}
              <div className="w-full h-11 sm:h-20 md:h-26 lg:h-32 flex items-center justify-center my-1 relative overflow-hidden rounded-lg sm:rounded-xl border border-black/10 shadow-[0_4px_14px_rgba(0,0,0,0.12)] bg-white">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  loading="eager"
                />
              </div>

              {/* 6. "EXPLORE >" Luxury Outline Button */}
              <div className="w-full pt-1 sm:pt-2.5">
                <div className="w-full py-1 sm:py-1.5 md:py-2 px-1 sm:px-3 md:px-4 rounded-md sm:rounded-lg border border-[#1A1A1A]/30 group-hover:border-[#1A1A1A] group-hover:bg-[#1A1A1A] text-[#1A1A1A] group-hover:text-white font-bold text-[8px] sm:text-[10px] md:text-xs tracking-wider uppercase flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 shadow-xs">
                  <span>EXPLORE</span>
                  <span className="text-[10px] sm:text-xs md:text-sm leading-none transition-transform duration-300 group-hover:translate-x-0.5 font-bold">›</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Upload Photos & Size Selection Modal */}
      <CustomAlbumUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onLaunchFlipbook={(photos, size) => {
          setFlipbookImages(photos);
          setFlipbookSize(size);
        }}
      />

      {/* 3D Realistic Album Flipbook Viewer */}
      {flipbookImages && (
        <AlbumFlipbookViewer
          images={flipbookImages}
          size={flipbookSize}
          title="Custom Wedding Album"
          onClose={() => setFlipbookImages(null)}
        />
      )}
    </section>
  );
}

