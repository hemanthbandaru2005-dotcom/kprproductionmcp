import React, { useState } from 'react';
import { ChevronDown, Sparkles, Mail, ArrowRight, Maximize2, X, MapPin, CheckCircle2, Phone, Music, Users, Star, Play, Award, Flame } from 'lucide-react';
import kprEventsLogo from '../assets/kpr_events_logo.png';
import eventsHeaderLeft from '../assets/events_header_left.jpg';
import eventsHeaderRight from '../assets/events_header_right.jpg';

const EVENT_GALLERY = [
  {
    id: 'live-stage-master',
    title: 'KPR Events Live Stage & Truss Production',
    subtitle: 'Signature Stage Setup with Widescreen LED Walls & Chevron Floor Panels',
    category: 'Stage & LED Wall',
    image: '/images/events/kpr_live_event_stage.jpg',
    location: 'Telangana, India',
    features: ['High-Definition Center LED Wall', 'Multi-Layer Truss Lighting Rig', 'Illuminated Chevron Floor Panels', 'Crystal Chandeliers & Stage Uplighting'],
    isFeatured: true
  },
  {
    id: 'stage-truss-dancefloor',
    title: 'Grand Open-Air Truss Rig & Interactive LED Dance Floor',
    subtitle: 'Heavy-duty aluminum trussing, multi-hue beam wash, and synchronized illuminated dance floor for grand celebrations',
    category: 'Truss & LED Dance Floor',
    image: '/images/events/kpr_stage_truss_dancefloor.jpg',
    location: 'Telangana, India',
    features: [
      'Heavy-Duty Aluminum Box Truss Matrix',
      'Synchronized Foreground LED Dance Floor',
      'Multi-Hue DMX Moving Head Beam Lights',
      'Stage CO2 Cryo Jets & Subwoofer Array'
    ],
    isFeatured: false
  },
  {
    id: 'stage-fireworks-pyro',
    title: 'Grand Celebration Fireworks & Royal Monogram Stage',
    subtitle: 'Synchronized sky fireworks, gold-rimmed monogram arch backdrop, and atmospheric night stage illumination',
    category: 'Sky Fireworks & Royal Backdrop',
    image: '/images/events/kpr_stage_fireworks_pyro.jpg',
    location: 'Telangana, India',
    features: [
      'Spectacular Night Sky Fireworks & Pyrotechnics',
      'Royal Custom Couple Monogram Arch Backdrop',
      'Chevron Pattern Stage Floor & Side Truss Towers',
      'Warm Golden Ambient & Theatrical Spotlights'
    ],
    isFeatured: false
  }
];


const CHOREOGRAPHY_SHOWCASES = [
  {
    id: 'grand-entry-pyro-spin',
    title: 'Grand Couple Entry, Cold Spark Pyro & Cryo Smoke Spin',
    subtitle: 'Signature romantic first dance featuring synchronized cold spark pyro fountains, high-pressure CO2 cryo jets, low fog, and custom LED heart visuals',
    category: 'Grand Entry & Cold Pyro',
    image: '/images/events/kpr_choreo_grand_entry_pyro.jpg',
    location: 'Telangana, India',
    features: [
      'Synchronized Cold Spark Fountains & CO2 Smoke Jets',
      'Royal Couple Spin & Grand First Dance Choreography',
      'High-Definition Heart & Diamond LED Backdrop',
      'Overhead Truss Light Beams & Multi-Color Stage Wash'
    ]
  },
  {
    id: 'romantic-confetti-ballad',
    title: 'Romantic Couple Ballad & Stage Confetti Blast',
    subtitle: 'Expressive slow-waltz and Bollywood romantic sequence with slow-fall colorful confetti blasts on chevron stage floor',
    category: 'Romantic Couple Ballad',
    image: '/images/events/kpr_choreo_romantic_confetti.jpg',
    location: 'Telangana, India',
    features: [
      'Slow-Waltz & Expressive Bollywood Ballad Routine',
      'Air-Cannon Color Paper Confetti Celebration Blast',
      'Modern Geometric Arch Visuals & Stage Lighting',
      'Personalized Couple Posture & Chemistry Coaching'
    ]
  },
  {
    id: 'energetic-sangeet-duet',
    title: 'High-Energy Sangeet Duet & Synchronized Grooves',
    subtitle: 'Joyful, upbeat Telugu & Bollywood dance medley choreographed with vibrant festive hand gestures and dynamic stage footwork',
    category: 'High-Energy Sangeet',
    image: '/images/events/kpr_choreo_festive_sangeet.jpg',
    location: 'Telangana, India',
    features: [
      'Fast-Tempo Festive Medley with Telugu & Bollywood Beats',
      'Beginner-Friendly Step Counts & Hand Gesture Coaching',
      'Dynamic Pixel-Matrix Color Block LED Wall Visuals',
      'Floral Accents & White Silk Stage Backdrop Styling'
    ]
  },
  {
    id: 'sparkle-hearts-pose',
    title: 'Signature Double-Heart LED Theme & Synchronized Pose Routine',
    subtitle: 'Fun, synchronized back-to-back choreography sequence with celestial sparkle-heart LED animations and floral stage decor',
    category: 'Couple Theme Performance',
    image: '/images/events/kpr_choreo_sparkle_hearts.jpg',
    location: 'Telangana, India',
    features: [
      'Synchronized Back-to-Back Couple Dance Steps',
      'Shimmering Sparkle Heart LED Visual Sync',
      'Fresh Flower Stage Framing & Front Floral Runners',
      'Custom Audio Edit with Romantic Dialogue Integration'
    ]
  }
];

const EVENTS_WHATSAPP_NUMBER = '919948972531';

export default function EventsSection({ onOpenPage }) {
  // Collapsible toggle state
  const [isExpanded, setIsExpanded] = useState(true);
  // Subsections toggle: 'stage' | 'choreography'
  const [activeSubTab, setActiveSubTab] = useState('stage');
  const [selectedEventPhoto, setSelectedEventPhoto] = useState(null);

  const featuredEvent = EVENT_GALLERY.find(e => e.isFeatured) || EVENT_GALLERY[0];
  const gridEvents = EVENT_GALLERY.filter(e => !e.isFeatured);

  const getEventWhatsAppUrl = (eventTitle) => {
    const text = `Hello KPR Events! I would like to inquire about *${eventTitle || 'Event Stage, Lighting & Choreography'}* for my upcoming celebration. Please share details and availability.`;
    return `https://wa.me/${EVENTS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const getChoreographyWhatsAppUrl = (topic) => {
    const text = `Hello KPR Events! I would like to inquire about *${topic || 'Wedding & Sangeet Choreography'}* for our celebration. Please share choreographer packages and studio rehearsal schedules.`;
    return `https://wa.me/${EVENTS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div id="events" className="w-full bg-[#F7F3EE] transition-all duration-300">
      <div className="w-full bg-white border-b border-[#E2D9CC] overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "KPR EVENTS" Header Bar with Clean 3-Box Layout (Left Photo | Center Logo | Right Photo) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] p-2 sm:p-4 md:p-6 flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 border-b border-[#E2D9CC] min-h-[85px] sm:min-h-[140px] md:min-h-[175px] overflow-hidden group cursor-pointer focus:outline-none transition-all duration-300"
          aria-label="Toggle KPR Events section"
        >
          {/* Left Showcase Photo Card (Always visible on all screens, separate box) */}
          <div className="w-14 h-14 sm:w-28 sm:h-28 md:w-48 md:h-34 lg:w-60 lg:h-38 shrink-0 rounded-lg sm:rounded-2xl overflow-hidden border border-[#E2D9CC] shadow-sm pointer-events-none">
            <img
              src={eventsHeaderLeft}
              alt="KPR Events - Luxury Stage Sofa & Floral Decor"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
            />
          </div>

          {/* Center Logo Area (Dedicated flexible space with zero photo overlap) */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-4 pointer-events-none">
            <img
              src={kprEventsLogo}
              alt="KPR Events"
              className="h-10 sm:h-20 md:h-28 lg:h-36 w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300 select-none drop-shadow-sm"
            />
          </div>

          {/* Right Showcase Photo Card (Always visible on all screens, separate box) */}
          <div className="w-14 h-14 sm:w-28 sm:h-28 md:w-48 md:h-34 lg:w-60 lg:h-38 shrink-0 rounded-lg sm:rounded-2xl overflow-hidden border border-[#E2D9CC] shadow-sm pointer-events-none">
            <img
              src={eventsHeaderRight}
              alt="KPR Events - Live Stage Dance Performance & Choreography"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
            />
          </div>

          {/* Chevron Rotate Animation */}
          <div className="shrink-0 ml-1 sm:ml-2">
            <div className={`p-1.5 sm:p-2.5 rounded-full border shadow-sm transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-white/90 text-[#1A1A1A] border-[#E2D9CC] group-hover:bg-[#EAE4DC]'
            }`}>
              <ChevronDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          
          {/* 2. Subsections Navigation & Big Title Bar (3-Column Layout: Left Button | Big Center Title | Right Button) */}
          <div className="w-full bg-[#F7F3EE] border-b border-[#E2D9CC] px-4 sm:px-8 md:px-12 py-3.5 sm:py-5">
            <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
              
              {/* 1. LEFT BOX: STAGE & LIGHTING BUTTON (Desktop) */}
              <div className="hidden md:flex justify-start">
                <button
                  onClick={() => setActiveSubTab('stage')}
                  className={`inline-flex justify-center items-center gap-2 px-6 lg:px-8 py-2.5 lg:py-3 text-xs lg:text-sm font-bold tracking-wider lg:tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-sm ${
                    activeSubTab === 'stage'
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#C5A880] shadow-md scale-105'
                      : 'bg-white text-[#444444] border border-[#E2D9CC] hover:bg-[#FAF8F5] hover:text-[#1A1A1A] hover:border-[#C5A880]'
                  }`}
                  aria-label="View Stage and Lighting Production"
                >
                  <Sparkles className={`w-4 h-4 ${activeSubTab === 'stage' ? 'text-[#C5A880]' : 'text-[#8C6D3F]'}`} />
                  <span>Stage & Lighting</span>
                </button>
              </div>

              {/* 2. MIDDLE BOX: BIG EVENTS TITLE IN TEXT */}
              <div className="text-center">
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1A1A1A] font-black tracking-wider uppercase">
                  EVENTS
                </h2>
                <p className="text-[11px] sm:text-xs md:text-sm text-[#666666] font-medium">
                  Grand Stage LED Walls, Truss Rigging & Live Choreography
                </p>
              </div>

              {/* 3. RIGHT BOX: CHOREOGRAPHY BUTTON (Desktop) */}
              <div className="hidden md:flex justify-end">
                <button
                  onClick={() => setActiveSubTab('choreography')}
                  className={`inline-flex justify-center items-center gap-2 px-6 lg:px-8 py-2.5 lg:py-3 text-xs lg:text-sm font-bold tracking-wider lg:tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-sm ${
                    activeSubTab === 'choreography'
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#C5A880] shadow-md scale-105'
                      : 'bg-white text-[#444444] border border-[#E2D9CC] hover:bg-[#FAF8F5] hover:text-[#1A1A1A] hover:border-[#C5A880]'
                  }`}
                  aria-label="View Choreography"
                >
                  <Music className={`w-4 h-4 ${activeSubTab === 'choreography' ? 'text-[#C5A880]' : 'text-[#8C6D3F]'}`} />
                  <span>Choreography</span>
                </button>
              </div>

              {/* 📱 MOBILE BUTTONS ROW (Visible only on mobile/tablet < md) */}
              <div className="flex md:hidden w-full items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setActiveSubTab('stage')}
                  className={`flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-sm ${
                    activeSubTab === 'stage'
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#C5A880] shadow-md'
                      : 'bg-white text-[#444444] border border-[#E2D9CC] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${activeSubTab === 'stage' ? 'text-[#C5A880]' : 'text-[#8C6D3F]'}`} />
                  <span>Stage & Lighting</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('choreography')}
                  className={`flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-sm ${
                    activeSubTab === 'choreography'
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#C5A880] shadow-md'
                      : 'bg-white text-[#444444] border border-[#E2D9CC] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Music className={`w-3.5 h-3.5 ${activeSubTab === 'choreography' ? 'text-[#C5A880]' : 'text-[#8C6D3F]'}`} />
                  <span>Choreography</span>
                </button>
              </div>

            </div>
          </div>

          {/* 3. Subsections Content Area */}
          <div className="w-full p-4 sm:p-8 lg:p-12 space-y-10 bg-[#FAF8F5]">
            <div className="w-full max-w-[1920px] mx-auto space-y-10">

            {/* ══════════ TAB 2: STAGE & LIGHTING PRODUCTION ══════════ */}
            {activeSubTab === 'stage' && (
              <div className="space-y-10 animate-fadeIn">
                
                {/* 🌟 FEATURED MASTER LIVE STAGE HERO SHOWCASE */}
                <div className="relative bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden shadow-lg group">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    
                    {/* Stage Photo with Hover Zoom & Fullscreen Action */}
                    <div 
                      className="lg:col-span-8 relative aspect-[16/9] lg:aspect-auto min-h-[280px] sm:min-h-[420px] overflow-hidden bg-black cursor-pointer"
                      onClick={() => setSelectedEventPhoto(featuredEvent)}
                    >
                      <img
                        src={featuredEvent.image}
                        alt={featuredEvent.title}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Featured Live Production</span>
                        </span>
                      </div>

                      <div className="absolute bottom-4 right-4 bg-black/70 hover:bg-[#C5A880] text-white hover:text-black p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-colors shadow-lg">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Info Panel */}
                    <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white border-t lg:border-t-0 lg:border-l border-[#E2D9CC]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8C6D3F]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{featuredEvent.location}</span>
                        </div>

                        <h3 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-bold leading-snug">
                          {featuredEvent.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                          {featuredEvent.subtitle}
                        </p>

                        <div className="pt-3 border-t border-[#E2D9CC] space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#999999]">Key Production Highlights:</p>
                          <ul className="space-y-1.5 text-xs text-[#444444]">
                            {featuredEvent.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                        <a
                          href={getEventWhatsAppUrl(featuredEvent.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-5 py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>Inquire on WhatsApp</span>
                        </a>
                        <button
                          onClick={() => setSelectedEventPhoto(featuredEvent)}
                          className="px-3.5 py-3 rounded-xl bg-[#F7F3EE] hover:bg-[#EAE4DC] text-[#1A1A1A] border border-[#E2D9CC] text-xs font-semibold transition-colors cursor-pointer"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 📸 EVENT SHOWCASE GRID (Shown when real images are present) */}
                {gridEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-bold">
                          Event Stage & Lighting Gallery
                        </h4>
                        <p className="text-xs sm:text-sm text-[#777777]">
                          Concert trussing, LED walls, dry-ice fog, and ceremony lighting setups.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      {gridEvents.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer"
                          onClick={() => setSelectedEventPhoto(item)}
                        >
                          <div className="relative aspect-[16/9] overflow-hidden bg-black">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 text-[10px] font-bold uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/60 hover:bg-[#C5A880] text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-[#8C6D3F] font-bold uppercase tracking-wider">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{item.location}</span>
                              </div>
                              <h5 className="font-serif text-base sm:text-lg text-[#1A1A1A] font-bold group-hover:text-[#8C6D3F] transition-colors">
                                {item.title}
                              </h5>
                              <p className="text-xs text-[#666666] line-clamp-2">
                                {item.subtitle}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#8C6D3F] font-semibold">
                              <span>View Details & Photo</span>
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ══════════ TAB 2: CHOREOGRAPHY (User's Real Photos & Custom Production Content) ══════════ */}
            {activeSubTab === 'choreography' && (
              <div className="space-y-10 animate-fadeIn">
                
                {/* 1. Header Banner */}
                <div className="bg-white border border-[#E2D9CC] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#C5A880] text-[10px] font-bold uppercase tracking-widest border border-[#E2D9CC]">
                      <Music className="w-3.5 h-3.5" />
                      <span>KPR Events Signature Choreography</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-bold">
                      Wedding, Sangeet & Reception Choreography
                    </h3>
                    <p className="text-xs sm:text-sm text-[#666666] max-w-2xl">
                      From private studio rehearsals with professional dance masters to breathtaking synchronized live stage performances tailored for couples, families, and bridal parties.
                    </p>
                  </div>

                  <a
                    href={getChoreographyWhatsAppUrl('Wedding & Sangeet Choreography')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-full bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 shrink-0 cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Inquire Choreography</span>
                  </a>
                </div>

                {/* 2. CHOREOGRAPHY SHOWCASES (Dynamically populated when photos are added) */}
                {CHOREOGRAPHY_SHOWCASES.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {CHOREOGRAPHY_SHOWCASES.map((item) => (
                      <div key={item.id} className="bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                        <div 
                          className="relative aspect-[16/10] overflow-hidden bg-black cursor-pointer"
                          onClick={() => setSelectedEventPhoto(item)}
                        >
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                          
                          <div className="absolute top-4 left-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#E8D4B8] border border-[#C5A880]/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg">
                              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>{item.category}</span>
                            </span>
                          </div>

                          <div className="absolute bottom-4 right-4 bg-black/70 hover:bg-[#C5A880] text-white hover:text-black p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-colors shadow-lg">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8C6D3F]">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{item.location}</span>
                            </div>
                            <h4 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-bold leading-snug group-hover:text-[#C5A880] transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                              {item.subtitle}
                            </p>
                          </div>

                          {item.features && item.features.length > 0 && (
                            <div className="pt-4 border-t border-[#E2D9CC] space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#999999]">Performance Highlights:</p>
                              <ul className="space-y-1.5 text-xs text-[#444444]">
                                {item.features.map((feat, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="pt-4">
                            <a
                              href={getChoreographyWhatsAppUrl(item.title)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center shadow-md cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Book {item.category}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* 💬 BOTTOM BOOKING CALLOUT BANNER */}
            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2C261F] rounded-2xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/20 text-[#C5A880] text-[10px] font-bold uppercase tracking-widest border border-[#C5A880]/30">
                  <Sparkles className="w-3 h-3" />
                  <span>KPR Events Full Production & Choreography</span>
                </div>
                <h4 className="font-serif text-xl sm:text-3xl font-bold">
                  Planning a Grand Event or Wedding Celebration?
                </h4>
                <p className="text-xs sm:text-sm text-white/70">
                  We provide complete multi-camera live video links, LED stage backdrops, dynamic truss lighting, audio-visual production, and professional choreography across Telangana & Andhra Pradesh.
                </p>
              </div>

              <a
                href={getEventWhatsAppUrl('Grand Event & Choreography Production')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 rounded-full bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xl hover:scale-105 shrink-0 cursor-pointer"
              >
                Inquire Event Availability
              </a>
            </div>

            </div>
          </div>

        </div>

      </div>

      {/* 🖼️ EVENT PHOTO LIGHTBOX MODAL */}
      {selectedEventPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setSelectedEventPhoto(null)}
        >
          <div 
            className="relative max-w-5xl w-full bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-[#0F1623] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                <h4 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide truncate">
                  {selectedEventPhoto.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEventPhoto(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 sm:px-6">
              <div className="aspect-[16/9] w-full bg-black rounded-xl overflow-hidden">
                <img
                  src={selectedEventPhoto.image}
                  alt={selectedEventPhoto.title}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#0F1623] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs text-white/90 font-medium">{selectedEventPhoto.subtitle}</p>
                <p className="text-[11px] text-[#C5A880] font-mono">{selectedEventPhoto.location} • {selectedEventPhoto.category}</p>
              </div>

              <a
                href={getChoreographyWhatsAppUrl(selectedEventPhoto.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded-full bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
              >
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
