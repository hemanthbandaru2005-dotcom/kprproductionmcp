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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* Top Close Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-[#E2D9CC]">
        <div className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
          KPR Fotography Cost Estimator
        </div>
        <button
          onClick={onClose}
          aria-label="Close Cost Estimator"
          className="p-2 rounded-full bg-[#FAF8F5] hover:bg-[#EFE9DF] text-[#1A1A1A] transition-colors cursor-pointer border border-[#E2D9CC]"
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
