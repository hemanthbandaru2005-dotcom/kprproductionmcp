import React, { useState } from 'react';
import { ChevronDown, Sparkles, Camera, Mail, ArrowRight, Maximize2, X, MapPin, CheckCircle2, Phone, Music, Users, Star, Play, Award, Flame } from 'lucide-react';
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
    id: 'stage-led-wall',
    title: 'Grand Widescreen LED Wall & Ambient Stage',
    subtitle: 'Multi-screen synchronous visual broadcasting for gala celebrations',
    category: 'LED Video Walls',
    image: '/images/events/event_stage_led_wall.jpg',
    location: 'Hyderabad, India',
    features: ['Ultra-HD Seamless Visual Screens', 'Ambient Multi-Hue Backdrop', 'Synchronous Audio-Visual Feed'],
    isFeatured: false
  },
  {
    id: 'truss-lighting-show',
    title: 'High-Energy Concert & Sangeet Light Show',
    subtitle: 'Moving beam heads, atmospheric haze, and dynamic lighting cues',
    category: 'Concert Lighting',
    image: '/images/events/event_truss_lighting.jpg',
    location: 'Telangana, India',
    features: ['Heavy Duty Aluminum Box Truss', 'Sharp Moving Head Beam Lights', 'DMX Programmed Dynamic Cues'],
    isFeatured: false
  },
  {
    id: 'royal-mandap-illumination',
    title: 'Royal Mandap & Architectural Floral Lighting',
    subtitle: 'Opulent warm golden illumination for traditional ceremonies',
    category: 'Architectural Lighting',
    image: '/images/events/event_grand_mandap.jpg',
    location: 'Heritage Venue, India',
    features: ['Warm Golden Architectural Uplights', 'Floral Pillar Spotlighting', 'Aisle Candlelit Illumination'],
    isFeatured: false
  },
  {
    id: 'stage-fog-reception',
    title: 'Atmospheric Low Fog & Grand Reception Production',
    subtitle: 'Dry ice low fog smoke, intelligent moving heads, and stage elegance',
    category: 'Special Effects & SFX',
    image: '/images/events/event_stage_fog.jpg',
    location: 'Convention Center, India',
    features: ['Low Lying Dry Ice Fog Effects', 'Multi-Angle 4K Stage Cameras', 'Ceiling Crystal Chandelier Array'],
    isFeatured: false
  }
];

const CHOREOGRAPHY_SHOWCASES = [
  {
    id: 'sangeet-live-performance',
    title: 'Grand Sangeet Live Stage Dance Production',
    subtitle: 'Bride & Groom leading a royal synchronized sangeet performance with full lighting & stage effects',
    category: 'Live Sangeet Performance',
    image: '/images/events/kpr_choreography_live_sangeet.jpg',
    location: 'Convention Center Stage, Telangana',
    features: [
      'Synchronized Bride & Groom lead choreography',
      'Dynamic beam light & stage background cues',
      'Group choreography for family & bridal entourage',
      'Custom music track medley & sound editing'
    ]
  },
  {
    id: 'studio-rehearsal-workshop',
    title: 'KPR Events Dance Studio Training & Workshops',
    subtitle: 'Professional dance master leading intensive step rehearsals with custom tempo adjustments for non-dancers',
    category: 'Studio Rehearsals',
    image: '/images/events/kpr_choreography_rehearsal.jpg',
    location: 'KPR Events Studio, Warangal',
    features: [
      'Dedicated private studio rehearsal floor',
      'Step-by-step guidance tailored for beginners',
      'Custom mashup creation & music track editing',
      'Slow-motion video guides for home practice'
    ]
  }
];

const CHOREOGRAPHY_CARDS = [
  {
    id: 'couple-entry',
    title: 'Couple Grand Entry & First Dance',
    tag: 'Signature Romantic',
    desc: 'Cinematic first dance, slow-waltz, royal groom & bride grand entry with cold-pyro and dry ice low fog synchronization.',
    image: '/images/events/kpr_choreography_live_sangeet.jpg',
    features: ['Couple romantic routine', 'Stage cold-fire coordination', 'Custom romantic song mashup']
  },
  {
    id: 'sangeet-medleys',
    title: 'Sangeet Family Medleys & Group Acts',
    tag: 'High Energy',
    desc: 'High-voltage energetic group routines for cousins, friends, and parents with easy-to-learn steps and high-impact beats.',
    image: '/images/events/kpr_choreography_rehearsal.jpg',
    features: ['Group synchronized steps', 'Fun themes & family segments', 'Fast rehearsal turnaround']
  },
  {
    id: 'solo-performance',
    title: 'Bride & Groom Spotlight Solo Acts',
    tag: 'Spotlight Feature',
    desc: 'Graceful classical, semi-classical, and Bollywood spotlight solo routines crafted to highlight expressions and elegance.',
    image: '/images/events/kpr_live_event_stage.jpg',
    features: ['Spotlight solo choreography', 'Expression & posture coaching', 'Stage blocking mastery']
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
        
        {/* 1. Main Collapsible "KPR EVENTS" Header Bar with Corner Spread Showcase Photos */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] px-2 py-2 sm:px-6 sm:py-4 md:px-8 md:py-5 flex items-center justify-between relative transition-all duration-300 group cursor-pointer focus:outline-none border-b border-[#E2D9CC] min-h-[105px] sm:min-h-[150px] md:min-h-[185px] overflow-hidden"
          aria-label="Toggle KPR Events section"
        >
          {/* Left Corner Spread Photo (Edge-to-Edge flush to corner, no box) */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={eventsHeaderLeft}
              alt="KPR Events - Floral Mandap Decor & Stage Production"
              className="w-full h-full object-cover object-left transition-transform duration-700 group-hover:scale-105 select-none"
            />
            {/* Soft fade into white center */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white pointer-events-none" />
          </div>

          {/* Center Logo Area (Undisturbed & Prominent) */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 md:px-12 pointer-events-none">
            <img
              src={kprEventsLogo}
              alt="KPR Events"
              className="h-14 sm:h-24 md:h-32 lg:h-40 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none drop-shadow-sm"
            />
          </div>

          {/* Right Corner Spread Photo (Edge-to-Edge flush to corner, no box) */}
          <div className="absolute right-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={eventsHeaderRight}
              alt="KPR Events - Joyful Wedding Celebration"
              className="w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105 select-none"
            />
            {/* Soft fade into white center */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white pointer-events-none" />
          </div>

          {/* Chevron Rotate Animation */}
          <div className="relative z-20 mr-1.5 sm:mr-3 md:mr-6 lg:mr-10">
            <div className={`p-1.5 sm:p-2.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-white/90 text-[#1A1A1A] border-[#E2D9CC] group-hover:bg-[#EAE4DC]'
            }`}>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          
          {/* 2. Subsections Navigation Tabs (Matching ColorLabSection pattern) */}
          <div className="w-full bg-[#F7F3EE] border-b border-[#E2D9CC] px-4 sm:px-8 lg:px-16 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#666666] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              Events Subsections:
            </p>

            <div className="inline-flex w-full sm:w-auto justify-center flex-wrap items-center gap-1.5 sm:gap-2 p-1 bg-white border border-[#E2D9CC] rounded-lg shadow-sm">
              
              {/* STAGE & LIGHTING TAB */}
              <button
                onClick={() => setActiveSubTab('stage')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'stage'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'stage' ? 'text-[#C5A880]' : ''}`} />
                <span>Stage & Lighting</span>
              </button>

              {/* CHOREOGRAPHY TAB */}
              <button
                onClick={() => setActiveSubTab('choreography')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'choreography'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Music className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'choreography' ? 'text-[#C5A880]' : ''}`} />
                <span>Choreography</span>
              </button>

            </div>

          </div>

          {/* 3. Subsections Content Area */}
          <div className="w-full p-4 sm:p-8 lg:p-12 space-y-10 bg-[#FAF8F5]">
            <div className="w-full max-w-[1920px] mx-auto space-y-10">
            
            {/* ══════════ TAB 1: STAGE & LIGHTING PRODUCTION ══════════ */}
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

                {/* 📸 EVENT SHOWCASE GRID */}
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

                {/* 2. DUAL FEATURED HEROES: LIVE SANGEET STAGE + STUDIO REHEARSAL WORKSHOP */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  
                  {/* Hero 1: Live Sangeet Stage Performance */}
                  <div className="bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                    <div 
                      className="relative aspect-[16/10] overflow-hidden bg-black cursor-pointer"
                      onClick={() => setSelectedEventPhoto(CHOREOGRAPHY_SHOWCASES[0])}
                    >
                      <img
                        src="/images/events/kpr_choreography_live_sangeet.jpg"
                        alt="Grand Sangeet Live Stage Dance Production"
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#E8D4B8] border border-[#C5A880]/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg">
                          <Flame className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>Live Stage Production</span>
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
                          <span>Convention Stage Performance</span>
                        </div>
                        <h4 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-bold leading-snug group-hover:text-[#C5A880] transition-colors">
                          Grand Sangeet & Couple Stage Choreography
                        </h4>
                        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                          Synchronized couple and group performances featuring the bride, groom, and entourage with automated beam light cues, LED wall visuals, and stage pyro effects.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#E2D9CC] space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#999999]">Performance Highlights:</p>
                        <ul className="space-y-1.5 text-xs text-[#444444]">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Bride & Groom lead synchronized dance sequence</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Stage pyro, dry-ice low fog & beam lighting coordination</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Multi-track custom music mashup with cinematic voiceovers</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <a
                          href={getChoreographyWhatsAppUrl('Grand Sangeet Stage Performance')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Book Sangeet Choreography</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Hero 2: Studio Dance Rehearsals & Training */}
                  <div className="bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group">
                    <div 
                      className="relative aspect-[16/10] overflow-hidden bg-black cursor-pointer"
                      onClick={() => setSelectedEventPhoto(CHOREOGRAPHY_SHOWCASES[1])}
                    >
                      <img
                        src="/images/events/kpr_choreography_rehearsal.jpg"
                        alt="KPR Events Dance Studio Training & Workshops"
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                      
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#E8D4B8] border border-[#C5A880]/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg">
                          <Users className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>KPR Studio Rehearsals</span>
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
                          <span>KPR Dance Studio Floor</span>
                        </div>
                        <h4 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-bold leading-snug group-hover:text-[#C5A880] transition-colors">
                          Studio Rehearsals & Personalized Training
                        </h4>
                        <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                          Professional choreographers break down steps into easy, comfortable routines. Ideal for beginners, parents, and busy friends with flexible studio timings.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#E2D9CC] space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#999999]">Training Highlights:</p>
                        <ul className="space-y-1.5 text-xs text-[#444444]">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Private air-conditioned dance rehearsal studio floor</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Beginner-friendly step counts with slow-speed practice</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                            <span>Recorded video tutorials sent via WhatsApp for home revision</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4">
                        <a
                          href={getChoreographyWhatsAppUrl('Studio Rehearsals & Training')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 text-center shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Book Studio Rehearsal Slot</span>
                        </a>
                      </div>
                    </div>
                  </div>

                </div>

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
