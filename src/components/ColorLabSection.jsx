import React, { useState, useEffect } from 'react';
import RetouchSlider from './RetouchSlider';
import PackagesSection from './PackagesSection';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import { Palette, Package, BookOpen, ChevronDown, Check, Sparkles, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import { PRINTING_DESIGN_SERVICES } from '../data/servicesData';
import { loadPdfPages } from '../utils/pdfLoader';
import { fetchCustomSitePhotos } from '../utils/sitePhotosService';
import kprColorLabLogo from '../assets/kpr_colorlab_logo.png';

export default function ColorLabSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('designs'); // 'designs' | 'packages' | 'albums'
  const [flipbookImages, setFlipbookImages] = useState(null); // when set, opens the album flipbook viewer
  const [pdfLoading, setPdfLoading] = useState(false);
  const [customColorLabPhotos, setCustomColorLabPhotos] = useState([]);

  useEffect(() => {
    async function loadCustom() {
      try {
        const photos = await fetchCustomSitePhotos('colorlab');
        if (photos && Array.isArray(photos)) {
          const colorlabOnly = photos.filter(p => (p.gallery || '').toLowerCase() === 'colorlab');
          setCustomColorLabPhotos(colorlabOnly);
        }
      } catch (e) {
        console.warn('Error loading custom colorlab photos:', e);
      }
    }
    loadCustom();
  }, []);

  const demoAlbumPages = Array.from({ length: 39 }, (_, i) => `/albums/demo/page_${i + 1}.jpg`);

  /* Handler to open an album — supports both image arrays and manifest/PDF files */
  const handleViewAlbum = async (album) => {
    if (album.manifestSrc) {
      setPdfLoading(true);
      try {
        const res = await fetch(album.manifestSrc);
        const data = await res.json();
        setFlipbookImages(data.pages);
      } catch (err) {
        console.error('Failed to load album manifest:', err);
        setFlipbookImages(demoAlbumPages);
      } finally {
        setPdfLoading(false);
      }
    } else if (album.previewImages) {
      setFlipbookImages(album.previewImages);
    }
  };

  const albumSheets = [
    {
      id: 'album-kpr-signature',
      title: 'KPR Signature Telugu Wedding Heirloom Album',
      subtitle: 'Flush Mount HD Archival Layflat Album',
      image: '/albums/kpr_album/page_01.jpg',
      pdfUrl: '/albums/alubm.pdf',
      desc: 'Exclusive luxury Telugu wedding album designed and printed in KPR Color Lab on premium archival layflat paper.',
      previewImages: [
        '/albums/kpr_album/page_01.jpg',
        '/albums/kpr_album/page_02.jpg',
        '/albums/kpr_album/page_03.jpg',
        '/albums/kpr_album/page_04.jpg',
        '/albums/kpr_album/page_05.jpg',
        '/albums/kpr_album/page_06.jpg',
        '/albums/kpr_album/page_07.jpg',
        '/albums/kpr_album/page_08.jpg',
        '/albums/kpr_album/page_09.jpg',
        '/albums/kpr_album/page_10.jpg',
      ]
    },
    {
      id: 'album-royal-velvet',
      title: 'Royal Velvet Wedding Album',
      subtitle: 'Flush Mount 30-Sheet Layflat',
      image: '/images/packages/user_pkg_trad_photo.png',
      desc: 'Handcrafted Italian leather album with metallic foil embossing and thick layflat archival sheets.',
      previewImages: [
        '/images/services/wedding_album_printing.png',
        '/images/services/large_format_printing.png',
        '/images/services/laser_printing.png',
        '/images/services/acrylic_mdf_frames.png',
        '/images/services/photo_frames.png',
        '/images/services/flex_printing.png',
      ]
    },
    {
      id: 'album-editorial-fineart',
      title: 'Editorial Fine Art Book',
      subtitle: 'Silk Linen Hardcover',
      image: '/images/packages/user_pkg_candid_photo.png',
      desc: 'Museum-grade matte cotton paper with custom typography layout for unforgettable wedding stories.',
      previewImages: [
        '/images/services/large_format_printing.png',
        '/images/services/photo_frames.png',
        '/images/services/acrylic_mdf_frames.png',
        '/images/services/wedding_album_printing.png',
        '/images/services/laser_printing.png',
        '/images/services/flex_printing.png',
      ]
    },
    {
      id: 'album-cinematic-sunset',
      title: 'Cinematic Sunset Storybook',
      subtitle: 'Acrylic Glass Cover',
      image: '/images/packages/user_pkg_cinematic_video.png',
      desc: 'High-definition acrylic front plate with metallic sheen pages capturing golden hour romance.',
      previewImages: [
        '/images/services/flex_printing.png',
        '/images/services/acrylic_mdf_frames.png',
        '/images/services/wedding_album_printing.png',
        '/images/services/large_format_printing.png',
        '/images/services/photo_frames.png',
        '/images/services/laser_printing.png',
      ]
    }
  ];

  return (
    <div id="colorlab" className="w-full bg-[#F7F3EE] py-4 px-2 sm:px-6 lg:px-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto border border-[#E2D9CC] rounded-xl bg-white shadow-xl overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "COLOR LAB" Header Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] p-4 sm:p-8 flex items-center justify-center relative transition-colors duration-300 group cursor-pointer focus:outline-none border-b border-[#E2D9CC] min-h-[90px] sm:min-h-[140px] md:min-h-[170px]"
        >
          <img
            src={kprColorLabLogo}
            alt="KPR Colour Lab"
            className="h-20 sm:h-32 md:h-44 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none"
          />

          {/* Chevron Rotate Animation */}
          <div className="absolute right-3 sm:right-8">
            <div className={`p-1.5 sm:p-2.5 rounded-full border transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-[#F7F3EE] text-[#1A1A1A] border-[#E2D9CC] group-hover:bg-[#EAE4DC]'
            }`}>
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          
          {/* 2. Subsections Navigation Tabs: DESIGNS | PACKAGES | ALBUMS */}
          <div className="bg-[#F7F3EE] border-b border-[#E2D9CC] px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#666666] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              Color Lab Subsections:
            </p>

            <div className="inline-flex w-full sm:w-auto justify-center flex-wrap items-center gap-1.5 sm:gap-2 p-1 bg-white border border-[#E2D9CC] rounded-lg shadow-sm">
              
              {/* DESIGNS TAB */}
              <button
                onClick={() => setActiveSubTab('designs')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'designs'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Palette className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'designs' ? 'text-[#C5A880]' : ''}`} />
                <span>Designs</span>
              </button>

              {/* PACKAGES TAB */}
              <button
                onClick={() => setActiveSubTab('packages')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'packages'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'packages' ? 'text-[#C5A880]' : ''}`} />
                <span>Packages</span>
              </button>

              {/* ALBUMS TAB */}
              <button
                onClick={() => setActiveSubTab('albums')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
                  activeSubTab === 'albums'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'albums' ? 'text-[#C5A880]' : ''}`} />
                <span>Albums</span>
              </button>

            </div>

          </div>

          {/* 3. Subsections Content Area */}
          <div className="p-2 sm:p-6 lg:p-8 bg-[#F7F3EE]">
            
            {/* DESIGNS SUBSECTION */}
            {activeSubTab === 'designs' && (
              <div className="animate-fadeIn space-y-10">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                    PRINTING & FRAMING SERVICES
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] font-light">
                    KPR Production Design & Printing Studio
                  </h3>
                  <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-4" />
                  <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed">
                    Custom Telangana-style wedding album printing, high-definition large format displays, custom frames, and laser engraving tailored for grand Indian celebrations.
                  </p>
                </div>

                {/* 7 Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {PRINTING_DESIGN_SERVICES.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-2xl hover:border-[#C5A880]/60 transition-all duration-500 group"
                    >
                      {/* Image Header */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#121212]">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3">
                          <span className="bg-black/70 backdrop-blur-md text-[#E8D4B8] text-[9px] tracking-widest uppercase px-3 py-1 font-medium border border-white/10 rounded">
                            {service.category}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="font-serif text-xl text-[#1A1A1A] font-semibold group-hover:text-[#C5A880] transition-colors">
                            {service.title}
                          </h4>
                          <p className="text-[11px] font-medium text-[#C5A880] tracking-wider uppercase">
                            {service.tagline}
                          </p>
                          <p className="text-xs text-[#666666] font-light leading-relaxed pt-1">
                            {service.description}
                          </p>
                        </div>

                        {/* WhatsApp Action Button */}
                        <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-between">
                          <span className="text-[10px] text-[#888888] uppercase tracking-wider font-mono">
                            Studio Service
                          </span>
                          <a
                            href={`https://wa.me/919849390876?text=${encodeURIComponent(`Hello KPR Production! I am interested in your ${service.title} services. Please share details and pricing.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A880] text-white text-[10px] font-semibold tracking-widest uppercase transition-all duration-300 rounded shadow-sm hover:shadow"
                          >
                            Inquire Now
                          </a>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Additional Admin-Added Color Lab Showcase Photos */}
                {customColorLabPhotos.length > 0 && (
                  <div className="pt-10 border-t border-[#E2D9CC] space-y-6">
                    <div className="text-center max-w-2xl mx-auto">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-semibold block mb-1">
                        COLOR LAB GALLERY
                      </span>
                      <h4 className="font-serif text-2xl text-[#1A1A1A]">Featured Print & Framing Works</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
                      {customColorLabPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
                        >
                          <div className="relative aspect-square overflow-hidden bg-black">
                            <img
                              src={photo.file_url}
                              alt={photo.title || 'Color Lab Print'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="bg-black/70 text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono">
                                {photo.category}
                              </span>
                            </div>
                          </div>
                          {photo.title && (
                            <div className="p-3">
                              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{photo.title}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* PACKAGES SUBSECTION */}
            {activeSubTab === 'packages' && (
              <div className="animate-fadeIn">
                <PackagesSection
                  packageType="colorlab"
                  whatsappNumber="919849390876"
                  displayPhone="+91 98493 90876"
                  categoryTitle="COLOUR LAB & PRINTING PACKAGES"
                  categorySubtitle="Transparent pricing for our fine art wedding album printing, framing, card printing, flex, and custom design services. Click Book Now to order via WhatsApp."
                />
              </div>
            )}

            {/* ALBUMS SUBSECTION */}
            {activeSubTab === 'albums' && (
              <div className="animate-fadeIn space-y-12">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                    PHYSICAL HEIRLOOMS
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">Luxury Flush-Mount Wedding Albums</h3>
                  <p className="text-xs text-[#666666] font-light mt-2 leading-relaxed">
                    Designed sheet-by-sheet in our color lab, printed on museum archival paper that will be cherished for generations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {albumSheets.map((album, i) => (
                    <div key={i} className="bg-white border border-[#E2D9CC] rounded-lg overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[4/3] overflow-hidden bg-black relative">
                        <img
                          src={album.image}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 text-[10px] tracking-widest text-[#C5A880] uppercase rounded font-semibold border border-[#C5A880]/30">
                          {album.subtitle}
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 space-y-3">
                        <h4 className="font-serif text-xl text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors">
                          {album.title}
                        </h4>
                        <p className="text-xs text-[#666666] font-light leading-relaxed">
                          {album.desc}
                        </p>
                        
                        <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleViewAlbum(album)}
                            disabled={pdfLoading}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F7F3EE] hover:bg-[#C5A880]/20 text-[#1A1A1A] text-[10px] tracking-widest uppercase font-semibold transition-colors rounded border border-[#E2D9CC] cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          >
                            {pdfLoading && album.pdfSrc ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            {pdfLoading && album.pdfSrc ? 'Loading…' : 'View Album'}
                          </button>
                          <a
                            href="https://wa.me/919849390876?text=Hi%20KPR%20Productions,%20I'm%20interested%20in%20your%20luxury%20wedding%20albums!"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#C5A880] text-white text-[10px] tracking-widest uppercase font-semibold transition-colors rounded"
                          >
                            Order Album
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Album Flipbook Viewer Modal */}
            {flipbookImages && (
              <AlbumFlipbookViewer
                images={flipbookImages}
                onClose={() => setFlipbookImages(null)}
              />
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
