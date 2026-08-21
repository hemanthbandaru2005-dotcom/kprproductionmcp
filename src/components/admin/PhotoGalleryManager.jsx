import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Palette, Plus, Trash2, Image as ImageIcon,
  Check, X, AlertTriangle, Loader2, RefreshCw, Upload,
  Eye, Info, Sparkles
} from 'lucide-react';
import {
  fetchCustomSitePhotos,
  addCustomSitePhoto,
  deleteCustomSitePhoto,
  PHOTOGRAPHY_CATEGORIES,
  COLORLAB_CATEGORIES
} from '../../utils/sitePhotosService';

export default function PhotoGalleryManager() {
  const [activeGallery, setActiveGallery] = useState('photography'); // 'photography' | 'colorlab'
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(null);

  // Add form state
  const [formCategory, setFormCategory] = useState('Weddings');
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const categories = activeGallery === 'photography' ? PHOTOGRAPHY_CATEGORIES : COLORLAB_CATEGORIES;

  const loadPhotos = async () => {
    setLoading(true);
    const data = await fetchCustomSitePhotos(activeGallery);
    setPhotos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    setCategoryFilter('all');
    setFormCategory(activeGallery === 'photography' ? 'Wedding' : 'Prints');
    loadPhotos();
  }, [activeGallery]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formImageUrl) {
      setErrorMsg('Please upload an image file or paste an image URL.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    const payload = {
      gallery: activeGallery,
      category: formCategory,
      title: formTitle.trim() || `${formCategory} Photo`,
      file_url: formImageUrl,
      display_order: Number(formDisplayOrder) || photos.length + 1
    };

    const res = await addCustomSitePhoto(payload);
    setUploading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setAddModalOpen(false);
      setFormTitle('');
      setFormImageUrl('');
      setImagePreview('');
      setToastMsg(`Photo added live to the ${activeGallery === 'photography' ? 'Photography' : 'Color Lab'} showcase!`);
      loadPhotos();
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPhoto) return;
    setUploading(true);

    const res = await deleteCustomSitePhoto(deletingPhoto.id);
    setUploading(false);

    if (!res.error) {
      setPhotos(photos.filter(p => p.id !== deletingPhoto.id));
      setDeletingPhoto(null);
      setToastMsg('Photo deleted from live site.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const filteredPhotos = photos.filter(p => categoryFilter === 'all' || p.category === categoryFilter);

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      
      {/* Toast Notification */}
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-8 z-50 px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMsg}</span>
        </motion.div>
      )}

      {/* 1. Header & Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider uppercase text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#C5A880]" />
            Photo Gallery Management
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Add new high-resolution photos that appear live on top of the existing showcase galleries.
          </p>
        </div>

        {/* Gallery Sub-Tabs: Photography vs Color Lab */}
        <div className="flex items-center gap-2 bg-[#111827] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveGallery('photography')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeGallery === 'photography'
                ? 'bg-[#C5A880] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photography</span>
          </button>

          <button
            onClick={() => setActiveGallery('colorlab')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeGallery === 'colorlab'
                ? 'bg-[#C5A880] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Lab</span>
          </button>
        </div>
      </div>

      {/* Scope notice banner */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3 text-xs text-blue-300">
        <Info className="w-4 h-4 shrink-0 text-blue-400" />
        <span>
          Showing custom photos added via Admin for <strong>{activeGallery === 'photography' ? 'Photography Gallery' : 'Color Lab Gallery'}</strong>. Existing static portfolio images are preserved as-is.
        </span>
      </div>

      {/* 2. Actions & Category Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-[#0F1623] rounded-2xl border border-white/5">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-2xl py-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-white text-black font-bold'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            All Categories ({photos.length})
          </button>

          {categories.map(cat => {
            const count = photos.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#C5A880] text-black font-bold'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Add Photo Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadPhotos}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Refresh gallery"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* 3. Photos Grid */}
      {loading ? (
        <div className="py-24 text-center text-white/40 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>Loading custom photos…</span>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-24 text-center text-white/40 text-xs bg-[#0F1623] rounded-2xl border border-white/5 space-y-3">
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto" />
          <p className="font-serif text-lg text-white/70">
            No Admin Photos in {activeGallery === 'photography' ? 'Photography' : 'Color Lab'} Yet
          </p>
          <p className="text-white/40 max-w-md mx-auto">
            Click "Add Photo" to upload a new showcase photo for this gallery. It will appear live on the public site immediately.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-5 py-2 rounded-xl bg-[#C5A880] text-black font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#D4BC9A] mt-2 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Photo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {filteredPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="group relative bg-[#1E2433] border border-white/10 hover:border-[#C5A880]/60 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between transition-all"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-square w-full bg-black/60 overflow-hidden">
                  <img
                    src={photo.file_url}
                    alt={photo.title || 'Showcase Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Order Badge */}
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white/80 text-[9px] font-mono backdrop-blur-sm">
                    #{photo.display_order || 1}
                  </span>

                  {/* Delete overlay button */}
                  <button
                    onClick={() => setDeletingPhoto(photo)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-500 text-white/80 hover:text-white transition-colors cursor-pointer shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info Footer */}
                <div className="p-2.5 space-y-1">
                  <p className="text-[11px] font-semibold text-white truncate">{photo.title || 'Untitled'}</p>
                  <span className="inline-block text-[9px] font-medium text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-1.5 py-0.5 rounded border border-[#C5A880]/20 truncate max-w-full">
                    {photo.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Add Photo Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 text-white">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                  Add to {activeGallery === 'photography' ? 'Photography' : 'Color Lab'} Gallery
                </h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Image Preview & Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                  Photo Asset *
                </label>

                {imagePreview ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/15">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(''); setFormImageUrl(''); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-white/20 hover:border-[#C5A880] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/5">
                      <Upload className="w-6 h-6 text-[#C5A880]" />
                      <span className="text-xs text-white/70 font-medium">Click to upload image file</span>
                      <span className="text-[10px] text-white/40">PNG, JPG, WebP</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="text-center text-[10px] text-white/40 uppercase tracking-widest">— OR PASTE URL —</div>

                    <input
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Title / Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Telugu Wedding Mandap"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Category & Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Photo</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-white">Delete Photo?</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              This will remove <strong>"{deletingPhoto.title || deletingPhoto.category}"</strong> from the live public {activeGallery === 'photography' ? 'Photography' : 'Color Lab'} gallery.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingPhoto(null)}
                className="px-5 py-2 rounded-xl text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={uploading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
