import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator, Sparkles, Clock, CheckCircle2,
  ChevronRight, ShieldCheck, Tag, Edit3, RotateCcw,
  Camera, Film, Video, Layers, IndianRupee,
  X, Check, Plus, Trash2, CheckSquare, Square
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

  // Multi-Selected package IDs state (Customer can select as many packages as needed!)
  const [selectedIds, setSelectedIds] = useState(() => {
    const firstId = photoPackages[0]?.id || 'pkg-corp-1';
    return [firstId];
  });

  // Selected category filter tab
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');

  // Manual Custom Total Budget / Price state
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [isManualPrice, setIsManualPrice] = useState(false);

  // Manual Custom Duration / Scope state
  const [isManualDuration, setIsManualDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState('');

  // List of currently selected package objects
  const selectedPackages = useMemo(() => {
    return photoPackages.filter(p => selectedIds.includes(String(p.id)));
  }, [photoPackages, selectedIds]);

  // Combined standard base price of all selected packages
  const combinedBasePrice = useMemo(() => {
    return selectedPackages.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  }, [selectedPackages]);

  // Keep custom price synced to sum if not manually altered
  useEffect(() => {
    if (!isManualPrice) {
      setCustomPriceInput(combinedBasePrice > 0 ? String(combinedBasePrice) : '');
    }
  }, [combinedBasePrice, isManualPrice]);

  // Combined standard duration summary
  const combinedDurationText = useMemo(() => {
    if (selectedPackages.length === 0) return 'No duration selected';
    if (selectedPackages.length === 1) return selectedPackages[0].duration || '6 hours';
    const durations = selectedPackages.map(p => p.duration || '6h').join(' + ');
    return durations;
  }, [selectedPackages]);

  // Effective duration for quote
  const effectiveDuration = useMemo(() => {
    if (isManualDuration && customDurationInput.trim()) {
      return customDurationInput.trim();
    }
    return combinedDurationText;
  }, [combinedDurationText, isManualDuration, customDurationInput]);

  // Formatted price string for quote
  const formattedEffectivePrice = useMemo(() => {
    if (isManualPrice && customPriceInput && !isNaN(Number(customPriceInput)) && Number(customPriceInput) > 0) {
      return `₹${Number(customPriceInput).toLocaleString('en-IN')}/-`;
    }
    return combinedBasePrice > 0 ? `₹${combinedBasePrice.toLocaleString('en-IN')}/-` : null;
  }, [isManualPrice, customPriceInput, combinedBasePrice]);

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

  // Toggle package selection (multi-select)
  const handleTogglePackage = (pkgId) => {
    const strId = String(pkgId);
    setSelectedIds(prev => {
      if (prev.includes(strId)) {
        // Remove from selection
        return prev.filter(id => id !== strId);
      } else {
        // Add to selection
        return [...prev, strId];
      }
    });
  };

  // Select all visible packages
  const handleSelectAllVisible = () => {
    const visibleIds = visiblePackages.map(p => String(p.id));
    setSelectedIds(prev => {
      const merged = new Set([...prev, ...visibleIds]);
      return Array.from(merged);
    });
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Reset custom adjustments
  const handleResetManualAdjustments = () => {
    setIsManualPrice(false);
    setIsManualDuration(false);
    setCustomPriceInput(String(combinedBasePrice));
    setCustomDurationInput('');
  };

  // WhatsApp formatted link supporting multiple selected packages
  const buildWhatsAppLink = () => {
    if (selectedPackages.length === 0) {
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Hi KPR Productions, I would like to inquire about photography and videography packages for my upcoming event. Please share pricing and availability.'
      )}`;
    }

    const packageList = selectedPackages
      .map((p, idx) => `${idx + 1}. *${p.name}* (${p.category || 'Photo'}) — ₹${Number(p.price || 0).toLocaleString('en-IN')} [${p.duration || 'Standard Scope'}]`)
      .join('\n');

    let message = `Hi KPR Productions, I would like an Instant Quote for the following *${selectedPackages.length} Fotogarphy Package(s)*:\n\n${packageList}\n\n`;

    if (formattedEffectivePrice) {
      message += `• *Estimated Total Budget:* ${formattedEffectivePrice}\n`;
    }
    if (effectiveDuration) {
      message += `• *Event Duration / Scope:* ${effectiveDuration}\n`;
    }

    message += `\nPlease confirm date availability and package details!`;

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
            <span>Fotogarphy Packages Estimator</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-4xl text-white font-light tracking-wide mb-2">
            Multi-Package Event Quote Builder
          </h3>
          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
            Select <strong className="text-[#E8D4B8] font-normal">as many fotogarphy or videography packages as you need</strong> below to customize your bundle, view instant combined pricing, and book directly via WhatsApp.
          </p>
        </div>

        {/* Top Control Bar: Category Tabs + Multi-Select Actions */}
        <div className="relative z-10 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto justify-start">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold transition-all shrink-0 cursor-pointer ${
                  activeCategoryTab === cat
                    ? 'bg-[#C5A880] text-black shadow-md font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Selection Helper Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-[10px] sm:text-[11px]">
            <span className="text-[#C5A880] font-semibold bg-[#C5A880]/10 px-2.5 py-1 rounded-md border border-[#C5A880]/30">
              {selectedPackages.length} {selectedPackages.length === 1 ? 'Package' : 'Packages'} Selected
            </span>
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="text-white/60 hover:text-white underline cursor-pointer px-1 py-0.5"
              title="Select all packages in current view"
            >
              Select All
            </button>
            {selectedPackages.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-white/40 hover:text-rose-400 underline cursor-pointer px-1 py-0.5"
                title="Clear all selected packages"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Interactive Multi-Select Packages Grid */}
        <div className="relative z-10 mb-7 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visiblePackages.map((pkg) => {
              const isSelected = selectedIds.includes(String(pkg.id));

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleTogglePackage(pkg.id)}
                  className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between cursor-pointer group select-none ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2A241D] to-[#1B1610] border-[#C5A880] text-white shadow-lg shadow-[#C5A880]/20 ring-2 ring-[#C5A880]/60 scale-[1.01]'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  {/* Top Bar: Category & Multi-Select Checkbox */}
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-[#C5A880] font-semibold truncate max-w-[75%]">
                      {pkg.category || 'Photography'}
                    </span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#C5A880] text-black'
                          : 'border border-white/30 group-hover:border-white/60 bg-white/5'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="my-1">
                    <span className={`text-xs sm:text-sm font-serif font-medium leading-tight block ${isSelected ? 'text-white font-semibold' : 'text-white/90 group-hover:text-white'}`}>
                      {pkg.name}
                    </span>
                    {pkg.clientHighlights && (
                      <p className="text-[10px] text-[#E8D4B8]/80 font-light truncate mt-0.5">
                        {pkg.clientHighlights}
                      </p>
                    )}
                  </div>

                  {/* Price & Duration Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2 w-full">
                    <span className="text-xs text-[#C5A880] font-bold">
                      ₹{Number(pkg.price || 0).toLocaleString('en-IN')}/-
                    </span>
                    <span className="text-[9.5px] text-white/60 font-medium truncate flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{pkg.duration || '6 hours'}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Bundle Breakdown & Custom Budget Box */}
        {selectedPackages.length > 0 ? (
          <div className="relative z-10 bg-white/[0.04] border border-[#C5A880]/30 rounded-2xl p-5 sm:p-7 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-7 backdrop-blur-md">
            {/* Left: Summary of all selected packages */}
            <div className="w-full lg:w-3/5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-semibold">
                    Selected Package Bundle:
                  </span>
                  <span className="bg-[#C5A880]/20 text-[#E8D4B8] border border-[#C5A880]/40 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedPackages.length} {selectedPackages.length === 1 ? 'Package' : 'Packages'}
                  </span>
                </div>

                {(isManualPrice || isManualDuration) && (
                  <button
                    type="button"
                    onClick={handleResetManualAdjustments}
                    className="text-[9px] text-[#C5A880] hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset Custom Values</span>
                  </button>
                )}
              </div>

              {/* Chips / Cards of Selected Packages */}
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {selectedPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    className="bg-[#242424] border border-[#C5A880]/30 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-white shadow-xs"
                  >
                    <div className="w-1.5 h-1.5 bg-[#C5A880] rounded-full shrink-0" />
                    <div className="truncate max-w-[180px] sm:max-w-[220px]">
                      <span className="font-serif font-medium">{pkg.name}</span>
                      <span className="text-[10px] text-[#C5A880] font-bold ml-1.5">
                        (₹{Number(pkg.price || 0).toLocaleString('en-IN')})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePackage(pkg.id)}
                      className="text-white/40 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                      title="Remove package from quote"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-white/60 font-light leading-relaxed">
                Includes all primary coverage, high-resolution master deliverables, and full color grading across selected services.
              </p>
            </div>

            {/* Right: Combined Budget & Duration Calculation Inputs */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 bg-black/60 border border-white/10 rounded-xl p-4 sm:p-5 shrink-0">
              {/* Total Estimated Price Entry Box */}
              <div className="text-center sm:text-left min-w-[160px] w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                  <Tag className="w-3 h-3 text-[#C5A880]" />
                  <span>Total Bundle Price</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualPrice(!isManualPrice);
                      if (!isManualPrice) setCustomPriceInput(String(combinedBasePrice));
                    }}
                    title="Customize proposed budget"
                    className="ml-1 text-[9px] text-[#C5A880] hover:text-white underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>{isManualPrice ? 'Auto' : 'Custom'}</span>
                  </button>
                </div>

                {isManualPrice ? (
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-[#C5A880] font-bold">₹</span>
                    <input
                      type="number"
                      value={customPriceInput}
                      onChange={(e) => {
                        setCustomPriceInput(e.target.value);
                        setIsManualPrice(true);
                      }}
                      placeholder="Enter Proposed Budget"
                      className="w-full sm:w-36 bg-[#222222] border border-[#C5A880]/60 focus:border-[#C5A880] rounded-lg pl-6 pr-2.5 py-1.5 text-sm text-[#E8D4B8] font-bold focus:outline-none focus:ring-1 focus:ring-[#C5A880] placeholder-white/30"
                    />
                  </div>
                ) : (
                  <div className="text-lg sm:text-xl text-[#E8D4B8] font-serif font-bold tracking-wide mt-1">
                    ₹{combinedBasePrice.toLocaleString('en-IN')}/-
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-[1px] h-12 bg-white/15" />

              {/* Combined Duration Box */}
              <div className="text-center sm:text-left min-w-[150px] w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
                  <Clock className="w-3 h-3 text-[#C5A880]" />
                  <span>Event Scope</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualDuration(!isManualDuration);
                      if (!isManualDuration) setCustomDurationInput(String(combinedDurationText));
                    }}
                    title="Edit event scope / duration"
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
                      placeholder="e.g. 2 Days / Full Day"
                      className="w-full sm:w-36 bg-[#222222] border border-[#C5A880]/60 focus:border-[#C5A880] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                    />
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-white font-medium tracking-wide mt-1 truncate max-w-[180px]">
                    {effectiveDuration}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 bg-white/[0.02] border border-dashed border-white/20 rounded-2xl p-6 mb-7 text-center">
            <p className="text-sm text-white/60 font-light">
              Tap any of the packages above to add them to your instant multi-package quote.
            </p>
          </div>
        )}

        {/* Action Button: Send Quote via WhatsApp */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-[11px] text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>Direct WhatsApp booking & instant quote generation with KPR Studio management</span>
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
            <span>Send Quote for ({selectedPackages.length}) via WhatsApp</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
