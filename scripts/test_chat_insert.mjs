import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nizuhdhhxwolrdrmuthr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_huALoFp5Lu24BDN4HVTCfw_7J7QC1je';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OFFICIAL_PHOTOGRAPHY_PACKAGES = [
  {
    id: 'pkg-1',
    type: 'photography',
    name: 'Traditional Photo',
    price: 6000,
    duration: '6 hours',
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
    price: 15000,
    duration: '6 hours / Custom Scope',
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

async function run() {
  console.log('Cleaning old packages from Supabase...');
  await supabase.from('packages').delete().neq('id', '9999999');

  console.log('Inserting all 13 photography packages into Supabase...');
  for (const pkg of OFFICIAL_PHOTOGRAPHY_PACKAGES) {
    const { data, error } = await supabase.from('packages').upsert({
      id: pkg.id,
      type: pkg.type,
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      description: pkg.description,
      features: pkg.features,
      display_order: pkg.display_order,
      status: pkg.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select();

    if (error) {
      console.error(`Error on ${pkg.name}:`, error.message);
    } else {
      console.log(`✓ [${pkg.id}] ${pkg.name} - ₹${pkg.price} (${pkg.duration})`);
    }
  }

  console.log('--- ALL 13 PACKAGES SUCCESSFULLY INSERTED IN SUPABASE DATABASE ---');
}

run();
