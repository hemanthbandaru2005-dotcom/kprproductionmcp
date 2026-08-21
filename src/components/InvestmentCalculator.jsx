import React, { useState } from 'react';
import { PACKAGES, ADD_ONS } from '../data/packagesData';
import { Check, Sparkles, Plus, Calculator, ArrowRight } from 'lucide-react';

export default function InvestmentCalculator({ onOpenInquireWithPackage }) {
  const [selectedPackageId, setSelectedPackageId] = useState('modern-luxury');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  const [extraHoursCount, setExtraHoursCount] = useState(0);

  const selectedPackage = PACKAGES.find(p => p.id === selectedPackageId) || PACKAGES[1];

  const toggleAddOn = (addonId) => {
    if (selectedAddOnIds.includes(addonId)) {
      setSelectedAddOnIds(selectedAddOnIds.filter(id => id !== addonId));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, addonId]);
    }
  };

  // Calculate Total Price
  const basePrice = selectedPackage.price;
  const addOnsTotal = selectedAddOnIds.reduce((sum, id) => {
    const addon = ADD_ONS.find(a => a.id === id);
    return sum + (addon ? addon.price : 0);
  }, 0);
  const extraHoursTotal = extraHoursCount * 450;
  const totalPrice = basePrice + addOnsTotal + extraHoursTotal;

  const handleBookNow = () => {
    const customPackageData = {
      package: selectedPackage,
      addOns: selectedAddOnIds.map(id => ADD_ONS.find(a => a.id === id)),
      extraHours: extraHoursCount,
      totalPrice
    };
    onOpenInquireWithPackage(customPackageData);
  };

  return (
    <section id="investment" className="py-24 bg-[#F7F3EE] relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase text-[#666666] font-medium mb-3">
            INVESTMENT & PRICING
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1A1A] font-light tracking-wide mb-6">
            BESPOKE COLLECTION PACKAGES
          </h2>
          <p className="text-[#666666] text-sm font-light leading-relaxed">
            Select your preferred wedding experience or customize your add-ons below for real-time tailored pricing.
          </p>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`relative bg-white p-8 border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#C5A880] ring-2 ring-[#C5A880]/30 shadow-xl -translate-y-2'
                    : 'border-[#E2D9CC] hover:border-[#C5A880]/50 shadow-md'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C5A880] text-white text-[10px] tracking-[0.25em] uppercase px-4 py-1 font-semibold flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3" />
                    <span>MOST POPULAR</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif text-2xl text-[#1A1A1A]">{pkg.name}</h3>
                    <p className="text-xs text-[#777777] mt-1 italic font-light">{pkg.tagline}</p>
                  </div>

                  <div className="py-4 border-y border-[#E8E1D5]">
                    <span className="text-[11px] tracking-widest uppercase text-[#888888]">Starting At</span>
                    <p className="font-serif text-4xl text-[#1A1A1A] font-light mt-1">
                      ${pkg.price.toLocaleString()} <span className="text-xs font-mono text-[#666666]">USD</span>
                    </p>
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#444444] font-light">
                        <Check className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPackageId(pkg.id);
                  }}
                  className={`w-full py-3 mt-8 text-[11px] tracking-[0.25em] uppercase font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F7F3EE] text-[#1A1A1A] hover:bg-[#C5A880] hover:text-white border border-[#E2D9CC]'
                  }`}
                >
                  {isSelected ? 'SELECTED PACKAGE' : 'SELECT PACKAGE'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Add-ons & Calculator Panel */}
        <div className="bg-white p-8 md:p-12 border border-[#E2D9CC] shadow-xl max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#E8E1D5]">
            <Calculator className="w-6 h-6 text-[#C5A880]" />
            <div>
              <h3 className="font-serif text-2xl text-[#1A1A1A]">Customize Your Experience</h3>
              <p className="text-xs text-[#777777]">Tailor add-ons to fit your exact wedding day schedule.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {ADD_ONS.map((addon) => {
              const isChecked = selectedAddOnIds.includes(addon.id);
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddOn(addon.id)}
                  className={`p-4 border cursor-pointer transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-[#FDFBF7] border-[#C5A880] text-[#1A1A1A]'
                      : 'bg-white border-[#E8E1D5] hover:border-[#C5A880]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isChecked ? 'bg-[#C5A880] border-[#C5A880] text-white' : 'border-[#CCCCCC]'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">{addon.name}</p>
                      <p className="text-[10px] text-[#777777] uppercase tracking-wider">{addon.unit}</p>
                    </div>
                  </div>
                  <span className="font-serif text-base text-[#C5A880] font-medium">+${addon.price}</span>
                </div>
              );
            })}
          </div>

          {/* Calculator Total Summary Bar */}
          <div className="bg-[#121212] text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm">
            <div>
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#C5A880]">Estimated Total Investment</p>
              <h4 className="font-serif text-3xl md:text-4xl text-white font-light mt-1">
                ${totalPrice.toLocaleString()} <span className="text-xs font-sans text-white/50">USD</span>
              </h4>
              <p className="text-xs text-white/60 mt-1 font-light">
                Includes {selectedPackage.name} + {selectedAddOnIds.length} custom add-ons
              </p>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full md:w-auto px-8 py-4 bg-[#C5A880] hover:bg-[#A4865E] text-white text-[11px] font-medium tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-2 group shrink-0"
            >
              <span>INQUIRE WITH THIS PACKAGE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
