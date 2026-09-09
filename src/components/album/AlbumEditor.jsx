import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  BookOpen,
  Sparkles,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoveLeft,
  MoveRight,
  Layers,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sliders,
  Type,
  ZoomIn,
  ZoomOut,
  X,
  FileText
} from 'lucide-react';
import { TEMPLATE_LIST, getTemplateById } from '../../utils/albumTemplates';
import { saveAlbumToStorage, DEFAULT_ALBUM, INITIAL_AVAILABLE_PHOTOS } from '../../utils/defaultAlbumData';
import AlbumPage from './AlbumPage';
import AlbumViewerModal from './AlbumViewerModal';

/**
 * AlbumEditor Component
 * Professional interactive photobook design studio for photographers and clients.
 */
export default function AlbumEditor({ initialAlbum = DEFAULT_ALBUM }) {
  const [album, setAlbum] = useState(initialAlbum);
  const [availablePhotos, setAvailablePhotos] = useState(INITIAL_AVAILABLE_PHOTOS);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null); // { pageId, slotId }
  const [templatePickerOpen, setTemplatePickerOpen] = useState(null); // pageId
  const [viewerOpen, setViewerOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const fileInputRef = useRef(null);
  const bgUploadRef = useRef(null);
  const bgUploadPageIdRef = useRef(null);

  const totalPages = album.pages.length;
  const totalSpreads = Math.ceil(totalPages / 2);

  const leftPageIndex = currentSpreadIndex * 2;
  const rightPageIndex = currentSpreadIndex * 2 + 1;

  const leftPage = album.pages[leftPageIndex];
  const rightPage = album.pages[rightPageIndex];

  // ─── File Upload to Photo Pool ───
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = files.map((file, idx) => ({
      id: `uploaded-${Date.now()}-${idx}`,
      src: URL.createObjectURL(file),
      name: file.name
    }));

    setAvailablePhotos((prev) => [...newPhotos, ...prev]);
    e.target.value = '';
  };

  // ─── Photo Assignment (Drop or Click) ───
  const handleDropPhoto = (pageId, slotId, src) => {
    setAlbum((prev) => {
      const newPages = prev.pages.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          photos: {
            ...p.photos,
            [slotId]: {
              src,
              scale: 1,
              offsetX: 0,
              offsetY: 0,
              fit: 'cover'
            }
          }
        };
      });
      return { ...prev, pages: newPages };
    });
  };

  const handleUpdatePhoto = (pageId, slotId, updates) => {
    setAlbum((prev) => {
      const newPages = prev.pages.map((p) => {
        if (p.id !== pageId) return p;
        const currentSlot = p.photos[slotId] || {};
        return {
          ...p,
          photos: {
            ...p.photos,
            [slotId]: {
              ...currentSlot,
              ...updates
            }
          }
        };
      });
      return { ...prev, pages: newPages };
    });
  };

  const handleRemovePhoto = (pageId, slotId) => {
    setAlbum((prev) => {
      const newPages = prev.pages.map((p) => {
        if (p.id !== pageId) return p;
        const newPhotos = { ...p.photos };
        delete newPhotos[slotId];
        return { ...p, photos: newPhotos };
      });
      return { ...prev, pages: newPages };
    });
    if (selectedSlot?.pageId === pageId && selectedSlot?.slotId === slotId) {
      setSelectedSlot(null);
    }
  };

  // ─── Text Updates ───
  const handleUpdateText = (pageId, textId, value) => {
    setAlbum((prev) => {
      const newPages = prev.pages.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          textSlots: {
            ...p.textSlots,
            [textId]: value
          }
        };
      });
      return { ...prev, pages: newPages };
    });
  };

  // ─── Template Change ───
  const handleSelectTemplate = (pageId, templateId) => {
    setAlbum((prev) => {
      const newPages = prev.pages.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          templateId
        };
      });
      return { ...prev, pages: newPages };
    });
    setTemplatePickerOpen(null);
    setSelectedSlot(null);
  };

  // ─── Custom Background Artwork Upload ───
  const handleCustomBgUpload = (e) => {
    const file = e.target.files?.[0];
    const pageId = bgUploadPageIdRef.current;
    if (file && pageId) {
      const url = URL.createObjectURL(file);
      setAlbum((prev) => {
        const newPages = prev.pages.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            templateId: 'T_CUSTOM_ARTWORK',
            backgroundUrl: url
          };
        });
        return { ...prev, pages: newPages };
      });
    }
    e.target.value = '';
    setTemplatePickerOpen(null);
  };

  // ─── Spread Management ───
  const handleAddSpread = () => {
    const newPage1Num = album.pages.length + 1;
    const newPage2Num = album.pages.length + 2;

    const newSpreadPages = [
      {
        id: `page-${Date.now()}-1`,
        pageNumber: newPage1Num,
        templateId: 'T1_HERO_PORTRAIT',
        photos: {},
        textSlots: { caption: 'Moments to Remember' }
      },
      {
        id: `page-${Date.now()}-2`,
        pageNumber: newPage2Num,
        templateId: 'T2_DUAL_VERTICAL',
        photos: {},
        textSlots: { caption: 'Eternal Bond' }
      }
    ];

    setAlbum((prev) => ({
      ...prev,
      pages: [...prev.pages, ...newSpreadPages]
    }));
    setCurrentSpreadIndex(Math.floor(album.pages.length / 2));
  };

  const handleDeleteSpread = (spreadIdx) => {
    if (album.pages.length <= 2) {
      alert('An album must contain at least one two-page spread.');
      return;
    }
    const p1Idx = spreadIdx * 2;
    const p2Idx = spreadIdx * 2 + 1;
    setAlbum((prev) => {
      const newPages = prev.pages
        .filter((_, idx) => idx !== p1Idx && idx !== p2Idx)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      return { ...prev, pages: newPages };
    });
    if (currentSpreadIndex >= Math.floor((album.pages.length - 2) / 2)) {
      setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1));
    }
    setSelectedSlot(null);
  };

  const handleMoveSpread = (spreadIdx, direction) => {
    const targetIdx = spreadIdx + direction;
    if (targetIdx < 0 || targetIdx >= totalSpreads) return;

    setAlbum((prev) => {
      const pagesCopy = [...prev.pages];
      const fromStart = spreadIdx * 2;
      const movedPages = pagesCopy.splice(fromStart, 2);
      const toStart = targetIdx * 2;
      pagesCopy.splice(toStart, 0, ...movedPages);
      const renumbered = pagesCopy.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      return { ...prev, pages: renumbered };
    });
    setCurrentSpreadIndex(targetIdx);
  };

  // ─── Save Album ───
  const handleSave = () => {
    saveAlbumToStorage(album);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // ─── Reset Album ───
  const handleReset = () => {
    if (window.confirm('Reset all pages to initial KPR default design?')) {
      setAlbum(DEFAULT_ALBUM);
      setSelectedSlot(null);
    }
  };

  // Active selected slot data (for fine-tuning sliders)
  const activePage = album.pages.find((p) => p.id === selectedSlot?.pageId);
  const activePhotoData = activePage?.photos?.[selectedSlot?.slotId];

  return (
    <div className="w-full min-h-[90vh] bg-[#F7F4EE] text-[#1E1914] flex flex-col justify-between select-none">
      {/* ═══════ TOP STUDIO CONTROL BAR ═══════ */}
      <header className="w-full bg-[#1A1612] text-white border-b border-[#C5A880]/30 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/60 flex items-center justify-center text-[#C5A880]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={album.title}
                onChange={(e) => setAlbum({ ...album, title: e.target.value })}
                className="font-serif text-sm sm:text-base font-bold bg-transparent border-b border-white/20 hover:border-[#C5A880] focus:border-[#C5A880] text-[#F4ECD8] outline-none tracking-wide"
              />
              <span className="px-2 py-0.5 rounded bg-[#C5A880] text-black font-mono text-[9px] font-bold tracking-widest uppercase">
                {album.size}
              </span>
            </div>
            <p className="text-[10px] text-[#A69989] tracking-wider uppercase">
              KPR Luxury Photobook Design Studio
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {saveToast && (
            <span className="text-[11px] text-emerald-400 font-sans flex items-center gap-1 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/40">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full sm:rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer"
            title="Reset to default design"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:inline sm:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full sm:rounded-md bg-white/10 hover:bg-white/20 text-[#C5A880] hover:text-white border border-[#C5A880]/50 text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Album</span>
          </button>

          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#C5A880] to-[#E3CEAF] hover:from-[#B8996E] hover:to-[#D5BC98] text-black font-serif font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Open in 3D Photobook</span>
          </button>
        </div>
      </header>

      {/* ═══════ MAIN WORKSPACE (PHOTO TRAY + SPREAD CANVAS) ═══════ */}
      <div className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden" style={{ minHeight: 0 }}>
        {/* ── LEFT DRAWER: PHOTO TRAY ── */}
        <aside className="w-full lg:w-72 bg-[#EFEAE1] border-b lg:border-b-0 lg:border-r border-[#D8CEBF] p-3 sm:p-4 flex flex-col shrink-0 overflow-y-auto max-h-56 lg:max-h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[#3D3327]">
              <ImageIcon className="w-4 h-4 text-[#C5A880]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Photo Tray ({availablePhotos.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-[11px] bg-[#C5A880]/20 hover:bg-[#C5A880]/30 text-[#4A3C28] px-2 py-1 rounded font-medium cursor-pointer border border-[#C5A880]/40 transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>Add Photos</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <p className="text-[10px] text-[#7A6B5C] mb-3 leading-relaxed">
            Drag any photograph onto an open frame on the spread, or click a frame then click a photo.
          </p>

          {/* Photo Pool Grid */}
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
            {availablePhotos.map((photo) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', photo.src);
                }}
                onClick={() => {
                  if (selectedSlot) {
                    handleDropPhoto(selectedSlot.pageId, selectedSlot.slotId, photo.src);
                  }
                }}
                className={`group relative aspect-square rounded overflow-hidden border cursor-grab active:cursor-grabbing transition-all hover:scale-102 hover:shadow-md ${
                  selectedSlot
                    ? 'border-[#C5A880] ring-1 ring-[#C5A880]/60'
                    : 'border-[#D5C9B8] hover:border-[#8A7862]'
                }`}
                title="Drag onto page or click to place in selected frame"
              >
                <img
                  src={photo.src}
                  alt={photo.name}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-[9px] text-white bg-black/70 px-1.5 py-0.5 rounded font-mono">
                    Drag
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER WORKSPACE: 2-PAGE SPREAD EDITOR ── */}
        <main className="flex-1 flex flex-col justify-between p-2 sm:p-5 overflow-y-auto bg-[#F7F4EE]">
          {/* Spread Navigator Bar */}
          <div className="flex items-center justify-between mb-3 bg-white/70 backdrop-blur-xs px-3 py-2 rounded-lg border border-[#E2D9CC] shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentSpreadIndex(Math.max(0, currentSpreadIndex - 1))}
                disabled={currentSpreadIndex === 0}
                className="p-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EDE5D8] disabled:opacity-35 disabled:cursor-not-allowed border border-[#D5C9B8] text-[#3D3327] cursor-pointer transition-colors"
                title="Previous Spread"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-serif text-xs sm:text-sm font-semibold text-[#2C241B] tracking-wide">
                Spread {currentSpreadIndex + 1} of {totalSpreads}{' '}
                <span className="text-[#8C7A66] font-mono text-[11px] font-normal">
                  (Pages {leftPageIndex + 1} & {rightPageIndex + 1})
                </span>
              </span>

              <button
                type="button"
                onClick={() => setCurrentSpreadIndex(Math.min(totalSpreads - 1, currentSpreadIndex + 1))}
                disabled={currentSpreadIndex >= totalSpreads - 1}
                className="p-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EDE5D8] disabled:opacity-35 disabled:cursor-not-allowed border border-[#D5C9B8] text-[#3D3327] cursor-pointer transition-colors"
                title="Next Spread"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Spread Reorder & Management */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleMoveSpread(currentSpreadIndex, -1)}
                disabled={currentSpreadIndex === 0}
                className="p-1.5 rounded hover:bg-[#EDE5D8] disabled:opacity-30 disabled:cursor-not-allowed text-[#4A3C28] cursor-pointer"
                title="Move Spread Earlier"
              >
                <MoveLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSpread(currentSpreadIndex, 1)}
                disabled={currentSpreadIndex >= totalSpreads - 1}
                className="p-1.5 rounded hover:bg-[#EDE5D8] disabled:opacity-30 disabled:cursor-not-allowed text-[#4A3C28] cursor-pointer"
                title="Move Spread Later"
              >
                <MoveRight className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-[#D5C9B8] mx-1" />

              <button
                type="button"
                onClick={handleAddSpread}
                className="flex items-center gap-1 text-[11px] bg-[#C5A880]/20 hover:bg-[#C5A880]/30 text-[#3D3327] px-2.5 py-1 rounded font-medium border border-[#C5A880]/40 cursor-pointer transition-colors"
                title="Add New Two-Page Spread"
              >
                <Plus className="w-3 h-3" />
                <span>Add Spread</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSpread(currentSpreadIndex)}
                className="p-1.5 rounded hover:bg-red-100 text-red-700/80 hover:text-red-700 cursor-pointer transition-colors"
                title="Delete Current Spread"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── TWO-PAGE SPREAD CANVASES WITH CENTER SPINE ── */}
          <div className="flex-1 flex items-center justify-center w-full py-1">
            <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-4xl aspect-[2/1] bg-[#14110D] p-2 sm:p-3 rounded-md shadow-2xl border border-[#C5A880]/40 relative">
              {/* Paper Stack Edge */}
              <div className="absolute -bottom-1.5 left-4 right-4 h-1.5 bg-gradient-to-r from-[#D8CEBF] via-[#FAF7F2] to-[#D8CEBF] rounded-b-xs opacity-80 pointer-events-none" />

              {/* ── LEFT PAGE ── */}
              {leftPage && (
                <div className="w-full sm:w-1/2 h-full flex flex-col">
                  {/* Left Page Toolbar */}
                  <div className="flex items-center justify-between px-2 py-1 bg-[#231D16] text-[#D5C9B8] text-[10px] font-mono border-b border-[#3D3327]">
                    <span>Page {leftPage.pageNumber}</span>
                    <button
                      type="button"
                      onClick={() => setTemplatePickerOpen(leftPage.id)}
                      className="flex items-center gap-1 text-[#C5A880] hover:text-white transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{getTemplateById(leftPage.templateId).name}</span>
                    </button>
                  </div>

                  <div className="flex-1 relative overflow-hidden">
                    <AlbumPage
                      pageData={leftPage}
                      pageIndex={leftPageIndex}
                      totalPages={totalPages}
                      isLeftPage={true}
                      isEditable={true}
                      selectedSlotId={
                        selectedSlot?.pageId === leftPage.id ? selectedSlot.slotId : null
                      }
                      onSelectSlot={(slotId) => setSelectedSlot({ pageId: leftPage.id, slotId })}
                      onDropPhoto={(slotId, src) => handleDropPhoto(leftPage.id, slotId, src)}
                      onUpdatePhoto={(slotId, updates) =>
                        handleUpdatePhoto(leftPage.id, slotId, updates)
                      }
                      onRemovePhoto={(slotId) => handleRemovePhoto(leftPage.id, slotId)}
                      onUpdateText={(textId, val) => handleUpdateText(leftPage.id, textId, val)}
                    />
                  </div>
                </div>
              )}

              {/* ── RIGHT PAGE ── */}
              {rightPage && (
                <div className="w-full sm:w-1/2 h-full flex flex-col">
                  {/* Right Page Toolbar */}
                  <div className="flex items-center justify-between px-2 py-1 bg-[#231D16] text-[#D5C9B8] text-[10px] font-mono border-b border-[#3D3327]">
                    <button
                      type="button"
                      onClick={() => setTemplatePickerOpen(rightPage.id)}
                      className="flex items-center gap-1 text-[#C5A880] hover:text-white transition-colors cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{getTemplateById(rightPage.templateId).name}</span>
                    </button>
                    <span>Page {rightPage.pageNumber}</span>
                  </div>

                  <div className="flex-1 relative overflow-hidden">
                    <AlbumPage
                      pageData={rightPage}
                      pageIndex={rightPageIndex}
                      totalPages={totalPages}
                      isLeftPage={false}
                      isEditable={true}
                      selectedSlotId={
                        selectedSlot?.pageId === rightPage.id ? selectedSlot.slotId : null
                      }
                      onSelectSlot={(slotId) => setSelectedSlot({ pageId: rightPage.id, slotId })}
                      onDropPhoto={(slotId, src) => handleDropPhoto(rightPage.id, slotId, src)}
                      onUpdatePhoto={(slotId, updates) =>
                        handleUpdatePhoto(rightPage.id, slotId, updates)
                      }
                      onRemovePhoto={(slotId) => handleRemovePhoto(rightPage.id, slotId)}
                      onUpdateText={(textId, val) => handleUpdateText(rightPage.id, textId, val)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FINE-TUNING PANEL (When a photo slot is selected) ── */}
          {selectedSlot && activePhotoData?.src && (
            <div className="mt-2 bg-white/90 backdrop-blur-md p-2.5 rounded-lg border border-[#C5A880]/50 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C5A880]" />
                <span className="font-semibold text-[#2C241B]">Selected Frame Adjustment:</span>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3.5 h-3.5 text-[#7A6B5C]" />
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={activePhotoData.scale || 1}
                  onChange={(e) =>
                    handleUpdatePhoto(selectedSlot.pageId, selectedSlot.slotId, {
                      scale: parseFloat(e.target.value)
                    })
                  }
                  className="w-24 accent-[#C5A880] cursor-pointer"
                />
                <ZoomIn className="w-3.5 h-3.5 text-[#7A6B5C]" />
                <span className="font-mono text-[11px] w-9 text-right text-[#4A3C28]">
                  {Math.round((activePhotoData.scale || 1) * 100)}%
                </span>
              </div>

              {/* Pan Offset Sliders */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#7A6B5C]">X:</span>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={activePhotoData.offsetX || 0}
                    onChange={(e) =>
                      handleUpdatePhoto(selectedSlot.pageId, selectedSlot.slotId, {
                        offsetX: parseInt(e.target.value, 10)
                      })
                    }
                    className="w-16 accent-[#C5A880] cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#7A6B5C]">Y:</span>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={activePhotoData.offsetY || 0}
                    onChange={(e) =>
                      handleUpdatePhoto(selectedSlot.pageId, selectedSlot.slotId, {
                        offsetY: parseInt(e.target.value, 10)
                      })
                    }
                    className="w-16 accent-[#C5A880] cursor-pointer"
                  />
                </div>
              </div>

              {/* Delete / Clear button */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(selectedSlot.pageId, selectedSlot.slotId)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {/* ── BOTTOM SPREADS FILMSTRIP CAROUSEL ── */}
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-2.5 min-w-max mx-auto justify-center">
              {Array.from({ length: totalSpreads }).map((_, sIdx) => {
                const p1 = album.pages[sIdx * 2];
                const p2 = album.pages[sIdx * 2 + 1];
                const isActive = currentSpreadIndex === sIdx;

                return (
                  <button
                    key={`strip-${sIdx}`}
                    type="button"
                    onClick={() => {
                      setCurrentSpreadIndex(sIdx);
                      setSelectedSlot(null);
                    }}
                    className={`flex flex-col items-center p-1 rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-[#C5A880] bg-white shadow-md scale-105'
                        : 'bg-white/60 hover:bg-white/90 border border-[#D5C9B8]'
                    }`}
                  >
                    <div className="flex w-20 h-11 border border-[#BFB19E] rounded-xs overflow-hidden bg-[#FAF8F5]">
                      <div className="w-1/2 h-full border-r border-black/15 overflow-hidden flex items-center justify-center bg-[#FAF8F5]">
                        {p1 && Object.values(p1.photos || {})[0]?.src ? (
                          <img
                            src={Object.values(p1.photos)[0].src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[7.5px] font-mono text-black/40">
                            {sIdx * 2 + 1}
                          </span>
                        )}
                      </div>
                      <div className="w-1/2 h-full overflow-hidden flex items-center justify-center bg-[#FAF8F5]">
                        {p2 && Object.values(p2.photos || {})[0]?.src ? (
                          <img
                            src={Object.values(p2.photos)[0].src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[7.5px] font-mono text-black/40">
                            {sIdx * 2 + 2}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] mt-1 font-mono ${
                        isActive ? 'font-bold text-[#C5A880]' : 'text-[#7A6B5C]'
                      }`}
                    >
                      {sIdx * 2 + 1}-{sIdx * 2 + 2}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* ═══════ TEMPLATE SELECTOR MODAL ═══════ */}
      {templatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E2D9CC] p-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2D9CC]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1E1914]">
                  Select Page Layout Template
                </h3>
                <p className="text-xs text-[#7A6B5C]">
                  Choose how many photographs and which fine-art frame arrangement to display.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {TEMPLATE_LIST.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    if (tpl.id === 'T_CUSTOM_ARTWORK') {
                      bgUploadPageIdRef.current = templatePickerOpen;
                      bgUploadRef.current?.click();
                    } else {
                      handleSelectTemplate(templatePickerOpen, tpl.id);
                    }
                  }}
                  className="flex flex-col text-left p-3 rounded-lg border border-[#D5C9B8] hover:border-[#C5A880] hover:bg-[#FAF8F5] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#C5A880] uppercase tracking-wider">
                      {tpl.category}
                    </span>
                    <span className="text-[9px] bg-[#EFEAE1] text-[#6A5A4A] px-1.5 py-0.5 rounded">
                      {tpl.photoCount} {tpl.photoCount === 1 ? 'Photo' : 'Photos'}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-[#2C241B] group-hover:text-[#A4865E] transition-colors mb-1">
                    {tpl.name}
                  </h4>
                  <p className="text-[10px] text-[#7A6B5C] leading-snug">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Hidden file input for custom artwork upload */}
            <input
              ref={bgUploadRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCustomBgUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* ═══════ 3D FULLSCREEN VIEWER MODAL ═══════ */}
      <AlbumViewerModal
        album={album}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
