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
   PAGE 1: DEDICATION / EX LIBRIS (Left Page)
   ───────────────────────────────────────────────────── */
const HeroDedicationPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-2.5 sm:p-4 relative overflow-hidden border-r-2 border-r-[#BFB19E]"
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
        }}
      >
        {/* Spine Crease Shadow on Right Edge */}
        <div
          className="absolute top-0 bottom-0 right-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)'
          }}
        />

        <div>
          <span
            className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
          >
            EX LIBRIS · WEDDING HEIRLOOM
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 px-1">
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
          <h3
            className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.7vw, 12px)' }}
          >
            A Lifetime of Cherished Vows
          </h3>
          <p
            className="font-serif italic text-[#6A5A4A] leading-relaxed line-clamp-2"
            style={{ fontSize: 'clamp(6px, 1.1vw, 8px)' }}
          >
            "Every glance a sacred memory, every smile an eternal treasure."
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
        </div>

        <span
          className="font-mono tracking-wider uppercase text-[#8C6D3F]/80 self-center"
          style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}
        >
          Spread 1 of 4
        </span>
      </div>
    </div>
  );
});
HeroDedicationPage.displayName = 'HeroDedicationPage';

/* ─────────────────────────────────────────────────────
   PHOTO PAGE HELPER (Pages 2 to 8)
   ───────────────────────────────────────────────────── */
const HeroPhotoPage = forwardRef(({ src, label, isLeftPage, ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className={`w-full h-full p-1 sm:p-2 flex items-center justify-center relative ${
          isLeftPage ? 'border-r-2 border-r-[#BFB19E]' : 'border-l-2 border-l-[#BFB19E]'
        }`}
        style={{ background: '#FAF8F5' }}
      >
        {/* Center Spine Crease Shadow */}
        <div
          className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
            isLeftPage
              ? 'right-0 w-3 sm:w-5 bg-gradient-to-l from-black/20 via-black/5 to-transparent'
              : 'left-0 w-3 sm:w-5 bg-gradient-to-r from-black/20 via-black/5 to-transparent'
          }`}
        />

        <div
          className="w-full h-full relative overflow-hidden rounded-xs border flex items-center justify-center bg-[#FAF8F5]"
          style={{ borderColor: 'rgba(213,201,184,0.7)' }}
        >
          <img
            src={src}
            alt={label}
            className="w-full h-full object-contain object-center pointer-events-none select-none drop-shadow-xs"
            loading="lazy"
            draggable={false}
          />
          <span
            className={`absolute bottom-1 font-mono text-[#5A4836] rounded-full border shadow-xs font-bold bg-white/95 px-1.5 py-0.5 ${
              isLeftPage ? 'left-1' : 'right-1'
            }`}
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)', borderColor: '#D5C9B8' }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
});
HeroPhotoPage.displayName = 'HeroPhotoPage';

/* ─────────────────────────────────────────────────────
   PAGE 35: LUXURY ENDSHEET HEIRLOOM (Left Page)
   ───────────────────────────────────────────────────── */
const HeroEndsheetPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-3 sm:p-5 relative overflow-hidden border-r-2 border-r-[#BFB19E]"
        style={{
          background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
        }}
      >
        <div
          className="absolute top-0 bottom-0 right-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to left, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)'
          }}
        />

        <div>
          <span
            className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
          >
            KPR PRODUCTIONS · TIMELESS MEMORIES
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 px-1">
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
          <h3
            className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.7vw, 12px)' }}
          >
            Preserved for Generations
          </h3>
          <p
            className="font-serif italic text-[#6B5A47] leading-relaxed"
            style={{ fontSize: 'clamp(6.5px, 1.25vw, 8.5px)' }}
          >
            Every smile, ceremony, and sacred blessing bound forever in luxury layflat print.
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
        </div>

        <div>
          <span
            className="font-mono text-[#8C6D3F]/80 uppercase tracking-widest"
            style={{ fontSize: 'clamp(5.5px, 1vw, 7px)' }}
          >
            Warangal & Hyderabad
          </span>
        </div>
      </div>
    </div>
  );
});
HeroEndsheetPage.displayName = 'HeroEndsheetPage';

/* ─────────────────────────────────────────────────────
   LUXURY ENDSHEET RIGHT PAGE (Right Page)
   Completes the final interior spread before the back cover closes
   ───────────────────────────────────────────────────── */
const HeroEndsheetRightPage = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      style={{ ...props.style }}
      className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] ${props.className || ''}`}
      data-density="soft"
    >
      <div
        className="w-full h-full flex flex-col justify-between text-center p-3 sm:p-5 relative overflow-hidden border-l-2 border-l-[#BFB19E]"
        style={{
          background: 'linear-gradient(225deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)'
        }}
      >
        <div
          className="absolute top-0 bottom-0 left-0 w-4 sm:w-6 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)'
          }}
        />

        <div>
          <span
            className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
            style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}
          >
            THE ART OF CINEMATIC MEMORIES
          </span>
        </div>

        <div className="space-y-1 sm:space-y-1.5 px-1">
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
          <h3
            className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
            style={{ fontSize: 'clamp(8.5px, 1.7vw, 12px)' }}
          >
            Crafted with Passion
          </h3>
          <p
            className="font-serif italic text-[#6B5A47] leading-relaxed"
            style={{ fontSize: 'clamp(6.5px, 1.25vw, 8.5px)' }}
          >
            "Photographs are the pause button of life, keeping precious moments timeless."
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto bg-[#8C6D3F]/40" />
        </div>

        <div>
          <span
            className="font-mono text-[#8C6D3F]/80 uppercase tracking-widest"
            style={{ fontSize: 'clamp(5.5px, 1vw, 7px)' }}
          >
            KPR PRODUCTIONS · 2026
          </span>
        </div>
      </div>
    </div>
  );
});
HeroEndsheetRightPage.displayName = 'HeroEndsheetRightPage';

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

  // Normalize photos: use custom uploaded photos if provided, otherwise default to demo FLEXY_ALBUM_PHOTOS
  const activePhotos = (customPhotos && customPhotos.length > 0)
    ? customPhotos.map((p, idx) => ({
        id: idx + 1,
        src: typeof p === 'string' ? p : p.url,
        label: p.label || `${String(idx + 1).padStart(2, '0')} · Photo ${idx + 1}`
      }))
    : FLEXY_ALBUM_PHOTOS;

  // Active cover: use custom uploaded cover image if available, else first custom photo, else default demo cover
  const activeCover = customCoverImage
    ? customCoverImage
    : (customPhotos && customPhotos.length > 0)
      ? (typeof customPhotos[0] === 'string' ? customPhotos[0] : customPhotos[0].url)
      : '/images/album/front_cover.jpg';

  const activeBackCover = '/images/album/back_cover.jpg';

  // Endsheets to complete the last spread before the back cover:
  // Front cover (1) + photos + endsheets + back cover (1) MUST be an EVEN total
  const endsheetCount = activePhotos.length % 2 === 0 ? 2 : 1;
  const totalPages = 1 + activePhotos.length + endsheetCount + 1;

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
        {/* Previous Page Arrow (Available while open OR when on the back cover to reopen) */}
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

        {/* Next Page Arrow (Available only while open and not yet at the back cover) */}
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
            {/* Page 0: Front Cover (Dynamic user upload or default demo) */}
            <HeroFrontCover
              coverSrc={activeCover}
              onCoverClick={handleFlipNext}
            />

            {/* Photo Pages (Dynamic user upload or default demo) */}
            {activePhotos.map((photo, idx) => (
              <HeroPhotoPage
                key={photo.id}
                src={photo.src}
                label={photo.label}
                isLeftPage={idx % 2 === 0}
              />
            ))}

            {/* Luxury Endsheets: Balanced to ensure an even total page count for crisp back cover closure */}
            <HeroEndsheetPage />
            {endsheetCount === 2 && <HeroEndsheetRightPage />}

            {/* Final Page: Luxury Hardcover Back Cover (Closes the book to single-page mode) */}
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
