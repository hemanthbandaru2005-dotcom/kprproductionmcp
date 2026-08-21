import React, { useState } from 'react';
import { Edit3, Camera, Package, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PhotoGalleryManager from './PhotoGalleryManager';
import PackagesManager from './PackagesManager';

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'packages'

  const userRole = profile?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'superadmin';

  // Strict route-level permission guard
  if (!isAuthorized) {
    return (
      <div className="bg-[#1E2433] rounded-3xl p-16 text-center text-white space-y-4 border border-rose-500/20 max-w-xl mx-auto my-12 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-serif text-white">Restricted Administrator Area</h3>
        <p className="text-xs text-white/60 leading-relaxed max-w-md mx-auto">
          Staff and worker accounts are not authorized to modify public showcase galleries or pricing settings. Contact the Studio Superadmin for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      
      {/* Editor Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0F1623] rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/15 text-[#C5A880] flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Studio Live Editor</h2>
            <p className="text-[11px] text-white/50">Manage dynamic showcase photos, services, and live package rates</p>
          </div>
        </div>

        {/* Tab Switcher: Photo Gallery vs Packages & Pricing */}
        <div className="flex items-center gap-2 bg-[#111827] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'photos'
                ? 'bg-[#C5A880] text-black shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photo Gallery</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-[#C5A880] text-black shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Packages & Pricing</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {activeTab === 'photos' && <PhotoGalleryManager />}
        {activeTab === 'packages' && <PackagesManager />}
      </div>

    </div>
  );
}
