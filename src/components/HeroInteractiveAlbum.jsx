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
   Aspect ratio: 1.0 (1:1 Square Album Format)
   Generous sizing to fill hero showcase area with zero empty side voids
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { singlePageW: 320, singlePageH: 320 };
  }
  const w = window.innerWidth;
  if (w < 380) {
    const sw = 140;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 480) {
    const sw = 160;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 640) {
    const sw = 200;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 768) {
    const sw = 240;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 1024) {
    const sw = 275;
    return { singlePageW: sw, singlePageH: sw };
  }
  if (w < 1280) {
    const sw = 315;
    return { singlePageW: sw, singlePageH: sw };
  }
  const sw = 335;
  return { singlePageW: sw, singlePageH: sw };
}

/* ─────────────────────────────────────────────────────
   3D TOP PAGES BLOCK (Paper leaves & spine curve from client sketch)
   Renders the fanned paper block and headband seen at the top of a real book
   ───────────────────────────────────────────────────── */
function BookTopPagesBlock({ width, height = 22, isReversed = false }) {
  const w = width;
  const h = height;
  const spineW = Math.max(14, Math.round(w * 0.08));

  if (isReversed) {
    // Mirrored for back cover (spine on the right)
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none drop-shadow-sm select-none"
      >
        {/* Rear cover board lip (background) */}
        <path
          d={`M 0 1 L ${w - spineW} 3 L ${w - spineW} 6 L 0 4 Z`}
          fill="#352B20"
        />
        <path
          d={`M 0 0.5 L ${w - spineW} 2.5`}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="0.8"
        />

        {/* Paper block body */}
        <path
          d={`M 3 3 L ${w - spineW} 5 C ${w - spineW * 0.4} 8 ${w - 4} 12 ${w - 3} ${h} L 3 ${h} Z`}
          fill="url(#paperGradientRev)"
        />

        {/* Paper stack layer lines */}
        <path d={`M 3 5 L ${w - spineW - 2} 7`} stroke="#C8BCAF" strokeWidth="0.8" />
        <path d={`M 3 8 L ${w - spineW - 4} 10`} stroke="#DFCFC0" strokeWidth="0.8" />
        <path d={`M 3 11 L ${w - spineW - 6} 13`} stroke="#BFB09D" strokeWidth="0.8" />
        <path d={`M 3 14 L ${w - spineW - 8} 16`} stroke="#DFCFC0" strokeWidth="0.8" />
        <path d={`M 3 17 L ${w - spineW - 10} 19`} stroke="#C8BCAF" strokeWidth="0.8" />

        {/* Spine headband arch (right side) */}
        <path
          d={`M ${w - spineW} 5 C ${w - spineW * 0.5} 7 ${w - 4} 12 ${w - 3} ${h} C ${w - 1} ${h} ${w - 2} 9 ${w - spineW} 5 Z`}
          fill="#5A4733"
        />
        <path
          d={`M ${w - spineW + 2} 6 C ${w - spineW * 0.4} 8 ${w - 3} 13 ${w - 2} ${h}`}
          stroke="#C5A880"
          strokeWidth="1.2"
          strokeDasharray="2,2"
        />

        {/* Front cover top lip (foreground) */}
        <rect x="0" y={h - 3} width={w} height="3" rx="0.5" fill="#2E2419" />
        <line x1="0" y1={h - 3} x2={w} y2={h - 3} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />

        <defs>
          <linearGradient id="paperGradientRev" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ECE3D6" />
            <stop offset="40%" stopColor="#FAF7F2" />
            <stop offset="85%" stopColor="#E8DFD1" />
            <stop offset="100%" stopColor="#D5C7B5" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Normal for front cover (spine on the left, matching sketch!)
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none drop-shadow-sm select-none"
    >
      {/* Rear cover board lip (background) */}
      <path
        d={`M ${spineW} 3 L ${w} 1 L ${w} 4 L ${spineW} 6 Z`}
        fill="#352B20"
      />
      <path
        d={`M ${spineW} 2.5 L ${w} 0.5`}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.8"
      />

      {/* Paper block body */}
      <path
        d={`M ${spineW} 5 L ${w - 3} 3 L ${w - 3} ${h} L 3 ${h} C 4 12 ${spineW * 0.4} 8 ${spineW} 5 Z`}
        fill="url(#paperGradient)"
      />

      {/* Paper stack layer lines */}
      <path d={`M ${spineW + 2} 7 L ${w - 3} 5`} stroke="#C8BCAF" strokeWidth="0.8" />
      <path d={`M ${spineW + 4} 10 L ${w - 3} 8`} stroke="#DFCFC0" strokeWidth="0.8" />
      <path d={`M ${spineW + 6} 13 L ${w - 3} 11`} stroke="#BFB09D" strokeWidth="0.8" />
      <path d={`M ${spineW + 8} 16 L ${w - 3} 14`} stroke="#DFCFC0" strokeWidth="0.8" />
      <path d={`M ${spineW + 10} 19 L ${w - 3} 17`} stroke="#C8BCAF" strokeWidth="0.8" />

      {/* Spine headband arch (left side, curved notch matching sketch!) */}
      <path
        d={`M ${spineW} 5 C ${spineW * 0.5} 7 4 12 3 ${h} C 1 ${h} 2 9 ${spineW} 5 Z`}
        fill="#5A4733"
      />
      <path
        d={`M ${spineW - 2} 6 C ${spineW * 0.4} 8 3 13 2 ${h}`}
        stroke="#C5A880"
        strokeWidth="1.2"
        strokeDasharray="2,2"
      />

      {/* Front cover top lip (foreground) */}
      <rect x="0" y={h - 3} width={w} height="3" rx="0.5" fill="#2E2419" />
      <line x1="0" y1={h - 3} x2={w} y2={h - 3} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />

      <defs>
        <linearGradient id="paperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D5C7B5" />
          <stop offset="15%" stopColor="#E8DFD1" />
          <stop offset="60%" stopColor="#FAF7F2" />
          <stop offset="100%" stopColor="#ECE3D6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   3D OPEN TOP PAGES BLOCK (When the book is OPEN across 2 pages)
   - Features center headband notch, gutter dip, paper leaves,
     and underlying hardcover board lip matching client sketch
   ───────────────────────────────────────────────────── */
function BookOpenTopPagesBlock({ width, height = 22 }) {
  const w = width;
  const h = height;
  const cx = Math.round(w / 2);
  const gutterW = Math.max(16, Math.round(w * 0.05));
  const halfGutter = Math.round(gutterW / 2);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none drop-shadow-sm select-none"
    >
      <defs>
        <linearGradient id="openPaperGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D5C7B5" />
          <stop offset="25%" stopColor="#EAE1D3" />
          <stop offset="70%" stopColor="#FAF7F2" />
          <stop offset="100%" stopColor="#DFCFC0" />
        </linearGradient>
        <linearGradient id="openPaperGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DFCFC0" />
          <stop offset="30%" stopColor="#FAF7F2" />
          <stop offset="75%" stopColor="#EAE1D3" />
          <stop offset="100%" stopColor="#D5C7B5" />
        </linearGradient>
        <linearGradient id="spineArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A3B2A" />
          <stop offset="50%" stopColor="#6E5842" />
          <stop offset="100%" stopColor="#4A3B2A" />
        </linearGradient>
      </defs>

      {/* Rear Hardcover Board Lip (Extends behind both open pages) */}
      <path
        d={`M 2 3 L ${cx - halfGutter} 1 L ${cx + halfGutter} 1 L ${w - 2} 3 L ${w - 2} 6 L ${cx + halfGutter} 4 L ${cx - halfGutter} 4 L 2 6 Z`}
        fill="#2A2117"
      />
      <path
        d={`M 2 2.5 L ${cx - halfGutter} 0.5 L ${cx + halfGutter} 0.5 L ${w - 2} 2.5`}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />

      {/* Left Page Paper Block (from left fore-edge curving gently down to gutter) */}
      <path
        d={`M 4 5 L ${cx - halfGutter} 3 C ${cx - halfGutter * 0.4} 6 ${cx - 2} 11 ${cx} ${h} L 4 ${h} Z`}
        fill="url(#openPaperGradLeft)"
      />

      {/* Right Page Paper Block (from gutter curving back up to right fore-edge) */}
      <path
        d={`M ${cx} ${h} C ${cx + 2} 11 ${cx + halfGutter * 0.4} 6 ${cx + halfGutter} 3 L ${w - 4} 5 L ${w - 4} ${h} L ${cx} ${h} Z`}
        fill="url(#openPaperGradRight)"
      />

      {/* Left Paper Stack Layer Lines */}
      <path d={`M 5 8 L ${cx - halfGutter - 2} 6`} stroke="#C8BCAF" strokeWidth="0.7" />
      <path d={`M 5 11 L ${cx - halfGutter - 4} 9`} stroke="#DFCFC0" strokeWidth="0.7" />
      <path d={`M 5 14 L ${cx - halfGutter - 6} 12`} stroke="#BFB09D" strokeWidth="0.7" />
      <path d={`M 5 17 L ${cx - halfGutter - 8} 15`} stroke="#DFCFC0" strokeWidth="0.7" />
      <path d={`M 5 20 L ${cx - halfGutter - 10} 18`} stroke="#C8BCAF" strokeWidth="0.7" />

      {/* Right Paper Stack Layer Lines */}
      <path d={`M ${cx + halfGutter + 2} 6 L ${w - 5} 8`} stroke="#C8BCAF" strokeWidth="0.7" />
      <path d={`M ${cx + halfGutter + 4} 9 L ${w - 5} 11`} stroke="#DFCFC0" strokeWidth="0.7" />
      <path d={`M ${cx + halfGutter + 6} 12 L ${w - 5} 14`} stroke="#BFB09D" strokeWidth="0.7" />
      <path d={`M ${cx + halfGutter + 8} 15 L ${w - 5} 17`} stroke="#DFCFC0" strokeWidth="0.7" />
      <path d={`M ${cx + halfGutter + 10} 18 L ${w - 5} 20`} stroke="#C8BCAF" strokeWidth="0.7" />

      {/* Center Spine Headband Arch & Gutter Notch (matches sketch!) */}
      <path
        d={`M ${cx - halfGutter} 3 C ${cx - halfGutter * 0.3} 6 ${cx - 2} 12 ${cx} ${h} C ${cx + 2} 12 ${cx + halfGutter * 0.3} 6 ${cx + halfGutter} 3 C ${cx} 1.5 ${cx - halfGutter} 3 Z`}
        fill="url(#spineArchGrad)"
      />
      {/* Decorative Headband Stitching Arc */}
      <path
        d={`M ${cx - halfGutter + 2} 4.5 C ${cx - halfGutter * 0.25} 7 ${cx - 1.5} 13 ${cx} ${h - 1} C ${cx + 1.5} 13 ${cx + halfGutter * 0.25} 7 ${cx + halfGutter - 2} 4.5`}
        stroke="#C5A880"
        strokeWidth="1.2"
        strokeDasharray="2,2"
      />

      {/* Foreground Front Lip Highlights */}
      <line x1="2" y1={h - 2} x2={cx - 3} y2={h - 2} stroke="#352B20" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={cx + 3} y1={h - 2} x2={w - 2} y2={h - 2} stroke="#352B20" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2" y1={h - 3} x2={cx - 3} y2={h - 3} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1={cx + 3} y1={h - 3} x2={w - 2} y2={h - 3} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE 0: LUXURY HARDCOVER FRONT COVER
   - data-density="hard" (rigid physical book cover)
   - Realistic French groove, spine roll, and fore-edge
   - Dynamic coverSrc (custom uploaded photo or demo cover)
   ───────────────────────────────────────────────────── */
const HeroFrontCover = forwardRef(({ onCoverClick, coverSrc, ...props }, ref) => {
  const imgSrc = coverSrc || "/images/album/front_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to open album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-r-2 border-r-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src={imgSrc}
          alt="Photobook Front Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="eager"
          draggable={false}
        />

        {/* ── Realistic French Groove / Spine Hinge Indentation (Matches user sketch) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            left: 'clamp(14px, 7.5%, 22px)',
            width: '3.5px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.25) 100%)',
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.45)'
          }}
        />

        {/* ── Rounded Spine Backbone Lighting Roll (Left of groove) ── */}
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none z-20"
          style={{
            width: 'clamp(14px, 7.5%, 22px)',
            background: 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.45) 100%)'
          }}
        />

        {/* ── Top-Left & Bottom-Left Spine Headband Notches (Matches sketch) ── */}
        <div
          className="absolute -top-0.5 left-0 w-3 h-2 pointer-events-none z-30"
          style={{
            borderTopLeftRadius: '3px',
            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.6)'
          }}
        />
        <div
          className="absolute -bottom-0.5 left-0 w-3 h-2 pointer-events-none z-30"
          style={{
            borderBottomLeftRadius: '3px',
            boxShadow: 'inset 1px -1px 2px rgba(0,0,0,0.6)'
          }}
        />

        {/* ── Hardcover Outer Bevel Highlight ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/25 shadow-[inset_0_0_6px_rgba(0,0,0,0.18)]"
        />

        {/* ── Right Fore-Edge Stacked Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 right-0 w-2.5 pointer-events-none z-20 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, rgba(240,230,215,0.4) 40%, transparent 100%)',
            borderLeft: '1px solid rgba(0,0,0,0.08)'
          }}
        />
      </div>
    </div>
  );
});
HeroFrontCover.displayName = 'HeroFrontCover';

/* ─────────────────────────────────────────────────────
   PHOTO PAGE HELPER (Full Bleed Edge-to-Edge)
   - Zero padding / borders so images come FULL in the photobook
   - Removed labels/names as requested by user
   - Spine crease shadow for authentic 3D book depth
   ───────────────────────────────────────────────────── */
const HeroPhotoPage = forwardRef(({ src, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#FAF8F5]">
        {/* Full Bleed Photo Edge-to-Edge with seamless gutter alignment matching open book reference */}
        <img
          src={src}
          alt="Photobook Page"
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{ objectPosition: isLeftPage ? 'right center' : 'left center' }}
          loading="lazy"
          draggable={false}
        />

        {/* Center Spine Crease / Binding Depth Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-6 bg-gradient-to-l from-black/30 via-black/10 to-transparent'
              : 'left-0 w-3 sm:w-6 bg-gradient-to-r from-black/30 via-black/10 to-transparent'
          }`}
        />

        {/* Outer Fore-Edge Paper Thickness Highlight */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'left-0 w-1 bg-gradient-to-r from-black/10 to-transparent'
              : 'right-0 w-1 bg-gradient-to-l from-black/10 to-transparent'
          }`}
        />
      </div>
    </div>
  );
});
HeroPhotoPage.displayName = 'HeroPhotoPage';

/* ─────────────────────────────────────────────────────
   PAGE: LUXURY HARDCOVER BACK COVER
   - data-density="hard" (rigid physical book cover)
   - Closes book cleanly into single-page format
   - Symmetrical French groove and spine roll
   ───────────────────────────────────────────────────── */
const HeroBackCover = forwardRef(({ onCoverClick, backCoverSrc, ...props }, ref) => {
  const imgSrc = backCoverSrc || "/images/album/back_cover.jpg";

  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] cursor-pointer ${props.className || ''}`}
      data-density="hard"
      title="Click or drag to reopen album"
      onClick={(e) => {
        props.onClick?.(e);
        onCoverClick?.();
      }}
    >
      <div className="w-full h-full relative overflow-hidden flex flex-col justify-between shadow-2xl border-l-2 border-l-[#8A7862]/30 bg-[#FAF8F5]">
        <img
          src={imgSrc}
          alt="Photobook Back Cover"
          className="w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* ── Realistic French Groove on Right Side (Hinge) ── */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20"
          style={{
            right: 'clamp(14px, 7.5%, 22px)',
            width: '3.5px',
            background: 'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.06) 45%, rgba(255,255,255,0.25) 100%)',
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.45)'
          }}
        />

        {/* ── Rounded Spine Backbone Lighting Roll (Right of groove) ── */}
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none z-20"
          style={{
            width: 'clamp(14px, 7.5%, 22px)',
            background: 'linear-gradient(to left, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.12) 80%, rgba(0,0,0,0.45) 100%)'
          }}
        />

        {/* ── Hardcover Outer Bevel Highlight ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20 border border-[#4A3C28]/25 shadow-[inset_0_0_6px_rgba(0,0,0,0.18)]"
        />

        {/* ── Left Fore-Edge Stacked Paper Thickness Highlight ── */}
        <div
          className="absolute top-0 bottom-0 left-0 w-2.5 pointer-events-none z-20 flex flex-col justify-between"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(240,230,215,0.4) 40%, transparent 100%)',
            borderRight: '1px solid rgba(0,0,0,0.08)'
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

  const topBlockHeight = Math.round(dims.singlePageW * 0.07) + 6;

  return (
    <div className="relative flex flex-col items-center justify-center select-none my-1 sm:my-1.5 w-full max-w-full px-2">
      {/* ── 3D Stage with Outer Drop Shadow ── */}
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

        {/* Soft Grounding Ambient Contact Shadow */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 h-5 sm:h-6 bg-black/60 blur-md rounded-full pointer-events-none transition-all duration-500 ease-out"
          style={{
            width: isOpen ? dims.singlePageW * 1.85 : dims.singlePageW * 0.92,
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
          {/* ── 3D Top Pages Block (Visible when closed on Front Cover) ── */}
          <AnimatePresence>
            {isCover && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 z-30 pointer-events-none"
                style={{
                  top: `-${topBlockHeight - 2}px`,
                  width: `${dims.singlePageW}px`
                }}
              >
                <BookTopPagesBlock
                  width={dims.singlePageW}
                  height={topBlockHeight}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 3D Top Pages Block (Visible when closed on Back Cover) ── */}
          <AnimatePresence>
            {isBackCover && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 z-30 pointer-events-none"
                style={{
                  top: `-${topBlockHeight - 2}px`,
                  width: `${dims.singlePageW}px`
                }}
              >
                <BookTopPagesBlock
                  width={dims.singlePageW}
                  height={topBlockHeight}
                  isReversed={true}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 3D Top Pages Block (Visible when OPEN across 2 pages matching client sketch) ── */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 z-30 pointer-events-none"
                style={{
                  top: `-${topBlockHeight - 2}px`,
                  width: `${dims.singlePageW * 2}px`
                }}
              >
                <BookOpenTopPagesBlock
                  width={dims.singlePageW * 2}
                  height={topBlockHeight}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hardcover Casing Frame Underneath Open Book */}
          {isOpen && (
            <div
              className="absolute -inset-1 sm:-inset-1.5 rounded-sm pointer-events-none z-0"
              style={{
                background: 'linear-gradient(to bottom, #2E2419, #1C150E)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.55), inset 0 0 4px rgba(255,255,255,0.12)'
              }}
            />
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
