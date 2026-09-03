import { supabase } from './supabaseClient';
import { SERVICES_PACKAGES as INITIAL_PHOTOGRAPHY_PACKAGES } from '../data/packagesData';
import { PRINTING_DESIGN_SERVICES as INITIAL_COLORLAB_SERVICES } from '../data/servicesData';

const PACKAGES_STORAGE_KEY = 'kpr_site_packages_v16';

export const OFFICIAL_PHOTOGRAPHY_PACKAGES = [
  {
    id: 'pkg-1',
    type: 'photography',
    name: 'Traditional Photo',
    price: 6000,
    duration: '6 hours',
    category: 'Photography',
    image: '/images/packages/user_pkg_trad_photo.png',
    popular: false,
    description: 'Complete traditional photo coverage for Telugu wedding ceremonies, family group portraits, and stage rituals.',
    features: [
      '6 hours on-site coverage',
      'Full event high-resolution photos',
      'Colour corrected deliverables',
      'Direct cloud link delivery'
    ],
    display_order: 1,
    status: 'active'
  },
  {
    id: 'pkg-2',
    type: 'photography',
    name: 'Traditional Video',
    price: 6000,
    duration: '6 hours',
    category: 'Videography',
    image: '/images/packages/user_pkg_trad_video.png',
    popular: false,
    description: 'Full HD continuous multi-angle video recording for traditional stage and ritual proceedings.',
    features: [
      '6 hours continuous coverage',
      'Full HD master output',
      'Clean audio recording',
      'Complete event footage'
    ],
    display_order: 2,
    status: 'active'
  },
  {
    id: 'pkg-3',
    type: 'photography',
    name: 'Candid Photography',
    price: 12000,
    duration: '6 hours',
    category: 'Photography',
    image: '/images/packages/user_pkg_candid_photo.png',
    popular: true,
    description: 'Artistic story-driven emotional portraits, candid bride & groom captures, and cinematic depth.',
    features: [
      '6 hours prime candid coverage',
      'Master colour graded shots',
      'High-speed prime lens portraits',
      'Social media teaser deliverable'
    ],
    display_order: 3,
    status: 'active'
  },
  {
    id: 'pkg-4',
    type: 'photography',
    name: 'Cinematic Video',
    price: 14000,
    duration: '6 hours',
    category: 'Videography',
    image: '/images/packages/user_pkg_cinematic_video.png',
    popular: true,
    description: '4K slow-motion cinematic camera recording with gimbal stabilization and artistic storytelling.',
    features: [
      '6 hours 4K cinematic shoot',
      'Gimbal & prime lens stabilization',
      'Cinematic LUT colour grading',
      'Highlight reel & master cuts'
    ],
    display_order: 4,
    status: 'active'
  },
  {
    id: 'pkg-5',
    type: 'photography',
    name: 'Drone',
    price: 6000,
    duration: '4 hours',
    category: 'Aerial',
    image: '/images/packages/user_pkg_drone.png',
    popular: false,
    description: '4K aerial bird-eye views of grand wedding venues, baraat processions, and outdoor entry moments.',
    features: [
      '4 hours aerial coverage',
      '4K high-altitude views',
      'Licensed drone pilot',
      'Baraat & venue bird-eye shots'
    ],
    display_order: 5,
    status: 'active'
  },
  {
    id: 'pkg-6',
    type: 'photography',
    name: 'LED Screen',
    price: 16000,
    duration: '6 hours (+ Transport Charges)',
    category: 'Setup',
    image: '/images/packages/user_pkg_led_screen.png',
    popular: false,
    description: 'High-brightness P3 outdoor/indoor high-definition LED wall for live event broadcast & stage visuals.',
    features: [
      '6 hours live stage display',
      'P3 high-density LED wall',
      'Live camera visual switching',
      'On-site technical operator'
    ],
    display_order: 6,
    status: 'active'
  },
  {
    id: 'pkg-7',
    type: 'photography',
    name: 'Avata Drone',
    price: 12000,
    duration: '3 hours',
    category: 'Aerial',
    image: '/images/packages/user_pkg_avata_drone.png',
    popular: false,
    description: 'Ultra-fast acrobatic FPV drone flight capturing thrilling bride/groom entries, indoor fly-throughs, and dynamic reels.',
    features: [
      '3 hours FPV dynamic coverage',
      'Indoor & outdoor proximity flight',
      'High-speed 4K 60fps recording',
      'Cinematic reel ready motion'
    ],
    display_order: 7,
    status: 'active'
  },
  {
    id: 'pkg-8',
    type: 'photography',
    name: 'Live Link',
    price: 6000,
    duration: '4 hours',
    category: 'Broadcast',
    image: '/images/packages/in_live_link.png',
    popular: false,
    description: 'Private or public Full HD multi-cam YouTube/custom live streaming link for global family viewing.',
    features: [
      '4 hours unbroken HD stream',
      'Multi-camera switcher setup',
      'Private YouTube or web link',
      'Immediate archive recording'
    ],
    display_order: 8,
    status: 'active'
  },
  {
    id: 'pkg-9',
    type: 'photography',
    name: 'Cinematic Teaser',
    price: 8000,
    duration: '4-5 min',
    category: 'Editing',
    image: '/images/packages/in_teaser.png',
    popular: true,
    description: 'Premium 4-5 minute cinematic teaser trailer with custom sound design, dialogue mixing, and color grading.',
    features: [
      '4-5 minute luxury teaser',
      'Custom music sound design',
      'Dialogue & speech integration',
      'Instagram reel 9:16 export included'
    ],
    display_order: 9,
    status: 'active'
  },
  {
    id: 'pkg-10',
    type: 'photography',
    name: 'Traditional Video Editing',
    price: 2000,
    duration: '1 hour',
    category: 'Editing',
    image: '/images/packages/trad_editing_user.png',
    popular: false,
    description: 'Chronological full-length Telugu wedding ritual editing with titles, songs, transitions, and audio sync.',
    features: [
      '1 hour finished output',
      'Complete ritual sequence',
      'Custom background songs',
      'Full HD master rendering'
    ],
    display_order: 10,
    status: 'active'
  },
  {
    id: 'pkg-11',
    type: 'photography',
    name: 'Cinematic Video Editing',
    price: 6000,
    duration: '1 hour',
    category: 'Editing',
    image: '/images/packages/cinematic_editing_user.png',
    popular: false,
    description: 'High-end cinematic documentary editing with colour grading, scene pacing, and audio mastering.',
    features: [
      '1 hour cinematic documentary cut',
      'Professional color correction',
      'Multi-track audio mastering',
      'High-bitrate 4K/FHD export'
    ],
    display_order: 11,
    status: 'active'
  },
  {
    id: 'pkg-12',
    type: 'photography',
    name: 'Each Album One Sheet',
    price: 250,
    duration: 'per sheet',
    category: 'Print Album',
    image: '/images/packages/in_album_sheet.png',
    unit: 'sheet',
    popular: false,
    description: 'Fine art photographic album sheet printing on archival non-tearable paper with UV protective lamination.',
    features: [
      'Per sheet custom printing',
      'Archival non-tearable paper',
      'Thermal UV gloss/matt coating',
      'High-density color fidelity'
    ],
    display_order: 12,
    status: 'active'
  },
  {
    id: 'pkg-corp-1',
    type: 'photography',
    name: 'Corporate & Commercial Events',
    clientHighlights: 'Tata Tele & JSW, Government Events, RS Brothers',
    price: 15000,
    duration: '6 hours / Custom Scope',
    category: 'Corporate & Commercial',
    image: '/images/packages/user_pkg_corporate_events.png',
    popular: true,
    description: 'Enterprise & commercial coverage for Tata Tele & JSW summits, Government Events protocol, RS Brothers retail campaigns, corporate AGMs, and commercial launches.',
    features: [
      'Tata Tele & JSW industrial summits & conferences',
      'Government Events & official state protocol',
      'RS Brothers & flagship retail showroom launches',
      'Keynote speakers, VIP portraits & same-day media'
    ],
    display_order: 13,
    status: 'active'
  }
];

export const OFFICIAL_COLORLAB_SERVICES = [
  {
    id: 'cl-1',
    type: 'colorlab',
    name: 'Wedding Album Printing',
    price: 4500,
    duration: 'Luxury Handcrafted Flush-Mount Layflat Albums',
    category: 'Album Artistry',
    image: '/images/services/wedding_album_printing.png',
    popular: true,
    description: 'Premium Italian leather, velvet & acrylic wedding albums with gold foil embossing, layflat archival sheets, custom color grading, and long-lasting heirloom finish for Telangana traditional weddings.',
    features: [
      'Luxury handcrafted flush-mount layflat albums',
      'Italian leather, velvet & acrylic covers',
      'Gold foil embossing & thermal UV lamination',
      'Archival museum non-tearable paper'
    ],
    display_order: 1,
    status: 'active'
  },
  {
    id: 'cl-2',
    type: 'colorlab',
    name: 'Colour Jet SONIQ Printer Large Format Flex Printer',
    price: 1200,
    duration: 'High-Speed Industrial Flex & Vinyl Printing',
    category: 'Large Format Flex',
    image: '/images/services/colorjet_soniq_printer.jpg',
    popular: false,
    description: 'Industrial-grade ColourJet SONIQ i large format flex & vinyl printer delivering vibrant, photorealistic prints with high-speed multi-head precision for event backdrops, hoardings, and stage banners.',
    features: [
      'High-speed industrial flex & vinyl printing',
      'Weatherproof & UV resistant media',
      'Photorealistic multi-head color precision',
      'Event backdrops, hoardings & stage banners'
    ],
    display_order: 2,
    status: 'active'
  },
  {
    id: 'cl-3',
    type: 'colorlab',
    name: 'Laser Printing & Precision Cutting',
    price: 1800,
    duration: 'Wooden, Stone & Acrylic Laser Engraving & CNC Cutting',
    category: 'Laser & Cutting',
    image: '/images/services/laser_printing.png',
    popular: false,
    description: 'Precision CNC laser engraving, cutting and etching on natural wood, stone, and crystal-clear acrylic sheets. Perfect for mandap decor, custom nameplates, portraits, and luxury event displays.',
    features: [
      'Precision CNC laser engraving & cutting',
      'Natural wood, polished stone & acrylic etching',
      '3D layered mandap decor & nameplates',
      'Custom wedding monogram engraving'
    ],
    display_order: 3,
    status: 'active'
  },
  {
    id: 'cl-4',
    type: 'colorlab',
    name: 'Canon imagePROGRAF GP-566S 60 in Large Format Photo Printer 7 Colours',
    price: 3500,
    duration: 'Ultra-Wide 7-Colour Archival Wedding Portraits & Canvas Prints',
    category: '60" Fine Art Photo',
    image: '/images/services/canon_imageprograf_printer.png',
    popular: true,
    description: 'Flagship Canon imagePROGRAF GP-566S 60-inch large format 7-colour photo printer featuring fluorescent pink ink and LUCIA PRO II pigment inks for stunning wide-gamut wedding portraits, canvas gallery wraps, and archival prints.',
    features: [
      'Ultra-wide 7-colour photo printing with fluorescent pink ink',
      'LUCIA PRO II archival pigment inks',
      '60-inch large format wedding portraits & canvas wraps',
      '100+ year anti-fade archival guarantee'
    ],
    display_order: 4,
    status: 'active'
  },
  {
    id: 'cl-5',
    type: 'colorlab',
    name: 'Acrylic & MDF Frames',
    price: 2200,
    duration: '3D Glossy Acrylic & Carved Wooden Wall Displays',
    category: 'Modern Wall Frames',
    image: '/images/services/acrylic_mdf_frames.png',
    popular: false,
    description: 'Ultra-modern 3D acrylic wall mounts and precision MDF carved frames with warm LED backlighting, making wedding portraits stand out like museum artwork.',
    features: [
      '3D high-gloss crystal acrylic wall mounts',
      'Precision carved MDF wooden frames',
      'Optional warm LED backlighting',
      'Museum quality portrait display'
    ],
    display_order: 5,
    status: 'active'
  },
  {
    id: 'cl-6',
    type: 'colorlab',
    name: 'Photo Frames',
    price: 950,
    duration: 'ReFrames, Antique Brass & Glass Table Frames',
    category: 'Classic Framing',
    image: '/images/services/photo_frames.png',
    popular: false,
    description: 'Hand-finished ReFrames, gold leaf, and glass photo frames crafted to preserve cherished family memories, wedding couple portraits, and event highlights.',
    features: [
      'Hand-finished ReFrames & gold leaf borders',
      'Antique brass & scratch resistant glass',
      'Tabletop stands & wall hanging mounts',
      'Custom photo framing & preservation'
    ],
    display_order: 6,
    status: 'active'
  }
];

function normalizePackageDurations(pkgs) {
  if (!Array.isArray(pkgs)) return [];
  const officialLookup = [...OFFICIAL_PHOTOGRAPHY_PACKAGES, ...OFFICIAL_COLORLAB_SERVICES];
  return pkgs.map(p => {
    const match = officialLookup.find(o => o.id === p.id || o.name === p.name);
    const enriched = {
      ...match,
      ...p,
      category: p.category || match?.category || (p.type === 'colorlab' ? 'Album Artistry' : 'Photography'),
      image: p.image || match?.image || (p.type === 'colorlab' ? '/images/services/wedding_album_printing.png' : '/images/packages/user_pkg_candid_photo.png'),
      popular: p.popular !== undefined ? p.popular : match?.popular || false,
    };
    if (enriched.name === 'Candid Photography' && (enriched.duration === 'Full Coverage' || !enriched.duration)) {
      enriched.duration = '6 hours';
    }
    if (enriched.name === 'Cinematic Videography' && (enriched.duration === 'Full Coverage' || !enriched.duration)) {
      enriched.duration = '6 hours';
    }
    return enriched;
  });
}

export function getLocalPackages() {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizePackageDurations(parsed);
      }
    }
  } catch (e) {}

  // Initialize seed packages if empty
  const initial = [
    ...OFFICIAL_PHOTOGRAPHY_PACKAGES,
    ...OFFICIAL_COLORLAB_SERVICES
  ];
  saveLocalPackages(initial);
  return initial;
}

export function saveLocalPackages(packages) {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  } catch (e) {}
}

/**
 * Reset all packages in local cache & Supabase back to verified studio defaults
 */
export async function resetToDefaultPackages() {
  const initial = [
    ...OFFICIAL_PHOTOGRAPHY_PACKAGES,
    ...OFFICIAL_COLORLAB_SERVICES
  ];

  saveLocalPackages(initial);

  try {
    // Attempt to upsert to supabase
    for (const pkg of initial) {
      const dbPayload = {
        id: pkg.id,
        type: pkg.type,
        name: pkg.name,
        price: pkg.price,
        duration: pkg.duration,
        description: pkg.description || '',
        features: pkg.features || [],
        display_order: pkg.display_order || 1,
        status: pkg.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await supabase.from('packages').upsert(dbPayload, { onConflict: 'id' });
    }
  } catch (e) {
    console.warn('Supabase reset error:', e);
  }

  return initial;
}

export async function fetchSitePackages(type = 'photography', includeHidden = false) {
  const targetType = (type || 'photography').toLowerCase().trim();

  try {
    let query = supabase
      .from('packages')
      .select('*')
      .eq('type', targetType)
      .order('display_order', { ascending: true });

    if (!includeHidden) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      const sanitized = normalizePackageDurations(data);
      return sanitized.filter(p => p.type === targetType && (includeHidden || p.status === 'active'));
    }
  } catch (err) {
    console.warn('Supabase packages query failed, using local store:', err);
  }

  const local = getLocalPackages();
  return local.filter(p => p.type === targetType && (includeHidden || p.status === 'active'));
}

export async function saveSitePackage(pkgPayload) {
  const isEdit = Boolean(pkgPayload.id);
  const pkgData = {
    id: pkgPayload.id || `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: pkgPayload.type || 'photography',
    name: pkgPayload.name,
    price: Number(pkgPayload.price) || 0,
    duration: pkgPayload.duration || '6 hours',
    category: pkgPayload.category || 'Photography',
    image: pkgPayload.image || '/images/packages/user_pkg_candid_photo.png',
    popular: Boolean(pkgPayload.popular),
    description: pkgPayload.description || '',
    features: Array.isArray(pkgPayload.features) ? pkgPayload.features.filter(Boolean) : [],
    display_order: Number(pkgPayload.display_order) || 1,
    status: pkgPayload.status || 'active',
    updated_at: new Date().toISOString(),
    created_at: pkgPayload.created_at || new Date().toISOString()
  };

  const dbPayload = {
    id: pkgData.id,
    type: pkgData.type,
    name: pkgData.name,
    price: pkgData.price,
    duration: pkgData.duration,
    description: pkgData.description,
    features: pkgData.features,
    display_order: pkgData.display_order,
    status: pkgData.status,
    created_at: pkgData.created_at,
    updated_at: pkgData.updated_at
  };

  try {
    let res;
    if (isEdit) {
      res = await supabase
        .from('packages')
        .update(dbPayload)
        .eq('id', dbPayload.id)
        .select();
    } else {
      res = await supabase
        .from('packages')
        .insert([dbPayload])
        .select();
    }

    if (!res.error && res.data && res.data.length > 0) {
      const saved = { ...pkgData, ...res.data[0] };
      const local = getLocalPackages();
      if (isEdit) {
        saveLocalPackages(local.map(p => p.id === saved.id ? saved : p));
      } else {
        saveLocalPackages([saved, ...local]);
      }
      return { data: saved, error: null };
    }
  } catch (err) {
    console.warn('Supabase package save error, updating local cache:', err);
  }

  const local = getLocalPackages();
  if (isEdit) {
    saveLocalPackages(local.map(p => p.id === pkgData.id ? pkgData : p));
  } else {
    saveLocalPackages([pkgData, ...local]);
  }
  return { data: pkgData, error: null };
}

export async function deleteSitePackage(packageId) {
  try {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId);

    if (!error) {
      const local = getLocalPackages();
      saveLocalPackages(local.filter(p => p.id !== packageId));
      return { error: null };
    }
  } catch (err) {
    console.warn('Supabase package delete error, removing locally:', err);
  }

  const local = getLocalPackages();
  saveLocalPackages(local.filter(p => p.id !== packageId));
  return { error: null };
}
