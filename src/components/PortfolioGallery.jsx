import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GALLERY_ITEMS as INITIAL_GALLERY_ITEMS, CATEGORIES } from '../data/galleryData';
import { fetchCustomSitePhotos } from '../utils/sitePhotosService';
import { Heart, Maximize2, MapPin, Sparkles } from 'lucide-react';
import CategoryReveal from './CategoryReveal';

export default function PortfolioGallery({ onSelectPhoto, moodboardIds = [], toggleMoodboardItem }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0] || 'Wedding');
  const [items, setItems] = useState(INITIAL_GALLERY_ITEMS);

  // Animation Sequence States
  // 'idle' (grid showing) | 'revealing' (themed animation panel showing)
  const [phase, setPhase] = useState('idle');
  const [revealingCategory, setRevealingCategory] = useState(null);

  // Sequence sequenceId tracking for immediate cancellation on fast clicks
  const sequenceRef = useRef(0);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Preload all 12 category reel images into memory for 0ms lag
  useEffect(() => {
    const reelImages = [
      '/images/reels/birthday.jpg',
      '/images/reels/engagement.jpg',
      '/images/reels/haldi.jpg',
      '/images/reels/maternity.jpg',
      '/images/reels/nature.jpg',
      '/images/reels/panchalu.jpg',
      '/images/reels/prewedding.jpg',
      '/images/reels/reception.jpg',
      '/images/reels/saree.jpg',
      '/images/reels/wedding.jpg',
      '/images/reels/modeling.jpg',
      '/images/corporate/photo_1.jpg'
    ];
    reelImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Load existing items PLUS any custom photography photos from Supabase
  useEffect(() => {
    async function loadGallery() {
      try {
        const customPhotos = await fetchCustomSitePhotos('photography');
        if (customPhotos && customPhotos.length > 0) {
          const photoOnly = customPhotos.filter(p => (p.gallery || '').toLowerCase() === 'photography');
          const formattedCustom = photoOnly.map(p => ({
            id: p.id,
            title: p.title || `${p.category} Photo`,
            category: p.category,
            image: p.file_url,
            rawImage: p.file_url,
            location: 'Telangana, India',
            story: 'KPR Productions Fine Art Showcase',
            isCustom: true
          }));

          setItems([...formattedCustom, ...INITIAL_GALLERY_ITEMS]);
          return;
        }
      } catch (e) {
        console.warn('Error loading custom photography photos:', e);
      }
      setItems(INITIAL_GALLERY_ITEMS);
    }

    loadGallery();
  }, []);

  // Handle Category Filter Click
  const handleCategoryClick = (category) => {
    if (category === activeCategory && phase === 'idle') return;

    // Increment sequence ID to invalidate any in-flight sequence
    const currentSeq = ++sequenceRef.current;

    // If user prefers reduced motion, switch directly without themed reveal
    if (prefersReducedMotion) {
      setActiveCategory(category);
      setPhase('idle');
      setRevealingCategory(null);
      return;
    }

    // 1. Enter revealing phase with the chosen category
    setActiveCategory(category);
    setRevealingCategory(category);
    setPhase('revealing');
  };

  // Called when the themed animation completes
  const handleRevealComplete = (completedSeq) => {
    // Only transition if this sequence is still the latest active one
    if (completedSeq === sequenceRef.current) {
      setPhase('idle');
      setRevealingCategory(null);
    }
  };

  const filteredItems = items.filter(
    (item) => item.category === activeCategory
  );

  return (
    <section id="portfolio" className="py-8 sm:py-12 bg-[#F7F3EE] relative overflow-hidden w-full">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sm:mb-12">
          <div className="text-center md:text-left max-w-2xl">
            <p className="text-[10px] sm:text-[12px] tracking-[0.4em] uppercase text-[#666666] font-medium mb-2 flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>CURATED WORKS ({items.length} TOTAL PHOTOS)</span>
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1A1A] font-light tracking-wide">
              THE GALLERY COLLECTION
            </h2>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold transition-all duration-300 cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-lg border border-[#1A1A1A] scale-105'
                    : 'bg-white text-[#555555] hover:text-black hover:bg-[#EFE8DD] border border-[#E2D9CC]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* ═══════ ANIMATED CONTAINER ═══════ */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* 1. THEMED ANIMATION REVEAL PANEL */}
            {phase === 'revealing' && revealingCategory ? (
              <motion.div
                key={`reveal-container-${revealingCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
              >
                <CategoryReveal
                  animationType={revealingCategory}
                  onComplete={() => handleRevealComplete(sequenceRef.current)}
                />
              </motion.div>
            ) : (
              /* 2. PHOTO GRID WITH STAGGERED ENTRANCE & FADE/SLIDE EXIT */
              <motion.div
                key={`grid-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: 20, transition: { duration: 0.3, ease: 'easeOut' } }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              >
                {filteredItems.map((item, index) => {
                  const isSaved = moodboardIds.includes(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.28,
                        delay: prefersReducedMotion ? 0 : Math.min(index * 0.025, 0.2),
                        ease: 'easeOut'
                      }}
                      className="group relative bg-white p-2 sm:p-2.5 rounded-[14px] border border-[#E2D9CC] shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl overflow-hidden transform-gpu cursor-pointer"
                      onClick={() => onSelectPhoto(item)}
                    >
                      {/* Image Container - Pure Photo Display */}
                      <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-[#1A1A1A]">
                        <img
                          src={item.image}
                          alt={item.title || 'KPR Fotography'}
                          loading={index < 6 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 select-none"
                        />
                        
                        {/* Elegant Hover Overlay with Quick Actions (No Text) */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                          <div className="p-3.5 rounded-full bg-white/90 text-black shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Maximize2 className="w-5 h-5" />
                          </div>

                          {/* Heart Button Top-Right */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof toggleMoodboardItem === 'function') {
                                toggleMoodboardItem(item.id);
                              }
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-90 cursor-pointer shadow-md ${
                              isSaved ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-red-500'
                            }`}
                            title={isSaved ? 'Saved' : 'Save'}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
