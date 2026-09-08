import React, { useState, useRef, useCallback } from 'react';
import {
  X, CloudUpload, BookOpen, Phone, AlertCircle, Loader2, Sparkles,
  Trash2, Plus, ArrowLeft, ArrowRight, MoveLeft, MoveRight
} from 'lucide-react';
import { loadPdfPages } from '../utils/pdfLoader';

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf'
];

export default function CustomAlbumUploadModal({ isOpen, onClose, onLaunchFlipbook }) {
  const [uploadedPages, setUploadedPages] = useState([]); // array of { id, url, name, isPdf }
  const [uploadError, setUploadError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);

  const fileInputRef = useRef(null);
  const draggedItemIndex = useRef(null);

  if (!isOpen) return null;

  const processFiles = async (filesList) => {
    const rawFiles = Array.from(filesList);
    if (rawFiles.length === 0) return;

    // Filter by accepted types (or extensions)
    const validFiles = rawFiles.filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return (
        ACCEPTED_FILE_TYPES.includes(f.type) ||
        ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'].includes(ext)
      );
    });

    if (validFiles.length === 0) {
      setUploadError('Please select valid photos (JPG, JPEG, PNG, WEBP, HEIC) or an Album PDF.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    const newPages = [];
    let failedCount = 0;

    for (const file of validFiles) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        try {
          const blobUrl = URL.createObjectURL(file);
          const pdfPages = await loadPdfPages(blobUrl, 2);
          if (pdfPages && pdfPages.length > 0) {
            pdfPages.forEach((pageUrl, idx) => {
              newPages.push({
                id: `${Date.now()}-pdf-${Math.random().toString(36).slice(2, 7)}-${idx}`,
                url: pageUrl,
                name: `${file.name.replace(/\.pdf$/i, '')} - Page ${idx + 1}`,
                isPdf: true,
              });
            });
          } else {
            failedCount++;
          }
        } catch (err) {
          console.warn('PDF extraction error:', err);
          failedCount++;
        }
      } else {
        // Image file: accept ANY dimensions, ANY aspect ratio, ANY resolution
        try {
          const objUrl = URL.createObjectURL(file);
          newPages.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: objUrl,
            name: file.name,
            isPdf: false,
          });
        } catch (err) {
          console.warn('Image read error:', err);
          failedCount++;
        }
      }
    }

    setIsProcessing(false);

    if (failedCount > 0) {
      setUploadError(
        failedCount === 1
          ? '1 file could not be read or is corrupted.'
          : `${failedCount} files could not be read or are corrupted.`
      );
    }

    if (newPages.length > 0) {
      setUploadedPages(prev => [...prev, ...newPages]);
    }
  };

  const handleFilesSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropZoneActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePage = (index, e) => {
    e.stopPropagation();
    setUploadedPages(prev => {
      const page = prev[index];
      if (page && page.url && !page.isPdf) {
        try { URL.revokeObjectURL(page.url); } catch (_) {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMovePage = (index, direction, e) => {
    e.stopPropagation();
    setUploadedPages(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Thumbnail drag-and-drop reorder
  const handleDragStart = (e, index) => {
    draggedItemIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleThumbnailDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleThumbnailDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIndex = draggedItemIndex.current;
    if (sourceIndex === null || sourceIndex === undefined || sourceIndex === targetIndex) {
      setDragOverIndex(null);
      return;
    }

    setUploadedPages(prev => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, draggedItem);
      return copy;
    });

    draggedItemIndex.current = null;
    setDragOverIndex(null);
  };

  const handleLaunch = () => {
    if (uploadedPages.length === 0) return;
    const urls = uploadedPages.map(p => p.url);
    onLaunchFlipbook(urls);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF8F5] border border-[#E2D9CC] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-8 space-y-5 relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#EFE9DF] hover:bg-[#E2D9CC] text-[#555555] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          title="Close modal"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880] inline-block animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#C5A880]">
              Interactive 3D Photobook Preview
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-semibold tracking-tight">
            UPLOAD YOUR ALBUM
          </h3>
          <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
            Upload your finished album pages or spreads. Any size or format is supported.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,application/pdf,.pdf,.jpg,.jpeg,.png,.webp,.heic"
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Dropzone / Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDropZoneActive(true);
          }}
          onDragLeave={() => setIsDropZoneActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer space-y-3 ${
            isDropZoneActive
              ? 'border-[#C5A880] bg-[#F2ECE1] scale-[1.01]'
              : 'border-[#C5A880]/70 hover:border-[#C5A880] bg-white hover:bg-[#F7F3EE]'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#9E7A4A] shadow-inner">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-[#9E7A4A]" />
            ) : (
              <CloudUpload className="w-7 h-7" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-serif font-bold text-[#1A1A1A]">
              {isProcessing ? 'Processing your album pages…' : 'Click or drag & drop your album pages here'}
            </p>
            <p className="text-[11px] sm:text-xs text-[#777777] font-sans">
              JPG, JPEG, PNG, WEBP or HEIC • Any size accepted
            </p>
          </div>
        </div>

        {/* Error notification */}
        {uploadError && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs animate-fadeIn">
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
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Uploaded Pages Thumbnails & Reorder Controls */}
        {uploadedPages.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-[#555555]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A1A1A]">
                  {uploadedPages.length} {uploadedPages.length === 1 ? 'Page' : 'Pages'} Uploaded
                </span>
                <span className="text-[10px] text-[#888888]">
                  (Drag or use arrows to reorder)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] text-[#8C6D3F] hover:text-[#5A4526] font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedPages([]);
                    setUploadError(null);
                  }}
                  className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Thumbnails Grid with Drag-and-Drop Reorder */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-2.5 bg-white rounded-xl border border-[#E2D9CC] shadow-inner">
              {uploadedPages.map((page, idx) => {
                const isOver = dragOverIndex === idx;
                return (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleThumbnailDragOver(e, idx)}
                    onDrop={(e) => handleThumbnailDrop(e, idx)}
                    className={`relative aspect-[3/2] rounded-lg overflow-hidden bg-[#1A1A1A] group border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                      isOver
                        ? 'ring-2 ring-[#C5A880] scale-105 shadow-lg border-[#C5A880]'
                        : 'border-[#DCD2C3] hover:border-[#C5A880]'
                    }`}
                  >
                    <img
                      src={page.url}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Page Number Badge */}
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white font-mono text-[9px] font-bold">
                      #{idx + 1}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemovePage(idx, e)}
                      className="absolute top-1 right-1 p-1 bg-black/75 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                      title="Remove page"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Left / Right Move Arrows for Mobile / Touch Accessibility */}
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => handleMovePage(idx, -1, e)}
                        className={`p-0.5 rounded bg-black/70 text-white hover:bg-[#C5A880] cursor-pointer transition-colors ${
                          idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move page left"
                      >
                        <MoveLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === uploadedPages.length - 1}
                        onClick={(e) => handleMovePage(idx, 1, e)}
                        className={`p-0.5 rounded bg-black/70 text-white hover:bg-[#C5A880] cursor-pointer transition-colors ${
                          idx === uploadedPages.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                        title="Move page right"
                      >
                        <MoveRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* "+ Add More" Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/2] rounded-lg border-2 border-dashed border-[#C5A880]/60 hover:border-[#C5A880] bg-[#FAF8F5] hover:bg-[#F2ECE1] flex flex-col items-center justify-center gap-1 text-[#8C6D3F] hover:text-[#5A4526] transition-colors cursor-pointer"
                title="Add more pages"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Page</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-3 border-t border-[#E8E1D5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLaunch}
            disabled={uploadedPages.length === 0}
            className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer ${
              uploadedPages.length > 0
                ? 'bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black hover:scale-[1.01]'
                : 'bg-[#CCCCCC] text-[#777777] cursor-not-allowed shadow-none'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {uploadedPages.length > 0
                ? `Open 3D Album Preview (${uploadedPages.length} ${uploadedPages.length === 1 ? 'page' : 'pages'})`
                : 'Upload pages to Preview in 3D'}
            </span>
          </button>

          <a
            href={`https://wa.me/919849390876?text=${encodeURIComponent(
              `Hello KPR Colour Lab! I would like to order a custom wedding album${
                uploadedPages.length > 0 ? ` with ${uploadedPages.length} uploaded pages` : ''
              }. Please share pricing and printing details.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Order on WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
}
