import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Camera, Sun, Crown, Gift, Flower2, Stars, Film, Play } from 'lucide-react';

const REEL_CONFIGS = {
  corporate: {
    image: '/images/corporate/photo_1.jpg',
    title: 'CORPORATE & COMMERCIAL EVENTS',
    tagline: 'Enterprise Summits, VIP Keynotes, Springboard Panels & Brand Launches',
    accentColor: '#38BDF8',
    type: 'corporate'
  },
  'corporatecommercialevents': {
    image: '/images/corporate/photo_1.jpg',
    title: 'CORPORATE & COMMERCIAL EVENTS',
    tagline: 'Enterprise Summits, VIP Keynotes, Springboard Panels & Brand Launches',
    accentColor: '#38BDF8',
    type: 'corporate'
  },
  '21': {
    image: '/images/reels/birthday.jpg',
    title: '21ST MILESTONE CELEBRATION',
    tagline: 'Grand 21st Birthday & Youth Milestone Moments',
    accentColor: '#F59E0B',
    type: 'twentyone'
  },
  birthday: {
    image: '/images/reels/birthday.jpg',
    title: 'BIRTHDAY CELEBRATION',
    tagline: 'Milestone Joy, Gourmet Cakes & Golden Confetti',
    accentColor: '#EC4899',
    type: 'birthday'
  },
  engagement: {
    image: '/images/reels/engagement.jpg',
    title: 'ENGAGEMENT & PROMISE',
    tagline: 'Interlocking Diamond Rings & Sacred Solitaires',
    accentColor: '#FBBF24',
    type: 'engagement'
  },
  haldi: {
    image: '/images/reels/haldi.jpg',
    title: 'HALDI & MANGALA SNANAM',
    tagline: 'Vibrant Marigold Petal Showers & Auspicious Turmeric',
    accentColor: '#EAB308',
    type: 'haldi'
  },
  modeling: {
    image: '/images/reels/modeling.jpg',
    title: 'MODELING & EDITORIAL',
    tagline: 'Studio Strobe Lighting, Optical Flares & High Fashion',
    accentColor: '#FFFFFF',
    type: 'modeling'
  },
  maternity: {
    image: '/images/reels/maternity.jpg',
    title: 'MATERNITY RADIANCE',
    tagline: 'Golden Hour Sunbeams & Pure Maternal Grace',
    accentColor: '#F472B6',
    type: 'maternity'
  },
  nature: {
    image: '/images/reels/nature.jpg',
    title: 'NATURE & LANDSCAPES',
    tagline: 'Enchanted Forest Canopies & Drifting Sunlight',
    accentColor: '#34D399',
    type: 'nature'
  },
  panchalu: {
    image: '/images/reels/panchalu.jpg',
    title: 'PANCHALU & UYYALA BLESSINGS',
    tagline: 'Traditional Telugu Dhoti & Golden Cradle Rites',
    accentColor: '#C5A880',
    type: 'panchalu'
  },
  prewedding: {
    image: '/images/reels/prewedding.jpg',
    title: 'PRE-WEDDING ROMANCE',
    tagline: 'Sunset Beach Walk & Cinematic Coastal Tales',
    accentColor: '#FB7185',
    type: 'prewedding'
  },
  reception: {
    image: '/images/reels/reception.jpg',
    title: 'GRAND GALA RECEPTION',
    tagline: 'Royal Mandap Stage, Chandeliers & Cold-Spark Pyro',
    accentColor: '#818CF8',
    type: 'reception'
  },
  sareefunction: {
    image: '/images/reels/saree.jpg',
    title: 'HALF SAREE CEREMONY',
    tagline: 'Pure Kanjeevaram Silks, Temple Gold & Heritage Rites',
    accentColor: '#F59E0B',
    type: 'sareefunction'
  },
  wedding: {
    image: '/images/reels/wedding.jpg',
    title: 'ROYAL TELUGU KALYANAM',
    tagline: 'Mangalasutram, Talambralu & Eternal Sacred Vows',
    accentColor: '#EF4444',
    type: 'wedding'
  }
};

/**
 * CategoryReveal Component
 * Plays a bespoke 1.35s photorealistic cinematic video reel matching the chosen category
 * before fading out and allowing the photo grid to animate in.
 */
export default function CategoryReveal({ animationType, onComplete }) {
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    // Elegant, slow cinematic playback duration ~2.0s
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    }, 2000);

    return () => {
      completedRef.current = true;
      clearTimeout(timer);
    };
  }, [animationType, onComplete]);

  // Normalize category key
  const rawKey = (animationType || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let config = REEL_CONFIGS[rawKey];
  if (!config) {
    if (rawKey.includes('corp') || rawKey.includes('commercial')) config = REEL_CONFIGS.corporate;
    else if (rawKey === '21' || rawKey.includes('twenty')) config = REEL_CONFIGS['21'];
    else if (rawKey.includes('birth')) config = REEL_CONFIGS.birthday;
    else if (rawKey.includes('engage')) config = REEL_CONFIGS.engagement;
    else if (rawKey.includes('hald')) config = REEL_CONFIGS.haldi;
    else if (rawKey.includes('model') || rawKey.includes('port')) config = REEL_CONFIGS.modeling;
    else if (rawKey.includes('mater')) config = REEL_CONFIGS.maternity;
    else if (rawKey.includes('natur')) config = REEL_CONFIGS.nature;
    else if (rawKey.includes('panch')) config = REEL_CONFIGS.panchalu;
    else if (rawKey.includes('pre')) config = REEL_CONFIGS.prewedding;
    else if (rawKey.includes('recep')) config = REEL_CONFIGS.reception;
    else if (rawKey.includes('saree')) config = REEL_CONFIGS.sareefunction;
    else config = REEL_CONFIGS.wedding;
  }

  const catType = config.type;

  return (
    <motion.div
      key={`reveal-${animationType}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="w-full min-h-[240px] sm:min-h-[300px] my-4 sm:my-8 rounded-2xl sm:rounded-3xl bg-[#07090E] border border-[#C5A880]/30 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center select-none transform-gpu"
    >
      {/* ── 1. Real Cinematic Slow-Motion High-Resolution Video Motion Background ── */}
      <motion.img
        src={config.image}
        alt={config.title}
        initial={{ scale: 1.0, y: 0 }}
        animate={{ scale: 1.08, y: -6 }}
        transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0 transform-gpu"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* ── 2. Cinematic Lighting & Gradient Film Vignette ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/85 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.85)_100%)] z-10 pointer-events-none" />

      {/* ── 3. Category-Specific Dynamic Motion Particle FX ── */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex items-center justify-center">
        
        {/* BIRTHDAY & 21: Radial Sparkling Confetti Burst & Candle Glow */}
        {(catType === 'birthday' || catType === 'twentyone') && (
          <>
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * 360;
              const dist = 90 + (i % 4) * 30;
              const rad = (angle * Math.PI) / 180;
              const colors = ['#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#10B981', '#FBBF24', '#FFFFFF'];
              return (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    opacity: [0, 1, 1, 0],
                    scale: [0.3, 1.4, 0.6, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
              );
            })}
          </>
        )}

        {/* ENGAGEMENT: Diamond Prism Glint & White Flash on Contact */}
        {catType === 'engagement' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 0], opacity: [0, 1, 0] }}
            transition={{ delay: 0.35, duration: 0.65 }}
            className="absolute w-16 h-16 rounded-full bg-white blur-[3px] flex items-center justify-center shadow-[0_0_30px_white]"
          >
            <Stars className="w-14 h-14 text-amber-200 fill-white" />
          </motion.div>
        )}

        {/* HALDI: Cascading Marigold Petal Shower */}
        {catType === 'haldi' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -30,
                  x: `${(i / 18) * 100}%`,
                  opacity: 0,
                  rotate: Math.random() * 180,
                  scale: 0.6 + (i % 3) * 0.3
                }}
                animate={{
                  y: ['0%', '110%'],
                  x: `${(i / 18) * 100 + (i % 2 === 0 ? 5 : -5)}%`,
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 240]
                }}
                transition={{
                  duration: 1.1,
                  delay: i * 0.04,
                  ease: 'easeInOut'
                }}
                className="absolute top-0 w-4 h-4 rounded-tr-full rounded-bl-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 shadow-[0_0_10px_#F59E0B]"
              />
            ))}
          </div>
        )}

        {/* MODELING: Studio Camera Shutter Flash Overlay */}
        {catType === 'modeling' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="absolute inset-0 bg-white"
          />
        )}

        {/* MATERNITY: Floating Pastel Bokeh Hearts */}
        {catType === 'maternity' && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: 120,
                  x: `${15 + i * 6}%`,
                  scale: 0.3,
                  opacity: 0
                }}
                animate={{
                  y: [-20, -100],
                  scale: [0.3, 1.2, 0.7],
                  opacity: [0, 0.9, 0]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.08,
                  ease: 'easeOut'
                }}
                className="absolute text-rose-300 filter drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]"
              >
                <Heart className="w-6 h-6 fill-rose-300" />
              </motion.div>
            ))}
          </div>
        )}

        {/* NATURE: Drifting Forest Leaves & Sweeping Sunbeams */}
        {catType === 'nature' && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '120%', opacity: [0, 0.7, 0] }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-48 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent skew-x-12"
          />
        )}

        {/* PANCHALU: Golden Starlight Particles */}
        {catType === 'panchalu' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
                className="absolute"
                style={{
                  top: `${25 + (i % 4) * 15}%`,
                  left: `${20 + i * 7}%`
                }}
              >
                <Sparkles className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_#F59E0B]" />
              </motion.div>
            ))}
          </div>
        )}

        {/* PRE WEDDING: Rose Petals Converging & Dispersing */}
        {catType === 'prewedding' && (
          <div className="relative w-48 h-32 flex items-center justify-center">
            {[...Array(14)].map((_, i) => {
              const angle = (i / 14) * 360;
              const rad = (angle * Math.PI) / 180;
              const startDist = 90;
              const xStart = Math.cos(rad) * startDist;
              const yStart = Math.sin(rad) * startDist;
              return (
                <motion.div
                  key={i}
                  initial={{ x: xStart, y: yStart, opacity: 0, scale: 0.4 }}
                  animate={{
                    x: [xStart, 0, xStart * 1.4],
                    y: [yStart, 0, yStart * 1.4],
                    opacity: [0, 1, 1, 0],
                    scale: [0.4, 1.3, 0.6],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 1.2, times: [0, 0.5, 1], ease: 'easeInOut' }}
                  className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-rose-600 via-rose-400 to-pink-300 shadow-[0_0_10px_#E11D48]"
                />
              );
            })}
          </div>
        )}

        {/* RECEPTION: Glitter Shower & Cold-Spark Explosions */}
        {catType === 'reception' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -20,
                  x: (Math.random() - 0.5) * 260,
                  opacity: 0,
                  scale: 0.2
                }}
                animate={{
                  y: [0, 90],
                  opacity: [0, 1, 0],
                  scale: [0.2, 1.2, 0.3]
                }}
                transition={{
                  duration: 1.0,
                  delay: i * 0.03,
                  ease: 'easeOut'
                }}
                className="absolute w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_8px_white]"
              />
            ))}
          </div>
        )}

        {/* SAREE FUNCTION: Silk Zari Golden Shimmer */}
        {catType === 'sareefunction' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_20px_#F59E0B]"
          />
        )}

        {/* WEDDING: Sacred Talambralu Floral Petal Shower & Golden Fireworks */}
        {catType === 'wedding' && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {[...Array(22)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -30,
                  x: `${(i / 22) * 100}%`,
                  opacity: 0,
                  rotate: 0
                }}
                animate={{
                  y: ['0%', '110%'],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.03,
                  ease: 'easeInOut'
                }}
                className="absolute top-0 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-red-600 via-rose-400 to-amber-300 shadow-[0_0_8px_#EF4444]"
              />
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute z-30"
            >
              <Stars className="w-16 h-16 text-amber-200 fill-amber-100" />
            </motion.div>
          </div>
        )}

      </div>

      {/* ── 4. Main Foreground Reel Title & Tagline ── */}
      <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col items-center"
        >
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md mb-3 shadow-xl">
            <Sparkles className="w-3.5 h-3.5" style={{ color: config.accentColor }} />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-white uppercase">
              {config.title}
            </span>
          </div>

          {/* Tagline */}
          <p className="text-xs sm:text-sm md:text-base font-light text-white/90 tracking-wide max-w-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-sans">
            {config.tagline}
          </p>

          {/* Accent Underline */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-[2px] rounded-full mt-3 shadow-lg"
            style={{ backgroundColor: config.accentColor }}
          />
        </motion.div>
      </div>

    </motion.div>
  );
}
