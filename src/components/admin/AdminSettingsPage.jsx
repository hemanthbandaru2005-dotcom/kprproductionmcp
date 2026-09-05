import React, { useState } from 'react';
import { Edit3, Camera, Package, BookOpen, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PhotoGalleryManager from './PhotoGalleryManager';
import PackagesManager from './PackagesManager';
import AlbumsManager from './AlbumsManager';

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'albums' | 'packages'

  const userRole = profile?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'superadmin';

  // Strict route-level permission guard
  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-[24px] sm:rounded-[32px] p-16 text-center text-[#111111] space-y-4 border border-[#FCA5A5] max-w-xl mx-auto my-12 animate-fadeIn shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#111111]">Restricted Administrator Area</h3>
        <p className="text-xs text-[#6B7280] leading-relaxed max-w-md mx-auto">
          Staff and worker accounts are not authorized to modify public showcase galleries or pricing settings. Contact the Studio Superadmin for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-[#111111]">
      
      {/* Editor Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-[20px] border border-[#E7E8EB] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DCE9FF] text-[#1E74FF] flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111111]">Studio Live Showcase Editor</h2>
            <p className="text-xs text-[#6B7280]">Manage dynamic showcase photos, albums & sizes, and live package rates</p>
          </div>
        </div>

        {/* Tab Switcher: Photo Gallery vs Albums vs Packages & Pricing */}
        <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1.5 rounded-full border border-[#E7E8EB] overflow-x-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'photos'
                ? 'bg-[#141414] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photo Gallery</span>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'albums'
                ? 'bg-[#141414] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Albums & Sizes</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-[#141414] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111111]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Packages & Pricing</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-[#E7E8EB] rounded-[20px] p-6 sm:p-8 shadow-xs">
        {activeTab === 'photos' && <PhotoGalleryManager />}
        {activeTab === 'albums' && <AlbumsManager />}
        {activeTab === 'packages' && <PackagesManager />}
      </div>

    </div>
  );
}
