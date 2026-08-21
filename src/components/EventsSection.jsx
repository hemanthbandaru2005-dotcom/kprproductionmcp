import React, { useState } from 'react';
import { ChevronDown, Sparkles, Camera, Mail, ArrowRight, Maximize2, X, MapPin, CheckCircle2 } from 'lucide-react';
import kprEventsLogo from '../assets/kpr_events_logo.png';

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

const EVENTS_WHATSAPP_NUMBER = '919948972531';

export default function EventsSection({ onOpenPage }) {
  // Collapsible toggle state matching ColorLabSection
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedEventPhoto, setSelectedEventPhoto] = useState(null);

  const featuredEvent = EVENT_GALLERY.find(e => e.isFeatured) || EVENT_GALLERY[0];
  const gridEvents = EVENT_GALLERY.filter(e => !e.isFeatured);

  const getEventWhatsAppUrl = (eventTitle) => {
    const text = `Hello KPR Events! I would like to inquire about *${eventTitle || 'Event Stage & Lighting Production'}* for my upcoming celebration. Please share details and availability.`;
    return `https://wa.me/${EVENTS_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div id="events" className="w-full bg-[#F7F3EE] py-4 px-2 sm:px-6 lg:px-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto border border-[#E2D9CC] rounded-xl bg-white shadow-xl overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "KPR EVENTS" Header Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] p-4 sm:p-8 flex items-center justify-center relative transition-colors duration-300 group cursor-pointer focus:outline-none border-b border-[#E2D9CC] min-h-[90px] sm:min-h-[140px] md:min-h-[170px]"
        >
          <img
            src={kprEventsLogo}
            alt="KPR Events"
            className="h-20 sm:h-32 md:h-44 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none"
          />

          {/* Chevron Rotate Animation */}
          <div className="absolute right-3 sm:right-8">
            <div className={`p-1.5 sm:p-2.5 rounded-full border transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-[#F7F3EE] text-[#1A1A1A] border-[#E2D9CC] group-hover:bg-[#EAE4DC]'
            }`}>
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          
          {/* 2. Subheader Bar */}
          <div className="bg-[#F7F3EE] border-b border-[#E2D9CC] px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-[#666666]">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span>Live Stage Production & Event Showcases</span>
            </div>
            
            <a
              href={getEventWhatsAppUrl('Event Stage & Lighting')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[11px] font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>WhatsApp: +91 99489 72531</span>
            </a>
          </div>

          {/* 3. Main Event Showcase Content */}
          <div className="p-4 sm:p-8 lg:p-10 space-y-10 bg-[#FAF8F5]">
            
            {/* 🌟 FEATURED MASTER LIVE STAGE HERO SHOWCASE (User's Real Event Stage Photo) */}
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

            {/* 📸 EVENT SHOWCASE GRID (4 Luxury Production Setups) */}
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
                          <MapPin className="w-3 h-3" />
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

            {/* 💬 BOTTOM BOOKING CALLOUT BANNER */}
            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2C261F] rounded-2xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/20 text-[#C5A880] text-[10px] font-bold uppercase tracking-widest border border-[#C5A880]/30">
                  <Sparkles className="w-3 h-3" />
                  <span>KPR Events Technical Team</span>
                </div>
                <h4 className="font-serif text-xl sm:text-3xl font-bold">
                  Planning a Grand Event or Wedding Celebration?
                </h4>
                <p className="text-xs sm:text-sm text-white/70">
                  We provide complete multi-camera live video links, LED stage backdrops, dynamic truss lighting, and audio-visual production across Telangana & Andhra Pradesh.
                </p>
              </div>

              <a
                href={getEventWhatsAppUrl('Grand Event Production')}
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
                href={getEventWhatsAppUrl(selectedEventPhoto.title)}
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
