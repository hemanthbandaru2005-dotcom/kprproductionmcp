import React, { useState } from 'react';
import { Calculator, Sparkles, Clock, CheckCircle2, ChevronRight, Send, ShieldCheck, Tag } from 'lucide-react';

export const INSTANT_QUOTE_EVENTS = {
  'wedding': {
    id: 'wedding',
    name: 'Wedding Ceremony',
    price: 24000,
    hours: 6,
    category: 'Wedding',
    badge: 'Most Popular',
    description: 'Complete traditional & candid coverage, master prime lens portraits, and all Telugu ritual highlights.'
  },
  'pre-wedding': {
    id: 'pre-wedding',
    name: 'Pre-Wedding Shoot',
    price: 18000,
    hours: 6,
    category: 'Couple Shoot',
    badge: 'Cinematic',
    description: 'Outdoor cinematic couple portraits, 4K slow-motion gimbal stabilization, and aerial drone framing.'
  },
  'engagement': {
    id: 'engagement',
    name: 'Engagement Ceremony',
    price: 14000,
    hours: 6,
    category: 'Family Event',
    badge: 'Special',
    description: 'Full ritual coverage, ring exchange highlights, family group portraits, and master colour grading.'
  },
  'birthday': {
    id: 'birthday',
    name: 'Birthday Celebration',
    price: 10000,
    hours: 4,
    category: 'Celebration',
    badge: 'Festive',
    description: 'Cake cutting, guest reception, dynamic candid captures, and family celebration moments.'
  },
  'corporate': {
    id: 'corporate',
    name: 'Corporate Events',
    price: 15000,
    hours: 6,
    category: 'Corporate',
    badge: 'Enterprise',
    description: 'Executive AGMs, leadership summits, keynote speakers, and same-day press release deliverables.'
  },
  'government': {
    id: 'government',
    name: 'Government Events',
    price: 20000,
    hours: 6,
    category: 'Government',
    badge: 'Official Protocol',
    description: 'Official state protocol documentation, dignitary visits, and press-ready high-resolution cataloging.'
  },
  'retail': {
    id: 'retail',
    name: 'Shopping Malls & Retail Launch',
    price: 18000,
    hours: 6,
    category: 'Commercial',
    badge: 'Commercial Launch',
    description: 'Store grand openings, celebrity ribbon cuttings, festive crowd engagements, and promotional photo reels.'
  }
};

export default function InstantQuoteWidget({
  whatsappNumber = '919849443648',
  displayPhone = '+91 98494 43648'
}) {
  const [selectedKey, setSelectedKey] = useState('wedding');
  const activeQuote = INSTANT_QUOTE_EVENTS[selectedKey] || INSTANT_QUOTE_EVENTS['wedding'];

  const formattedPrice = `₹${Number(activeQuote.price).toLocaleString('en-IN')}`;

  const buildWhatsAppLink = () => {
    const message = `Hi, I'd like a quote for ${activeQuote.name} — Package: ${formattedPrice} for ${activeQuote.hours} hours. Please confirm availability.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-8 sm:my-14">
      {/* Glassmorphic Luxury Container */}
      <div className="relative bg-gradient-to-b from-[#1E1E1E] to-[#121212] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {/* Header Eyebrow & Title */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8] text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase mb-3 shadow-sm">
            <Calculator className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Instant Estimator</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-4xl text-white font-light tracking-wide mb-2">
            Get Your Instant Event Quote
          </h3>
          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
            Select your event type below to calculate instant transparent pricing and book your dates directly.
          </p>
        </div>

        {/* Interactive Event Selector */}
        <div className="relative z-10 mb-8">
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold mb-3 text-center sm:text-left">
            1. Select Event Type:
          </label>
          
          {/* Responsive Button Group / Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {Object.keys(INSTANT_QUOTE_EVENTS).map((key) => {
              const eventItem = INSTANT_QUOTE_EVENTS[key];
              const isSelected = selectedKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`relative p-3 sm:p-3.5 rounded-xl text-left transition-all duration-300 border flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2A241D] to-[#1F1A14] border-[#C5A880] text-white shadow-lg shadow-[#C5A880]/10 scale-[1.02]'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-[#C5A880] font-medium">
                      {eventItem.category}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-serif font-medium leading-snug ${isSelected ? 'text-white' : 'text-white/80'}`}>
                    {eventItem.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-Filled Quote Display Card */}
        <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 backdrop-blur-md">
          <div className="w-full md:w-auto space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                Event Selected:
              </span>
              <span className="bg-[#C5A880]/20 text-[#E8D4B8] border border-[#C5A880]/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {activeQuote.badge}
              </span>
            </div>
            <h4 className="font-serif text-xl sm:text-2xl text-white font-medium">
              {activeQuote.name}
            </h4>
            <p className="text-xs text-white/60 font-light max-w-md leading-relaxed">
              {activeQuote.description}
            </p>
          </div>

          {/* Price & Duration Big Stat Display */}
          <div className="flex items-center gap-4 sm:gap-6 bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 shrink-0 w-full md:w-auto justify-around md:justify-start">
            <div className="text-center md:text-left">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5">
                Package Price
              </div>
              <div className="font-serif text-2xl sm:text-3xl text-[#E8D4B8] font-bold tracking-tight">
                {formattedPrice}
              </div>
            </div>

            <div className="w-[1px] h-10 bg-white/15" />

            <div className="text-center md:text-left">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#C5A880]" />
                <span>Duration</span>
              </div>
              <div className="text-sm sm:text-base text-white font-bold tracking-wide mt-0.5">
                {activeQuote.hours} Hours
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Send via WhatsApp */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Official KPR Studio direct response & date lock guaranteed</span>
          </div>

          <a
            href={buildWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#1EBE5A] text-white text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/30 hover:scale-[1.02] rounded-xl cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.431 2.504 1.16 3.477l-.76 2.776 2.842-.746c.94.512 2.019.803 3.167.803 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.769-5.766zm4.186 8.163c-.174.492-.857.901-1.393.992-.367.062-.846.111-2.457-.557-2.062-.854-3.393-2.951-3.495-3.088-.103-.138-.834-1.112-.834-2.122 0-1.01.527-1.507.714-1.713.188-.206.411-.257.548-.257.137 0 .274.001.394.007.127.006.298-.048.466.356.174.419.599 1.463.651 1.567.052.103.086.223.018.36-.069.137-.103.223-.206.343-.103.12-.216.268-.309.36-.103.103-.211.215-.091.421.12.206.533.88 1.144 1.424.786.7 1.45.918 1.656 1.021.206.103.326.086.446-.052.12-.137.514-.6.651-.806.137-.206.274-.171.463-.103.188.069 1.2.566 1.406.669.206.103.343.154.394.24.051.086.051.497-.123.989zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.176L2 22l4.981-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
            <span>Send Quote via WhatsApp</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
