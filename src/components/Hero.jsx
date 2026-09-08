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
      className="relative w-full min-h-[100svh] md:h-[100svh] md:max-h-[100svh] overflow-y-auto md:overflow-hidden flex flex-col justify-between bg-[#07090D] text-white pt-13 xs:pt-14 sm:pt-16 md:pt-18 pb-2 sm:pb-3 md:pb-3 px-2 sm:px-5 lg:px-8 select-none"
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
      <div className="w-full flex-1 flex flex-col items-center justify-center z-20 py-0.5 sm:py-1.5 pointer-events-auto max-w-4xl mx-auto">
        {/* Text Block: Moved down slightly on mobile view ONLY (sm:mt-0 leaves laptop view completely undisturbed) */}
        <div className="flex flex-col items-center text-center mt-3 xs:mt-4 sm:mt-0 mb-0.5 sm:mb-1">
          {/* Eyebrow Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-0.5 rounded-full bg-[#FAF7F2]/90 border border-[#D8CFC4] text-[#8C6D3F] text-[7.5px] xs:text-[8.5px] sm:text-[10px] font-bold tracking-widest uppercase shadow-xs mb-1 sm:mb-1.5"
          >
            <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8C6D3F]" />
            <span>YOUR MEMORIES • YOUR ALBUM</span>
          </motion.div>

          {/* Heading: Compact & constrained on mobile so it stays in cream center and never overlaps lens/frame */}
          <motion.h2
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-serif text-[12px] xs:text-[13.5px] sm:text-xl md:text-2xl lg:text-[26px] font-normal text-[#1A1A1A] tracking-tight text-center leading-snug sm:leading-tight max-w-[210px] xs:max-w-[245px] sm:max-w-xl md:max-w-3xl px-1 sm:px-2 mb-0.5 whitespace-normal md:whitespace-nowrap"
          >
            Turn your memories into a beautiful printed album.
          </motion.h2>

          {/* Subtitle: Compact on mobile */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-[8px] xs:text-[9px] sm:text-[11px] md:text-xs text-[#555555] font-light text-center tracking-normal max-w-[210px] xs:max-w-[245px] sm:max-w-2xl px-1 sm:px-4 mb-1 sm:mb-1.5 leading-tight"
          >
            Upload your photos • Preview your album • Print & preserve your memories
          </motion.p>
        </div>

        {/* 3D Open Photobook Album with 'Swipe to explore' annotation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="relative flex items-center justify-center w-full my-0.5 sm:my-1"
        >
          {/* Left 'Swipe to explore' handwritten callout */}
          <div className="absolute left-0 xs:left-1 sm:left-2 md:left-6 lg:left-10 top-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
            <img
              src="/images/swipe_to_explore.png"
              alt="Swipe to explore"
              className="w-10 xs:w-12 sm:w-16 md:w-20 h-auto object-contain drop-shadow-xs -rotate-2"
              draggable="false"
            />
          </div>

          {/* Clickable Open 3D Album Mockup */}
          <div
            onClick={() => setUploadModalOpen(true)}
            className="relative group cursor-pointer transition-transform duration-400 hover:scale-[1.03] active:scale-[0.98]"
            title="Click to preview and explore your custom album"
          >
            <img
              src="/images/hero_open_album.png"
              alt="Turn your memories into a luxury printed photobook album"
              className="w-[190px] xs:w-[220px] sm:w-[260px] md:w-[310px] lg:w-[340px] max-h-[135px] xs:max-h-[155px] sm:max-h-[185px] md:max-h-[200px] max-w-[85vw] h-auto object-contain select-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.22)] group-hover:drop-shadow-[0_22px_38px_rgba(0,0,0,0.3)] transition-all duration-300"
              draggable="false"
            />
          </div>
        </motion.div>

        {/* Action Button: EXPLORE YOUR ALBUM */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex justify-center mt-1 sm:mt-1.5"
        >
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="group inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 px-3.5 xs:px-4 sm:px-6 py-1 xs:py-1.5 sm:py-2 rounded-full bg-[#141414] hover:bg-[#000000] text-white border border-white/20 hover:border-[#C5A880] shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_24px_rgba(197,168,128,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <BookOpen className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-white group-hover:text-[#C5A880] transition-colors" />
            <span className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-bold tracking-[0.16em] uppercase font-sans">
              EXPLORE YOUR ALBUM
            </span>
            <span className="text-white group-hover:text-[#C5A880] text-xs sm:text-sm transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </motion.div>
      </div>

      {/* ── 3. Unified 3-Column Services Showcase Cards (With Bigger Visual Images) ── */}
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 z-10 mb-1 sm:mb-2 py-0 px-0.5 sm:px-1">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="group relative bg-[#FAF7F2]/95 hover:bg-[#FFFFFF] backdrop-blur-xl border border-[#D8CFC4]/90 hover:border-[#1A1A1A]/60 rounded-xl sm:rounded-2xl p-1.5 xs:p-2 sm:p-2.5 md:p-3 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
            >
              {/* Card hover background subtle glow */}
              <div
                className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04)_0%,transparent_70%)]"
              />

              {/* 1. Official Logo Badge Asset */}
              <div className="h-7 xs:h-8 sm:h-9 md:h-11 w-full flex items-center justify-center mb-0.5">
                <img
                  src={service.logoSrc}
                  alt={service.title}
                  className="max-h-7 xs:max-h-8 sm:max-h-9 md:max-h-11 w-auto max-w-[90%] sm:max-w-[85%] object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300 select-none"
                  loading="eager"
                />
              </div>

              {/* 2. Title Text */}
              {service.showTitleText ? (
                <h3 className="text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-sm lg:text-base font-black tracking-wide text-[#1A1A1A] uppercase font-sans mt-0.5 truncate max-w-full">
                  {service.title}
                </h3>
              ) : (
                <div className="h-0.5 sm:h-1" />
              )}

              {/* 3. Color Divider Underline */}
              <div
                className="w-4 sm:w-6 md:w-8 h-[2px] rounded-full my-0.5 sm:my-1 transition-all duration-300 group-hover:w-10"
                style={{ backgroundColor: service.accentColor }}
              />

              {/* 4. Supporting Visual Asset (Significantly Bigger, High Clarity Display) */}
              <div className="w-full h-11 xs:h-13 sm:h-16 md:h-20 lg:h-22 flex items-center justify-center my-0.5 sm:my-1 relative overflow-hidden rounded-md sm:rounded-lg border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.1)] bg-white">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  loading="eager"
                />
              </div>

              {/* 5. "EXPLORE >" Luxury Outline Button */}
              <div className="w-full pt-0.5 sm:pt-1.5">
                <div className="w-full py-0.5 xs:py-1 sm:py-1 md:py-1.5 px-1 sm:px-2 rounded sm:rounded-md border border-[#1A1A1A]/30 group-hover:border-[#1A1A1A] group-hover:bg-[#1A1A1A] text-[#1A1A1A] group-hover:text-white font-bold text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] md:text-[10.5px] tracking-wider uppercase flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-300 shadow-xs">
                  <span>EXPLORE</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs leading-none transition-transform duration-300 group-hover:translate-x-0.5 font-bold">›</span>
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

