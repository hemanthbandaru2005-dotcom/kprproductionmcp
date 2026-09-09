/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KPR PRODUCTIONS — LUXURY PHOTOBOOK TEMPLATE REGISTRY
 * ═══════════════════════════════════════════════════════════════════════════
 * Separates:
 * 1. Background / Template Artwork (fine art archival paper, gold hairline trims)
 * 2. Photo frames / placeholders (with percentage-based coordinates & zoom/pan)
 * 3. Optional text areas (captions, wedding names, dates)
 */

export const ALBUM_TEMPLATES = {
  T1_HERO_PORTRAIT: {
    id: 'T1_HERO_PORTRAIT',
    name: 'Single Hero Portrait',
    photoCount: 1,
    category: '1 Photo',
    description: 'Full focal portrait with archival bevel mat & gold foil caption',
    slots: [
      {
        id: 'slot-1',
        x: 8,
        y: 8,
        width: 84,
        height: 76,
        label: 'Hero Photo',
        aspect: '4/5'
      }
    ],
    textSlots: [
      {
        id: 'caption',
        x: 8,
        y: 86,
        width: 84,
        height: 8,
        placeholder: 'Narjot & Jasmin · Sacred Vows',
        fontStyle: 'serif',
        align: 'center'
      }
    ]
  },

  T1_FULL_BLEED: {
    id: 'T1_FULL_BLEED',
    name: 'Full Bleed Cinematic',
    photoCount: 1,
    category: '1 Photo',
    description: 'Edge-to-edge luxury impact image with subtle border margin',
    slots: [
      {
        id: 'slot-1',
        x: 4,
        y: 4,
        width: 92,
        height: 92,
        label: 'Cinematic Photo',
        aspect: '1/1'
      }
    ],
    textSlots: []
  },

  T2_DUAL_VERTICAL: {
    id: 'T2_DUAL_VERTICAL',
    name: 'Dual Vertical Story',
    photoCount: 2,
    category: '2 Photos',
    description: 'Two balanced vertical portraits side-by-side with gold divider',
    slots: [
      {
        id: 'slot-1',
        x: 6,
        y: 10,
        width: 42,
        height: 74,
        label: 'Left Photo',
        aspect: '3/4'
      },
      {
        id: 'slot-2',
        x: 52,
        y: 10,
        width: 42,
        height: 74,
        label: 'Right Photo',
        aspect: '3/4'
      }
    ],
    textSlots: [
      {
        id: 'caption',
        x: 8,
        y: 87,
        width: 84,
        height: 7,
        placeholder: 'Two Souls · One Journey',
        fontStyle: 'serif',
        align: 'center'
      }
    ]
  },

  T2_STACKED_LANDSCAPE: {
    id: 'T2_STACKED_LANDSCAPE',
    name: 'Stacked Dual Landscape',
    photoCount: 2,
    category: '2 Photos',
    description: 'Two cinematic landscape photos stacked vertically',
    slots: [
      {
        id: 'slot-1',
        x: 8,
        y: 8,
        width: 84,
        height: 39,
        label: 'Top Photo',
        aspect: '16/9'
      },
      {
        id: 'slot-2',
        x: 8,
        y: 51,
        width: 84,
        height: 39,
        label: 'Bottom Photo',
        aspect: '16/9'
      }
    ],
    textSlots: []
  },

  T3_TRIO_FEATURE: {
    id: 'T3_TRIO_FEATURE',
    name: 'Trio Feature Spread',
    photoCount: 3,
    category: '3 Photos',
    description: 'One prominent landscape photo on top + two companion portraits below',
    slots: [
      {
        id: 'slot-1',
        x: 7,
        y: 7,
        width: 86,
        height: 44,
        label: 'Primary Landscape',
        aspect: '16/9'
      },
      {
        id: 'slot-2',
        x: 7,
        y: 54,
        width: 41.5,
        height: 38,
        label: 'Detail 1',
        aspect: '1/1'
      },
      {
        id: 'slot-3',
        x: 51.5,
        y: 54,
        width: 41.5,
        height: 38,
        label: 'Detail 2',
        aspect: '1/1'
      }
    ],
    textSlots: []
  },

  T4_CLASSIC_GRID: {
    id: 'T4_CLASSIC_GRID',
    name: 'Classic 2x2 Gallery Grid',
    photoCount: 4,
    category: '4 Photos',
    description: 'Four harmonious square photos celebrating cherished ceremony details',
    slots: [
      {
        id: 'slot-1',
        x: 7,
        y: 7,
        width: 41.5,
        height: 41.5,
        label: 'Photo 1',
        aspect: '1/1'
      },
      {
        id: 'slot-2',
        x: 51.5,
        y: 7,
        width: 41.5,
        height: 41.5,
        label: 'Photo 2',
        aspect: '1/1'
      },
      {
        id: 'slot-3',
        x: 7,
        y: 51.5,
        width: 41.5,
        height: 41.5,
        label: 'Photo 3',
        aspect: '1/1'
      },
      {
        id: 'slot-4',
        x: 51.5,
        y: 51.5,
        width: 41.5,
        height: 41.5,
        label: 'Photo 4',
        aspect: '1/1'
      }
    ],
    textSlots: []
  },

  T_EDITORIAL_COLLAGE: {
    id: 'T_EDITORIAL_COLLAGE',
    name: 'Editorial Showcase',
    photoCount: 3,
    category: 'Editorial',
    description: '1 tall bridal portrait with 2 stacked candid moments and quote',
    slots: [
      {
        id: 'slot-1',
        x: 7,
        y: 8,
        width: 45,
        height: 82,
        label: 'Portrait',
        aspect: '9/16'
      },
      {
        id: 'slot-2',
        x: 55,
        y: 8,
        width: 38,
        height: 38,
        label: 'Moment 1',
        aspect: '1/1'
      },
      {
        id: 'slot-3',
        x: 55,
        y: 50,
        width: 38,
        height: 38,
        label: 'Moment 2',
        aspect: '1/1'
      }
    ],
    textSlots: [
      {
        id: 'quote',
        x: 55,
        y: 90,
        width: 38,
        height: 6,
        placeholder: 'Pure Timeless Love',
        fontStyle: 'serif',
        align: 'left'
      }
    ]
  },

  T_CUSTOM_ARTWORK: {
    id: 'T_CUSTOM_ARTWORK',
    name: 'Custom Page Artwork / Template',
    photoCount: 1,
    category: 'Custom',
    description: 'Your own provided background artwork file with photo overlay',
    isCustom: true,
    slots: [
      {
        id: 'slot-1',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        label: 'Artwork Frame',
        aspect: 'any'
      }
    ],
    textSlots: []
  }
};

export const TEMPLATE_LIST = Object.values(ALBUM_TEMPLATES);

export function getTemplateById(id) {
  return ALBUM_TEMPLATES[id] || ALBUM_TEMPLATES.T1_HERO_PORTRAIT;
}
