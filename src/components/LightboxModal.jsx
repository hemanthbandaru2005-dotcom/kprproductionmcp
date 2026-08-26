import React from 'react';
import { X, Heart, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/galleryData';

export default function LightboxModal({ photo, onClose, onOpenInquireWithPhoto, moodboardIds = [], toggleMoodboardItem, onSelectPhoto }) {
  if (!photo) return null;

  const isSaved = moodboardIds.includes(photo.id);
  const currentIndex = GALLERY_ITEMS.findIndex(item => item.id === photo.id);

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    onSelectPhoto(GALLERY_ITEMS[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % GALLERY_ITEMS.length;
    onSelectPhoto(GALLERY_ITEMS[nextIndex]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none">
      
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-white/80 hover:text-white p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg"
        title="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg"
        title="Previous Photo"
      >
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg"
        title="Next Photo"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Pure High-Resolution Photo Viewer */}
      <div className="relative max-w-5xl max-h-[88vh] flex items-center justify-center">
        <img
          src={photo.image}
          alt="KPR Fotography"
          className="max-h-[85vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10"
        />

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-3">
          {/* Save to Moodboard */}
          <button
            onClick={() => toggleMoodboardItem(photo.id)}
            className={`p-2.5 sm:p-3 rounded-full shadow-xl backdrop-blur-md transition-transform active:scale-90 flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer ${
              isSaved ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-red-500'
            }`}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Quick Inquire Button */}
          <button
            onClick={() => {
              onClose();
              onOpenInquireWithPhoto(photo);
            }}
            className="px-4 py-2.5 rounded-full bg-[#C5A880] hover:bg-[#D4AF37] text-black font-bold text-xs tracking-wider uppercase backdrop-blur-md shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inquire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
