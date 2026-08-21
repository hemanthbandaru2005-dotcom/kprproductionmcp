import React from 'react';
import { LogOut, ArrowLeft, Heart } from 'lucide-react';

/**
 * ExitConfirmModal
 *
 * Appears ONLY when the user presses the browser/device Back button at the root/entry
 * of the website (i.e., attempting to leave the site entirely, not on internal page navigation).
 */
export default function ExitConfirmModal({ isOpen, onStay, onExit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#18202F] border border-[#C5A880]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center text-white animate-scaleUp">
        
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 flex items-center justify-center mx-auto shadow-lg text-[#C5A880]">
          <Heart className="w-8 h-8 fill-[#C5A880]/20" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/10 border border-[#C5A880]/20 text-[#C5A880] text-[9px] font-bold uppercase tracking-[0.25em]">
            <span>KPR Productions</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium">
            Are you sure you want to exit?
          </h3>
          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed max-w-xs mx-auto">
            You are about to leave KPR Productions Fine Art Studio. You can continue exploring our collections and private client suite.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onStay}
            autoFocus
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-xl cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Stay on Site</span>
          </button>

          <button
            onClick={onExit}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>

      </div>
    </div>
  );
}
