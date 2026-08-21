import React from 'react';
import { Camera, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { SOCIAL_LINKS } from '../utils/socialLinks';
import { InstagramIcon, FacebookIcon, YoutubeIcon } from './SocialIcons';

export default function Footer({ onOpenInquire, showInstagram = true }) {
  const instagramGrid = [
    '/images/21/photo_1.jpg',
    '/images/21/photo_2.jpg',
    '/images/21/photo_3.jpg',
    '/images/21/photo_4.jpg',
    '/images/21/photo_5.jpg',
    '/images/21/photo_1.jpg'
  ];

  return (
    <footer className="bg-[#0A0A0A] text-white border-t border-white/10 pt-10 sm:pt-16 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        
        {/* Instagram Grid Teaser (Only visible when showInstagram is true) */}
        {showInstagram && (
          <div className="mb-12 sm:mb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-white/10">
              <div>
                <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-medium block">
                  @KPR_FOTOGRAPHY
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-light">Follow Our Journal On Instagram</h3>
              </div>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 sm:px-4 py-2 border border-white/20 hover:border-[#C5A880] text-[11px] sm:text-xs uppercase tracking-wider text-white/80 hover:text-[#C5A880] transition-all duration-300 flex items-center gap-2 self-start sm:self-auto group"
              >
                <InstagramIcon className="w-4 h-4 text-[#C5A880] group-hover:scale-110 transition-transform" />
                <span>Follow Live @kpr_fotography</span>
              </a>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {instagramGrid.map((img, i) => (
                <a
                  key={i}
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden bg-white/5 border border-white/10"
                >
                  <img src={img} alt="Instagram preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <InstagramIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A880]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer Main Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 pb-10 sm:pb-16 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-serif text-3xl tracking-[0.2em] uppercase text-white font-light">
              KPR PRODUCTIONS
            </h2>
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#C5A880]">
              FINE ART WEDDING & PORTRAIT STUDIO
            </p>
            <p className="text-xs text-white/60 font-light leading-relaxed max-w-sm">
              Capturing iconic love stories, high fashion editorial portraiture, and luxury destination celebrations worldwide.
            </p>
          </div>

          {/* Studio Contact Info */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880] font-semibold">Studio Enquiries</h4>
            <div className="space-y-2.5 text-xs text-white/70 font-light">
              <a
                href="https://goo.gl/maps/NtABjd1bV6S5kNHq8?g_st=ac"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-white/80 hover:text-[#C5A880] transition-colors group"
              >
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-semibold text-white block">Grand Gayathri, 8-5-34</span>
                  <span>TKS Commercial Complex, Station Road, Warangal 506002</span>
                </div>
              </a>
              <a
                href="mailto:kprfotography@gmail.com"
                className="flex items-center gap-2 hover:text-[#C5A880] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>kprfotography@gmail.com</span>
              </a>
              <a
                href="tel:+919849443648"
                className="flex items-center gap-2 hover:text-[#C5A880] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>+91 98494 43648</span>
              </a>
            </div>
          </div>

          {/* Social Media Channels Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880] font-semibold">Connect With Us</h4>
            <div className="flex flex-col space-y-2.5">
              
              {/* Instagram Link */}
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-[#C5A880]/15 border border-white/10 hover:border-[#C5A880]/40 rounded text-xs text-white/80 hover:text-white transition-all duration-300 group"
              >
                <div className="p-1.5 bg-[#C5A880]/20 rounded text-[#C5A880] group-hover:scale-110 transition-transform">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-medium text-white group-hover:text-[#C5A880]">Instagram</span>
                  <span className="text-[10px] text-white/40">@kpr_fotography</span>
                </div>
              </a>

              {/* Facebook Link */}
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

              {/* YouTube Link */}
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-[#C5A880]/15 border border-white/10 hover:border-[#C5A880]/40 rounded text-xs text-white/80 hover:text-white transition-all duration-300 group"
              >
                <div className="p-1.5 bg-[#C5A880]/20 rounded text-[#C5A880] group-hover:scale-110 transition-transform">
                  <YoutubeIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-medium text-white group-hover:text-[#C5A880]">YouTube</span>
                  <span className="text-[10px] text-white/40">@kprfotography</span>
                </div>
              </a>

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
