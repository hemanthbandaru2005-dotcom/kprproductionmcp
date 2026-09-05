import React, { useState, useRef } from 'react';
import {
  X, CloudUpload, BookOpen, Phone, AlertCircle, Loader2, Check, Sparkles
} from 'lucide-react';
import { loadPdfPages } from '../utils/pdfLoader';
import {
  ALBUM_SIZES,
  ALBUM_SIZE_SPECS,
  validateImageSizeForAlbum
} from '../utils/albumsService';

const ALBUM_SIZE_OPTIONS = [
  { id: '12x36', label: '12x36', desc: 'Panoramic Spread (36" × 12")', popular: true },
  { id: '13x39', label: '13x39', desc: 'Grand Master Heirloom (39" × 13")', popular: false },
  { id: '14x40', label: '14x40', desc: 'Ultra Regal Panoramic (40" × 14")', popular: false },
  { id: '16x24', label: '16x24', desc: 'Royal Portrait Master (24" × 16")', popular: false },
  { id: '18x24', label: '18x24', desc: 'Imperial Fine Art (24" × 18")', popular: false },
  { id: '12x24', label: '12x24', desc: 'Classic Traditional (24" × 12")', popular: false },
];

export default function CustomAlbumUploadModal({ isOpen, onClose, onLaunchFlipbook }) {
  const [selectedAlbumSize, setSelectedAlbumSize] = useState('12x36');
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [validatingFiles, setValidatingFiles] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const processUploadedFiles = async (files) => {
    const rawFiles = Array.from(files);
    const validFiles = rawFiles.filter(f =>
      f.type.startsWith('image/') ||
      f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i) ||
      f.type === 'application/pdf' ||
      f.name.endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      setUploadError('Please select valid photos (JPG, PNG, WEBP, HEIC) or an Album PDF.');
      return;
    }

    setValidatingFiles(true);
    setUploadError(null);

    const newUrls = [];
    let failedCount = 0;

    // 1. PDF Spread processing
    const pdfFiles = validFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFiles.length > 0) {
      setPdfLoading(true);
      for (const pdfFile of pdfFiles) {
        try {
          const blobUrl = URL.createObjectURL(pdfFile);
          const pages = await loadPdfPages(blobUrl, 2);
          if (pages && pages.length > 0) {
            newUrls.push(...pages);
          } else {
            failedCount++;
          }
        } catch (err) {
          console.warn('PDF preview extraction note:', err);
          failedCount++;
        }
      }
      setPdfLoading(false);
    }

    // 2. Individual image validation (verifies valid image)
    const imageFiles = validFiles.filter(f => !f.type.includes('pdf') && !f.name.endsWith('.pdf'));
    for (const imageFile of imageFiles) {
      const valRes = await validateImageSizeForAlbum(imageFile, selectedAlbumSize);
      if (!valRes.valid) {
        failedCount++;
      } else {
        newUrls.push(URL.createObjectURL(imageFile));
      }
    }

    setValidatingFiles(false);

    if (failedCount > 0) {
      setUploadError(
        failedCount === 1
          ? '1 photo could not be read or is corrupted.'
          : `${failedCount} photos could not be read or are corrupted.`
      );
    }

    if (newUrls.length > 0) {
      setUploadedPhotoUrls(prev => [...prev, ...newUrls]);
    }
  };

  const handleFilesSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  const handleRemoveUploadedPhoto = (index, e) => {
    e.stopPropagation();
    setUploadedPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleLaunch = () => {
    if (uploadedPhotoUrls.length === 0) return;
    onLaunchFlipbook(uploadedPhotoUrls, selectedAlbumSize);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E2D9CC] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-8 space-y-6 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F7F3EE] hover:bg-[#EAE4DC] text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880] inline-block animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#C5A880]">
              Interactive 3D Proof Generator
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-semibold">
            Upload Your Album
          </h3>
          <p className="text-xs text-[#666666]">
            Select your physical album size and upload personal wedding photos or PDF spreads to generate a realistic 3D photobook preview.
          </p>
        </div>

        {/* 1. Size Selection Grid */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            Step 1: Choose Physical Album Size
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {ALBUM_SIZE_OPTIONS.map((opt) => {
              const isSelected = selectedAlbumSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAlbumSize(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer relative ${
                    isSelected
                      ? 'border-[#C5A880] bg-[#FAF8F5] ring-2 ring-[#C5A880]/40 shadow-sm'
                      : 'border-[#E2D9CC] bg-white hover:border-[#C5A880]/60 hover:bg-[#FAF8F5]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-sm font-bold ${isSelected ? 'text-[#1A1A1A]' : 'text-[#333333]'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#C5A880] text-black flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#777777] leading-tight line-clamp-2">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Photo Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
              Step 2: Upload Album Photos or PDF Spreads
            </label>
            {uploadedPhotoUrls.length > 0 && (
              <span className="text-[11px] font-mono font-bold text-[#C5A880]">
                {uploadedPhotoUrls.length} file{uploadedPhotoUrls.length !== 1 ? 's' : ''} loaded
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.heic"
            onChange={handleFilesSelected}
            className="hidden"
          />

          {/* Dropzone / Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#C5A880]/60 hover:border-[#C5A880] bg-[#FAF8F5] hover:bg-[#F3EFE9] rounded-xl p-6 text-center transition-colors cursor-pointer space-y-2"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
              {validatingFiles ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#C5A880]" />
              ) : (
                <CloudUpload className="w-6 h-6" />
              )}
            </div>
            <p className="text-xs font-semibold text-[#1A1A1A]">
              {validatingFiles ? 'Reading photo files…' : 'Click or drag & drop photos here'}
            </p>
            <p className="text-[10px] text-[#777777]">
              Supports JPG, PNG, WEBP, HEIC or Album PDF Spreads ({selectedAlbumSize} format)
            </p>
          </div>

          {/* Small compact error notice */}
          {uploadError && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="truncate font-medium">{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Uploaded Photos Thumbnails Preview */}
          {uploadedPhotoUrls.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-[#555555]">
                <span className="font-semibold text-[#1A1A1A]">
                  {uploadedPhotoUrls.length} Photo{uploadedPhotoUrls.length !== 1 ? 's' : ''} Ready ({selectedAlbumSize})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedPhotoUrls([]);
                    setUploadError(null);
                  }}
                  className="text-[10px] text-red-600 hover:underline font-semibold"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-[#F7F3EE] rounded-lg border border-[#E2D9CC]">
                {uploadedPhotoUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-black group border border-[#E2D9CC]">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => handleRemoveUploadedPhoto(idx, e)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-[#E8E1D5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={uploadedPhotoUrls.length === 0}
            className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md cursor-pointer ${
              uploadedPhotoUrls.length > 0
                ? 'bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black'
                : 'bg-[#CCCCCC] text-[#666666] cursor-not-allowed shadow-none'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {uploadedPhotoUrls.length > 0
                ? `Open 3D Flipbook (${uploadedPhotoUrls.length} pages in ${selectedAlbumSize})`
                : `Upload photos to Preview in ${selectedAlbumSize}`}
            </span>
          </button>

          <a
            href={`https://wa.me/919849443648?text=${encodeURIComponent(
              `Hello KPR Colour Lab! I would like to order a custom wedding album in size ${selectedAlbumSize}${
                uploadedPhotoUrls.length > 0 ? ` with ${uploadedPhotoUrls.length} photos` : ''
              }. Please share pricing and printing timeline.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Order on WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
}
