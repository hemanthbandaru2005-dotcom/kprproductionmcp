import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  BookOpen,
  Upload,
  Camera,
  RotateCcw,
  Heart,
  Star,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Responsive Dimension Helper
   ───────────────────────────────────────────────────── */
function getBookDimensions() {
  if (typeof window === 'undefined') {
    return { closedW: 240, closedH: 175, openW: 460, openH: 175 };
  }
  const w = window.innerWidth;
  if (w < 380) return { closedW: 165, closedH: 124, openW: 305, openH: 120 };
  if (w < 480) return { closedW: 190, closedH: 140, openW: 340, openH: 132 };
  if (w < 640) return { closedW: 215, closedH: 158, openW: 388, openH: 148 };
  if (w < 768) return { closedW: 235, closedH: 172, openW: 428, openH: 163 };
  if (w < 1024) return { closedW: 255, closedH: 185, openW: 472, openH: 178 };
  if (w < 1280) return { closedW: 268, closedH: 196, openW: 505, openH: 188 };
  return { closedW: 285, closedH: 210, openW: 538, openH: 200 };
}

/* ─────────────────────────────────────────────────────
   FRONT COVER — Premium KPR Productions Leather Hardcover
   ───────────────────────────────────────────────────── */
function FrontCover({ onOpen, dimensions }) {
  return (
    <motion.div
      key="front-cover"
      initial={{ opacity: 0, scale: 0.96, rotateY: -12 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.94, rotateY: -80 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="w-full h-full relative overflow-hidden cursor-pointer group select-none"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: 3,
        background: 'linear-gradient(145deg, #231B13 0%, #2D2218 35%, #1A1510 65%, #110E0A 100%)',
        boxShadow: '0 20px 55px rgba(0,0,0,0.75), 0 6px 18px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(197,168,128,0.15)',
        border: '2px solid rgba(197,168,128,0.6)',
      }}
    >
      {/* ── Leather grain texture ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(#D8C4A4 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)' }} />

      {/* ── Spine hinge on left with stitching ── */}
      <div className="absolute top-0 bottom-0 left-0 w-4 sm:w-5 flex flex-col justify-around items-center py-2 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)', borderRight: '1px solid rgba(197,168,128,0.35)' }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-0.5 sm:w-1 h-1.5 sm:h-2 rounded-full bg-[#C5A880]/60 shadow" />
        ))}
      </div>

      {/* ── Gilt page edges right & bottom ── */}
      <div className="absolute top-1 bottom-1 right-0 w-1.5 pointer-events-none rounded-r opacity-85"
        style={{ background: 'linear-gradient(to left, #FBF8F3, #D8CEBB, #9B8C78)' }} />
      <div className="absolute left-4 right-1 bottom-0 h-1.5 pointer-events-none rounded-b opacity-85"
        style={{ background: 'linear-gradient(to top, #FBF8F3, #D8CEBB, #9B8C78)' }} />

      {/* ── Double gold foil border ── */}
      <div className="absolute inset-2 sm:inset-3 pointer-events-none rounded-sm"
        style={{ border: '1px solid rgba(197,168,128,0.60)' }} />
      <div className="absolute inset-3 sm:inset-4.5 pointer-events-none rounded-sm"
        style={{ border: '1px solid rgba(197,168,128,0.25)' }} />

      {/* ── Ornate corner filigree ── */}
      {[
        'top-3 left-5 sm:top-4 sm:left-6 border-t-2 border-l-2',
        'top-3 right-3 sm:top-4 sm:right-4 border-t-2 border-r-2',
        'bottom-3 left-5 sm:bottom-4 sm:left-6 border-b-2 border-l-2',
        'bottom-3 right-3 sm:bottom-4 sm:right-4 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-3 h-3 sm:w-4 sm:h-4 pointer-events-none border-[#E5D3B3] ${cls}`} />
      ))}

      {/* ── Top header badge ── */}
      <div className="absolute top-3 sm:top-4 left-0 right-0 flex items-center justify-center z-10">
        <div className="flex items-center gap-1 px-2 py-0.5">
          <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C5A880]" />
          <span className="text-[5.5px] sm:text-[7px] font-bold tracking-[0.3em] uppercase text-[#C5A880]">
            ROYAL HEIRLOOM COLLECTION
          </span>
          <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C5A880]" />
        </div>
      </div>

      {/* ── Center: Main branding ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-3 gap-1 sm:gap-2">
        {/* KPR Logo circle */}
        <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(197,168,128,0.2) 0%, rgba(0,0,0,0.7) 100%)',
            border: '1.5px solid rgba(197,168,128,0.65)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <img
            src="/images/kpr_logo.png"
            alt="KPR Productions"
            className="w-full h-full object-contain rounded-full p-1"
            style={{ filter: 'drop-shadow(0 2px 5px rgba(197,168,128,0.6))' }}
          />
        </div>

        {/* Studio name */}
        <div className="text-center space-y-0.5">
          <h2 className="font-serif font-bold tracking-[0.22em] uppercase leading-tight"
            style={{
              fontSize: 'clamp(11px, 2.2vw, 17px)',
              background: 'linear-gradient(to bottom, #FFF8EB 0%, #EDD094 40%, #C5A261 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
            }}>
            KPR PRODUCTIONS
          </h2>

          {/* Separator */}
          <div className="flex items-center justify-center gap-1.5 py-0.5">
            <div className="h-px w-6 sm:w-10" style={{ background: 'linear-gradient(to right, transparent, #C5A880)' }} />
            <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-[#C5A880] fill-[#C5A880]" />
            <div className="h-px w-6 sm:w-10" style={{ background: 'linear-gradient(to left, transparent, #C5A880)' }} />
          </div>

          <p className="font-serif italic text-[#F0E6D2] tracking-[0.15em] uppercase"
            style={{ fontSize: 'clamp(6.5px, 1.4vw, 10px)' }}>
            Wedding Photobook
          </p>
          <p className="font-mono text-[#C5A880]/80 tracking-widest uppercase"
            style={{ fontSize: 'clamp(5px, 1vw, 7.5px)' }}>
            Layflat Silk Edition
          </p>
        </div>

        {/* Open CTA */}
        <div className="pt-0.5">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full font-bold uppercase tracking-wider transition-transform duration-200 group-hover:scale-105"
            style={{
              fontSize: 'clamp(6px, 1.2vw, 8.5px)',
              background: 'linear-gradient(to right, #C5A880, #E5CC88, #C5A880)',
              color: '#120F0C',
              boxShadow: '0 2px 12px rgba(197,168,128,0.5)',
            }}>
            <span>Open Album</span>
            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center z-10">
        <p className="text-[#C5A880]/70 uppercase tracking-[0.28em] font-medium"
          style={{ fontSize: 'clamp(5px, 0.9vw, 7px)' }}>
          KPR COLOUR LAB &amp; STUDIO · HYDERABAD
        </p>
      </div>

      {/* ── Hover shimmer overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)' }} />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   BACK COVER — Premium Closing Hardcover
   ───────────────────────────────────────────────────── */
function BackCover({ onReopen }) {
  return (
    <motion.div
      key="back-cover"
      initial={{ opacity: 0, scale: 0.96, rotateY: 30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.94, rotateY: 80 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full relative overflow-hidden select-none"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: 3,
        background: 'linear-gradient(145deg, #110E0A 0%, #1A1510 35%, #2D2218 65%, #231B13 100%)',
        boxShadow: '0 20px 55px rgba(0,0,0,0.75), 0 6px 18px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(197,168,128,0.15)',
        border: '2px solid rgba(197,168,128,0.6)',
      }}
    >
      {/* Leather grain */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(#D8C4A4 1px, transparent 1px)', backgroundSize: '6px 6px' }} />

      {/* Spine hinge on right with stitching */}
      <div className="absolute top-0 bottom-0 right-0 w-4 sm:w-5 flex flex-col justify-around items-center py-2 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)', borderLeft: '1px solid rgba(197,168,128,0.35)' }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-0.5 sm:w-1 h-1.5 sm:h-2 rounded-full bg-[#C5A880]/60 shadow" />
        ))}
      </div>

      {/* Gilt page edges left & bottom */}
      <div className="absolute top-1 bottom-1 left-0 w-1.5 pointer-events-none rounded-l opacity-85"
        style={{ background: 'linear-gradient(to right, #FBF8F3, #D8CEBB, #9B8C78)' }} />
      <div className="absolute left-1 right-4 bottom-0 h-1.5 pointer-events-none rounded-b opacity-85"
        style={{ background: 'linear-gradient(to top, #FBF8F3, #D8CEBB, #9B8C78)' }} />

      {/* Double gold foil border */}
      <div className="absolute inset-2 sm:inset-3 pointer-events-none rounded-sm"
        style={{ border: '1px solid rgba(197,168,128,0.60)' }} />
      <div className="absolute inset-3 sm:inset-4.5 pointer-events-none rounded-sm"
        style={{ border: '1px solid rgba(197,168,128,0.25)' }} />

      {/* Corner filigrees */}
      {[
        'top-3 left-3 sm:top-4 sm:left-4 border-t-2 border-l-2',
        'top-3 right-5 sm:top-4 sm:right-6 border-t-2 border-r-2',
        'bottom-3 left-3 sm:bottom-4 sm:left-4 border-b-2 border-l-2',
        'bottom-3 right-5 sm:bottom-4 sm:right-6 border-b-2 border-r-2',
      ].map((cls, i) => (
        <div key={i} className={`absolute w-3 h-3 sm:w-4 sm:h-4 pointer-events-none border-[#E5D3B3] ${cls}`} />
      ))}

      {/* Top badge */}
      <div className="absolute top-3 sm:top-4 left-0 right-0 flex justify-center z-10">
        <span className="font-bold tracking-[0.28em] uppercase text-[#C5A880]"
          style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}>
          ARCHIVAL CERTIFIED EDITION
        </span>
      </div>

      {/* Center seal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-1.5 sm:gap-2">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-inner"
          style={{
            background: 'radial-gradient(circle, rgba(197,168,128,0.18) 0%, rgba(18,15,12,0.9) 100%)',
            border: '1.5px solid rgba(229,211,179,0.65)',
          }}>
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#C5A880]" />
        </div>

        <div className="text-center space-y-0.5">
          <h3 className="font-serif font-bold tracking-[0.2em] uppercase leading-tight"
            style={{
              fontSize: 'clamp(10px, 2vw, 14px)',
              background: 'linear-gradient(to bottom, #FFF8EB 0%, #EDD094 40%, #C5A261 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            KPR PRODUCTIONS
          </h3>
          <p className="text-[#C5A880] tracking-[0.16em] uppercase font-semibold"
            style={{ fontSize: 'clamp(6px, 1.2vw, 8.5px)' }}>
            Luxury Wedding Storytelling
          </p>
          <div className="w-8 sm:w-12 h-px mx-auto" style={{ background: 'rgba(197,168,128,0.5)' }} />
          <p className="text-[#D5C4A6]/65 tracking-wider uppercase"
            style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}>
            Digital Color Lab · Hyderabad
          </p>
        </div>

        {/* Reopen button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onReopen(); }}
          className="inline-flex items-center gap-1 px-3 py-0.5 sm:py-1 rounded-full border font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:scale-105"
          style={{
            fontSize: 'clamp(6px, 1.2vw, 8.5px)',
            background: 'rgba(0,0,0,0.7)',
            color: '#C5A880',
            borderColor: 'rgba(197,168,128,0.55)',
          }}>
          <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span>Reopen Album</span>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center z-10">
        <p className="text-[#C5A880]/65 uppercase tracking-[0.22em] font-mono"
          style={{ fontSize: 'clamp(5px, 0.9vw, 7px)' }}>
          100% LAYFLAT CERTIFIED
        </p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   OPEN SPREAD — Two-Page Layflat
   ───────────────────────────────────────────────────── */
function OpenSpread({ spreadIndex, onPrev, onNext, onClose, onOpenUpload, direction }) {
  return (
    <motion.div
      key={`spread-${spreadIndex}`}
      initial={{ opacity: 0, rotateY: direction > 0 ? 18 : -18, scale: 0.97 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: direction > 0 ? -18 : 18, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full overflow-hidden flex relative"
      style={{
        transformStyle: 'preserve-3d',
        borderRadius: 3,
        background: '#FAF8F5',
        border: '1.5px solid #D5C9B8',
        boxShadow: '0 18px 45px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      {/* Center spine crease shadow */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-5 sm:w-8 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.22), rgba(0,0,0,0.06), transparent)' }} />
      <div className="absolute top-0 bottom-0 left-1/2 w-px z-20 pointer-events-none opacity-40"
        style={{ background: '#8C7A64' }} />

      {/* Page thickness bottom edge */}
      <div className="absolute -bottom-0.5 left-2 right-2 h-1 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #D5CABB, #FAF7F2, #D5CABB)', opacity: 0.8 }} />

      {/* ─── SPREAD 1 ─── */}
      {spreadIndex === 1 && (
        <>
          {/* Left: Dedication page */}
          <div className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3.5 relative overflow-hidden border-r"
            style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 50%, #EAE2D2 100%)', borderColor: '#D5C9B8' }}>
            <div>
              <span className="font-bold tracking-[0.22em] uppercase text-[#8C6D3F]"
                style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}>
                EX LIBRIS · WEDDING HEIRLOOM
              </span>
            </div>
            <div className="space-y-1 sm:space-y-1.5 px-1">
              <div className="w-7 sm:w-12 h-px mx-auto" style={{ background: 'rgba(140,109,63,0.4)' }} />
              <h3 className="font-serif text-[#2A231C] font-semibold tracking-wide uppercase leading-tight"
                style={{ fontSize: 'clamp(8px, 1.7vw, 12px)' }}>
                A Lifetime of Cherished Vows
              </h3>
              <p className="font-serif italic text-[#6A5A4A] leading-relaxed"
                style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}>
                "Every glance a sacred memory, every smile an eternal treasure preserved for generations."
              </p>
              <div className="w-7 sm:w-12 h-px mx-auto" style={{ background: 'rgba(140,109,63,0.4)' }} />
              <p className="font-mono tracking-widest uppercase text-[#8C6D3F]"
                style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}>
                Mastercrafted by KPR Colour Lab
              </p>
            </div>
            <span className="font-mono tracking-wider uppercase text-[#8C6D3F]/75 bg-[#8C6D3F]/10 px-2 py-0.5 rounded-full border border-[#8C6D3F]/20 self-center"
              style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}>
              Spread 1 of 4
            </span>
          </div>
          {/* Right: Photo */}
          <PhotoHalf src="/images/wedding/photo_1.jpg" label="01 · Royal Bride" side="right" />
        </>
      )}

      {/* ─── SPREAD 2 ─── */}
      {spreadIndex === 2 && (
        <>
          <PhotoHalf src="/images/wedding/photo_2.jpg" label="02 · Eternal Couple" side="left" />
          <PhotoHalf src="/images/wedding/photo_3.jpg" label="03 · Mandap Vows" side="right" />
        </>
      )}

      {/* ─── SPREAD 3 ─── */}
      {spreadIndex === 3 && (
        <>
          <PhotoHalf src="/images/wedding/photo_4.jpg" label="04 · Haldi Splendor" side="left" />
          <PhotoHalf src="/images/wedding/photo_5.jpg" label="05 · Twilight Romance" side="right" />
        </>
      )}

      {/* ─── SPREAD 4 ─── */}
      {spreadIndex === 4 && (
        <>
          <PhotoHalf src="/images/wedding/photo_6.jpg" label="06 · Royal Traditions" side="left" />
          <PhotoHalf src="/images/wedding/photo_7.jpg" label="07 · Grand Reception" side="right" />
        </>
      )}

      {/* ─── SPREAD 5 — Closing CTA ─── */}
      {spreadIndex === 5 && (
        <>
          {/* Left: Upload CTA */}
          <div className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden border-r"
            style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 50%, #EAE0D0 100%)', borderColor: '#D5C9B8' }}>
            <span className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
              style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}>
              CREATE YOUR ALBUM
            </span>
            <div className="space-y-1 sm:space-y-1.5">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-[#8C6D3F]"
                style={{ background: 'rgba(140,109,63,0.15)', border: '1px solid rgba(140,109,63,0.3)' }}>
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <h4 className="font-serif text-[#2A231C] font-semibold leading-tight"
                style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}>
                Upload Your Own Photos
              </h4>
              <p className="text-[#6A5A4A] leading-tight"
                style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}>
                Upload finished spreads or photos to generate your 3D proof.
              </p>
              {onOpenUpload && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenUpload(); }}
                  className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer border"
                  style={{
                    fontSize: 'clamp(6px, 1.1vw, 8px)',
                    padding: '3px 10px',
                    background: '#181410',
                    color: '#E8D4B8',
                    borderColor: 'rgba(197,168,128,0.5)',
                  }}>
                  <Upload className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  <span>Upload Album</span>
                </button>
              )}
            </div>
            <span className="font-mono tracking-wider text-[#8C6D3F]"
              style={{ fontSize: 'clamp(5px, 0.9vw, 6.5px)' }}>
              KPR Colour Lab
            </span>
          </div>

          {/* Right: Close album CTA */}
          <div className="w-1/2 h-full flex flex-col justify-between text-center p-2 sm:p-3 relative overflow-hidden"
            style={{ background: '#FAF8F5' }}>
            <span className="font-bold tracking-[0.2em] uppercase text-[#8C6D3F]"
              style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)' }}>
              END OF PREVIEW
            </span>
            <div className="space-y-1 sm:space-y-1.5">
              <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-[#C5A880] mx-auto fill-[#C5A880]/25" />
              <h4 className="font-serif text-[#2A231C] font-semibold leading-tight"
                style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}>
                Preserved for Generations
              </h4>
              <p className="text-[#6A5A4A] leading-tight"
                style={{ fontSize: 'clamp(5px, 1vw, 7px)' }}>
                100% Layflat Flushmount Binding with Ultra-HD 4K Chromogenic Silk Printing
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  fontSize: 'clamp(6px, 1.1vw, 8px)',
                  padding: '3px 10px',
                  background: '#C5A880',
                  color: '#120F0C',
                  boxShadow: '0 2px 8px rgba(197,168,128,0.4)',
                }}>
                <span>Close Album</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            </div>
            <span className="font-mono tracking-widest uppercase text-[#8C6D3F]/70"
              style={{ fontSize: 'clamp(5px, 0.9vw, 6.5px)' }}>
              Turn to Close Atta →
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   Photo Half-Page Helper
   ───────────────────────────────────────────────────── */
function PhotoHalf({ src, label, side }) {
  return (
    <div className={`w-1/2 h-full relative overflow-hidden flex items-center justify-center p-1 sm:p-1.5 ${side === 'left' ? 'border-r' : ''}`}
      style={{ background: '#FAF8F5', borderColor: '#D5C9B8' }}>
      <div className="w-full h-full relative overflow-hidden rounded-sm border"
        style={{ background: 'rgba(0,0,0,0.08)', borderColor: 'rgba(213,201,184,0.7)' }}>
        <img
          src={src}
          alt={label}
          className="w-full h-full object-cover pointer-events-none"
          loading="eager"
          draggable={false}
        />
        <span className={`absolute bottom-1 font-mono text-[#5A4836] rounded-full border shadow-sm font-bold bg-white/95 px-1.5 py-0.5 ${side === 'left' ? 'left-1' : 'right-1'}`}
          style={{ fontSize: 'clamp(5.5px, 1.1vw, 7.5px)', borderColor: '#D5C9B8' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main Export — Hero Interactive Album
   ───────────────────────────────────────────────────── */
export default function HeroInteractiveAlbum({ onOpenUpload, onOpenFullscreen }) {
  /*
   Spread index states:
     0  →  Front Hardcover (closed)
     1  →  Spread 1: Dedication + Royal Bride
     2  →  Spread 2: Couple + Mandap
     3  →  Spread 3: Haldi + Sunset
     4  →  Spread 4: Saree + Reception
     5  →  Spread 5: Upload CTA + Close CTA
     6  →  Back Hardcover (closed)
  */
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dimensions, setDimensions] = useState(getBookDimensions);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleResize = () => setDimensions(getBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSpreads = 6;

  const goToSpread = useCallback((n) => {
    if (n < 0 || n > totalSpreads) return;
    setDirection(n >= spreadIndex ? 1 : -1);
    setSpreadIndex(n);
  }, [spreadIndex]);

  const flipNext = useCallback(() => {
    if (spreadIndex < totalSpreads) {
      setDirection(1);
      setSpreadIndex(p => p + 1);
    }
  }, [spreadIndex]);

  const flipPrev = useCallback(() => {
    if (spreadIndex > 0) {
      setDirection(-1);
      setSpreadIndex(p => p - 1);
    }
  }, [spreadIndex]);

  const handleTouchStart = (e) => {
    if (e.touches?.[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches?.[0]) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dx < 0 ? flipNext() : flipPrev();
    }
  };

  const isCover = spreadIndex === 0;
  const isBackCover = spreadIndex === totalSpreads;
  const isOpen = !isCover && !isBackCover;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none my-0.5 sm:my-1 w-full max-w-full px-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint badge */}
      <div className={`absolute -left-3 xs:-left-8 sm:-left-14 top-1/2 -translate-y-1/2 pointer-events-none select-none z-30 hidden xs:block transition-opacity duration-300 ${isCover ? 'opacity-90' : 'opacity-35'}`}>
        <img
          src="/images/swipe_to_explore.png"
          alt="Swipe to explore"
          className="w-9 xs:w-11 sm:w-14 md:w-16 h-auto object-contain drop-shadow-xs -rotate-6"
          draggable="false"
        />
      </div>

      {/* ── Book Stage ── */}
      <div className="relative flex items-center justify-center select-none">

        {/* Desk shadow */}
        <div
          className="absolute -bottom-3 sm:-bottom-4 h-5 sm:h-7 bg-black/45 blur-md rounded-full pointer-events-none transition-all duration-400"
          style={{ width: isOpen ? dimensions.openW * 0.92 : dimensions.closedW * 0.96 }}
        />

        {/* Fullscreen expand button */}
        {onOpenFullscreen && (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="absolute -top-2.5 -right-2 sm:-top-3 sm:-right-3 z-40 p-1 sm:p-1.5 rounded-full border shadow-md hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            style={{ background: 'rgba(26,26,26,0.92)', color: '#C5A880', borderColor: 'rgba(197,168,128,0.5)' }}
            title="Open Fullscreen 3D Photobook Viewer"
            aria-label="Open Fullscreen Viewer"
          >
            <Maximize2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
          </button>
        )}

        {/* Left navigation arrow */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={spreadIndex === 0}
          className={`absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-35 p-1.5 sm:p-2 rounded-full border shadow-lg transition-all duration-200 cursor-pointer ${spreadIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'}`}
          style={{ background: 'rgba(26,26,26,0.95)', color: '#C5A880', borderColor: 'rgba(197,168,128,0.6)' }}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Right navigation arrow */}
        <button
          type="button"
          onClick={flipNext}
          disabled={spreadIndex >= totalSpreads}
          className={`absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-35 p-1.5 sm:p-2 rounded-full border shadow-lg transition-all duration-200 cursor-pointer ${spreadIndex >= totalSpreads ? 'opacity-0 pointer-events-none' : 'opacity-90 hover:opacity-100 hover:scale-110 active:scale-95'}`}
          style={{ background: 'rgba(26,26,26,0.95)', color: '#C5A880', borderColor: 'rgba(197,168,128,0.6)' }}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* ── Dynamic Book Container ── */}
        <div
          className="relative flex items-center justify-center transition-all duration-400 ease-out"
          style={{
            width: isOpen ? dimensions.openW : dimensions.closedW,
            height: isOpen ? dimensions.openH : dimensions.closedH,
            perspective: 1200,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {/* FRONT COVER */}
            {isCover && (
              <FrontCover key="front" onOpen={flipNext} dimensions={dimensions} />
            )}

            {/* OPEN SPREADS */}
            {isOpen && (
              <OpenSpread
                key={`spread-${spreadIndex}`}
                spreadIndex={spreadIndex}
                direction={direction}
                onPrev={flipPrev}
                onNext={flipNext}
                onClose={flipNext}
                onOpenUpload={onOpenUpload}
              />
            )}

            {/* BACK COVER */}
            {isBackCover && (
              <BackCover key="back" onReopen={() => goToSpread(0)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Page Indicator Dots ── */}
      <div className="flex items-center justify-center gap-1.5 mt-2 select-none z-20">
        <div className="flex items-center gap-1 backdrop-blur-xs px-2.5 py-1 rounded-full border shadow-sm"
          style={{ background: 'rgba(20,20,20,0.92)', borderColor: 'rgba(213,201,184,0.3)' }}>
          {[0, 1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => goToSpread(s)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${spreadIndex === s ? 'h-1 sm:h-1.5 bg-[#C5A880]' : 'h-1 sm:h-1.5 bg-white/40 hover:bg-white/75'}`}
              style={{ width: spreadIndex === s ? '16px' : '6px' }}
              title={s === 0 ? 'Front Cover' : s === 6 ? 'Back Cover' : `Spread ${s} of 5`}
              aria-label={s === 0 ? 'Front Cover' : s === 6 ? 'Back Cover' : `Spread ${s}`}
            />
          ))}
          <span className="font-mono text-[#F5E6D0] ml-1 font-bold tracking-wider"
            style={{ fontSize: 'clamp(7px, 1.4vw, 9.5px)' }}>
            {spreadIndex === 0 ? 'COVER' : spreadIndex === 6 ? 'BACK' : `${spreadIndex}/5`}
          </span>
        </div>

        <span className="text-[#666666] font-medium hidden xs:inline"
          style={{ fontSize: 'clamp(7px, 1.4vw, 9.5px)' }}>
          • Click or swipe to turn
        </span>
      </div>
    </div>
  );
}
