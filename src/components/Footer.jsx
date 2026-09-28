import React from 'react';
import { Camera, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { SOCIAL_LINKS } from '../utils/socialLinks';
import { InstagramIcon, FacebookIcon, YoutubeIcon } from './SocialIcons';

export default function Footer({
  activePage = 'media',
  onSelectPage,
  onOpenInquire,
  showInstagram = true,
  showFacebook = true,
  showYoutube = true,
  showAddress = true,
  mapUrl = 'https://goo.gl/maps/NtABjd1bV6S5kNHq8?g_st=ac',
  instagramUrl = SOCIAL_LINKS.instagram,
  instagramHandle = '@kpr_fotography',
  youtubeUrl = SOCIAL_LINKS.youtube,
  youtubeHandle = '@kprdancezone2022',
  contactEmail = 'kprfotography@gmail.com',
  contactPhone = '+91 98494 43648',
  addressLine1 = 'Grand Gayathri, 8-5-34',
  addressLine2 = 'TKS Commercial Complex, Station Road, Warangal 506002'
}) {
  const handleNavClick = (pageName) => {
    if (typeof onSelectPage === 'function') {
      onSelectPage(pageName);
    } else if (typeof window !== 'undefined') {
      window.location.hash = `#${pageName}`;
    }
  };

  // Section-specific gallery curation
  const SECTION_GALLERIES = {
    // Fotography section: Luxury weddings, romantic couple portraits & fine-art moments
    media: [
      { src: '/images/wedding/photo_1.jpg', alt: 'KPR Fotography Fine Art Wedding Bride Portrait Warangal' },
      { src: '/images/engagement/photo_1.jpg', alt: 'KPR Fotography Romantic Candid Engagement Shoot' },
      { src: '/images/wedding/photo_10.jpg', alt: 'KPR Fotography Luxury Cinematic Couple Portrait' },
      { src: '/images/wedding/photo_3.jpg', alt: 'KPR Fotography Traditional Royal Telugu Wedding Rituals' },
      { src: '/images/reception/photo_1.jpg', alt: 'KPR Fotography Grand Evening Wedding Reception' },
      { src: '/images/wedding/photo_11.jpg', alt: 'KPR Fotography Editorial Candid Wedding Moment' },
    ],
    // Colour Lab section: Photobook printing, layflat albums, frame craftsmanship & cases
    colorlab: [
      { src: '/images/services/wedding_album_printing.png', alt: 'KPR Colour Lab Layflat Wedding Photobook Album Printing' },
      { src: '/images/services/acrylic_mdf_frames.jpg', alt: 'KPR Colour Lab HD Acrylic & MDF Embossed Frames' },
      { src: '/images/colorlab_album_case.jpg', alt: 'KPR Colour Lab Handcrafted Velvet Album Briefcase & Box' },
      { src: '/images/services/photo_frames.png', alt: 'KPR Colour Lab Premium Italian Wooden Gallery Wall Frames' },
      { src: '/images/colorlab_red_album.jpg', alt: 'KPR Colour Lab Gold Foil Debossed Photobook Craftsmanship' },
      { src: '/images/services/laser_printing.jpg', alt: 'KPR Colour Lab High Precision Digital Laser Production' },
    ],
    // Events section: Grand concerts, LED video walls, beam lighting & truss production
    events: [
      { src: '/images/events_gallery/event_photo_1.jpg', alt: 'KPR Events Grand Concert & Sangeet Stage Setup' },
      { src: '/images/events_gallery/event_photo_2.jpg', alt: 'KPR Events High-Tech LED Video Wall & Intelligent Beam Lighting' },
      { src: '/images/events_gallery/event_photo_3.jpg', alt: 'KPR Events Corporate Arena Audio & Line Array Truss Rigging' },
      { src: '/images/events_gallery/event_photo_4.jpg', alt: 'KPR Events Spectacular Live Musical Performance Atmosphere' },
      { src: '/images/events_gallery/event_photo_5.jpg', alt: 'KPR Events Royal Mandap & Thematic Destination Stage Production' },
      { src: '/images/events_gallery/event_photo_7.jpg', alt: 'KPR Events Mega Stage Architecture & Cold Pyro Atmospheric FX' },
    ],
    // Default fallback (About, Contact, Home): Flagship multi-division highlights
    default: [
      { src: '/images/wedding/photo_1.jpg', alt: 'KPR Productions Fine Art Wedding Photography' },
      { src: '/images/services/wedding_album_printing.png', alt: 'KPR Colour Lab Premium Layflat Album Printing' },
      { src: '/images/events_gallery/event_photo_1.jpg', alt: 'KPR Events Stage Production & LED Walls' },
      { src: '/images/wedding/photo_10.jpg', alt: 'KPR Productions Cinematic Wedding Portrait' },
      { src: '/images/colorlab_album_case.jpg', alt: 'KPR Colour Lab Handcrafted Album Packaging' },
      { src: '/images/events_gallery/event_photo_2.jpg', alt: 'KPR Events Concert Lighting & Truss Rigging' },
    ],
  };

  const galleryItems = SECTION_GALLERIES[activePage] || SECTION_GALLERIES.default;

  return (
    <footer className="bg-[#0A0A0A] text-white border-t border-white/10 pt-10 sm:pt-16 pb-8 sm:pb-12">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* Instagram Grid Teaser (Only visible when showInstagram is true) */}
        {showInstagram && (
          <div className="mb-12 sm:mb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-medium block">
                  {instagramHandle.toUpperCase()}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-light">
                  {activePage === 'colorlab'
                    ? 'Follow Our Colour Lab Journal On Instagram'
                    : activePage === 'events'
                    ? 'Follow Our Events Journal On Instagram'
                    : activePage === 'media'
                    ? 'Follow Our Photography Journal On Instagram'
                    : 'Follow Our Journal On Instagram'}
                </h3>
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 sm:px-4 py-2 border border-white/20 hover:border-[#C5A880] text-[11px] sm:text-xs uppercase tracking-wider text-white/80 hover:text-[#C5A880] transition-all duration-300 flex items-center gap-2 self-start sm:self-auto group"
              >
                <span className="group-hover:text-[#C5A880] font-medium">@{instagramHandle.replace('@', '')}</span>
                <span className="text-[#C5A880] text-sm group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {galleryItems.map((item, i) => (
                <a
                  key={i}
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square bg-white/5 overflow-hidden group/item relative rounded-sm"
                  title={item.alt}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover grayscale brightness-90 group-hover/item:grayscale-0 group-hover/item:brightness-100 group-hover/item:scale-105 transition-all duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                    <InstagramIcon className="w-5 h-5 text-white" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-white/10">
          
          {/* Brand Column (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-wider font-light text-white">KPR PRODUCTIONS</span>
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#C5A880] font-medium">
              FINE ART WEDDING & PORTRAIT STUDIO
            </p>
            <p className="text-xs text-white/60 font-light leading-relaxed max-w-sm">
              Capturing iconic love stories, high fashion editorial portraiture, and luxury destination celebrations worldwide across Warangal, Hanumakonda, and Telangana.
            </p>
          </div>

          {/* Quick Links Column (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880] font-semibold">Studio Pages</h4>
            <nav className="flex flex-col space-y-2 text-xs text-white/70 font-light">
              <a
                href="/wedding-photography-warangal"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('media');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                Photography
              </a>
              <a
                href="/color-lab"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('colorlab');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                Color Lab
              </a>
              <a
                href="/event-photography-hanumakonda"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('events');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                Event Stage
              </a>
              <a
                href="/cost-estimator"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('estimator');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                Cost Calculator
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('about');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                About Studio
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('contact');
                }}
                className="hover:text-[#C5A880] transition-colors"
              >
                Contact Us
              </a>
            </nav>
          </div>

          {/* Studio Contact Info (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880] font-semibold">Studio Enquiries</h4>
            <div className="space-y-2.5 text-xs text-white/70 font-light">
              {showAddress && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-white/80 hover:text-[#C5A880] transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-white block">{addressLine1}</span>
                    <span>{addressLine2}</span>
                  </div>
                </a>
              )}
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 hover:text-[#C5A880] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{contactEmail}</span>
              </a>
              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2 hover:text-[#C5A880] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{contactPhone}</span>
              </a>
            </div>
          </div>

          {/* Social Media Channels Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880] font-semibold">Connect With Us</h4>
            <div className="flex flex-col space-y-2.5">
              
              {/* Instagram Link */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-[#C5A880]/15 border border-white/10 hover:border-[#C5A880]/40 rounded text-xs text-white/80 hover:text-white transition-all duration-300 group"
              >
                <div className="p-1.5 bg-[#C5A880]/20 rounded text-[#C5A880] group-hover:scale-110 transition-transform">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-medium text-white group-hover:text-[#C5A880]">Instagram</span>
                  <span className="text-[10px] text-white/40">{instagramHandle}</span>
                </div>
              </a>

              {/* Facebook Link */}
              {showFacebook && (
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-[#C5A880]/15 border border-white/10 hover:border-[#C5A880]/40 rounded text-xs text-white/80 hover:text-white transition-all duration-300 group"
                >
                  <div className="p-1.5 bg-[#C5A880]/20 rounded text-[#C5A880] group-hover:scale-110 transition-transform">
                    <FacebookIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-medium text-white group-hover:text-[#C5A880]">Facebook</span>
                    <span className="text-[10px] text-white/40">KPR Fotography</span>
                  </div>
                </a>
              )}

              {/* YouTube Link */}
              {showYoutube && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-[#C5A880]/15 border border-white/10 hover:border-[#C5A880]/40 rounded text-xs text-white/80 hover:text-white transition-all duration-300 group"
                >
                  <div className="p-1.5 bg-[#C5A880]/20 rounded text-[#C5A880] group-hover:scale-110 transition-transform">
                    <YoutubeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-medium text-white group-hover:text-[#C5A880]">YouTube</span>
                    <span className="text-[10px] text-white/40">{youtubeHandle}</span>
                  </div>
                </a>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 font-light gap-4">
          <p>© {new Date().getFullYear()} KPR PRODUCTIONS. ALL RIGHTS RESERVED.</p>
          <p className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#C5A880] fill-current" />
            <span>for fine art wedding clients</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
