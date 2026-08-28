import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Edit2, Trash2, Check,
  X, AlertTriangle, Loader2, RefreshCw, Eye, EyeOff,
  CheckCircle2, Camera, Palette, Sparkles, RotateCcw,
  Image as ImageIcon, Clock, Tag
} from 'lucide-react';
import {
  fetchSitePackages,
  saveSitePackage,
  deleteSitePackage,
  resetToDefaultPackages,
  OFFICIAL_PHOTOGRAPHY_PACKAGES,
  OFFICIAL_COLORLAB_SERVICES
} from '../../utils/packagesService';

const PHOTOGRAPHY_CATEGORIES = [
  'Photography',
  'Videography',
  'Aerial',
  'Setup',
  'Broadcast',
  'Editing',
  'Print Album'
];

const COLORLAB_CATEGORIES = [
  'Album Artistry',
  'Large Format Flex',
  'Laser & Cutting',
  '60" Fine Art Photo',
  'Modern Wall Frames',
  'Classic Framing',
  'Custom Printing'
];

export default function PackagesManager() {
  const [activeType, setActiveType] = useState('photography'); // 'photography' | 'colorlab'
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [deletingPkg, setDeletingPkg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('6 hours');
  const [category, setCategory] = useState('Photography');
  const [image, setImage] = useState('');
  const [popular, setPopular] = useState(false);
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState(['']);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [status, setStatus] = useState('active'); // 'active' | 'hidden'
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    const data = await fetchSitePackages(activeType, true); // true = include hidden
    setPackages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, [activeType]);

  const openAddModal = () => {
    setEditingPkg(null);
    setName('');
    setPrice(activeType === 'photography' ? '6000' : '2500');
    setDuration(activeType === 'photography' ? '6 hours' : 'Luxury Handcrafted Flush-Mount Layflat Albums');
    setCategory(activeType === 'photography' ? 'Photography' : 'Album Artistry');
    setImage(activeType === 'photography' ? '/images/packages/user_pkg_candid_photo.png' : '/images/services/wedding_album_printing.png');
    setPopular(false);
    setDescription('');
    setFeatures(['Full on-site coverage', 'High-res deliverables', 'Direct cloud link delivery']);
    setDisplayOrder(packages.length + 1);
    setStatus('active');
    setErrorMsg('');
    setFormModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setDuration(pkg.duration || '');
    setCategory(pkg.category || (activeType === 'photography' ? 'Photography' : 'Album Artistry'));
    setImage(pkg.image || '');
    setPopular(Boolean(pkg.popular));
    setDescription(pkg.description || '');
    setFeatures(pkg.features && pkg.features.length > 0 ? pkg.features : ['']);
    setDisplayOrder(pkg.display_order || 1);
    setStatus(pkg.status || 'active');
    setErrorMsg('');
    setFormModalOpen(true);
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleFeatureChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Package name is required.');
      return;
    }
    if (price === '' || isNaN(Number(price))) {
      setErrorMsg('Please enter a valid numeric price.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const cleanFeatures = features.map(f => f.trim()).filter(Boolean);

    const payload = {
      id: editingPkg?.id || undefined,
      type: activeType,
      name: name.trim(),
      price: Number(price),
      duration: duration.trim(),
      category: category.trim(),
      image: image.trim() || (activeType === 'photography' ? '/images/packages/user_pkg_candid_photo.png' : '/images/services/wedding_album_printing.png'),
      popular,
      description: description.trim(),
      features: cleanFeatures,
      display_order: Number(displayOrder) || 1,
      status
    };

    const res = await saveSitePackage(payload);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setFormModalOpen(false);
      setToastMsg(editingPkg ? 'Package updated successfully!' : 'New package created live!');
      loadPackages();
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPkg) return;
    setSubmitting(true);

    const res = await deleteSitePackage(deletingPkg.id);
    setSubmitting(false);

    if (!res.error) {
      setPackages(packages.filter(p => p.id !== deletingPkg.id));
      setDeletingPkg(null);
      setToastMsg('Package removed from live site.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  // Reset to verified studio default packages matching image exactly
  const handleResetToDefaults = async () => {
    if (window.confirm('Reset packages to the studio official Photography (12) & Color Lab (6) standard matching the public showcase? Any unsaved edits will be refreshed.')) {
      setResetting(true);
      await resetToDefaultPackages();
      await loadPackages();
      setResetting(false);
      setToastMsg('Packages re-synchronized with public showcase standard!');
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const currentCategories = activeType === 'photography' ? PHOTOGRAPHY_CATEGORIES : COLORLAB_CATEGORIES;

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-[#141414] text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-white/20 animate-slideUp">
          <Check className="w-4 h-4 text-[#13A52D] stroke-[3]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Section Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E7E8EB] pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111111] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#C5A880]" />
            <span>Studio Packages & Services Editor</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Configure live package titles, categories, scopes/durations, deliverables, and rates.
          </p>
        </div>

        {/* Sub-Tabs: Photography Packages vs Color Lab Services */}
        <div className="flex items-center gap-2 bg-[#F7F8FA] p-1.5 rounded-2xl border border-[#E7E8EB]">
          <button
            onClick={() => setActiveType('photography')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeType === 'photography'
                ? 'bg-[#141414] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photography Packages (12)</span>
          </button>

          <button
            onClick={() => setActiveType('colorlab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeType === 'colorlab'
                ? 'bg-[#141414] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Lab Printing (6)</span>
          </button>
        </div>
      </div>

      {/* 2. Actions & Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B7280] font-medium">
            Total {activeType === 'photography' ? 'Photography Packages' : 'Color Lab Services'}: <strong className="text-[#111111]">{packages.length}</strong>
          </span>
          <span className="text-xs text-[#13A52D] font-bold bg-[#EAF8EE] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
            {packages.filter(p => p.status === 'active').length} Active Live
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetToDefaults}
            disabled={resetting}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F1F2F4] text-[#6B7280] hover:text-[#111111] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-[#E7E8EB] flex items-center gap-1.5 shadow-2xs"
            title="Reset packages to studio verified defaults"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Sync Studio Defaults</span>
          </button>

          <button
            onClick={loadPackages}
            className="p-2 rounded-xl bg-white hover:bg-[#F1F2F4] text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer border border-[#E7E8EB]"
            title="Refresh packages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeType === 'photography' ? 'Package' : 'Service'}</span>
          </button>
        </div>
      </div>

      {/* 3. Packages Grid / Cards (Exact Luxury Showcase Visual Design) */}
      {loading ? (
        <div className="py-24 text-center text-[#9CA0A6] text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#141414]" />
          <span>Loading verified pricing data…</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="py-24 text-center text-[#9CA0A6] text-xs bg-[#F7F8FA] rounded-2xl border border-[#E7E8EB] space-y-3">
          <Package className="w-12 h-12 text-[#9CA0A6] mx-auto" />
          <p className="font-serif text-lg text-[#111111]">No Packages Found</p>
          <p className="text-[#6B7280]">Click "Sync Studio Defaults" to load the official studio catalog.</p>
          <button
            onClick={handleResetToDefaults}
            className="mt-2 px-4 py-2 bg-[#141414] text-white rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Load Studio Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence>
            {packages.map((pkg, index) => {
              const isActive = pkg.status === 'active';
              const displayDuration = pkg.duration || (activeType === 'photography' ? '6 hours' : 'Standard Turnaround');
              const imageSrc = pkg.image || (activeType === 'photography' ? '/images/packages/user_pkg_candid_photo.png' : '/images/services/wedding_album_printing.png');

              return (
                <div
                  key={pkg.id || index}
                  className={`bg-white border border-[#E2D9CC] rounded-xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-500 hover:border-[#C5A880]/60 group ${
                    !isActive ? 'opacity-70 border-amber-300' : ''
                  }`}
                >
                  {/* Thumbnail Image Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#121212]">
                    <img
                      src={imageSrc}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = activeType === 'photography' ? '/images/packages/user_pkg_candid_photo.png' : '/images/services/wedding_album_printing.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Category Badge (Top Left) */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/60 backdrop-blur-md text-[#E8D4B8] text-[9px] tracking-widest uppercase px-3 py-1 font-medium border border-white/10 rounded-sm">
                        {pkg.category || (activeType === 'photography' ? 'Photography' : 'Printing')}
                      </span>
                    </div>

                    {/* Popular Badge (Bottom Left) */}
                    {pkg.popular && (
                      <div className="absolute bottom-3 left-3 bg-[#C5A880] text-white text-[9px] tracking-[0.2em] uppercase px-3 py-1 font-semibold flex items-center gap-1 shadow rounded-sm">
                        <Sparkles className="w-3 h-3" />
                        <span>POPULAR</span>
                      </div>
                    )}

                    {/* Visibility & Order Indicator (Top Right) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className="bg-black/70 text-white/90 text-[9px] font-mono px-2 py-0.5 rounded-sm border border-white/10">
                        #{pkg.display_order || index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-amber-600 text-white border-amber-500'
                      }`}>
                        {isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5 sm:space-y-2">
                      <h3 className="font-serif text-lg sm:text-2xl text-[#1A1A1A] font-medium leading-tight group-hover:text-[#C5A880] transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-xs text-[#666666] font-light leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* DURATION / SCOPE Box (Matches Screenshot 100%) */}
                    <div className="pt-4 border-t border-[#E8E1D5] space-y-4">
                      <div className="flex items-center justify-between bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8E1D5] gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold shrink-0">
                          Duration / Scope
                        </span>
                        <span className="text-xs font-bold text-[#1A1A1A] text-right truncate">
                          {displayDuration}
                        </span>
                      </div>

                      {/* Included Features List with Gold Dots */}
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="space-y-1.5 text-[11px] text-[#555555]">
                          {pkg.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full shrink-0 mt-1" />
                              <span className="leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Admin Controls Footer */}
                      <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-2">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="flex-1 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[10px] font-semibold tracking-wider uppercase transition-all duration-300 rounded-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Package Details</span>
                        </button>

                        <button
                          onClick={() => setDeletingPkg(pkg)}
                          className="p-2 text-[#9CA0A6] hover:text-[#DC2626] transition-colors rounded-sm hover:bg-rose-50 cursor-pointer border border-[#E8E1D5]"
                          title="Delete package"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Add / Edit Package Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[28px] w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-[#111111] max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#E7E8EB] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-[#111111]">
                  {editingPkg ? 'Edit Studio Package' : `Add New ${activeType === 'photography' ? 'Photography' : 'Color Lab'} Package`}
                </h3>
              </div>
              <button onClick={() => setFormModalOpen(false)} className="p-1 rounded-full hover:bg-[#F1F2F4] text-[#6B7280] hover:text-[#111111] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-[#DC2626] rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                  Package / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Candid Photography or Wedding Album Printing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="e.g. 12000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Duration / Scope *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6 hours / Luxury Handcrafted Layflat Albums"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              {/* Category & Thumbnail Image Path */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                  >
                    {currentCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Image Asset Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /images/packages/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] font-mono focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-[#F7F8FA] rounded-xl border border-[#E7E8EB]">
                <input
                  type="checkbox"
                  id="popular-pkg"
                  checked={popular}
                  onChange={(e) => setPopular(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#141414] cursor-pointer"
                />
                <label htmlFor="popular-pkg" className="text-xs font-semibold text-[#111111] cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Highlight with POPULAR Badge</span>
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Full day candid photography with master color graded portraits."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] resize-none"
                />
              </div>

              {/* Repeatable Deliverables Feature List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    Included Deliverables
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs text-[#1E74FF] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 6 Hours on-site coverage"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414]"
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#DC2626] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Toggle & Display Order */}
              <div className="grid grid-cols-2 gap-3 items-end pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F8FA] border border-[#E7E8EB] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                    Visibility Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`py-2 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        status === 'active'
                          ? 'bg-[#EAF8EE] border-[#BBF7D0] text-[#13A52D]'
                          : 'bg-[#F7F8FA] border-[#E7E8EB] text-[#6B7280]'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Active</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('hidden')}
                      className={`py-2 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        status === 'hidden'
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-[#F7F8FA] border-[#E7E8EB] text-[#6B7280]'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Hidden</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E8EB]">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#6B7280] text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPkg ? 'Save Changes' : 'Create Package'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Dialog */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E7E8EB] rounded-[24px] w-full max-w-sm p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#DC2626] mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-[#111111]">Delete Package?</h4>
              <p className="text-xs text-[#6B7280] max-w-xs mx-auto">
                Are you sure you want to remove <strong className="text-[#111111]">"{deletingPkg.name}"</strong> from public studio packages?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingPkg(null)}
                className="flex-1 py-2 rounded-xl bg-[#F1F2F4] hover:bg-[#E5E7EB] text-[#6B7280] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-[#DC2626] hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
