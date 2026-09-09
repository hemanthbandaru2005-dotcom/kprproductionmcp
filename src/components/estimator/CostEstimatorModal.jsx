import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import PhotographyCostEstimator from './PhotographyCostEstimator';

export default function CostEstimatorModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Top Close Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#0D0B08]/90 backdrop-blur-md border-b border-[#2A2622]">
        <div className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">
          KPR Photography Cost Estimator
        </div>
        <button
          onClick={onClose}
          aria-label="Close Cost Estimator"
          className="p-2 rounded-full bg-[#1F1A15] hover:bg-[#332B23] text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Estimator Content */}
      <div className="w-full">
        <PhotographyCostEstimator onBackToHome={onClose} />
      </div>
    </div>
  );
}
