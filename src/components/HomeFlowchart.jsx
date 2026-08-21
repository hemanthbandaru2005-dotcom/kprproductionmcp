import React from 'react';
import { Home, Layers, Camera, Package, ArrowDown, ArrowRight, Sparkles, PhoneCall, CheckCircle } from 'lucide-react';

export default function HomeFlowchart({ onNavigateToMedia }) {
  return (
    <div id="home" className="w-full bg-[#F7F3EE] py-12 px-4 sm:px-6 lg:px-12 animate-fadeIn">
      <div className="max-w-6xl mx-auto">
        
        {/* Welcome Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] text-[#C5A880] text-xs font-semibold tracking-widest uppercase mb-4 shadow-md">
            <Home className="w-3.5 h-3.5" />
            <span>KPR PRODUCTION HOME</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1A1A] font-light tracking-wide mb-4">
            LUXURY PHOTOGRAPHY & MEDIA FLOW
          </h2>
          <p className="text-[#666666] text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to KPR Production. Explore our interactive website experience flowchart below to navigate directly into our Media Collection, Photo Gallery, and Custom Pricing Packages.
          </p>
        </div>

        {/* Interactive Flowchart Container */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center space-y-8 relative z-10">
            
            {/* STEP 1: HOME NODE */}
            <div className="w-full max-w-md bg-[#1A1A1A] text-white p-6 rounded-xl shadow-lg border border-[#C5A880]/40 text-center relative group hover:border-[#C5A880] transition-all">
              <div className="w-12 h-12 rounded-full bg-[#C5A880] text-white mx-auto flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                <Home className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-[0.3em] text-[#C5A880] font-mono font-bold uppercase">
                STARTING POINT
              </span>
              <h3 className="font-serif text-2xl tracking-wider font-light mt-1">
                KPR PRODUCTION HOME
              </h3>
              <p className="text-xs text-gray-400 font-light mt-1">
                Luxury Wedding & Cinematic Photography Services
              </p>
            </div>

            {/* FLOW ARROW 1 */}
            <div className="flex flex-col items-center text-[#C5A880]">
              <div className="w-0.5 h-8 bg-gradient-to-b from-[#1A1A1A] to-[#C5A880]" />
              <ArrowDown className="w-6 h-6 animate-bounce mt-1" />
            </div>

            {/* STEP 2: MEDIA HUB NODE (MAIN CONTAINER) */}
            <button
              onClick={() => onNavigateToMedia('gallery')}
              className="w-full max-w-lg bg-[#F7F3EE] hover:bg-[#F0E8DD] border-2 border-[#C5A880] p-6 rounded-xl shadow-xl text-center group cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880] text-white text-[10px] font-bold tracking-widest uppercase mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>STEP 2: CENTRAL HUB</span>
              </div>
              <h3 className="font-serif text-2xl text-[#1A1A1A] font-medium tracking-wide">
                MEDIA CENTER
              </h3>
              <p className="text-xs text-[#666666] mt-1">
                Unified destination containing all visual portfolio photos & service pricing
              </p>
              <span className="inline-block mt-3 text-xs font-semibold text-[#C5A880] underline tracking-wider uppercase">
                Click to Enter Media Center →
              </span>
            </button>

            {/* FLOW ARROW 2 (SPLIT BRANCHES) */}
            <div className="w-full max-w-2xl flex flex-col items-center text-[#C5A880]">
              <div className="w-0.5 h-8 bg-[#C5A880]" />
              {/* Horizontal Split Line */}
              <div className="w-3/4 h-0.5 bg-[#C5A880] relative">
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#C5A880]" />
                <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-[#C5A880]" />
              </div>
              <div className="w-full flex justify-between px-12 pt-2">
                <ArrowDown className="w-5 h-5 text-[#C5A880]" />
                <ArrowDown className="w-5 h-5 text-[#C5A880]" />
              </div>
            </div>

            {/* STEP 3: SUBSECTIONS (GALLERY & PACKAGES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
              
              {/* GALLERY BRANCH NODE */}
              <button
                onClick={() => onNavigateToMedia('gallery')}
                className="bg-white border-2 border-[#E2D9CC] hover:border-[#1A1A1A] p-6 rounded-xl shadow-md text-left group cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] text-[#C5A880] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#C5A880] uppercase tracking-widest">
                    SUBSECTION 1
                  </span>
                </div>
                <h4 className="font-serif text-xl text-[#1A1A1A] font-semibold mb-1">
                  📸 Gallery Collection
                </h4>
                <p className="text-xs text-gray-500 font-light mb-4">
                  Browse wedding portraits, candid moments, traditional ceremonies & drone shots.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors">
                  <span>View Photo Gallery</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* PACKAGES BRANCH NODE */}
              <button
                onClick={() => onNavigateToMedia('packages')}
                className="bg-white border-2 border-[#E2D9CC] hover:border-[#C5A880] p-6 rounded-xl shadow-md text-left group cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C5A880] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#1A1A1A] uppercase tracking-widest">
                    SUBSECTION 2
                  </span>
                </div>
                <h4 className="font-serif text-xl text-[#1A1A1A] font-semibold mb-1">
                  💎 Packages & Pricing
                </h4>
                <p className="text-xs text-gray-500 font-light mb-4">
                  12 transparent pricing options with direct 1-click WhatsApp instant booking.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C5A880] group-hover:text-[#1A1A1A] transition-colors">
                  <span>View Package Rates</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>

            {/* FLOW ARROW 3 */}
            <div className="flex flex-col items-center text-[#C5A880]">
              <div className="w-0.5 h-6 bg-[#C5A880]" />
              <ArrowDown className="w-5 h-5" />
            </div>

            {/* STEP 4: FINAL CONVERSION NODE */}
            <div className="w-full max-w-md bg-[#262626] text-white p-5 rounded-xl text-center border border-[#C5A880]/30 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-[#C5A880] text-xs font-bold uppercase tracking-widest mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>BOOK & INQUIRE</span>
              </div>
              <p className="text-xs text-gray-300 font-light">
                Direct WhatsApp booking for fast responses: <strong className="text-white font-mono">+91 98494 43648</strong>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
