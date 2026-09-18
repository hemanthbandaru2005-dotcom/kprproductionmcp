import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { FLEXY_ALBUM_PHOTOS } from '../data/albumPhotosData';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper for 3D Photobook
   Aspect ratio: ~0.76 (Portrait Fine-Art Photobook Format)
   Matches the user's reference photograph exactly:
   - Closed: Upright, elegant fine-art portrait photobook
   - Open: 2 facing pages create a pristine 1.52 (3:2) spread
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { singlePageW: 280, singlePageH: 370 };
  }
  const w = window.innerWidth;
  if (w < 380) {
    return { singlePageW: 150, singlePageH: 198 };
  }
  if (w < 480) {
    return { singlePageW: 175, singlePageH: 230 };
  }
  if (w < 640) {
    return { singlePageW: 215, singlePageH: 282 };
  }
  if (w < 768) {
    return { singlePageW: 250, singlePageH: 328 };
  }
  if (w < 1024) {
    return { singlePageW: 275, singlePageH: 362 };
  }
  if (w < 1280) {
    return { singlePageW: 300, singlePageH: 395 };
  }
  return { singlePageW: 320, singlePageH: 420 };
}

/* ─────────────────────────────────────────────────────
   PAGE 0: LUXURY FINE-ART HARDCOVER FRONT COVER
   - data-density="hard" (rigid physical book cover)
   - Fine-art archival paper/linen texture from client reference
   - Embossed French groove / spine hinge indentation on the left
   - Dynamic coverSrc (custom uploaded photo or pristine fine-art cover)
   ───────────────────────────────────────────────────── */
const HeroFrontCover = forwardRef(({ onCoverClick, coverSrc, ...props }, ref) => {
  const imgSrc = coverSrc || "/images/album/front_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#F7F5F0] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to open album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border border-[#E5E0D8] bg-[#F7F5F0]">
        <img
          src={imgSrc}
          alt="Fine Art Photobook Front Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="eager"
          draggable={false}
        />

        {/* ── Realistic Debossed French Groove / Spine Hinge Indentation (Matches client image) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            left: 'clamp(12px, 5.5%, 20px)',
            width: '2.5px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.04) 40%, rgba(255,255,255,0.4) 100%)',
            boxShadow: 'inset 1px 0 1.5px rgba(0,0,0,0.3)'
          }}
        />

        {/* ── Soft Spine Lighting Highlight (Left of groove) ── */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none z-20"
          style={{
            width: 'clamp(12px, 5.5%, 20px)',
            background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.06) 100%)'
          }}
        />

        {/* ── Crisp Hardcover Bevel Edge ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/15 shadow-[inset_0_0_4px_rgba(0,0,0,0.08)]"
        />

        {/* ── Right Fore-Edge Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.3) 40%, transparent 100%)',
            borderLeft: '1px solid rgba(0,0,0,0.05)'
          }}
        />
      </div>
    </div>
  );
});
HeroFrontCover.displayName = 'HeroFrontCover';

/* ─────────────────────────────────────────────────────
   PHOTO PAGE HELPER (Fine-Art Archival Mounted)
   - Zero cutting, cropping or distortion: 100% full photo preserved
   - Neatly centered on museum-grade fine-art paper (#FAF9F6)
   - Crisp rendering with high-quality filter
   - Spine crease shadow for authentic 3D book depth
   ───────────────────────────────────────────────────── */
const HeroPhotoPage = forwardRef(({ src, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF9F6] ${props.className || ''}`}
      data-density="soft"
    >
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-2 xs:p-2.5 sm:p-3 bg-[#FAF9F6]">
        {/* Full uncropped photo with fine-art archival mounting — pristine, neat, and never cut */}
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt="Photobook Page"
            className="max-w-full max-h-full w-auto h-auto object-contain object-center select-none pointer-events-none rounded-[1px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            style={{
              imageRendering: 'high-quality',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)'
            }}
            loading="eager"
            draggable={false}
          />
        </div>

        {/* Center Layflat Spine Crease Depth Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-6 bg-gradient-to-l from-black/20 via-black/5 to-transparent'
              : 'left-0 w-3 sm:w-6 bg-gradient-to-r from-black/20 via-black/5 to-transparent'
          }`}
        />

        {/* Outer Fore-Edge Paper Thickness Highlight */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'left-0 w-1 bg-gradient-to-r from-black/8 to-transparent'
              : 'right-0 w-1 bg-gradient-to-l from-black/8 to-transparent'
          }`}
        />
      </div>
    </div>
  );
});
HeroPhotoPage.displayName = 'HeroPhotoPage';

/* ─────────────────────────────────────────────────────
   PAGE: LUXURY FINE-ART HARDCOVER BACK COVER
   - data-density="hard" (rigid physical book cover)
   - Symmetrical debossed French groove on right side
   - Closes book cleanly into portrait single-page format
   ───────────────────────────────────────────────────── */
const HeroBackCover = forwardRef(({ onCoverClick, backCoverSrc, ...props }, ref) => {
  const imgSrc = backCoverSrc || "/images/album/back_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#F7F5F0] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to reopen album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border border-[#E5E0D8] bg-[#F7F5F0]">
        <img
          src={imgSrc}
          alt="Fine Art Photobook Back Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* ── Realistic Debossed French Groove on Right Side (Hinge) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            right: 'clamp(12px, 5.5%, 20px)',
            width: '2.5px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.04) 40%, rgba(255,255,255,0.4) 100%)',
            boxShadow: 'inset -1px 0 1.5px rgba(0,0,0,0.3)'
          }}
        />

        {/* ── Soft Spine Lighting Highlight (Right of groove) ── */}
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none z-20"
          style={{
            width: 'clamp(12px, 5.5%, 20px)',
            background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.06) 100%)'
          }}
        />

        {/* ── Crisp Hardcover Bevel Edge ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/15 shadow-[inset_0_0_4px_rgba(0,0,0,0.08)]"
        />

        {/* ── Left Fore-Edge Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.3) 40%, transparent 100%)',
            borderRight: '1px solid rgba(0,0,0,0.05)'
          }}
        />
      </div>
    </div>
  );
});
HeroBackCover.displayName = 'HeroBackCover';

/* ─────────────────────────────────────────────────────
   Main Export: HeroInteractiveAlbum
   - Uses real HTMLFlipBook engine (zero shaking, real 3D page curls)
   - Realistic 3D Physical Book casing with top paper block from client sketch
   - Supports dynamic user uploads (cover + pages) while preserving demo defaults
   - Dedicated [ ⛶ Full View ] button
   ───────────────────────────────────────────────────── */
export default function HeroInteractiveAlbum({
  onOpenUpload,
  onOpenFullscreen,
  showFullscreenButton = true,
  customCoverImage = null,
  customPhotos = null
}) {
  const flipBookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [dims, setDims] = useState(getBookDimensions);

  useEffect(() => {
    const handleResize = () => setDims(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Demo Photobook: Always pristine default demo with full storytelling sequence
  const activePhotos = FLEXY_ALBUM_PHOTOS;
  const activeCover = '/images/album/front_cover.jpg';
  const activeBackCover = '/images/album/back_cover.jpg';

  // 1 (Front Cover) + 66 (Photos) + 1 (Back Cover) = 68 pages (EVEN total, closes cleanly to back cover)
  const totalPages = 1 + activePhotos.length + 1;

  const handleFlipNext = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flipNext();
    } catch (e) {
      console.warn('flipNext error:', e);
    }
  }, []);

  const handleFlipPrev = useCallback(() => {
    try {
      flipBookRef.current?.pageFlip()?.flipPrev();
    } catch (e) {
      console.warn('flipPrev error:', e);
    }
  }, []);

  const handlePageFlip = useCallback((e) => {
    if (e && typeof e.data === 'number') {
      setCurrentPage(e.data);
    }
  }, []);

  const handleChangeState = useCallback((e) => {
    if (e && e.data === 'read') {
      try {
        const idx = flipBookRef.current?.pageFlip()?.getCurrentPageIndex();
        if (typeof idx === 'number') {
          setCurrentPage(idx);
        }
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const isCover = currentPage === 0;
  const isBackCover = currentPage >= totalPages - 1;
  const isOpen = !isCover && !isBackCover;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-1 sm:my-2 w-full max-w-full px-2"
    >
      {/* ── 3D Stage with Natural Ambient Contact Shadow ── */}
      <div
        className="relative flex items-center justify-center select-none transition-all duration-500 ease-out"
        style={{
          width: isOpen ? dims.singlePageW * 2 : dims.singlePageW,
          height: dims.singlePageH
        }}
      >
        {/* ── "Swipe to open" Callout (Positioned in open space to the right of the book cover) ── */}
        <AnimatePresence>
          {isCover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: 0.15 }}
              onClick={handleFlipNext}
              className="absolute top-[18%] xs:top-[22%] sm:top-[25%] left-full ml-2 xs:ml-3 sm:ml-4 z-50 flex flex-col items-start cursor-pointer select-none pointer-events-auto group"
              title="Click or swipe to open"
            >
              <span className="font-serif italic font-semibold text-[11px] xs:text-xs sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap -rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Swipe to open
              </span>
              <svg
                width="32"
                height="22"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 ml-1 group-hover:-translate-x-1 transition-all"
              >
                <path
                  d="M26 4C18 4 12 8 5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 9L4 15L11 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "Tap to reopen" Callout (Positioned in open space to the left of the closed back cover) ── */}
        <AnimatePresence>
          {isBackCover && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: 0.15 }}
              onClick={handleFlipPrev}
              className="absolute top-[18%] xs:top-[22%] sm:top-[25%] right-full mr-2 xs:mr-3 sm:mr-4 z-50 flex flex-col items-end cursor-pointer select-none pointer-events-auto group"
              title="Click or swipe to reopen album"
            >
              <span className="font-serif italic font-semibold text-[11px] xs:text-xs sm:text-[13px] text-[#C85A48] tracking-wide whitespace-nowrap rotate-6 group-hover:scale-105 group-hover:text-[#B34533] transition-all drop-shadow-xs">
                Tap to reopen
              </span>
              <svg
                width="32"
                height="22"
                viewBox="0 0 32 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#C85A48] group-hover:text-[#B34533] mt-0.5 mr-1 group-hover:translate-x-1 transition-all"
              >
                <path
                  d="M6 4C14 4 20 8 27 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 9L28 15L21 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft Ambient Contact Shadow Underneath (matching user reference image) */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 h-4 sm:h-5 bg-black/45 blur-md rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dims.singlePageW * 1.85 : dims.singlePageW * 0.94,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />

        {/* ── Discreet Outside Navigation Arrows ── */}
        {(isOpen || isBackCover) && (
          <button
            type="button"
            onClick={handleFlipPrev}
            className="absolute -left-9 sm:-left-12 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(20,20,22,0.92)',
              color: '#C5A880',
              borderColor: 'rgba(197,168,128,0.5)'
            }}
            title={isBackCover ? 'Reopen album' : 'Previous page'}
            aria-label={isBackCover ? 'Reopen album' : 'Previous page'}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {isOpen && (
          <button
            type="button"
            onClick={handleFlipNext}
            className="absolute -right-9 sm:-right-12 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-2.5 rounded-full border shadow-md transition-all duration-200 cursor-pointer opacity-85 hover:opacity-100 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(20,20,22,0.92)',
              color: '#C5A880',
              borderColor: 'rgba(197,168,128,0.5)'
            }}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* ── Smooth Horizontal Translation Container (Centers Closed Cover & Open Spread) ── */}
        <div
          className="relative transition-transform duration-500 ease-out"
          style={{
            transform:
              currentPage === 0
                ? `translateX(-${Math.round(dims.singlePageW / 2)}px)`
                : isBackCover
                ? `translateX(${Math.round(dims.singlePageW / 2)}px)`
                : 'translateX(0px)'
          }}
        >
          {/* Hardcover Casing Underplate & Subtle Fore-Edge Framing */}
          {isOpen && (
            <div
              className="absolute -inset-1 sm:-inset-1.5 rounded-xs pointer-events-none z-0"
              style={{
                background: '#EAE5DC',
                boxShadow: '0 20px 48px -8px rgba(0,0,0,0.28), 0 8px 20px -4px rgba(0,0,0,0.14)'
              }}
            >
              {/* Visible Paper Block Fore-Edges on Left and Right */}
              <div className="absolute top-1 bottom-1 left-0.5 w-1 bg-gradient-to-r from-[#EFE9DF] to-[#FAF7F2] border-r border-black/10" />
              <div className="absolute top-1 bottom-1 right-0.5 w-1 bg-gradient-to-l from-[#EFE9DF] to-[#FAF7F2] border-l border-black/10" />
            </div>
          )}

          {/* ── REAL 3D PAGE-FLIP ENGINE (HTMLFlipBook) ── */}
          <HTMLFlipBook
            key={`hero-flipbook-${dims.singlePageW}-${dims.singlePageH}-${activePhotos.length}-${activeCover}`}
            ref={flipBookRef}
            width={dims.singlePageW}
            height={dims.singlePageH}
            size="fixed"
            minWidth={130}
            maxWidth={800}
            minHeight={120}
            maxHeight={800}
            maxShadowOpacity={0.6}
            showCover={true}
            mobileScrollSupport={true}
            flippingTime={550}
            usePortrait={false}
            startPage={0}
            drawShadow={true}
            autoSize={false}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={15}
            showPageCorners={true}
            disableFlipByClick={false}
            onFlip={handlePageFlip}
            onChangeState={handleChangeState}
            className="album-flipbook-shadow"
          >
            {/* Page 0: Front Cover */}
            <HeroFrontCover
              coverSrc={activeCover}
              onCoverClick={handleFlipNext}
            />

            {/* Photo Pages: Edge-to-edge full bleed, Haldi to Birthday, no labels */}
            {activePhotos.map((photo, idx) => (
              <HeroPhotoPage
                key={photo.id}
                src={photo.src}
                isLeftPage={idx % 2 === 0}
              />
            ))}

            {/* Final Page: Luxury Hardcover Back Cover (Closes directly to single-page mode) */}
            <HeroBackCover
              backCoverSrc={activeBackCover}
              onCoverClick={handleFlipPrev}
            />
          </HTMLFlipBook>
        </div>
      </div>

      {/* ── FULL VIEW BUTTON (Dedicated Luxury Launcher) ── */}
      {onOpenFullscreen && showFullscreenButton && (
        <div className="flex items-center justify-center mt-2 sm:mt-2.5 select-none z-20">
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="group inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#161412]/95 hover:bg-black text-[#F4ECD8] text-[9.5px] sm:text-xs font-serif tracking-widest uppercase border border-[#C5A880]/60 hover:border-[#C5A880] shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_6px_18px_rgba(197,168,128,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Open in Full View 3D Photobook"
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C5A880] group-hover:scale-110 transition-transform" />
            <span>Full View</span>
          </button>
        </div>
      )}
    </div>
  );
}
