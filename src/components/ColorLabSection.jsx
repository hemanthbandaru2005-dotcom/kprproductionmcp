import React, { useState, useEffect, useRef } from 'react';
import RetouchSlider from './RetouchSlider';
import PackagesSection from './PackagesSection';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import AlbumPreviewPage from './AlbumPreviewPage';
import {
  Palette, Package, BookOpen, ChevronDown, Check, Sparkles,
  Eye, Loader2, Image as ImageIcon, Mail, Phone, Upload, X,
  FolderUp, ImagePlus, CloudUpload, ArrowRight, Layers, Trash2
} from 'lucide-react';
import { PRINTING_DESIGN_SERVICES } from '../data/servicesData';
import { loadPdfPages } from '../utils/pdfLoader';
import { fetchCustomSitePhotos } from '../utils/sitePhotosService';
import { ALBUM_SIZES } from '../utils/albumsService';
import kprColorLabLogo from '../assets/kpr_colorlab_logo.png';
import colorLabHeaderLeft from '../assets/colorlab_header_left.jpg';

const ALBUM_SIZE_OPTIONS = [
  { id: '12x36', label: '12x36', desc: 'Panoramic Spread (36" × 12")', popular: true },
  { id: '13x39', label: '13x39', desc: 'Grand Master Heirloom (39" × 13")', popular: false },
  { id: '14x40', label: '14x40', desc: 'Ultra Regal Panoramic (40" × 14")', popular: false },
  { id: '16x24', label: '16x24', desc: 'Royal Portrait Master (24" × 16")', popular: false },
  { id: '18x24', label: '18x24', desc: 'Imperial Fine Art (24" × 18")', popular: false },
  { id: '12x24', label: '12x24', desc: 'Classic Traditional (24" × 12")', popular: false },
];

export default function ColorLabSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('designs'); // 'designs' | 'packages' | 'albums'
  const [flipbookImages, setFlipbookImages] = useState(null); // when set, opens the album flipbook viewer
  const [flipbookSize, setFlipbookSize] = useState('12x36');
  const [flipbookTitle, setFlipbookTitle] = useState('Custom Wedding Album');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [customColorLabPhotos, setCustomColorLabPhotos] = useState([]);
  
  // Custom Upload & Size Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAlbumSize, setSelectedAlbumSize] = useState('12x36');
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const folderInputRef = useRef(null);
  const modalFileInputRef = useRef(null);

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

  /* Handler to open an album — supports image arrays and manifest/PDF files */
  const handleViewAlbum = async (album) => {
    setFlipbookSize(album.size || '12x36');
    setFlipbookTitle(album.title || 'Luxury Wedding Album');
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
    } else {
      setFlipbookImages(demoAlbumPages);
    }
  };

  /* Open custom album upload modal */
  const handleOpenUploadModal = () => {
    setUploadModalOpen(true);
  };

  /* Process selected files (images or PDF) */
  const processUploadedFiles = async (files) => {
    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/') ||
      f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i) ||
      f.type === 'application/pdf' ||
      f.name.endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      alert('Please select valid photos (JPG, PNG, WEBP) or an Album PDF.');
      return;
    }

    const newUrls = [];
    const pdfFile = validFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFile) {
      setPdfLoading(true);
      try {
        const blobUrl = URL.createObjectURL(pdfFile);
        const pages = await loadPdfPages(blobUrl, 2);
        if (pages && pages.length > 0) newUrls.push(...pages);
      } catch (err) {
        console.warn('PDF preview extraction note:', err);
      } finally {
        setPdfLoading(false);
      }
    }

    const imageFiles = validFiles.filter(f => !f.type.includes('pdf') && !f.name.endsWith('.pdf'));
    imageFiles.forEach(f => {
      newUrls.push(URL.createObjectURL(f));
    });

    if (newUrls.length > 0) {
      setUploadedPhotoUrls(prev => [...prev, ...newUrls]);
    }
  };

  /* Handle file input change from modal */
  const handleModalFilesSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  /* Remove an uploaded photo */
  const handleRemoveUploadedPhoto = (index, e) => {
    e.stopPropagation();
    setUploadedPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  /* Launch flipbook from modal */
  const handleLaunchCustomFlipbook = () => {
    const pagesToView = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : demoAlbumPages;
    setFlipbookSize(selectedAlbumSize);
    setFlipbookTitle(`Custom ${selectedAlbumSize} Album`);
    setFlipbookImages(pagesToView);
    setUploadModalOpen(false);
  };

  const albumSheets = [];

  return (
    <div id="colorlab" className="w-full bg-[#F7F3EE] transition-all duration-300">
      <div className="w-full bg-white border-b border-[#E2D9CC] overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "COLOR LAB" Header Bar with Corner Spread Showcase Photos */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] px-2 py-2 sm:px-6 sm:py-4 md:px-8 md:py-5 flex items-center justify-between relative transition-all duration-300 group cursor-pointer focus:outline-none border-b border-[#E2D9CC] min-h-[105px] sm:min-h-[150px] md:min-h-[185px] overflow-hidden"
          aria-label="Toggle KPR Colour Lab section"
        >
          {/* Left Corner Spread Photo (100% Clear & Crisp) */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={colorLabHeaderLeft}
              alt="KPR Color Lab - Luxury Heirloom Wedding Albums Stack"
              className="w-full h-full object-cover object-left transition-transform duration-700 group-hover:scale-105 select-none"
            />
          </div>

          {/* Center Logo Area (Undisturbed & Prominent) */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 md:px-12 pointer-events-none">
            <img
              src={kprColorLabLogo}
              alt="KPR Colour Lab"
              className="h-14 sm:h-24 md:h-32 lg:h-40 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none drop-shadow-sm"
            />
          </div>

          {/* Right Corner Spread Photo (Wedding Album Printing) */}
          <div className="absolute right-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src="/images/services/wedding_album_printing.png"
              alt="KPR Color Lab - Wedding Album Printing"
              className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 select-none"
            />
          </div>

          {/* Chevron Rotate Animation */}
          <div className="relative z-20 mr-1.5 sm:mr-3 md:mr-6 lg:mr-10">
            <div className={`p-1.5 sm:p-2.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-500 ${
              isExpanded ? 'rotate-180 bg-[#C5A880] text-white border-[#C5A880]' : 'rotate-0 bg-white/90 text-[#1A1A1A] border-[#E2D9CC] group-hover:bg-[#EAE4DC]'
            }`}>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </button>

        {/* Collapsible Wrapper Body */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          
          {/* 2. Subsections Navigation Tabs: PRINTING & CUTTING | PACKAGES | ALBUMS */}
          <div className="w-full bg-[#F7F3EE] border-b border-[#E2D9CC] px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-center">
            <div className="inline-flex justify-center items-center gap-1 sm:gap-2 p-1 bg-white border border-[#E2D9CC] rounded-full shadow-sm max-w-full overflow-x-auto">
              
              {/* PRINTING & CUTTING TAB */}
              <button
                onClick={() => setActiveSubTab('designs')}
                className={`inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeSubTab === 'designs'
                    ? 'bg-[#1A1A1A] text-white shadow-md'
                    : 'text-[#555555] hover:text-[#1A1A1A] hover:bg-[#F7F3EE]'
                }`}
              >
                <Palette className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeSubTab === 'designs' ? 'text-[#C5A880]' : ''}`} />
                <span>Printing & Cutting</span>
              </button>

              {/* PACKAGES TAB */}
              <button
                onClick={() => setActiveSubTab('packages')}
                className={`inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap ${
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
                className={`inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap ${
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
          <div className="w-full p-3 sm:p-8 lg:p-12 bg-[#F7F3EE]">
            <div className="w-full max-w-[1920px] mx-auto">
            
            {/* PRINTING & CUTTING SUBSECTION */}
            {activeSubTab === 'designs' && (
              <div className="animate-fadeIn space-y-10">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block">
                    PRINTING & CUTTING LAB
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] font-light">
                    Printing & Cutting
                  </h3>
                  <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-3" />
                  <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed">
                    Custom Telugu wedding album printing, industrial ColourJet flex printing, Canon 60" 7-colour photo printing, and precision CNC laser cutting tailored for grand Indian celebrations.
                  </p>
                </div>

                {/* 6 Services Grid */}
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
                        <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-end">
                          <a
                            href={`https://wa.me/919849443648?text=${encodeURIComponent(`Hello KPR Colour Lab! I am interested in your ${service.title} services. Please share details and pricing.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto text-center px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[10px] font-semibold tracking-widest uppercase transition-all duration-300 rounded shadow-sm hover:shadow"
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
                              src={photo.file_url || photo.url}
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
                  whatsappNumber="919849443648"
                  displayPhone="+91 98494 43648"
                  showEyebrow={false}
                  showQuoteWidget={false}
                  categoryTitle="PRINTING PACKAGES"
                  categorySubtitle="Fine art wedding album printing, framing, card printing, flex, and custom design services. Click Inquire & Book Now to order via WhatsApp."
                />
              </div>
            )}

            {/* ALBUMS SUBSECTION */}
            {activeSubTab === 'albums' && (
              <div className="animate-fadeIn space-y-12">
                {/* Top Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                    PHYSICAL HEIRLOOMS
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">Luxury Flush-Mount Wedding Albums</h3>
                  <p className="text-xs text-[#666666] font-light mt-2 leading-relaxed">
                    Designed sheet-by-sheet in our color lab, printed on museum archival paper that will be cherished for generations.
                  </p>
                </div>

                {/* Hidden File Input for Folder Card Trigger */}
                <input
                  ref={folderInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  multiple
                  onChange={handleFolderFilesSelected}
                  className="hidden"
                />

                {/* Album Cards Grid: Demo Card + Upload Your Images Folder Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  
                  {/* 1. Demo Album Card */}
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
                            {pdfLoading && album.pdfSrc ? 'Loading…' : 'View Demo'}
                          </button>
                          <a
                            href="https://wa.me/919849443648?text=Hi%20KPR%20Colour%20Lab,%20I'm%20interested%20in%20your%20luxury%20wedding%20albums!"
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

                  {/* 2. Upload Your Images & Select Size Card */}
                  <div
                    onClick={handleOpenUploadModal}
                    className="bg-white border-2 border-dashed border-[#C5A880]/70 hover:border-[#C5A880] rounded-lg overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#FAF8F5] to-white relative"
                  >
                    {/* Folder Banner Area */}
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#1E1914] to-[#12100E] relative flex flex-col items-center justify-center p-6 text-center group-hover:from-[#2A231C] group-hover:to-[#1A1612] transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] group-hover:scale-110 transition-transform mb-2 shadow-inner">
                        <FolderUp className="w-8 h-8 text-[#E8D4B8]" />
                      </div>

                      <div className="absolute top-3 left-3 bg-[#C5A880] text-black px-2.5 py-0.5 text-[9.5px] tracking-widest uppercase rounded font-bold shadow-sm">
                        Size Selector & 3D Flipbook
                      </div>

                      <h5 className="font-serif text-lg text-white font-medium">Upload Photos & Choose Size</h5>
                      <p className="text-[11px] text-[#C5A880] mt-0.5 font-light">12x36 · 13x39 · 14x40 · 16x24 · 18x24 · 12x24</p>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-xl text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors">
                          Upload Your Photos
                        </h4>
                        <p className="text-xs text-[#666666] font-light leading-relaxed mt-1">
                          Select your physical album size and upload personal wedding photos or PDF spreads to generate a realistic 3D book preview with zero photo cropping.
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUploadModal();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C5A880] hover:bg-[#b89560] text-black text-[10px] tracking-widest uppercase font-bold transition-all rounded shadow-sm cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Select Size & Upload Photos</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Custom Album Size & Photo Upload Modal */}
            {uploadModalOpen && (
              <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white border border-[#E2D9CC] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-8 space-y-6 relative">
                  
                  {/* Close Button */}
                  <button
                    onClick={() => setUploadModalOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-[#F7F3EE] hover:bg-[#EAE4DC] text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Header */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/15 text-[#9E784F] text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Custom Album Flipbook Preview</span>
                    </div>
                    <h3 className="font-serif text-2xl text-[#1A1A1A] font-bold">
                      Upload Photos & Select Album Size
                    </h3>
                    <p className="text-xs text-[#666666]">
                      Choose your print size and upload photos or PDF spreads. Our 3D flipbook renderer will format them with realistic book spine physics and no image cropping.
                    </p>
                  </div>

                  {/* Step 1: Select Physical Size */}
                  <div className="space-y-3 pt-2 border-t border-[#E8E1D5]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Step 1: Choose Physical Album Size</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-[#C5A880] bg-[#1A1A1A] px-2 py-0.5 rounded">
                        Selected: {selectedAlbumSize}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {ALBUM_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedAlbumSize(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                            selectedAlbumSize === opt.id
                              ? 'border-[#C5A880] bg-[#FAF8F5] ring-2 ring-[#C5A880]/40 shadow-sm'
                              : 'border-[#E2D9CC] hover:border-[#C5A880]/60 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-[#1A1A1A]">
                              {opt.label}
                            </span>
                            {selectedAlbumSize === opt.id && (
                              <Check className="w-4 h-4 text-[#C5A880]" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#777777] mt-1 leading-tight">
                            {opt.desc}
                          </span>
                          {opt.popular && (
                            <span className="mt-1.5 self-start bg-[#C5A880] text-black text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase">
                              Most Popular
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Upload Files */}
                  <div className="space-y-3 pt-2 border-t border-[#E8E1D5]">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Step 2: Add Photos or Album PDF</span>
                    </label>

                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                      multiple
                      onChange={handleModalFilesSelected}
                      className="hidden"
                    />

                    {/* Dropzone / Upload Box */}
                    <div
                      onClick={() => modalFileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#C5A880]/60 hover:border-[#C5A880] bg-[#FAF8F5] hover:bg-[#F3EFE9] rounded-xl p-6 text-center transition-colors cursor-pointer space-y-2"
                    >
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                        <CloudUpload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">
                        Click or drag & drop photos here
                      </p>
                      <p className="text-[10px] text-[#777777]">
                        Supports JPG, PNG, WEBP, HEIC or Album PDF Spreads
                      </p>
                    </div>

                    {/* Uploaded Photos Thumbnails Preview */}
                    {uploadedPhotoUrls.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs text-[#555555]">
                          <span className="font-semibold text-[#1A1A1A]">
                            {uploadedPhotoUrls.length} Photo{uploadedPhotoUrls.length !== 1 ? 's' : ''} Ready
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadedPhotoUrls([])}
                            className="text-[10px] text-red-600 hover:underline font-semibold"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-[#F7F3EE] rounded-lg border border-[#E2D9CC]">
                          {uploadedPhotoUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-black group border border-[#E2D9CC]">
                              <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => handleRemoveUploadedPhoto(idx, e)}
                                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-[#E8E1D5] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleLaunchCustomFlipbook}
                      className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {uploadedPhotoUrls.length > 0
                          ? `Open 3D Flipbook (${uploadedPhotoUrls.length} pages in ${selectedAlbumSize})`
                          : `Preview 3D Book in ${selectedAlbumSize}`}
                      </span>
                    </button>

                    <a
                      href={`https://wa.me/919849443648?text=${encodeURIComponent(
                        `Hello KPR Colour Lab! I would like to order a custom wedding album in size ${selectedAlbumSize}${
                          uploadedPhotoUrls.length > 0 ? ` with ${uploadedPhotoUrls.length} photos` : ''
                        }. Please share pricing and printing timeline.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Order on WhatsApp</span>
                    </a>
                  </div>

                </div>
              </div>
            )}

            {/* Album Flipbook Viewer Modal */}
            {flipbookImages && (
              <AlbumFlipbookViewer
                images={flipbookImages}
                size={flipbookSize}
                title={flipbookTitle}
                onClose={() => setFlipbookImages(null)}
              />
            )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
