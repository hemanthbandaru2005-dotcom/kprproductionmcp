import React, { useState, useMemo, useEffect } from 'react';
import {
  Check, ArrowLeft, ArrowRight, Sparkles, Download, CheckCircle2,
  Calendar, Phone, User, ShieldCheck, Heart, Camera, Video, Film,
  Layers, Sliders, ChevronRight, RotateCcw, FileText, Send, Clock,
  Plus, Minus, AlertCircle, Eye
} from 'lucide-react';
import { OFFICIAL_PHOTOGRAPHY_PACKAGES } from '../../utils/packagesService';
import { CATEGORIES } from '../../data/galleryData';
import { generateEstimatePdf, formatINR } from '../../utils/estimatorPdfService';

// Celebratory Event icons & tags mapping for Step 2
const EVENT_METADATA = {
  'Wedding': { emoji: '💍', label: 'Grand Telugu Wedding', tag: 'Most Popular' },
  'Engagement': { emoji: '✨', label: 'Ring Ceremony & Nischitartham', tag: 'Popular' },
  'Reception': { emoji: '🥂', label: 'Evening Banquet & Gala', tag: 'Grand' },
  'Haldi': { emoji: '💛', label: 'Pellikuthuru & Mangalasnanam', tag: 'Traditional' },
  'Saree Function': { emoji: '🌸', label: 'Half Saree / Ritu Kala Samskara', tag: 'Traditional' },
  'Birthday': { emoji: '🎂', label: 'Milestone Birthdays & Anniversaries', tag: 'Celebration' },
  'Panchalu': { emoji: '🪡', label: 'Dhoti Ceremony & Traditional Rituals', tag: 'Traditional' },
  'Pre Wedding': { emoji: '🌅', label: 'Cinematic Outdoor Love Story', tag: 'Trending' },
  'Maternity': { emoji: '👶', label: 'Motherhood & Baby Shower', tag: 'Memories' },
  'Modeling': { emoji: '📸', label: 'Fashion, Editorial & Portraiture', tag: 'Portfolio' },
  'Corporate & Commercial Events': { emoji: '🏢', label: 'Conferences, Summits & Protocol', tag: 'Commercial' },
  'Shopping Malls': { emoji: '🛍️', label: 'Mall Launches & Celebrity Invocations', tag: 'High-Impact' },
  '21': { emoji: '🌟', label: '21st Day Cradle & Naming Ceremony', tag: 'Auspicious' },
  'Nature': { emoji: '🌿', label: 'Landscape, Floral & Outdoor', tag: 'Scenic' }
};

// Official Deliverable Add-ons (exact prices)
const OPTIONAL_ADDONS = [
  {
    id: 'addon-trad-edit',
    name: 'Extra Traditional Video Editing',
    scope: 'Per 1 additional hour finished master footage',
    price: 2000,
    unit: 'hour',
    category: 'Editing'
  },
  {
    id: 'addon-cine-edit',
    name: 'Extra Cinematic Video Editing',
    scope: 'Per 1 additional hour cinematic timeline grading & sound design',
    price: 6000,
    unit: 'hour',
    category: 'Editing'
  },
  {
    id: 'addon-live-link',
    name: 'Additional Live Streaming Channel Link',
    scope: '4 hours 1080p live stream broadcast for remote guests',
    price: 6000,
    unit: 'broadcast',
    category: 'Broadcast'
  },
  {
    id: 'addon-led-screen',
    name: 'P3 High-Definition LED Video Wall Setup',
    scope: '6 hours real-time stage display with technical crew',
    price: 16000,
    unit: 'setup',
    category: 'Display'
  },
  {
    id: 'addon-usb-box',
    name: 'Custom Wooden Keepsake Box + 64GB USB 3.0',
    scope: 'Laser-engraved couple monogram with full archival raw & master files',
    price: 1500,
    unit: 'box',
    category: 'Storage'
  }
];

export default function PhotographyCostEstimator({ onBackToHome, onNavigateToPage }) {
  // Step tracker (1 through 7)
  const [currentStep, setCurrentStep] = useState(1);

  // ── STEP 1: Client Information ──
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');

  // ── STEP 2: Selected Event ──
  const [selectedEvent, setSelectedEvent] = useState('Wedding');

  // ── STEP 3: Selected Packages ──
  // Default to popular starter combination: Candid Photo + Traditional Video
  const [selectedPackageIds, setSelectedPackageIds] = useState(['pkg-3', 'pkg-2']);
  const [packageCategoryFilter, setPackageCategoryFilter] = useState('ALL');

  // ── STEP 4: Album Selection ──
  const [needAlbum, setNeedAlbum] = useState(true);
  const [albumSheets, setAlbumSheets] = useState(30); // 30 sheets = 60 pages = 30 * 250 = ₹7,500
  const [albumCoverStyle, setAlbumCoverStyle] = useState('Italian Leatherette with Gold Embossing');

  // ── STEP 5: Deliverables Add-Ons ──
  const [selectedAddons, setSelectedAddons] = useState({});

  // ── Estimate Reference & Date ──
  const [estimateNumber] = useState(() => `KPR-EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [estimateDate] = useState(() => new Date());

  // Available studio packages (excluding sheet item from services list, as it belongs to Step 4)
  const availablePackages = useMemo(() => {
    return OFFICIAL_PHOTOGRAPHY_PACKAGES.filter(p => p.id !== 'pkg-12' && p.name !== 'Each Album One Sheet');
  }, []);

  // Filtered packages based on Category tab
  const filteredPackages = useMemo(() => {
    if (packageCategoryFilter === 'ALL') return availablePackages;
    return availablePackages.filter(p => {
      if (packageCategoryFilter === 'Photography') return p.category === 'Photography';
      if (packageCategoryFilter === 'Videography') return p.category === 'Videography';
      if (packageCategoryFilter === 'Aerial') return p.category === 'Aerial';
      if (packageCategoryFilter === 'Editing') return p.category === 'Editing';
      if (packageCategoryFilter === 'Commercial') return p.category === 'Corporate & Commercial' || p.category === 'Commercial Retail';
      return true;
    });
  }, [availablePackages, packageCategoryFilter]);

  // Selected packages objects
  const selectedPackages = useMemo(() => {
    return availablePackages.filter(p => selectedPackageIds.includes(p.id));
  }, [availablePackages, selectedPackageIds]);

  // Pricing calculations (Centralized, purely derived, zero hardcoding)
  const servicesSubtotal = useMemo(() => {
    return selectedPackages.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  }, [selectedPackages]);

  // Album subtotal: exact ₹250 per sheet
  const albumSubtotal = useMemo(() => {
    if (!needAlbum) return 0;
    return Math.max(1, Number(albumSheets) || 0) * 250;
  }, [needAlbum, albumSheets]);

  // Add-ons subtotal
  const addOnsSubtotal = useMemo(() => {
    return Object.entries(selectedAddons).reduce((acc, [addonId, qty]) => {
      const addon = OPTIONAL_ADDONS.find(a => a.id === addonId);
      if (addon && qty > 0) {
        return acc + (addon.price * qty);
      }
      return acc;
    }, 0);
  }, [selectedAddons]);

  // Grand Total
  const grandTotal = useMemo(() => {
    return servicesSubtotal + albumSubtotal + addOnsSubtotal;
  }, [servicesSubtotal, albumSubtotal, addOnsSubtotal]);

  // Dynamic deliverables based on chosen packages
  const includedDeliverables = useMemo(() => {
    const list = [
      'Full event high-resolution photographs with master color grading',
      'Private cloud download gallery link with high-speed delivery'
    ];

    const hasTradPhoto = selectedPackageIds.includes('pkg-1');
    const hasTradVideo = selectedPackageIds.includes('pkg-2');
    const hasCandid = selectedPackageIds.includes('pkg-3');
    const hasCinematic = selectedPackageIds.includes('pkg-4');
    const hasDrone = selectedPackageIds.includes('pkg-5') || selectedPackageIds.includes('pkg-7');
    const hasLiveLink = selectedPackageIds.includes('pkg-8');
    const hasLED = selectedPackageIds.includes('pkg-6');
    const hasTeaser = selectedPackageIds.includes('pkg-9');
    const hasCommercial = selectedPackageIds.includes('pkg-corp-1') || selectedPackageIds.includes('pkg-mall-1');

    if (hasCandid) {
      list.push('Prime lens portraits with artistic depth & emotional storytelling');
      list.push('Social media vertical highlight teaser for Instagram/Reels');
    }
    if (hasTradPhoto && !hasCandid) {
      list.push('Traditional ceremony stage group portraits with balanced lighting');
    }
    if (hasTradVideo) {
      list.push('Continuous Full HD multi-angle video master archive with clean audio');
    }
    if (hasCinematic) {
      list.push('4K 10-bit cinematic gimbal movements & film-grade LUT color grading');
      list.push('Signature wedding cinema highlight film (3-5 minutes duration)');
    }
    if (hasDrone) {
      list.push('4K stabilized aerial flyby video of venue, baraat & mandap');
    }
    if (hasLiveLink) {
      list.push('Full HD live broadcast streaming link (YouTube/Private) for distant guests');
    }
    if (hasLED) {
      list.push('Real-time stage live video feed displayed on P3 LED wall display');
    }
    if (hasTeaser && !hasCinematic) {
      list.push('Curated 4-5 minute cinematic teaser with synchronized soundtrack');
    }
    if (hasCommercial) {
      list.push('High-speed media turnaround for PR, newspaper & corporate distribution');
      list.push('Keynote speakers, VIP dignitary portraits & venue merchandising coverage');
    }
    if (needAlbum) {
      list.push(`Handcrafted flush-mount layflat wedding album (${albumSheets} Sheets / ${albumSheets * 2} Pages)`);
      list.push('Archival museum non-tearable paper with thermal UV gloss/matt protective coating');
    }

    return list;
  }, [selectedPackageIds, needAlbum, albumSheets]);

  // Handle phone input with strict 10 digits validation
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // only digits
    if (raw.length <= 10) {
      setCustomerPhone(raw);
      if (raw.length === 10) {
        setPhoneError('');
      }
    }
  };

  // Validate step 1
  const handleStep1Submit = () => {
    let valid = true;
    if (!customerName.trim() || customerName.trim().length < 2) {
      setNameError('Please enter your full name (at least 2 characters).');
      valid = false;
    } else {
      setNameError('');
    }

    if (!customerPhone || customerPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian phone number.');
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      setPhoneError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      valid = false;
    } else {
      setPhoneError('');
    }

    if (valid) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle package selection in step 3
  const togglePackage = (id) => {
    if (selectedPackageIds.includes(id)) {
      if (selectedPackageIds.length === 1) {
        // Prevent deselecting everything without warning
        return;
      }
      setSelectedPackageIds(selectedPackageIds.filter(item => item !== id));
    } else {
      setSelectedPackageIds([...selectedPackageIds, id]);
    }
  };

  // Deliverable add-on quantity controls
  const updateAddonQty = (addonId, delta) => {
    const current = selectedAddons[addonId] || 0;
    const next = Math.max(0, current + delta);
    setSelectedAddons(prev => {
      const copy = { ...prev };
      if (next === 0) {
        delete copy[addonId];
      } else {
        copy[addonId] = next;
      }
      return copy;
    });
  };

  // Generate Estimate Data Object
  const getEstimateDataObject = () => {
    const addonsList = Object.entries(selectedAddons).map(([id, qty]) => {
      const a = OPTIONAL_ADDONS.find(item => item.id === id);
      return {
        id,
        name: a?.name || id,
        scope: a?.scope || '',
        price: a?.price || 0,
        quantity: qty
      };
    });

    return {
      estimateNumber,
      date: estimateDate,
      customerName,
      customerPhone,
      event: selectedEvent,
      selectedPackages,
      album: {
        needAlbum,
        sheets: needAlbum ? albumSheets : 0,
        coverStyle: albumCoverStyle,
        price: albumSubtotal
      },
      deliverables: includedDeliverables,
      addOns: addonsList,
      servicesSubtotal,
      albumSubtotal,
      addOnsSubtotal,
      grandTotal
    };
  };

  // Trigger PDF download
  const handleDownloadPdf = () => {
    const data = getEstimateDataObject();
    generateEstimatePdf(data, true);
  };

  // WhatsApp 1-Click inquiry
  const getWhatsAppShareUrl = () => {
    const pkgNames = selectedPackages.map(p => `• ${p.name} (₹${p.price.toLocaleString('en-IN')})`).join('\n');
    const albumTxt = needAlbum ? `Yes (${albumSheets} Sheets / ${albumSheets * 2} Pages - ₹${albumSubtotal.toLocaleString('en-IN')})` : 'Digital Only';

    const msg = `*KPR PHOTOGRAPHY COST ESTIMATE*\n` +
      `*Estimate No:* ${estimateNumber}\n` +
      `*Client:* ${customerName} (+91 ${customerPhone})\n` +
      `*Celebrating:* ${selectedEvent}\n\n` +
      `*Selected Services:*\n${pkgNames}\n\n` +
      `*Album:* ${albumTxt}\n` +
      `*Total Estimated Investment:* ₹${grandTotal.toLocaleString('en-IN')}/-\n\n` +
      `Hello KPR Photography team! I have configured my event estimate on your website and would like to verify date availability and discuss booking details.`;

    return `https://wa.me/919849443648?text=${encodeURIComponent(msg)}`;
  };

  // Reset entire flow
  const handleStartNewEstimate = () => {
    setCurrentStep(1);
    setCustomerName('');
    setCustomerPhone('');
    setSelectedEvent('Wedding');
    setSelectedPackageIds(['pkg-3', 'pkg-2']);
    setNeedAlbum(true);
    setAlbumSheets(30);
    setSelectedAddons({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stepper Header Data
  const stepsMeta = [
    { num: 1, title: 'Client Info' },
    { num: 2, title: 'Event' },
    { num: 3, title: 'Packages' },
    { num: 4, title: 'Album' },
    { num: 5, title: 'Deliverables' },
    { num: 6, title: 'Summary' },
    { num: 7, title: 'Download' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#0D0B08] text-[#FAF7F2] py-6 sm:py-12 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#C5A880] selection:text-black">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Header Badge */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8] text-[11px] font-semibold tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>KPR Photography Studio • Cost Estimator</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-light text-[#FAF7F2] tracking-wide">
            Event Photography Cost Estimator
          </h1>
          <p className="text-xs sm:text-sm text-[#A89F91] max-w-xl mx-auto mt-2 font-light">
            Plan your celebration with 100% transparent studio pricing. Calculate exact costs for candid photography, 4K cinematic video, drone, and luxury layflat albums.
          </p>
        </div>

        {/* ── 7-STEP PROGRESS INDICATOR ── */}
        <div className="bg-[#161412] border border-[#2B2724] rounded-2xl p-3 sm:p-4 mb-8 shadow-xl">
          <div className="flex items-center justify-between relative overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {stepsMeta.map((s, idx) => {
              const isCompleted = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex items-center shrink-0">
                  {/* Step Item */}
                  <button
                    onClick={() => {
                      if (isCompleted) {
                        setCurrentStep(s.num);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    disabled={!isCompleted && !isCurrent}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-[#C5A880] text-black font-bold shadow-lg shadow-[#C5A880]/20'
                        : isCompleted
                        ? 'text-[#C5A880] hover:bg-[#C5A880]/10 cursor-pointer'
                        : 'text-[#666058] cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-black text-[#C5A880]'
                        : isCompleted
                        ? 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]'
                        : 'bg-[#22201D] text-[#666058]'
                    }`}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider hidden md:inline">
                      {s.title}
                    </span>
                  </button>

                  {/* Connector Line */}
                  {idx < stepsMeta.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 rounded-full hidden sm:block ${
                      currentStep > s.num ? 'bg-[#C5A880]' : 'bg-[#2B2724]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Running Subtotal Banner */}
          <div className="mt-3 pt-3 border-t border-[#2B2724] flex items-center justify-between text-xs text-[#A89F91]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span>Step {currentStep} of 7: <strong className="text-white">{stepsMeta[currentStep - 1]?.title}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#A89F91]">Running Total:</span>
              <span className="text-sm sm:text-base font-serif font-bold text-[#E8D4B8]">
                ₹{grandTotal.toLocaleString('en-IN')}/-
              </span>
            </div>
          </div>
        </div>

        {/* ── MAIN STEP CONTAINER ── */}
        <div className="bg-[#141210] border border-[#2B2724] rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: LET'S GET STARTED
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 1</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  LET'S GET STARTED
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Enter your name and mobile number to begin tailoring your accurate photography estimate.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#E8D4B8]">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D3F]" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (e.target.value.trim().length >= 2) setNameError('');
                      }}
                      placeholder="e.g. Ramesh Reddy / Sneha Patel"
                      className="w-full bg-[#1B1815] border border-[#3A342F] focus:border-[#C5A880] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#666058] outline-none transition-all shadow-inner"
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{nameError}</span>
                    </p>
                  )}
                </div>

                {/* 10-Digit Phone Number */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#E8D4B8]">
                    10-Digit Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative flex">
                    <div className="bg-[#24201B] border border-r-0 border-[#3A342F] rounded-l-xl px-3 flex items-center text-xs font-bold text-[#C5A880] shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      placeholder="9849443648"
                      className="w-full bg-[#1B1815] border border-[#3A342F] focus:border-[#C5A880] rounded-r-xl px-4 py-3 text-sm text-white placeholder-[#666058] outline-none transition-all shadow-inner"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#7A7268]">
                      We respect your privacy. No spam. You will receive this official PDF estimate.
                    </p>
                  )}
                </div>
              </div>

              {/* Studio Guarantee Info Card */}
              <div className="bg-[#1C1814] border border-[#302B26] rounded-xl p-4 sm:p-5 flex items-start gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#E8D4B8] tracking-wider uppercase">
                    Direct Studio Pricing Guarantee
                  </h4>
                  <p className="text-xs text-[#9E9485] font-light leading-relaxed">
                    All prices are pulled directly from KPR Fotography's official packages database. Zero markup, zero hidden charges.
                  </p>
                </div>
              </div>

              {/* Next Step Action */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleStep1Submit}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: WHAT ARE YOU CELEBRATING?
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 2</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  WHAT ARE YOU CELEBRATING?
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Select your celebration from KPR Photography's authentic event catalog.
                </p>
              </div>

              {/* Event Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
                {CATEGORIES.filter(c => c !== 'Nature').map((catName) => {
                  const meta = EVENT_METADATA[catName] || { emoji: '✨', label: catName, tag: 'Celebration' };
                  const isSelected = selectedEvent === catName;

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSelectedEvent(catName)}
                      className={`relative p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 cursor-pointer group ${
                        isSelected
                          ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-lg shadow-[#C5A880]/15 scale-[1.02]'
                          : 'bg-[#181512] border-[#2E2824] hover:border-[#C5A880]/50 hover:bg-[#201C18]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl sm:text-3xl">{meta.emoji}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#C5A880] text-black flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <h3 className={`font-serif text-sm sm:text-base font-medium leading-snug ${isSelected ? 'text-[#FAF7F2]' : 'text-[#D6CEBE]'}`}>
                          {catName}
                        </h3>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[9px] uppercase tracking-wider text-[#998F80]">
                          {meta.tag}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-[#2B2724] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#1C1814] hover:bg-[#2B2520] text-[#A89F91] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Packages</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: CHOOSE YOUR PHOTOGRAPHY PACKAGE
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 3</span>
                  <span className="text-xs text-[#C5A880]">
                    {selectedPackageIds.length} Service{selectedPackageIds.length > 1 ? 's' : ''} Selected
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  CHOOSE YOUR PHOTOGRAPHY PACKAGE
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Select your combination of photography, cinematic video, drone, and editing services. Prices update dynamically.
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['ALL', 'Photography', 'Videography', 'Aerial', 'Editing', 'Commercial'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPackageCategoryFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                      packageCategoryFilter === tab
                        ? 'bg-[#C5A880] text-black shadow-md'
                        : 'bg-[#1D1916] text-[#A89F91] hover:text-white hover:bg-[#28221D]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Packages Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackageIds.includes(pkg.id);
                  const displayDuration = pkg.duration || '6 hours';

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => togglePackage(pkg.id)}
                      className={`relative rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer select-none group ${
                        isSelected
                          ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-lg shadow-[#C5A880]/10 scale-[1.01]'
                          : 'bg-[#181512] border-[#2E2824] hover:border-[#C5A880]/50 hover:bg-[#201C18]'
                      }`}
                    >
                      <div>
                        {/* Header Badge & Checkbox */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded bg-black/50 text-[#C5A880] font-semibold border border-[#C5A880]/30">
                            {pkg.category}
                          </span>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#C5A880] text-black'
                              : 'border border-[#554E44] group-hover:border-[#C5A880]'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Package Title */}
                        <h3 className="font-serif text-base sm:text-lg font-medium text-white group-hover:text-[#E8D4B8] transition-colors">
                          {pkg.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-[#9E9485] mt-1 font-light leading-relaxed line-clamp-2">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Price & Duration */}
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#A89F91]">
                          <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>{displayDuration}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm sm:text-base font-serif font-bold text-[#E8D4B8]">
                            ₹{Number(pkg.price).toLocaleString('en-IN')}/-
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal of Step 3 */}
              <div className="bg-[#1C1814] border border-[#302B26] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#A89F91]">
                  Photography & Videography Subtotal:
                </span>
                <span className="text-base sm:text-lg font-serif font-bold text-[#C5A880]">
                  ₹{servicesSubtotal.toLocaleString('en-IN')}/-
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#2B2724] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#1C1814] hover:bg-[#2B2520] text-[#A89F91] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Album</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 4: ALBUM
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 4</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  ALBUM
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Do you need a luxury handcrafted flush-mount wedding photobook album?
                </p>
              </div>

              {/* Yes / No Toggle Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setNeedAlbum(false)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    !needAlbum
                      ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-lg shadow-[#C5A880]/10'
                      : 'bg-[#181512] border-[#2E2824] hover:bg-[#201C18]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-white">
                      No Album Needed
                    </span>
                    {!needAlbum && <Check className="w-5 h-5 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#9E9485] font-light">
                    Deliver all high-resolution edited photos via cloud download link only.
                  </p>
                  <div className="mt-3 text-sm font-serif font-bold text-[#A89F91]">
                    ₹0/-
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setNeedAlbum(true)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    needAlbum
                      ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-lg shadow-[#C5A880]/10'
                      : 'bg-[#181512] border-[#2E2824] hover:bg-[#201C18]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold uppercase tracking-wider text-white">
                      Yes, I Need An Album
                    </span>
                    {needAlbum && <Check className="w-5 h-5 text-[#C5A880]" />}
                  </div>
                  <p className="text-xs text-[#9E9485] font-light">
                    Handcrafted flush-mount layflat album on non-tearable archival paper with UV coating.
                  </p>
                  <div className="mt-3 text-sm font-serif font-bold text-[#C5A880]">
                    From ₹250 / sheet (2 pages)
                  </div>
                </button>
              </div>

              {/* If YES: Show Album Sheet Options & Exact Studio Pricing */}
              {needAlbum && (
                <div className="space-y-6 pt-4 border-t border-[#2B2724] animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-lg text-white font-medium">
                        Select Photobook Album Size
                      </h4>
                      <p className="text-xs text-[#A89F91] font-light">
                        Studio rate: <strong>₹250 per sheet</strong> (Each sheet contains 2 display pages).
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#A89F91] uppercase tracking-wider">Album Price</span>
                      <div className="text-lg sm:text-xl font-serif font-bold text-[#C5A880]">
                        ₹{albumSubtotal.toLocaleString('en-IN')}/-
                      </div>
                    </div>
                  </div>

                  {/* Preset Sheet Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { sheets: 20, pages: 40, title: 'Classic Album', desc: 'Compact essential ceremony album' },
                      { sheets: 30, pages: 60, title: 'Grand Heirloom', desc: 'Most popular for complete Telugu weddings', popular: true },
                      { sheets: 40, pages: 80, title: 'Royal Luxury Edition', desc: 'Extensive multi-event ceremony coverage' }
                    ].map((preset) => {
                      const isPresetActive = albumSheets === preset.sheets;
                      const presetPrice = preset.sheets * 250;

                      return (
                        <div
                          key={preset.sheets}
                          onClick={() => setAlbumSheets(preset.sheets)}
                          className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                            isPresetActive
                              ? 'bg-[#C5A880]/20 border-[#C5A880] shadow-md'
                              : 'bg-[#191613] border-[#302A24] hover:border-[#C5A880]/50'
                          }`}
                        >
                          {preset.popular && (
                            <div className="absolute -top-2.5 right-3 bg-[#C5A880] text-black text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow">
                              RECOMMENDED
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-serif text-sm font-semibold text-white">
                              {preset.title}
                            </h5>
                            {isPresetActive && <Check className="w-4 h-4 text-[#C5A880]" />}
                          </div>
                          <div className="text-xs text-[#E8D4B8] font-medium">
                            {preset.sheets} Sheets • {preset.pages} Pages
                          </div>
                          <p className="text-[11px] text-[#8C8375] font-light mt-1">
                            {preset.desc}
                          </p>
                          <div className="mt-3 pt-2 border-t border-white/10 text-sm font-serif font-bold text-[#FAF7F2]">
                            ₹{presetPrice.toLocaleString('en-IN')}/-
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Sheet Counter Slider */}
                  <div className="bg-[#1C1814] border border-[#302B26] rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#E8D4B8]">
                        Custom Sheet Counter (@ ₹250 / sheet)
                      </span>
                      <span className="text-xs text-[#A89F91]">
                        {albumSheets} Sheets = <strong>{albumSheets * 2} Pages</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setAlbumSheets(prev => Math.max(10, prev - 5))}
                        className="w-10 h-10 rounded-lg bg-[#2B2520] hover:bg-[#C5A880] hover:text-black text-white font-bold flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1">
                        <input
                          type="range"
                          min="10"
                          max="80"
                          step="2"
                          value={albumSheets}
                          onChange={(e) => setAlbumSheets(Number(e.target.value))}
                          className="w-full accent-[#C5A880] cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setAlbumSheets(prev => Math.min(100, prev + 5))}
                        className="w-10 h-10 rounded-lg bg-[#2B2520] hover:bg-[#C5A880] hover:text-black text-white font-bold flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-[#2B2724] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#1C1814] hover:bg-[#2B2520] text-[#A89F91] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(5);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Deliverables</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 5: DELIVERABLES
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 5</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  DELIVERABLES
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Review your included deliverables and add any specialized post-production items.
                </p>
              </div>

              {/* Section 1: Included Deliverables (Complimentary based on selections) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Included Deliverables (₹0 Extra)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {includedDeliverables.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#181512] border border-[#2E2824] rounded-xl p-3 flex items-start gap-2.5"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#E8D4B8] font-medium leading-relaxed">
                          {item}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Included in Package
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Optional Deliverable Add-ons (Exact pricing) */}
              <div className="space-y-3 pt-4 border-t border-[#2B2724]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8D4B8]">
                    <Plus className="w-4 h-4 text-[#C5A880]" />
                    <span>Optional Additional-Cost Deliverables</span>
                  </div>
                  {addOnsSubtotal > 0 && (
                    <span className="text-xs text-[#C5A880]">
                      Add-ons: ₹{addOnsSubtotal.toLocaleString('en-IN')}/-
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {OPTIONAL_ADDONS.map((addon) => {
                    const qty = selectedAddons[addon.id] || 0;
                    const isPicked = qty > 0;

                    return (
                      <div
                        key={addon.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isPicked
                            ? 'bg-[#C5A880]/15 border-[#C5A880]'
                            : 'bg-[#181512] border-[#2E2824] hover:border-[#C5A880]/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-white">
                              {addon.name}
                            </h4>
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-[#C5A880] border border-[#C5A880]/30">
                              {addon.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9E9485] font-light">
                            {addon.scope}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0">
                          <span className="text-xs sm:text-sm font-serif font-bold text-[#E8D4B8]">
                            +₹{addon.price.toLocaleString('en-IN')}/-
                          </span>

                          <div className="flex items-center gap-2 bg-[#221E1A] border border-[#3A332C] rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateAddonQty(addon.id, -1)}
                              disabled={qty === 0}
                              className="w-6 h-6 rounded bg-[#2F2923] disabled:opacity-30 text-white flex items-center justify-center text-xs font-bold hover:bg-[#C5A880] hover:text-black cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateAddonQty(addon.id, 1)}
                              className="w-6 h-6 rounded bg-[#2F2923] text-white flex items-center justify-center text-xs font-bold hover:bg-[#C5A880] hover:text-black cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Deliverables Total Note */}
              <div className="bg-[#1C1814] border border-[#302B26] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#A89F91]">
                  Total with Deliverables & Add-ons:
                </span>
                <span className="text-base sm:text-lg font-serif font-bold text-[#C5A880]">
                  ₹{grandTotal.toLocaleString('en-IN')}/-
                </span>
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#2B2724] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#1C1814] hover:bg-[#2B2520] text-[#A89F91] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(6);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>View Total Estimated Price</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 6: TOTAL ESTIMATED PRICE (Complete Professional Summary)
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2 border-b border-[#2B2724] pb-5">
                <span className="text-[10px] tracking-[0.25em] uppercase text-[#C5A880] font-bold">STEP 6</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-white font-light">
                  TOTAL ESTIMATED PRICE
                </h2>
                <p className="text-xs sm:text-sm text-[#A89F91] font-light">
                  Comprehensive review of customer details, selected event, packages, album, and itemized breakdown.
                </p>
              </div>

              {/* Complete Professional Summary Card */}
              <div className="bg-[#181512] border border-[#2E2824] rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl">
                
                {/* 1. Customer & Event Header Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-[#2B2724]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8C8375]">Client Name</span>
                    <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{customerName}</h4>
                    <p className="text-xs text-[#C5A880]">+91 {customerPhone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8C8375]">Celebrating Event</span>
                    <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{selectedEvent}</h4>
                    <p className="text-xs text-[#A89F91]">Telangana, India</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8C8375]">Estimate Reference</span>
                    <h4 className="text-sm font-mono font-bold text-[#E8D4B8] mt-0.5">{estimateNumber}</h4>
                    <p className="text-xs text-[#8C8375]">{estimateDate.toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                {/* 2. Selected Packages Table */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                    1. Photography & Videography Packages
                  </span>
                  <div className="bg-[#12100E] rounded-xl border border-[#28221D] divide-y divide-[#221D18]">
                    {selectedPackages.map(pkg => (
                      <div key={pkg.id} className="p-3 sm:p-3.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <strong className="text-white text-sm">{pkg.name}</strong>
                          <div className="text-[11px] text-[#A89F91]">
                            {pkg.category} • Scope: {pkg.duration}
                          </div>
                        </div>
                        <span className="font-serif text-sm font-bold text-[#E8D4B8]">
                          ₹{Number(pkg.price).toLocaleString('en-IN')}/-
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Album Option */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                    2. Album Configuration
                  </span>
                  <div className="bg-[#12100E] rounded-xl border border-[#28221D] p-3 sm:p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white text-sm">
                        {needAlbum ? `Luxury Flush-Mount Layflat Photobook (${albumSheets} Sheets / ${albumSheets * 2} Pages)` : 'No Album (Digital Deliverables Only)'}
                      </strong>
                      <div className="text-[11px] text-[#A89F91] mt-0.5">
                        {needAlbum ? 'Archival non-tearable paper, UV lamination & presentation box' : 'Cloud link delivery'}
                      </div>
                    </div>
                    <span className="font-serif text-sm font-bold text-[#E8D4B8]">
                      ₹{albumSubtotal.toLocaleString('en-IN')}/-
                    </span>
                  </div>
                </div>

                {/* 4. Deliverables & Add-ons */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C5A880]">
                    3. Deliverables Summary
                  </span>
                  <div className="bg-[#12100E] rounded-xl border border-[#28221D] p-3 sm:p-3.5 space-y-2 text-xs">
                    <p className="text-[#A89F91]">
                      <strong>{includedDeliverables.length} Standard Deliverables Included:</strong> High-res cloud link, color grading, multi-angle ceremony master.
                    </p>
                    {Object.keys(selectedAddons).length > 0 && (
                      <div className="pt-2 border-t border-[#221D18] space-y-1">
                        {Object.entries(selectedAddons).map(([id, qty]) => {
                          const a = OPTIONAL_ADDONS.find(item => item.id === id);
                          if (!a) return null;
                          return (
                            <div key={id} className="flex items-center justify-between text-xs">
                              <span className="text-[#E8D4B8]">{a.name} (x{qty})</span>
                              <span className="font-serif font-bold text-[#C5A880]">
                                +₹{(a.price * qty).toLocaleString('en-IN')}/-
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Complete Financial Breakdown Box */}
                <div className="bg-[#1F1A15] border border-[#3E342B] rounded-xl p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#A89F91]">
                    <span>Services Base Subtotal:</span>
                    <span className="font-serif font-semibold text-white">₹{servicesSubtotal.toLocaleString('en-IN')}/-</span>
                  </div>

                  {needAlbum && (
                    <div className="flex items-center justify-between text-xs text-[#A89F91]">
                      <span>Album Subtotal ({albumSheets} Sheets):</span>
                      <span className="font-serif font-semibold text-white">₹{albumSubtotal.toLocaleString('en-IN')}/-</span>
                    </div>
                  )}

                  {addOnsSubtotal > 0 && (
                    <div className="flex items-center justify-between text-xs text-[#A89F91]">
                      <span>Optional Deliverables Add-ons:</span>
                      <span className="font-serif font-semibold text-white">₹{addOnsSubtotal.toLocaleString('en-IN')}/-</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#3E342B] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E8D4B8]">
                        FINAL ESTIMATED TOTAL
                      </span>
                      <p className="text-[10px] text-[#8C8375]">
                        100% verified studio rate card. No hidden charges.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-xl sm:text-3xl font-bold text-[#C5A880]">
                        ₹{grandTotal.toLocaleString('en-IN')}/-
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-[#2B2724] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(5);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#1C1814] hover:bg-[#2B2520] text-[#A89F91] hover:text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back / Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(7);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Download</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 7: DOWNLOAD YOUR ESTIMATE
              ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 7 && (
            <div className="space-y-8 animate-fadeIn text-center py-4 sm:py-6">
              
              {/* Success Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mx-auto">
                <Check className="w-4 h-4" />
                <span>Estimate Ready for Download</span>
              </div>

              {/* Grand Total Hero Display */}
              <div className="max-w-md mx-auto bg-gradient-to-b from-[#1E1914] to-[#120F0D] border border-[#C5A880]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-3">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C5A880] font-bold">
                  TOTAL ESTIMATED INVESTMENT
                </span>
                <div className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-wide">
                  ₹{grandTotal.toLocaleString('en-IN')}/-
                </div>
                <div className="text-xs text-[#A89F91]">
                  Prepared for <strong className="text-white">{customerName}</strong> for <strong className="text-white">{selectedEvent}</strong>
                </div>
                <div className="text-[11px] font-mono text-[#8C8375] pt-1">
                  Reference: {estimateNumber}
                </div>
              </div>

              {/* Download Buttons Section */}
              <div className="max-w-md mx-auto space-y-3 pt-2">
                
                {/* PROMINENT DOWNLOAD ESTIMATE PDF BUTTON */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-4 px-6 rounded-2xl bg-[#C5A880] hover:bg-[#D4B991] text-black font-bold text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Your Estimate PDF</span>
                </button>

                {/* WhatsApp Share / Booking Confirmation */}
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold text-xs uppercase tracking-[0.15em] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.431 2.504 1.16 3.477l-.76 2.776 2.842-.746c.94.512 2.019.803 3.167.803 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.769-5.766zm4.186 8.163c-.174.492-.857.901-1.393.992-.367.062-.846.111-2.457-.557-2.062-.854-3.393-2.951-3.495-3.088-.103-.138-.834-1.112-.834-2.122 0-1.01.527-1.507.714-1.713.188-.206.411-.257.548-.257.137 0 .274.001.394.007.127.006.298-.048.466.356.174.419.599 1.463.651 1.567.052.103.086.223.018.36-.069.137-.103.223-.206.343-.103.12-.216.268-.309.36-.103.103-.211.215-.091.421.12.206.533.88 1.144 1.424.786.7 1.45.918 1.656 1.021.206.103.326.086.446-.052.12-.137.514-.6.651-.806.137-.206.274-.171.463-.103.188.069 1.2.566 1.406.669.206.103.343.154.394.24.051.086.051.497-.123.989zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.176L2 22l4.981-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                  <span>Chat & Lock Dates on WhatsApp</span>
                </a>

                {/* Secondary Actions */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(6);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-[#A89F91] hover:text-white underline cursor-pointer"
                  >
                    Edit Selections
                  </button>
                  <span className="text-[#3A332C]">•</span>
                  <button
                    type="button"
                    onClick={handleStartNewEstimate}
                    className="text-xs text-[#A89F91] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Start New Estimate</span>
                  </button>
                </div>
              </div>

              {/* Studio Support Footer */}
              <div className="pt-6 border-t border-[#2B2724] max-w-lg mx-auto text-xs text-[#7A7268] space-y-1">
                <p>KPR Fotography Studio • Station Road, Warangal / Hyderabad, Telangana</p>
                <p>Questions? Call us directly at <a href="tel:+919849443648" className="text-[#C5A880] underline">+91 98494 43648</a></p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
