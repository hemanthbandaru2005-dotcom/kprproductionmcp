/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KPR PRODUCTIONS — DEFAULT LUXURY WEDDING PHOTOBOOK DATA
 * ═══════════════════════════════════════════════════════════════════════════
 * Fully populated with the user's authentic supplied covers and high-res
 * ceremony photographs to demonstrate realistic 3D flipping out-of-the-box.
 */

export const INITIAL_AVAILABLE_PHOTOS = [
  { id: 'pool-1', src: '/images/wedding/photo_1.jpg', name: 'Ceremony Vows' },
  { id: 'pool-2', src: '/images/wedding/photo_2.jpg', name: 'Bridal Portrait' },
  { id: 'pool-3', src: '/images/wedding/photo_3.jpg', name: 'Groom Elegance' },
  { id: 'pool-4', src: '/images/wedding/photo_4.jpg', name: 'Mandap Rituals' },
  { id: 'pool-5', src: '/images/wedding/photo_5.jpg', name: 'Sacred Fire Saptapadi' },
  { id: 'pool-6', src: '/images/wedding/photo_6.jpg', name: 'Ring Exchange' },
  { id: 'pool-7', src: '/images/wedding/photo_7.jpg', name: 'Floral Haldi Smiles' },
  { id: 'pool-8', src: '/images/wedding/photo_8.jpg', name: 'Family Blessings' },
  { id: 'pool-9', src: '/images/wedding/photo_9.jpg', name: 'Candid Joy' },
  { id: 'pool-10', src: '/images/wedding/photo_10.jpg', name: 'Grand Stage Entry' },
  { id: 'pool-11', src: '/images/wedding/photo_11.jpg', name: 'Sunset Vows' },
  { id: 'pool-12', src: '/images/wedding/photo_12.jpg', name: 'Royal Procession' },
  { id: 'pool-13', src: '/images/wedding/photo_13.jpg', name: 'Cinematic Embrace' },
  { id: 'pool-14', src: '/images/wedding/photo_14.jpg', name: 'Bridal Lehengas' },
  { id: 'pool-15', src: '/images/wedding/photo_15.jpg', name: 'Jewelry & Detailing' },
  { id: 'pool-16', src: '/images/wedding/photo_16.jpg', name: 'Celebration Confetti' },
  { id: 'pool-17', src: '/images/wedding/photo_17.jpg', name: 'Cherished Forever' }
];

export const DEFAULT_ALBUM = {
  id: 'kpr-album-narjot-jasmin',
  title: 'Narjot & Jasmin · Wedding Ceremony',
  date: '28 November 2023',
  subtitle: 'Luxury Archival Layflat Heirloom',
  size: '12x36',
  cover: {
    frontImage: '/images/album/front_cover.jpg',
    backImage: '/images/album/back_cover.jpg',
    title: 'WEDDING CEREMONY',
    couple: 'Narjot & Jasmin',
    date: '28 NOVEMBER 23'
  },
  pages: [
    // Spread 1: Left (Page 1) + Right (Page 2)
    {
      id: 'page-1',
      pageNumber: 1,
      templateId: 'T1_HERO_PORTRAIT',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_1.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {
        caption: 'Narjot & Jasmin · The Beginning of Forever'
      }
    },
    {
      id: 'page-2',
      pageNumber: 2,
      templateId: 'T2_DUAL_VERTICAL',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_2.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-2': {
          src: '/images/wedding/photo_3.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {
        caption: 'Sacred Rituals & Eternal Promises'
      }
    },

    // Spread 2: Left (Page 3) + Right (Page 4)
    {
      id: 'page-3',
      pageNumber: 3,
      templateId: 'T3_TRIO_FEATURE',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_4.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-2': {
          src: '/images/wedding/photo_5.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-3': {
          src: '/images/wedding/photo_6.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {}
    },
    {
      id: 'page-4',
      pageNumber: 4,
      templateId: 'T4_CLASSIC_GRID',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_7.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-2': {
          src: '/images/wedding/photo_8.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-3': {
          src: '/images/wedding/photo_9.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-4': {
          src: '/images/wedding/photo_10.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {}
    },

    // Spread 3: Left (Page 5) + Right (Page 6)
    {
      id: 'page-5',
      pageNumber: 5,
      templateId: 'T2_STACKED_LANDSCAPE',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_11.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-2': {
          src: '/images/wedding/photo_12.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {}
    },
    {
      id: 'page-6',
      pageNumber: 6,
      templateId: 'T1_FULL_BLEED',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_13.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {}
    },

    // Spread 4: Left (Page 7) + Right (Page 8)
    {
      id: 'page-7',
      pageNumber: 7,
      templateId: 'T_EDITORIAL_COLLAGE',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_14.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-2': {
          src: '/images/wedding/photo_15.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        },
        'slot-3': {
          src: '/images/wedding/photo_16.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {
        quote: 'Whispers of Love & Everlasting Joy'
      }
    },
    {
      id: 'page-8',
      pageNumber: 8,
      templateId: 'T1_HERO_PORTRAIT',
      backgroundUrl: null,
      photos: {
        'slot-1': {
          src: '/images/wedding/photo_17.jpg',
          scale: 1,
          offsetX: 0,
          offsetY: 0,
          fit: 'cover'
        }
      },
      textSlots: {
        caption: 'Cherished Memories · Bound For Generations'
      }
    }
  ]
};

export const ALBUM_STORAGE_KEY = 'kpr_digital_album_data_v1';

export function loadSavedAlbum() {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ALBUM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load saved album from localStorage:', e);
  }
  return DEFAULT_ALBUM;
}

export function saveAlbumToStorage(album) {
  try {
    if (typeof window !== 'undefined' && album) {
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(album));
      return true;
    }
  } catch (e) {
    console.warn('Failed to save album to localStorage:', e);
  }
  return false;
}
