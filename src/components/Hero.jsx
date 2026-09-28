import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Eye } from 'lucide-react';
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
import { FLEXY_PHOTO_URLS } from '../data/albumPhotosData';

const HERO_SAMPLE_PHOTOS = FLEXY_PHOTO_URLS;

const SERVICES = [
  {
    id: 'photography',
    route: 'media',
    title: 'FOTOGRAPHY',
    showTitleText: true,
    logoSrc: showcasePhotoLogoExact,
    cardImage: heroApertureSquare,
    cardAlt: 'Fine Art Wedding Photography & Cinematography Equipment - KPR Productions Warangal',
    buttonText: 'EXPLORE',
  },
  {
    id: 'colorlab',
    route: 'colorlab',
    title: 'Colour Lab',
    showTitleText: false,
    logoSrc: showcaseColorLabLogoExact,
    cardImage: cardAlbumReal,
    cardAlt: 'Master Layflat Wedding Photobook Album Printing - KPR Colour Lab Warangal',
    buttonText: 'EXPLORE',
  },
  {
    id: 'events',
    route: 'events',
    title: 'EVENTS',
    showTitleText: true,
    logoSrc: showcaseEventsLogoExact,
    cardImage: cardStageReal,
    cardAlt: 'Grand Stage Production, LED Video Walls & Truss Rigging - KPR Events Hanumakonda',
    buttonText: 'EXPLORE',
  }
];

export default function Hero({ onOpenPage }) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [flipbookImages, setFlipbookImages] = useState(null);
  const [flipbookSize, setFlipbookSize] = useState('12x36');
  const [flipbookCover, setFlipbookCover] = useState(null);
  const [flipbookBackCover, setFlipbookBackCover] = useState(null);

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
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between bg-white text-[#1A1A1A] pt-12 sm:pt-14 md:pt-16 pb-2 sm:pb-3 select-none"
      style={{ height: 'var(--app-height, 100vh)', backgroundColor: '#FFFFFF' }}
    >
      {/* Semantic H1 for Search Engine Indexing */}
      <h1 className="sr-only">
        Fine Art Wedding Photography in Warangal & Hanumakonda
      </h1>

      {/* ── 1. Desktop Background Composition with Stable Framing ── */}
      <div
        className="hidden md:block absolute inset-0 w-full h-full pointer-events-none select-none z-0 hero-bg-cover bg-white"
        style={{
          backgroundImage: `url(${heroDesktop})`,
          backgroundColor: '#FFFFFF',
        }}
        aria-hidden="true"
      />

      {/* ── 1b. Mobile-Only Background Image (For Mobile Screens Only) ── */}
      <img
        src={heroMobile}
        alt="KPR Productions Luxury Photography Flatlay Studio Scene Mobile"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0 bg-white"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', backgroundColor: '#FFFFFF' }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable="false"
      />

      {/* ── 2. Middle Section: Brand Centerpiece, Album Feature & Showcase ── */}
      <div className="w-full flex-1 flex flex-col items-center justify-center z-20 py-0.5 pointer-events-auto hero-responsive-container">
        {/* Center Logo & Tagline (Moved slightly upwards on laptop & desktop into open space below navbar) */}
        <div className="flex flex-col items-center text-center mt-0.5 sm:mt-1 mb-1 sm:mb-1.5 md:-mt-4 lg:-mt-6 xl:-mt-7 md:mb-1.5 lg:mb-2 relative z-30">
          <motion.img
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            src={kprProductionsLogo}
            alt="KPR PRODUCTIONS"
            className="h-10 xs:h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain select-none drop-shadow-xs"
            loading="eager"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="font-serif italic text-[11px] xs:text-xs sm:text-base md:text-lg lg:text-xl text-[#1A1A1A] tracking-normal mt-0.5 sm:mt-1 flex items-center justify-center gap-1.5 sm:gap-2.5 select-none relative z-30"
          >
            <span className="text-[#D32F2F] not-italic font-sans font-bold text-xs sm:text-base leading-none">—</span>
            <span>Turn Your Moments Into Memories</span>
            <span className="text-[#D32F2F] not-italic font-sans font-bold text-xs sm:text-base leading-none">—</span>
          </motion.p>
        </div>

        {/* Album + Buttons Block (Centered in the middle on mobile & laptop) */}
        <div className="w-full flex flex-col items-center justify-center my-0.5">
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
                setFlipbookCover('/images/album/front_cover.jpg');
                setFlipbookBackCover('/images/album/back_cover.jpg');
                setFlipbookSize('12x36');
              }}
            />
          </motion.div>

          {/* Action Buttons: PRINT YOUR ALBUMS and 3D VIEW */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col items-center justify-center gap-1 mt-1 sm:mt-1.5 md:mt-2"
          >
            <div className="flex items-center justify-center gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 flex-nowrap max-w-full px-2">
              <button
                type="button"
                onClick={() => handleCardClick('colorlab')}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3.5 xs:px-4 sm:px-6 md:px-7 py-1.5 sm:py-2 md:py-2.5 rounded-full bg-white/95 hover:bg-white text-[#1A1A1A] hover:text-black border-2 border-[#C5A880] hover:border-[#9E783D] shadow-[0_4px_14px_rgba(180,140,90,0.25)] hover:shadow-[0_6px_20px_rgba(197,168,128,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-sm whitespace-nowrap"
                title="Print Your Albums"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A47E43] group-hover:text-[#8D652B] transition-colors" />
                <span className="text-[8.5px] xs:text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.14em] uppercase font-sans">
                  PRINT YOUR ALBUMS
                </span>
              </button>

              {/* PREVIEW YOUR 3D ALBUM BUTTON */}
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3.5 xs:px-4 sm:px-6 md:px-7 py-1.5 sm:py-2 md:py-2.5 rounded-full bg-white/95 hover:bg-white text-[#1A1A1A] hover:text-black border-2 border-[#C5A880] hover:border-[#9E783D] shadow-[0_4px_14px_rgba(180,140,90,0.25)] hover:shadow-[0_6px_20px_rgba(197,168,128,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-sm whitespace-nowrap"
                title="Preview Your 3D Album"
                aria-label="Preview Your 3D Album"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A47E43] group-hover:text-[#8D652B] transition-colors" />
                <span className="text-[8.5px] xs:text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.14em] uppercase font-sans">
                  PREVIEW YOUR 3D ALBUM
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 3. Unified 3-Column Services Showcase Cards (Matching Background) ── */}
      <div className="w-full hero-showcase-container grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-3.5 relative z-30 pointer-events-auto mb-1 sm:mb-2 py-0">
        {SERVICES.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
              onClick={() => handleCardClick(service.route)}
              className="group relative bg-white/95 hover:bg-white backdrop-blur-md border border-[#C5A880]/60 hover:border-[#C5A880] rounded-xl sm:rounded-2xl p-1.5 xs:p-2 sm:p-2.5 md:p-3 flex flex-col items-center text-center justify-between transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(197,168,128,0.25)]"
            >
              {/* 1. Official Logo Badge & Optional Title Section */}
              <div className="h-8 xs:h-9 sm:h-11 md:h-12 w-full flex flex-col items-center justify-center">
                <div className={`w-full flex items-center justify-center ${service.showTitleText ? 'h-5 xs:h-6 sm:h-7 md:h-8' : 'h-8 xs:h-9 sm:h-11 md:h-12'}`}>
                  <img
                    src={service.logoSrc}
                    alt={service.title}
                    className={`${service.showTitleText ? 'max-h-5 xs:max-h-6 sm:max-h-7 md:max-h-8 max-w-[90%] sm:max-w-[85%]' : 'max-h-7 xs:max-h-8 sm:max-h-10 md:max-h-11 max-w-[92%] sm:max-w-[88%]'} w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300 select-none`}
                    loading="eager"
                  />
                </div>

                {service.showTitleText && (
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[11px] md:text-xs font-bold tracking-wide text-[#1A1A1A] font-sans mt-0.5 truncate max-w-full leading-tight">
                    {service.title}
                  </h3>
                )}
              </div>

              {/* 3. Supporting Visual Asset */}
              <div className="w-full h-11 xs:h-12 sm:h-14 md:h-16 lg:h-18 flex items-center justify-center my-0.5 sm:my-1 relative overflow-hidden rounded-md sm:rounded-lg border border-[#C5A880]/30 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white">
                <img
                  src={service.cardImage}
                  alt={service.cardAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                  loading="eager"
                />
              </div>

              {/* 4. "EXPLORE >" Link */}
              <div className="w-full pt-0.5 flex items-center justify-center">
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#1A1A1A] group-hover:text-[#A47E43] uppercase flex items-center gap-0.5 transition-colors duration-300">
                  <span>EXPLORE</span>
                  <span className="text-[9px] sm:text-[11px] md:text-xs leading-none transition-transform duration-300 group-hover:translate-x-0.5 font-bold text-[#A47E43]">&gt;</span>
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
        onLaunchFlipbook={(photos, size, coverUrl) => {
          const selectedCover = coverUrl || photos[0];
          const selectedBackCover = photos.length > 1 ? photos[photos.length - 1] : selectedCover;
          setFlipbookCover(selectedCover);
          setFlipbookBackCover(selectedBackCover);
          setFlipbookImages(photos);
          setFlipbookSize(size || '12x36');
        }}
      />

      {/* 3D Realistic Album Flipbook Viewer */}
      {flipbookImages && (
        <AlbumFlipbookViewer
          images={flipbookImages}
          size={flipbookSize}
          title={flipbookCover && flipbookCover !== '/images/album/front_cover.jpg' ? "Custom Photobook Album" : "KPR Luxury Wedding Album"}
          coverImage={flipbookCover || "/images/album/front_cover.jpg"}
          backCoverImage={flipbookBackCover || "/images/album/back_cover.jpg"}
          onClose={() => {
            setFlipbookImages(null);
            setFlipbookCover(null);
            setFlipbookBackCover(null);
          }}
        />
      )}
    </section>
  );
}

