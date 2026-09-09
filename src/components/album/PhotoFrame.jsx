import React, { useState, useRef } from 'react';
import { ImagePlus, ZoomIn, ZoomOut, Move, Trash2, RefreshCw } from 'lucide-react';

/**
 * PhotoFrame component for individual photo slots on an album page.
 * Supports:
 * - Empty state with dropzone
 * - Filled state with object-fit: cover, zoom scale, and pan offsets
 * - Interactive adjustment controls when isEditable is true
 */
export default function PhotoFrame({
  slot,
  photoData,
  isEditable = false,
  isSelected = false,
  onSelect,
  onDropPhoto,
  onUpdatePhoto,
  onRemovePhoto,
  onReplaceClick
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startOffX: 0, startOffY: 0 });

  const hasPhoto = Boolean(photoData?.src);
  const scale = photoData?.scale || 1;
  const offsetX = photoData?.offsetX || 0;
  const offsetY = photoData?.offsetY || 0;

  // Handle Drag & Drop from the Photo Tray
  const handleDragOver = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const src = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      if (src && onDropPhoto) {
        onDropPhoto(slot.id, src);
      }
    } catch (err) {
      console.warn('Drop error:', err);
    }
  };

  // Pan repositioning handlers in editor mode
  const handleMouseDown = (e) => {
    if (!isEditable || !hasPhoto) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffX: offsetX,
      startOffY: offsetY
    };

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - panStartRef.current.x;
      const dy = moveEvent.clientY - panStartRef.current.y;
      if (onUpdatePhoto) {
        onUpdatePhoto(slot.id, {
          offsetX: Math.max(-50, Math.min(50, panStartRef.current.startOffX + Math.round(dx / 4))),
          offsetY: Math.max(-50, Math.min(50, panStartRef.current.startOffY + Math.round(dy / 4)))
        });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${slot.width}%`,
        height: `${slot.height}%`
      }}
      className={`absolute overflow-hidden rounded-xs transition-all duration-200 select-none ${
        isDragOver
          ? 'ring-2 ring-[#C5A880] ring-offset-2 ring-offset-white bg-[#C5A880]/15'
          : isSelected && isEditable
          ? 'ring-2 ring-[#C5A880] shadow-md'
          : 'shadow-xs'
      } ${
        !hasPhoto && isEditable
          ? 'border-2 border-dashed border-[#D5C9B8] bg-[#FAF8F5]/80 hover:border-[#C5A880] hover:bg-[#F5EFE6]'
          : 'border border-[#DCD2C3]/80 bg-[#1E1B18]/5'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (isEditable && onSelect) {
          e.stopPropagation();
          onSelect(slot.id);
        }
      }}
    >
      {/* ── Photo Render ── */}
      {hasPhoto ? (
        <div
          className={`w-full h-full relative overflow-hidden flex items-center justify-center ${
            isEditable ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
          }`}
          onMouseDown={isEditable ? handleMouseDown : undefined}
        >
          <img
            src={photoData.src}
            alt={slot.label || 'Album Photograph'}
            className="w-full h-full object-cover pointer-events-none transition-transform duration-100 ease-out select-none will-change-transform"
            style={{
              transform: `scale(${scale}) translate(${offsetX}%, ${offsetY}%)`,
              transformOrigin: 'center center'
            }}
            loading="lazy"
            draggable={false}
          />

          {/* Archival Mat Bevel inner shadow */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)] border border-black/5" />

          {/* Quick interactive floating toolbar when selected in editor */}
          {isEditable && isSelected && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/85 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-lg text-white text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  onUpdatePhoto &&
                  onUpdatePhoto(slot.id, {
                    scale: Math.max(1, +(scale - 0.15).toFixed(2))
                  })
                }
                className="p-1 hover:text-[#C5A880] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono w-7 text-center select-none text-[#C5A880]">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdatePhoto &&
                  onUpdatePhoto(slot.id, {
                    scale: Math.min(2.5, +(scale + 0.15).toFixed(2))
                  })
                }
                className="p-1 hover:text-[#C5A880] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3 bg-white/20 mx-0.5" />

              <button
                type="button"
                onClick={() => onReplaceClick && onReplaceClick(slot.id)}
                className="p-1 hover:text-[#C5A880] transition-colors"
                title="Replace Photo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onRemovePhoto && onRemovePhoto(slot.id)}
                className="p-1 hover:text-red-400 transition-colors"
                title="Remove Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty Frame Placeholder ── */
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#9C8C7B] select-none">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#C5A880]/15 flex items-center justify-center mb-1.5 text-[#C5A880]">
            <ImagePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="text-[9px] sm:text-[11px] font-medium tracking-wider uppercase text-[#7A6B5C]">
            {slot.label || 'Drop Photo'}
          </span>
          <span className="text-[7.5px] sm:text-[9px] text-[#A69989] font-light">
            Drag photo from tray
          </span>
        </div>
      )}
    </div>
  );
}
