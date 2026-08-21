import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Edit2, Trash2, Check,
  X, AlertTriangle, Loader2, RefreshCw, Eye, EyeOff,
  CheckCircle2, Camera, Palette
} from 'lucide-react';
import {
  fetchSitePackages,
  saveSitePackage,
  deleteSitePackage
} from '../../utils/packagesService';

export default function PackagesManager() {
  const [activeType, setActiveType] = useState('photography'); // 'photography' | 'colorlab'
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [deletingPkg, setDeletingPkg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('6 hours');
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
    setPrice('');
    setDuration(activeType === 'photography' ? '6 hours' : 'Standard Turnaround');
    setDescription('');
    setFeatures(['Full on-site coverage', 'High-res deliverables']);
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
      setTimeout(() => setToastMsg(''), 3000);
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
      setToastMsg('Package removed from public site.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

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
            <Package className="w-6 h-6 text-[#C5A880]" />
            Packages & Pricing Management
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Configure live rates, deliverables, and package visibility across Photography and Color Lab.
          </p>
        </div>

        {/* Sub-Tabs: Photography Packages vs Color Lab Pricing */}
        <div className="flex items-center gap-2 bg-[#111827] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveType('photography')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeType === 'photography'
                ? 'bg-[#C5A880] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photography Packages</span>
          </button>

          <button
            onClick={() => setActiveType('colorlab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeType === 'colorlab'
                ? 'bg-[#C5A880] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Lab Pricing</span>
          </button>
        </div>
      </div>

      {/* 2. Actions & Summary Bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-[#0F1623] rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 font-medium">
            Total {activeType === 'photography' ? 'Packages' : 'Services'}: <strong className="text-white">{packages.length}</strong>
          </span>
          <span className="text-xs text-emerald-400 font-medium">
            ({packages.filter(p => p.status === 'active').length} Active Live)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPackages}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Refresh packages"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-lg cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeType === 'photography' ? 'Package' : 'Service'}</span>
          </button>
        </div>
      </div>

      {/* 3. Packages Grid / Cards */}
      {loading ? (
        <div className="py-24 text-center text-white/40 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#C5A880]" />
          <span>Loading pricing data…</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="py-24 text-center text-white/40 text-xs bg-[#0F1623] rounded-2xl border border-white/5 space-y-3">
          <Package className="w-12 h-12 text-white/20 mx-auto" />
          <p className="font-serif text-lg text-white/70">No Packages Created Yet</p>
          <p className="text-white/40">Click "Add Package" to set up your pricing offerings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {packages.map((pkg) => {
              const isActive = pkg.status === 'active';

              return (
                <motion.div
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className={`bg-[#0F1623] border rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${
                    isActive ? 'border-white/10 hover:border-[#C5A880]/50' : 'border-amber-500/20 opacity-70'
                  }`}
                >
                  {/* Card Top */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-mono text-white/40 uppercase">Order #{pkg.display_order || 1}</span>
                        <h4 className="font-serif text-xl font-bold text-white tracking-wide">{pkg.name}</h4>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isActive ? 'Active' : 'Hidden'}</span>
                      </span>
                    </div>

                    {/* Price in INR */}
                    <div className="flex items-baseline justify-between gap-1 text-[#C5A880] pb-2 border-b border-white/5">
                      <div className="flex items-baseline">
                        <span className="font-serif text-2xl sm:text-3xl font-bold">
                          ₹{Number(pkg.price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-white/40 font-light">/-</span>
                      </div>
                      {pkg.duration && (
                        <span className="text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded font-mono">
                          {pkg.duration}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-xs text-white/60 font-light leading-relaxed">
                        {pkg.description}
                      </p>
                    )}

                    {/* Features Deliverables List */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Included Deliverables:</p>
                        <ul className="space-y-1.5">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="text-xs text-white/80 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingPkg(pkg)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer border border-white/10"
                      title="Delete package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Add / Edit Package Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1F2937] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 text-white max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                  {editingPkg ? 'Edit Package' : `Add ${activeType === 'photography' ? 'Photography' : 'Color Lab'} Package`}
                </h3>
              </div>
              <button onClick={() => setFormModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Telugu Wedding Collection"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="e.g. 25000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Coverage Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 hours / Full Day"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Full day candid photography with traditional videography & drone highlight reel."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880] resize-none"
                />
              </div>

              {/* Repeatable Features List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                    Included Features / Deliverables
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs text-[#C5A880] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 8 Hours on-site coverage"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#111827] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C5A880]"
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Toggle & Order */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1.5">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`py-2 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        status === 'active'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/60'
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
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Hidden</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC9A] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPkg ? 'Update Package' : 'Publish Package'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1F2937] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-white">Delete Package?</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              This will permanently remove <strong>"{deletingPkg.name}"</strong> (₹{Number(deletingPkg.price).toLocaleString('en-IN')}) from the public site.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingPkg(null)}
                className="px-5 py-2 rounded-xl text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
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
