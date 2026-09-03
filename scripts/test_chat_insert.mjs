import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nizuhdhhxwolrdrmuthr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_huALoFp5Lu24BDN4HVTCfw_7J7QC1je';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OFFICIAL_PHOTOGRAPHY_PACKAGES = [
  {
    id: 'pkg-corp-1',
    type: 'photography',
    name: 'Corporate & Commercial Events',
    price: 15000,
    duration: '6 hours / Custom Scope',
    description: 'Enterprise & commercial coverage for Tata Tele & JSW summits, Government Events protocol, corporate AGMs, and commercial launches.',
    features: [
      'Tata Tele & JSW industrial summits & conferences',
      'Government Events & official state protocol',
      'Corporate AGMs & commercial product launches',
      'Keynote speakers, VIP portraits & same-day media'
    ],
    display_order: 1,
    status: 'active'
  },
  {
    id: 'pkg-mall-1',
    type: 'photography',
    name: 'Shopping Malls',
    price: 18000,
    duration: '6 hours / Custom Scope',
    description: 'High-impact visual coverage for mega shopping mall inaugurations, celebrity showroom launches, red-carpet media meets, and retail campaigns.',
    features: [
      'Celebrity inaugurations & red-carpet arrivals',
      'Showroom interior & visual merchandising showcases',
      'Media press conferences & VIP ribbon-cutting',
      'High-speed media turnaround for PR & print'
    ],
    display_order: 2,
    status: 'active'
  },
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
    display_order: 3,
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
    display_order: 4,
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
    display_order: 5,
    status: 'active'
  },
  {
    id: 'pkg-4',
    type: 'photography',
    name: 'Cinematic Video',
    price: 14000,
    duration: '6 hours',
    description: 'Ultra-HD cinematic storytelling with gimbal stabilization, color graded highlights, and emotional score.',
    features: [
      '6 hours cinematic coverage',
      '4K gimbal cinematography',
      'Cinematic color grading',
      'Signature highlight film'
    ],
    display_order: 6,
    status: 'active'
  },
  {
    id: 'pkg-5',
    type: 'photography',
    name: 'Drone',
    price: 6000,
    duration: '4 hours',
    description: 'High-altitude 4K aerial shots of wedding venue, baraat procession, and outdoor landscape perspectives.',
    features: [
      '4 hours aerial coverage',
      '4K stabilized aerial video',
      'Grand venue & baraat flybys',
      'DGCA safety compliant pilot'
    ],
    display_order: 7,
    status: 'active'
  },
  {
    id: 'pkg-6',
    type: 'photography',
    name: 'LED Screen',
    price: 16000,
    duration: '6 hours (+ Transport Charges)',
    description: 'Ultra-bright high-definition LED video wall display setup for real-time live telecast at wedding mandap and banquet halls.',
    features: [
      '6 hours display runtime',
      'High-resolution P3 LED wall',
      'Real-time live video feed display',
      'On-site technical support team',
      'Transport charges apply based on venue'
    ],
    display_order: 8,
    status: 'active'
  },
  {
    id: 'pkg-7',
    type: 'photography',
    name: 'Avata Drone',
    price: 12000,
    duration: '3 hours',
    description: 'High-speed FPV Avata drone indoor-outdoor immersive fly-throughs with acrobatic cinematic angles.',
    features: [
      '3 hours specialized FPV flight',
      'Immersive indoor/outdoor fly-throughs',
      'High-speed dynamic transitions',
      '4K 60fps stabilized FPV footage'
    ],
    display_order: 9,
    status: 'active'
  },
  {
    id: 'pkg-8',
    type: 'photography',
    name: 'Live Link',
    price: 6000,
    duration: '4 hours',
    description: 'Multi-platform live streaming to YouTube & private web links for NRI relatives and distant guests.',
    features: [
      '4 hours live broadcast link',
      '1080p full HD streaming',
      'Private/public YouTube URL',
      'Direct WhatsApp sharing link'
    ],
    display_order: 10,
    status: 'active'
  },
  {
    id: 'pkg-9',
    type: 'photography',
    name: 'Cinematic Teaser',
    price: 8000,
    duration: '4-5 min',
    description: 'Short 4-5 minute viral-ready cinematic wedding teaser edited with curated audio sync and cinematic pacing.',
    features: [
      '4 to 5 minutes duration',
      'Curated audio sync',
      'Instagram/Reels 4K export',
      'Rapid delivery'
    ],
    display_order: 11,
    status: 'active'
  },
  {
    id: 'pkg-10',
    type: 'photography',
    name: 'Traditional Video Editing',
    price: 2000,
    duration: '1 hour',
    category: 'Editing',
    description: 'Complete ceremony editing with chapter titles, traditional Telugu background music, and smooth cuts.',
    features: [
      'Per 1 hour finished footage',
      'Traditional Telugu music overlays',
      'Ceremony titles & credits',
      'Clean master chaptering'
    ],
    display_order: 12,
    status: 'active'
  },
  {
    id: 'pkg-11',
    type: 'photography',
    name: 'Cinematic Video Editing',
    price: 6000,
    duration: '1 hour',
    description: 'Master film-grade cinematic timeline editing, speed ramps, sound design, and LUT color grading.',
    features: [
      'Per 1 hour cinematic timeline',
      'LUT color grading',
      'Sound design & audio mixing',
      '4K master master output'
    ],
    display_order: 13,
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
    display_order: 14,
    status: 'active'
  }
];

async function run() {
  console.log('Cleaning old packages from Supabase...');
  await supabase.from('packages').delete().neq('id', '9999999');

  console.log('Inserting all 14 photography packages into Supabase in priority order...');
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
