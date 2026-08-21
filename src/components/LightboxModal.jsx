import React from 'react';
import { X, Heart, MapPin, Sparkles, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/galleryData';

export default function LightboxModal({ photo, onClose, onOpenInquireWithPhoto, moodboardIds, toggleMoodboardItem, onSelectPhoto }) {
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
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-8 animate-fadeIn">
      
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 text-white/70 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-md transition-colors"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Prev / Next Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white p-3 rounded-full bg-white/10 backdrop-blur-md transition-colors hidden sm:block"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white p-3 rounded-full bg-white/10 backdrop-blur-md transition-colors hidden sm:block"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Container */}
      <div className="max-w-6xl w-full bg-[#181818] border border-white/10 rounded-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Photo View Column */}
        <div className="lg:col-span-8 bg-black relative flex items-center justify-center p-2 sm:p-4 min-h-[240px] sm:min-h-[350px] lg:min-h-[550px]">
          <img
            src={photo.image}
            alt={photo.title}
            className="max-h-[45vh] sm:max-h-[80vh] w-auto object-contain"
          />

          {/* Heart Badge on Photo */}
          <button
            onClick={() => toggleMoodboardItem(photo.id)}
            className={`absolute top-3 left-3 sm:top-6 sm:left-6 p-2 sm:p-3 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider ${
              isSaved ? 'bg-red-500 text-white' : 'bg-black/60 backdrop-blur-md text-white hover:bg-[#C5A880]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save to Moodboard'}</span>
          </button>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-4 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-4 sm:space-y-6 text-white bg-[#1A1A1A]">
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <span className="bg-[#C5A880] text-white text-[9px] sm:text-[10px] tracking-widest uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 font-medium inline-block mb-2 sm:mb-3">
                {photo.category}
              </span>
              <h3 className="font-serif text-xl sm:text-3xl font-light text-white leading-snug">{photo.title}</h3>
              <div className="flex items-center gap-2 text-xs text-[#C5A880] mt-2 font-light">
                <MapPin className="w-3.5 h-3.5" />
                <span>{photo.location}</span>
              </div>
            </div>

            {/* Story */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <h4 className="text-[11px] tracking-[0.25em] uppercase text-white/50 font-medium">Behind The Shot</h4>
              <p className="text-sm text-white/80 font-light leading-relaxed italic">
                "{photo.story}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onOpenInquireWithPhoto(photo);
              }}
              className="w-full py-3 bg-[#C5A880] hover:bg-[#A4865E] text-white text-[11px] font-medium tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Inquire About This Style</span>
            </button>

            <div className="flex items-center justify-between text-xs text-white/50 pt-1">
              <span>Photo {currentIndex + 1} of {GALLERY_ITEMS.length}</span>
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="hover:text-white">Previous</button>
                <span>•</span>
                <button onClick={handleNext} className="hover:text-white">Next</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
