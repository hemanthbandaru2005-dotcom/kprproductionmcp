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
      {/* ── 1. Desktop Background Image (For Laptops & Desktops Only) ── */}
      <img
        src={heroDesktop}
        alt="KPR Productions Studio Background"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        draggable="false"
      />

      {/* ── 1b. Mobile-Only Background Image (For Mobile Screens Only) ── */}
      <img
        src={heroMobile}
        alt="KPR Productions Studio Mobile Background"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        loading="eager"
        fetchPriority="high"
        draggable="false"
      />

      {/* ── 2. Middle Section: Small "Upload Your Album" Button (Yellow Mark Area) ── */}
      <div className="w-full flex-1 flex items-end justify-center z-20 pb-3 sm:pb-5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#FAF7F2]/95 hover:bg-[#FFFFFF] text-[#1A1A1A] border-2 border-[#D8CFC4] hover:border-[#C5A880] backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_28px_rgba(197,168,128,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          title="Upload Your Album"
        >
          <div className="w-5 h-5 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#9E784F] group-hover:scale-110 transition-transform">
            <Upload className="w-3 h-3 text-[#9E784F]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase font-sans text-[#1A1A1A]">
            Upload Your Album
          </span>
          <span className="text-[#C5A880] text-sm font-bold transition-transform duration-300 group-hover:translate-x-0.5 leading-none">
            ›
          </span>
        </button>
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

