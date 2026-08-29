import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator, Sparkles, Clock, CheckCircle2,
  ChevronRight, ShieldCheck, Tag, Edit3, RotateCcw,
  Camera, Film, Video, Layers, IndianRupee
} from 'lucide-react';
import { fetchSitePackages, OFFICIAL_PHOTOGRAPHY_PACKAGES } from '../utils/packagesService';

export default function InstantQuoteWidget({
  packages: initialPackages,
  whatsappNumber = '919849443648',
  displayPhone = '+91 98494 43648'
}) {
  const [photoPackages, setPhotoPackages] = useState(
    Array.isArray(initialPackages) && initialPackages.length > 0
      ? initialPackages.filter(p => p.type === 'photography' || !p.type)
      : OFFICIAL_PHOTOGRAPHY_PACKAGES
  );

  useEffect(() => {
    async function loadFreshPackages() {
      try {
        const data = await fetchSitePackages('photography');
        if (data && data.length > 0) {
          const filtered = data.filter(p => (p.type === 'photography' || !p.type) && p.status !== 'hidden');
          if (filtered.length > 0) {
            setPhotoPackages(filtered);
          }
        }
      } catch (e) {
        console.warn('Failed to load fresh photography packages for quote widget:', e);
      }
    }
    loadFreshPackages();
  }, []);

  // Selected package state
  const [selectedId, setSelectedId] = useState(() => {
    return photoPackages[0]?.id || 'pkg-corp-1';
  });

  // Selected category filter tab
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');

  // Manual Custom Price state (starts blank - 100% manual entry, NO default price shown)
  const [customPriceInput, setCustomPriceInput] = useState('');

  // Manual Custom Duration state
  const [isManualDuration, setIsManualDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('');

  // Find active package
  const activePackage = useMemo(() => {
    const found = photoPackages.find(p => String(p.id) === String(selectedId));
    return found || photoPackages[0] || OFFICIAL_PHOTOGRAPHY_PACKAGES[0];
  }, [photoPackages, selectedId]);

  // Extract effective duration
  const effectiveDuration = useMemo(() => {
    if (isManualDuration && customDurationInput.trim()) {
      return customDurationInput.trim();
    }
    return activePackage?.duration || '6 hours';
  }, [activePackage, isManualDuration, customDurationInput]);

  // Formatted price string if entered manually
  const formattedManualPrice = useMemo(() => {
    if (!customPriceInput || isNaN(Number(customPriceInput)) || Number(customPriceInput) <= 0) {
      return null;
    }
    return `₹${Number(customPriceInput).toLocaleString('en-IN')}`;
  }, [customPriceInput]);

  // Available categories for pill tabs
  const categories = useMemo(() => {
    const set = new Set();
    photoPackages.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [photoPackages]);

  // Filtered packages for the selector
  const visiblePackages = useMemo(() => {
    if (activeCategoryTab === 'ALL') return photoPackages;
    return photoPackages.filter(p => p.category === activeCategoryTab);
  }, [photoPackages, activeCategoryTab]);

  // Handle switching packages (no default price is populated)
  const handleSelectPackage = (pkg) => {
    setSelectedId(pkg.id);
    setIsManualDuration(false);
    setCustomDurationInput('');
  };

  // WhatsApp formatted link
  const buildWhatsAppLink = () => {
    const durationText = effectiveDuration.toLowerCase().includes('hour') ||
      effectiveDuration.toLowerCase().includes('min') ||
      effectiveDuration.toLowerCase().includes('sheet') ||
      effectiveDuration.toLowerCase().includes('day')
      ? effectiveDuration
      : `${effectiveDuration} hours`;

    let message = '';
    if (formattedManualPrice) {
      message = `Hi, I'd like a quote for ${activePackage?.name || 'Photography'} — Proposed Package Budget: ${formattedManualPrice} for ${durationText}. Please confirm availability.`;
    } else {
      message = `Hi, I'd like a quote for ${activePackage?.name || 'Photography'} (${durationText}). Please share pricing and confirm availability.`;
    }

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-8 sm:my-14" id="instant-quote-calculator">
      {/* Luxury Glassmorphic Container */}
      <div className="relative bg-gradient-to-b from-[#1C1C1C] via-[#141414] to-[#0D0D0D] border border-[#C5A880]/30 rounded-2xl p-5 sm:p-10 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Ambient Warm Golden Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C5A880]/5 rounded-full blur-2xl pointer-events-none -ml-28 -mb-28" />

        {/* Eyebrow & Title */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-7 sm:mb-9">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8] text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] uppercase mb-3 shadow-sm">
            <Calculator className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Photography Packages Estimator</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-4xl text-white font-light tracking-wide mb-2">
            Get Your Instant Event Quote
          </h3>
          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
            Choose any photography or videography package below, customize duration/budget if needed, and send directly via WhatsApp.
          </p>
        </div>

        {/* Category Tabs for Fast Browsing */}
        <div className="relative z-10 mb-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryTab(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                activeCategoryTab === cat
                  ? 'bg-[#C5A880] text-black shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dropdown for Mobile / Compact Navigation */}
        <div className="relative z-10 block sm:hidden mb-4">
          <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold mb-1.5">
            Select Photography Package:
          </label>
          <select
            value={selectedId}
            onChange={(e) => {
              const pkg = photoPackages.find(p => String(p.id) === String(e.target.value));
              if (pkg) handleSelectPackage(pkg);
            }}
            className="w-full bg-[#242424] border border-[#C5A880]/40 rounded-xl px-4 py-3 text-white text-xs font-serif focus:outline-none focus:border-[#C5A880]"
          >
            {photoPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id} className="bg-[#1A1A1A] text-white">
                {pkg.name} ({pkg.duration})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Photography Packages Grid (No Prices on Cards) */}
        <div className="relative z-10 mb-7 max-h-[310px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {visiblePackages.map((pkg) => {
              const isSelected = String(selectedId) === String(pkg.id);

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className={`relative p-3 rounded-xl text-left transition-all duration-300 border flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2A241D] to-[#1F1A14] border-[#C5A880] text-white shadow-lg shadow-[#C5A880]/15 ring-1 ring-[#C5A880]/50 scale-[1.01]'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[8.5px] uppercase tracking-widest text-[#C5A880] font-semibold truncate max-w-[80%]">
                      {pkg.category || 'Photography'}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                    )}
                  </div>

                  <span className={`text-xs sm:text-sm font-serif font-medium leading-tight mb-2 ${isSelected ? 'text-white font-semibold' : 'text-white/90 group-hover:text-white'}`}>
                    {pkg.name}
                  </span>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/10 mt-auto">
                    <span className="text-[10px] text-[#C5A880]/80 font-medium truncate flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{pkg.duration}</span>
                    </span>
                    {pkg.popular && (
                      <span className="text-[8px] bg-[#C5A880]/20 text-[#E8D4B8] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Package Breakdown Card with 100% Manual Price & Duration Editing */}
        <div className="relative z-10 bg-white/[0.04] border border-white/10 rounded-2xl p-5 sm:p-7 flex flex-col lg:flex-row items-center justify-between gap-6 mb-7 backdrop-blur-md">
          {/* Left Details */}
          <div className="w-full lg:w-1/2 space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                Package Selected:
              </span>
              <span className="bg-[#C5A880]/20 text-[#E8D4B8] border border-[#C5A880]/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {activePackage.category || 'Photography'}
              </span>
              {activePackage.popular && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Popular
                </span>
              )}
            </div>

            <h4 className="font-serif text-xl sm:text-2xl text-white font-medium">
              {activePackage.name}
            </h4>

            <p className="text-xs text-white/65 font-light leading-relaxed max-w-lg">
              {activePackage.description || 'Full professional photographic coverage with high-resolution deliverables and color grading.'}
            </p>

            {/* Quick Feature Checklist */}
            {activePackage.features && activePackage.features.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-[10px] text-white/60">
                {activePackage.features.slice(0, 3).map((feat, idx) => (
                  <span key={idx} className="bg-white/5 px-2.5 py-1 rounded-md border border-white/5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full" />
                    {feat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Inputs: Manual Package Price & Duration Scope */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 bg-black/50 border border-white/10 rounded-xl p-4 sm:p-5 shrink-0">
            {/* Manual Price Entry Box */}
            <div className="text-center sm:text-left min-w-[150px] w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                <Tag className="w-3 h-3 text-[#C5A880]" />
                <span>Package Price</span>
                <span className="text-[9px] text-[#C5A880] font-normal">(Manual)</span>
              </div>

              <div className="relative mt-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#C5A880] font-bold">₹</span>
                <input
                  type="number"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder="Enter Price"
                  className="w-full sm:w-36 bg-[#222222] border border-[#C5A880]/60 focus:border-[#C5A880] rounded-lg pl-6 pr-2.5 py-1.5 text-sm text-[#E8D4B8] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A880] placeholder-white/30"
                />
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-12 bg-white/15" />

            {/* Duration Box with Edit Option */}
            <div className="text-center sm:text-left min-w-[140px] w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                <Clock className="w-3 h-3 text-[#C5A880]" />
                <span>Duration / Scope</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualDuration(!isManualDuration);
                    if (!isManualDuration) setCustomDurationInput(String(activePackage.duration || '6 hours'));
                  }}
                  title="Click to edit duration / scope"
                  className="ml-1 text-[9px] text-[#C5A880] hover:text-white underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{isManualDuration ? 'Reset' : 'Edit'}</span>
                </button>
              </div>

              {isManualDuration ? (
                <div className="mt-1">
                  <input
                    type="text"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    placeholder="e.g. 6 hours / Full Day"
                    className="w-full sm:w-36 bg-[#222222] border border-[#C5A880]/60 focus:border-[#C5A880] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                  />
                </div>
              ) : (
                <div className="text-sm sm:text-base text-white font-bold tracking-wide mt-1">
                  {effectiveDuration}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Send Quote via WhatsApp */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-[11px] text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Direct WhatsApp booking with KPR Studio management</span>
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
