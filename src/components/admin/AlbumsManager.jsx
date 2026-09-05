import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Edit3, Trash2, Check, X,
  AlertTriangle, Loader2, RefreshCw, Eye, Sparkles,
  Layers, Image as ImageIcon, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  ALBUM_SIZES,
  fetchAlbums,
  createAlbum,
  updateAlbum,
  updateAlbumSize,
  deleteAlbum
} from '../../utils/albumsService';

export default function AlbumsManager() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [deletingAlbum, setDeletingAlbum] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPagesText, setFormPagesText] = useState('');
  const [formStatus, setFormStatus] = useState('published');
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadAlbumsData = async () => {
    setLoading(true);
    const data = await fetchAlbums();
    setAlbums(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAlbumsData();

    const handleUpdated = () => {
      loadAlbumsData();
    };

    window.addEventListener('kpr_albums_updated', handleUpdated);
    return () => {
      window.removeEventListener('kpr_albums_updated', handleUpdated);
    };
  }, []);

  const openCreateModal = () => {
    setEditingAlbum(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormSize('');
    setFormCoverImage('');
    setFormDesc('');
    setFormPagesText('');
    setFormStatus('published');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (album) => {
    setEditingAlbum(album);
    setFormTitle(album.title || '');
    setFormSubtitle(album.subtitle || '');
    setFormSize(album.size || '');
    setFormCoverImage(album.cover_image || album.coverImage || '');
    setFormDesc(album.description || album.desc || '');
    setFormPagesText((album.pages || []).join('\n'));
    setFormStatus(album.status || 'published');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleQuickSizeChange = async (album, newSize) => {
    const cleanSize = newSize || null;
    // Optimistic UI update
    setAlbums(prev => prev.map(a => a.id === album.id ? { ...a, size: cleanSize } : a));
    
    await updateAlbumSize(album.id, cleanSize);
    setToastMsg(`Size for "${album.title}" updated to ${cleanSize || 'Unset'}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('Please enter an album title.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const pages = formPagesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const payload = {
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      size: formSize ? formSize.trim() : null,
      cover_image: formCoverImage.trim() || (pages[0] || '/images/services/wedding_album_printing.png'),
      description: formDesc.trim(),
      pages: pages.length > 0 ? pages : ['/images/services/wedding_album_printing.png'],
      status: formStatus
    };

    if (editingAlbum) {
      // Update existing album row without creating new row
      await updateAlbum(editingAlbum.id, payload);
      setToastMsg(`Album "${payload.title}" updated successfully!`);
    } else {
      // Create new album
      await createAlbum(payload);
      setToastMsg(`New album "${payload.title}" created successfully!`);
    }

    setSaving(false);
    setModalOpen(false);
    loadAlbumsData();
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAlbum) return;
    setSaving(true);
    await deleteAlbum(deletingAlbum.id);
    setSaving(false);
    setDeletingAlbum(null);
    setToastMsg('Album deleted successfully.');
    loadAlbumsData();
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filteredAlbums = albums.filter(album => {
    const matchSearch =
      (album.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (album.subtitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (album.size || '').toLowerCase().includes(search.toLowerCase());

    const matchSize = sizeFilter === 'all' || (sizeFilter === 'unset' ? !album.size : album.size === sizeFilter);
    return matchSearch && matchSize;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-[#111111] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C5A880]" />
            <span>Layout Albums & Sizes</span>
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage public layflat flipbook albums, dimensions, cover artistry, and proofing layouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Album</span>
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {toastMsg && (
        <div className="bg-[#DFF5E3] border border-[#16A34A]/30 text-[#16A34A] px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-[#16A34A] hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search albums by title or size…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSizeFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              sizeFilter === 'all'
                ? 'bg-[#141414] text-white'
                : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            All Sizes ({albums.length})
          </button>

          {ALBUM_SIZES.map(s => {
            const count = albums.filter(a => a.size === s).length;
            return (
              <button
                key={s}
                onClick={() => setSizeFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold font-mono transition-colors cursor-pointer whitespace-nowrap ${
                  sizeFilter === s
                    ? 'bg-[#C5A880] text-white'
                    : 'bg-[#F7F8FA] text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}

          <button
            onClick={loadAlbumsData}
            className="p-2 rounded-full bg-[#F1F2F4] text-[#111111] hover:bg-[#E5E7EB] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Album Cards Grid (Admin Album List View) */}
      {loading ? (
        <div className="p-16 text-center text-[#9CA0A6] bg-white rounded-[20px] border border-[#E7E8EB]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#141414] mb-2" />
          <p className="text-xs">Loading albums…</p>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="p-16 text-center text-[#9CA0A6] bg-white rounded-[20px] border border-[#E7E8EB] space-y-3">
          <BookOpen className="w-12 h-12 text-[#9CA0A6] mx-auto" />
          <h4 className="text-base font-bold text-[#111111]">No Albums Found</h4>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Create an album or adjust your search filter to view your layout albums.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Album</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="bg-white border border-[#E7E8EB] hover:border-[#141414]/40 rounded-[20px] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Card Top: Cover Image + Badges */}
              <div className="relative aspect-[16/10] bg-[#141414] overflow-hidden">
                <img
                  src={album.cover_image || album.coverImage || '/images/services/wedding_album_printing.png'}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = '/images/services/wedding_album_printing.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Top Floating Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold rounded-full border border-white/20 uppercase tracking-wider">
                    {album.subtitle || 'Layflat Album'}
                  </span>

                  {/* Size Badge: ONLY rendered if size is set */}
                  {album.size && (
                    <span className="px-2.5 py-1 bg-[#C5A880] text-[#141414] text-[10.5px] font-bold font-mono rounded-full border border-[#C5A880]/50 shadow-xs uppercase tracking-wider">
                      {album.size}
                    </span>
                  )}
                </div>

                {/* Bottom title overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-sm font-bold drop-shadow-sm line-clamp-1">{album.title}</p>
                  <p className="text-[11px] text-[#D1D5DB] flex items-center gap-1.5 mt-0.5">
                    <span>{album.pages?.length || 0} Pages • Flipbook</span>
                    {album.size && (
                      <>
                        <span>•</span>
                        <span className="text-[#E8D4B8] font-mono font-bold">{album.size}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                  {album.description || album.desc || 'Handcrafted luxury wedding album with archival flush-mount sheets.'}
                </p>

                {/* Size Quick-Selector */}
                <div className="pt-3 border-t border-[#E7E8EB] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Album Size:
                    </label>
                    {album.size ? (
                      <span className="text-xs font-mono font-bold text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded border border-[#C5A880]/30">
                        {album.size}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA0A6] italic">Unset</span>
                    )}
                  </div>

                  <select
                    value={album.size || ''}
                    onChange={(e) => handleQuickSizeChange(album, e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                  >
                    <option value="">Select Size (Optional)</option>
                    {ALBUM_SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditModal(album)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F1F2F4] hover:bg-[#141414] hover:text-white text-[#111111] text-xs font-semibold rounded-full transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Album</span>
                  </button>

                  <button
                    onClick={() => setDeletingAlbum(album)}
                    className="p-2 text-[#9CA0A6] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors cursor-pointer border border-transparent hover:border-[#FCA5A5]"
                    title="Delete Album"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          4. CREATE / EDIT ALBUM MODAL (INCLUDES SIZE DROPDOWN)
          ══════════════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#111111]">
                  {editingAlbum ? 'Edit Existing Album' : 'Create New Album'}
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {editingAlbum
                    ? 'Update album details or change size without recreating existing rows.'
                    : 'Add a new handcrafted layout album to your public showcase and proofing catalog.'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-[#9CA0A6] hover:text-[#111111] hover:bg-[#F1F2F4] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Velvet Wedding Album"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Subtitle / Cover Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flush Mount 30-Sheet Layflat"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              {/* SIZE DROPDOWN (Exact options specified in task) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
                  <span>Size (Optional)</span>
                  {formSize && (
                    <span className="text-xs font-mono font-bold text-[#C5A880]">
                      Selected: {formSize}
                    </span>
                  )}
                </label>
                <select
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414] cursor-pointer"
                >
                  <option value="">Select Size (Optional)</option>
                  {ALBUM_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#9CA0A6]">
                  Optional physical dimension. Available sizes: 12x36, 13x39, 14x40, 16x24, 18x24, 12x24.
                </p>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="/images/services/wedding_album_printing.png"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                />
              </div>

              {/* Pages URLs (One per line) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Album Pages (One image URL per line)
                </label>
                <textarea
                  rows={4}
                  placeholder={`/images/services/wedding_album_printing.png\n/images/services/large_format_printing.png\n/images/services/card_sticker_printing.png`}
                  value={formPagesText}
                  onChange={(e) => setFormPagesText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs font-mono text-[#111111] focus:outline-none focus:border-[#141414] resize-y"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Handcrafted Italian leather album with metallic foil embossing..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414] resize-y"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E7E8EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingAlbum ? 'Save Album Changes' : 'Create Album'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAlbum && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#111111]">Delete Album?</h4>
              <p className="text-xs text-[#6B7280]">
                Are you sure you want to delete <strong className="text-[#111111]">"{deletingAlbum.title}"</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingAlbum(null)}
                className="flex-1 py-2 bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#111111] text-xs font-semibold rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="flex-1 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
