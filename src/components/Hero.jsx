import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Maximize2 } from 'lucide-react';
import CustomAlbumUploadModal from './CustomAlbumUploadModal';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import HeroInteractiveAlbum from './HeroInteractiveAlbum';
import heroDesktop from '../assets/hero_flatlay_desktop.jpg';
import heroMobile from '../assets/hero_flatlay_mobile.jpg';
import kprProductionsLogo from '../assets/kpr_productions_logo.png';
import showcasePhotoLogoExact from '../assets/showcase_photo_logo_exact.png';
import showcaseColorLabLogoExact from '../assets/showcase_colorlab_logo_exact.png';
import showcaseEventsLogoExact from '../assets/showcase_events_logo_exact.png';
import heroApertureSquare from '../assets/hero_aperture_lens_square.jpg';
import cardAlbumReal from '../assets/card_album_photobook_real.jpg';
import cardStageReal from '../assets/card_event_stage_real.jpg';

const HERO_SAMPLE_PHOTOS = [
  '/images/wedding/photo_1.jpg',
  '/images/wedding/photo_2.jpg',
  '/images/wedding/photo_3.jpg',
  '/images/wedding/photo_4.jpg',
  '/images/wedding/photo_5.jpg',
  '/images/wedding/photo_6.jpg',
  '/images/wedding/photo_7.jpg',
  '/images/wedding/photo_8.jpg',
  '/images/wedding/photo_9.jpg',
  '/images/wedding/photo_10.jpg',
  '/images/wedding/photo_11.jpg',
  '/images/wedding/photo_12.jpg',
  '/images/wedding/photo_13.jpg',
  '/images/wedding/photo_14.jpg',
  '/images/wedding/photo_15.jpg',
  '/images/wedding/photo_16.jpg',
  '/images/wedding/photo_17.jpg',
];

const SERVICES = [
  {
    id: 'photography',
    route: 'media',
    title: 'FOTOGRAPHY',
    showTitleText: true,
    logoSrc: showcasePhotoLogoExact,
    cardImage: heroApertureSquare,
    cardAlt: 'DSLR Multi-Blade Aperture Lens',
    buttonText: 'EXPLORE',
  },
  {
    id: 'colorlab',
    route: 'colorlab',
    title: 'Colour Lab',
    showTitleText: true,
    logoSrc: showcaseColorLabLogoExact,
    cardImage: cardAlbumReal,
    cardAlt: 'High-Clarity Luxury Wedding Layflat Photobook Album',
    buttonText: 'EXPLORE',
  },
  {
    id: 'events',
    route: 'events',
    title: 'EVENTS',
    showTitleText: true,
    logoSrc: showcaseEventsLogoExact,
    cardImage: cardStageReal,
    cardAlt: 'High-Clarity Grand Wedding Stage & Mandap Decor',
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
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-[#07090D] text-white pt-14 xs:pt-15 sm:pt-16 md:pt-18 pb-2 sm:pb-3 px-2 sm:px-5 lg:px-8 select-none"
      style={{ height: 'var(--app-height, 100vh)' }}
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

      {/* ── 2. Middle Section: Brand Centerpiece, Album Feature & Showcase ── */}
      <div className="w-full flex-1 flex flex-col items-center justify-between md:justify-center z-20 py-0.5 pointer-events-auto max-w-4xl mx-auto">
        {/* Center Logo & Tagline (Prominent & Enlarged on Mobile and Desktop) */}
        <div className="flex flex-col items-center text-center mt-1 sm:mt-1.5 mb-1 sm:mb-2">
          <motion.img
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            src={kprProductionsLogo}
            alt="KPR PRODUCTIONS"
            className="h-11 xs:h-13 sm:h-16 md:h-20 lg:h-24 w-auto object-contain select-none drop-shadow-xs"
            loading="eager"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="font-serif italic text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-[#1A1A1A] tracking-normal mt-0.5 sm:mt-1 flex items-center justify-center gap-1.5 sm:gap-2.5 select-none"
          >
            <span className="text-[#D32F2F] not-italic font-sans font-bold text-xs sm:text-base leading-none">—</span>
            <span>Turn Your Moments Into Memories</span>
            <span className="text-[#D32F2F] not-italic font-sans font-bold text-xs sm:text-base leading-none">—</span>
          </motion.p>
        </div>

        {/* Album + Buttons Block (Brought down near the service showcases on mobile) */}
        <div className="w-full flex flex-col items-center justify-center mt-auto md:mt-0 mb-1 sm:mb-2 translate-y-1.5 xs:translate-y-2.5 md:translate-y-0">
          {/* Interactive 3D Photobook Album */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="relative flex items-center justify-center w-full my-0.5"
          >
            <HeroInteractiveAlbum
              showFullscreenButton={false}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenFullscreen={() => {
                setFlipbookImages(HERO_SAMPLE_PHOTOS);
                setFlipbookSize('12x36');
              }}
            />
          </motion.div>

          {/* Action Buttons: Full View and PREVIEW (Side by side, close to showcase cards) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center justify-center gap-2 sm:gap-3 mt-1 sm:mt-1.5"
          >
            <button
              type="button"
              onClick={() => {
                setFlipbookImages(HERO_SAMPLE_PHOTOS);
                setFlipbookSize('12x36');
              }}
              className="group inline-flex items-center gap-1.5 px-3 xs:px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#181818] hover:bg-black text-[#F4ECD8] text-[8.5px] xs:text-[9.5px] sm:text-xs font-bold tracking-wider uppercase border border-[#C5A880]/60 hover:border-[#C5A880] shadow-[0_3px_10px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="Open in Full View 3D Photobook"
            >
              <Maximize2 className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover:scale-110 transition-transform" />
              <span>Full View</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="group inline-flex items-center gap-1.5 px-3.5 xs:px-4 sm:px-5 py-1 sm:py-1.5 rounded-full bg-[#1A1A1A] hover:bg-black text-white border-2 border-[#E5D7BE] hover:border-[#C5A880] shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="Preview Album"
            >
              <Eye className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-white group-hover:text-[#C5A880] transition-colors" />
              <span className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-bold tracking-[0.16em] uppercase font-sans">
                PREVIEW
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── 3. Unified 3-Column Services Showcase Cards (From Older Image) ── */}
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 z-10 mb-1 sm:mb-2 py-0 px-0.5 sm:px-1">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="group relative bg-white/95 hover:bg-white backdrop-blur-xl border border-[#E8E2D9] hover:border-[#1A1A1A]/40 rounded-xl sm:rounded-2xl p-1.5 xs:p-2 sm:p-2.5 md:p-3 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
            >
              {/* 1. Official Logo Badge Asset */}
              <div className="h-7 xs:h-8 sm:h-9 md:h-11 w-full flex items-center justify-center mb-0.5">
                <img
                  src={service.logoSrc}
                  alt={service.title}
                  className="max-h-7 xs:max-h-8 sm:max-h-9 md:max-h-11 w-auto max-w-[90%] sm:max-w-[85%] object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300 select-none"
                  loading="eager"
                />
              </div>

              {/* 2. Title Text (Preserving exact casing: "FOTOGRAPHY", "Colour Lab", "EVENTS") */}
              <h3 className="text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-sm lg:text-base font-bold tracking-wide text-[#1A1A1A] font-sans mt-0.5 truncate max-w-full">
                {service.title}
              </h3>

              {/* 3. Supporting Visual Asset */}
              <div className="w-full h-11 xs:h-13 sm:h-16 md:h-20 lg:h-22 flex items-center justify-center my-0.5 sm:my-1 relative overflow-hidden rounded-md sm:rounded-lg border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-white">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  loading="eager"
                />
              </div>

              {/* 4. "EXPLORE >" Link */}
              <div className="w-full pt-0.5 sm:pt-1 flex items-center justify-center">
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#1A1A1A] group-hover:text-[#D32F2F] uppercase flex items-center gap-0.5 transition-colors duration-300">
                  <span>EXPLORE</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs leading-none transition-transform duration-300 group-hover:translate-x-0.5 font-bold">&gt;</span>
                </span>
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

