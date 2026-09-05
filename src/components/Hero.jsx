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
      className="relative w-full h-[100svh] min-h-[100svh] max-h-[100svh] overflow-hidden flex flex-col justify-between bg-[#07090D] text-white pt-16 sm:pt-20 pb-3 sm:pb-5 lg:pb-6 px-3 sm:px-8 lg:px-12 select-none"
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
      <div className="w-full flex-1 flex items-center justify-center z-20 py-2 sm:py-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border-2 border-[#C5A880] shadow-[0_8px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(197,168,128,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          title="Upload Your Album"
        >
          <div className="w-5 h-5 rounded-full bg-[#C5A880]/30 flex items-center justify-center text-[#C5A880] group-hover:scale-110 transition-transform">
            <Upload className="w-3 h-3 text-[#E8D4B8]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase font-sans text-[#FAF7F2]">
            Upload Your Album
          </span>
          <span className="text-[#C5A880] text-sm font-bold transition-transform duration-300 group-hover:translate-x-0.5 leading-none">
            ›
          </span>
        </button>
      </div>

      {/* ── 3. Responsive 3-Column Services Showcase Cards (Harmonious Light Glassmorphism Matching Flatlay) ── */}
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-3 sm:gap-5 lg:gap-6 z-10 mb-1 sm:mb-2 py-1 px-1 scrollbar-none">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="min-w-[72vw] sm:min-w-[280px] md:min-w-0 snap-center shrink-0 md:shrink group relative bg-[#FAF7F2]/95 hover:bg-[#FFFFFF] backdrop-blur-xl border border-[#D8CFC4]/90 hover:border-[#1A1A1A]/60 rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Card hover background subtle glow */}
              <div
                className="absolute inset-0 rounded-[20px] sm:rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04)_0%,transparent_70%)]"
              />

              {/* 1. Official Logo Badge Asset (Crystal Clear) */}
              <div className="h-16 sm:h-22 w-full flex items-center justify-center mb-0.5">
                <img
                  src={service.logoSrc}
                  alt={service.title}
                  className="max-h-16 sm:max-h-22 w-auto max-w-[85%] object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300 select-none"
                  loading="eager"
                />
              </div>

              {/* 2. Title Text (Conditionally rendered to avoid redundancy on Colour Lab) */}
              {service.showTitleText ? (
                <h3 className="text-sm sm:text-lg lg:text-xl font-black tracking-wider text-[#1A1A1A] uppercase font-sans mt-0.5 sm:mt-1">
                  {service.title}
                </h3>
              ) : (
                <div className="h-2 sm:h-3" />
              )}

              {/* 3. Color Divider Underline */}
              <div
                className="w-8 sm:w-12 h-[2.5px] rounded-full my-1.5 sm:my-2.5 transition-all duration-300 group-hover:w-16"
                style={{ backgroundColor: service.accentColor }}
              />

              {/* 4. Readable Charcoal Description */}
              <p className="text-[10.5px] sm:text-xs text-[#555555] font-medium leading-snug sm:leading-relaxed mb-2 sm:mb-3 px-1 max-w-[240px]">
                {service.description}
              </p>

              {/* 5. Supporting Visual Asset (High Clarity Full Frame Display) */}
              <div className="w-full h-22 sm:h-28 lg:h-32 flex items-center justify-center my-1 relative overflow-hidden rounded-xl border border-black/10 shadow-[0_8px_20px_rgba(0,0,0,0.16)] bg-white">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  loading="eager"
                />
              </div>

              {/* 6. "EXPLORE >" Luxury Outline Button */}
              <div className="w-full pt-2.5 sm:pt-3.5">
                <div className="w-full py-1.5 sm:py-2 px-4 rounded-lg border border-[#1A1A1A]/30 group-hover:border-[#1A1A1A] group-hover:bg-[#1A1A1A] text-[#1A1A1A] group-hover:text-white font-bold text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm">
                  <span>EXPLORE</span>
                  <span className="text-xs sm:text-sm leading-none transition-transform duration-300 group-hover:translate-x-1 font-bold">›</span>
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

