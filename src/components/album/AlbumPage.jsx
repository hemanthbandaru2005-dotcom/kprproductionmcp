import React, { forwardRef } from 'react';
import { getTemplateById } from '../../utils/albumTemplates';
import PhotoFrame from './PhotoFrame';

/**
 * AlbumPage Component
 * Renders an archival photobook page with:
 * - Fine-art background artwork & gold hairline borders
 * - Predefined template photo frames
 * - Optional customizable text areas
 * - Spine crease binding shadow (left vs right page)
 * - Archival page number watermark
 */
const AlbumPage = forwardRef(
  (
    {
      pageData,
      pageIndex,
      totalPages,
      isLeftPage = true,
      isEditable = false,
      selectedSlotId = null,
      onSelectSlot,
      onDropPhoto,
      onUpdatePhoto,
      onRemovePhoto,
      onReplaceClick,
      onUpdateText,
      ...props
    },
    ref
  ) => {
    const template = getTemplateById(pageData?.templateId);
    const photos = pageData?.photos || {};
    const textSlots = pageData?.textSlots || {};

    return (
      <div
        ref={ref}
        {...props}
        style={{ ...props.style }}
        className={`page-wrapper select-none relative overflow-hidden bg-[#FAF8F5] shadow-md ${
          props.className || ''
        }`}
        data-density="soft"
      >
        <div
          className={`w-full h-full relative overflow-hidden flex flex-col justify-between border border-[#E2D9CC] ${
            isLeftPage
              ? 'bg-gradient-to-r from-[#FBF9F6] via-[#FAF8F5] to-[#EDE5D8] border-r-2 border-r-[#BFB19E]'
              : 'bg-gradient-to-r from-[#EDE5D8] via-[#FAF8F5] to-[#FBF9F6] border-l-2 border-l-[#BFB19E]'
          }`}
        >
          {/* ── 1. Background Artwork ── */}
          {pageData?.backgroundUrl ? (
            /* Custom user-supplied template background image */
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src={pageData.backgroundUrl}
                alt="Page Template Artwork"
                className="w-full h-full object-cover select-none"
              />
            </div>
          ) : (
            /* Built-in Luxury Fine-Art Archival Paper Texture with Gold Accents */
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Subtle paper grain texture */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  background:
                    'radial-gradient(#C5A880 0.75px, transparent 0.75px)',
                  backgroundSize: '12px 12px'
                }}
              />

              {/* Ornate Fine-Line Gold Frame */}
              <div className="absolute inset-2 sm:inset-3 border border-[#C5A880]/30 rounded-xs pointer-events-none" />
              <div className="absolute inset-3 sm:inset-4.5 border border-[#C5A880]/15 rounded-xs pointer-events-none" />

              {/* Corner Filigree Marks */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-2.5 h-2.5 border-t border-l border-[#C5A880]/50" />
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2.5 h-2.5 border-t border-r border-[#C5A880]/50" />
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-2.5 h-2.5 border-b border-l border-[#C5A880]/50" />
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-2.5 h-2.5 border-b border-r border-[#C5A880]/50" />
            </div>
          )}

          {/* ── 2. Photo Frames Layer ── */}
          <div className="absolute inset-0 z-10">
            {template.slots.map((slot) => (
              <PhotoFrame
                key={slot.id}
                slot={slot}
                photoData={photos[slot.id]}
                isEditable={isEditable}
                isSelected={selectedSlotId === slot.id}
                onSelect={onSelectSlot}
                onDropPhoto={onDropPhoto}
                onUpdatePhoto={onUpdatePhoto}
                onRemovePhoto={onRemovePhoto}
                onReplaceClick={onReplaceClick}
              />
            ))}
          </div>

          {/* ── 3. Optional Text Areas Layer ── */}
          {template.textSlots && template.textSlots.length > 0 && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              {template.textSlots.map((txt) => {
                const textValue = textSlots[txt.id] ?? txt.placeholder;
                return (
                  <div
                    key={txt.id}
                    style={{
                      left: `${txt.x}%`,
                      top: `${txt.y}%`,
                      width: `${txt.width}%`,
                      height: `${txt.height}%`
                    }}
                    className={`absolute flex items-center ${
                      txt.align === 'center'
                        ? 'justify-center text-center'
                        : txt.align === 'right'
                        ? 'justify-end text-right'
                        : 'justify-start text-left'
                    } ${isEditable ? 'pointer-events-auto' : ''}`}
                  >
                    {isEditable ? (
                      <input
                        type="text"
                        value={textSlots[txt.id] || ''}
                        placeholder={txt.placeholder}
                        onChange={(e) =>
                          onUpdateText && onUpdateText(txt.id, e.target.value)
                        }
                        className="w-full bg-white/70 hover:bg-white focus:bg-white text-[#2C241B] font-serif text-[10px] sm:text-xs tracking-wider px-2 py-0.5 rounded border border-[#C5A880]/40 focus:border-[#C5A880] outline-none shadow-2xs"
                      />
                    ) : (
                      <span className="font-serif text-[#3D3327] text-[10px] sm:text-xs tracking-wider drop-shadow-2xs font-light italic px-2">
                        {textValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 4. Center Spine Binding Shadow Crease ── */}
          <div
            className={`absolute top-0 bottom-0 pointer-events-none z-30 ${
              isLeftPage
                ? 'right-0 w-4 sm:w-8 bg-gradient-to-l from-black/25 via-black/8 to-transparent border-r border-black/10'
                : 'left-0 w-4 sm:w-8 bg-gradient-to-r from-black/25 via-black/8 to-transparent border-l border-black/10'
            }`}
          />

          {/* ── 5. Archival Page Number Badge ── */}
          <div
            className={`absolute bottom-1.5 sm:bottom-2 z-20 pointer-events-none select-none ${
              isLeftPage ? 'left-2.5 sm:left-4' : 'right-2.5 sm:right-4'
            }`}
          >
            <span className="text-[7.5px] sm:text-[9.5px] font-mono text-[#7A6B5C] bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#D5C9B8] shadow-2xs">
              {pageIndex + 1}
            </span>
          </div>

        </div>
      </div>
    );
  }
);

AlbumPage.displayName = 'AlbumPage';
export default AlbumPage;
