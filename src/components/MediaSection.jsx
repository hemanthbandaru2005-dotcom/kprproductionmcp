import React, { useState } from 'react';
import PortfolioGallery from './PortfolioGallery';
import PackagesSection from './PackagesSection';
import { ChevronDown, Camera, Package } from 'lucide-react';
import kprLogo from '../assets/kpr_logo.png';

export default function MediaSection({ onSelectPhoto, moodboardIds, toggleMoodboardItem, initialTab = 'gallery' }) {
  // Collapsible toggle state
  const [isExpanded, setIsExpanded] = useState(true);

  // Active subsection state: 'gallery' | 'packages'
  const [activeTab, setActiveTab] = useState(initialTab === 'all' ? 'gallery' : initialTab);

  return (
    <div id="media" data-section="photography-section" className="w-full bg-[#F7F3EE] transition-all duration-300">
      <div id="photography-section" className="w-full bg-white border-b border-[#E2D9CC] overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "PHOTOGRAPHY" Header Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-[#1A1A1A] hover:bg-[#242424] text-white p-4 sm:p-8 flex items-center justify-center relative transition-colors duration-300 group cursor-pointer focus:outline-none border-b border-black min-h-[90px] sm:min-h-[140px] md:min-h-[170px]"
        >
          <img
            src={kprLogo}
            alt="KPR Fotography"
            className="h-20 sm:h-32 md:h-44 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none"
          />

          {/* Chevron Rotate Animation Icon */}
          <div className="absolute right-4 sm:right-8 lg:right-12">
            <div className={`p-1.5 sm:p-2.5 rounded-full border transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-white/10 text-white border-white/20 group-hover:bg-white/20'
            }`}>
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        {isExpanded && (
          <div className="transition-all duration-300 ease-in-out">
          
          {/* 2. Subsections Navigation Tabs (Gallery | Packages) */}
          <div className="w-full bg-[#F7F3EE] border-b border-[#E2D9CC] px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-center">
            <div className="inline-flex justify-center items-center gap-1 sm:gap-2 p-1 bg-white border border-[#E2D9CC] rounded-full shadow-sm max-w-full">
              {/* Gallery Tab */}
              <button
                onClick={() => setActiveTab('gallery')}
                className={`inline-flex justify-center items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Camera className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'gallery' ? 'text-[#C5A880]' : ''}`} />
                <span>Gallery</span>
              </button>

              {/* Packages Tab */}
              <button
                onClick={() => setActiveTab('packages')}
                className={`inline-flex justify-center items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === 'packages'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'packages' ? 'text-[#C5A880]' : ''}`} />
                <span>Packages</span>
              </button>
            </div>
          </div>

          {/* 3. Subsections Content Area */}
          <div className="w-full p-2 sm:p-6 lg:p-10 bg-[#F7F3EE]">
            
            {/* Gallery Subsection Content */}
            {activeTab === 'gallery' && (
              <div className="animate-fadeIn transition-all duration-500">
                <PortfolioGallery
                  onSelectPhoto={onSelectPhoto}
                  moodboardIds={moodboardIds}
                  toggleMoodboardItem={toggleMoodboardItem}
                />
              </div>
            )}

            {/* Packages Subsection Content */}
            {activeTab === 'packages' && (
              <div className="animate-fadeIn transition-all duration-500">
                <PackagesSection
                  onBackToGallery={() => setActiveTab('gallery')}
                />
              </div>
            )}

          </div>

        </div>
        )}

      </div>
    </div>
  );
}
