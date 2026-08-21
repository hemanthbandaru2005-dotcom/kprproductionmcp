import React from 'react';
import { GALLERY_ITEMS } from '../data/galleryData';
import { X, Trash2, Heart, Send } from 'lucide-react';

export default function MoodboardDrawer({ isOpen, onClose, moodboardIds, toggleMoodboardItem, onOpenInquireWithMoodboard }) {
  if (!isOpen) return null;

  const savedPhotos = GALLERY_ITEMS.filter(item => moodboardIds.includes(item.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Dark backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-[#F7F3EE] text-[#1A1A1A] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 bg-[#121212] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#C5A880] fill-current" />
              <h3 className="font-serif text-xl tracking-wider">Saved Vision Board</h3>
            </div>

            <button onClick={onClose} className="p-2 text-white/70 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {savedPhotos.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#E8E1D5] mx-auto flex items-center justify-center text-[#666666]">
                  <Heart className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-2xl text-[#1A1A1A]">Your Vision Board is Empty</h4>
                <p className="text-xs text-[#666666] font-light max-w-xs mx-auto leading-relaxed">
                  Browse the portfolio gallery and click the heart icon on any photo to assemble your vision board.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#666666] font-light">
                  Saved {savedPhotos.length} vision inspiration photos. These will be automatically attached when you inquire.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {savedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group bg-white p-2 border border-[#E2D9CC] shadow-sm">
                      <div className="aspect-[4/5] overflow-hidden bg-[#121212]">
                        <img src={photo.image} alt={photo.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="font-serif text-xs text-[#1A1A1A] mt-2 truncate">{photo.title}</p>
                      <p className="text-[9px] uppercase tracking-wider text-[#888888]">{photo.category}</p>

                      <button
                        onClick={() => toggleMoodboardItem(photo.id)}
                        className="absolute top-3 right-3 p-1.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {savedPhotos.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8E1D5] space-y-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenInquireWithMoodboard(savedPhotos);
                }}
                className="w-full py-3.5 bg-[#C5A880] hover:bg-[#A4865E] text-white text-[11px] font-medium tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Vision Board With Inquiry</span>
              </button>

              <button
                onClick={() => {
                  savedPhotos.forEach(p => toggleMoodboardItem(p.id));
                }}
                className="w-full text-center text-xs text-[#888888] hover:text-red-600 py-1 cursor-pointer"
              >
                Clear All Favorites
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
