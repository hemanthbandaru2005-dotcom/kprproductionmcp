import React, { useState, useEffect, useRef } from 'react';
import RetouchSlider from './RetouchSlider';
import PackagesSection from './PackagesSection';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import AlbumPreviewPage from './AlbumPreviewPage';
import {
  Palette, Package, BookOpen, ChevronDown, Check, Sparkles,
  Eye, Loader2, Image as ImageIcon, Mail, Phone, Upload, X,
  FolderUp, ImagePlus, CloudUpload
} from 'lucide-react';
import { PRINTING_DESIGN_SERVICES } from '../data/servicesData';
import { loadPdfPages } from '../utils/pdfLoader';
import { fetchCustomSitePhotos } from '../utils/sitePhotosService';
import kprColorLabLogo from '../assets/kpr_colorlab_logo.png';
import colorLabHeaderLeft from '../assets/colorlab_header_left.jpg';
import colorLabHeaderRight from '../assets/colorlab_header_right.jpg';

export default function ColorLabSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('designs'); // 'designs' | 'packages' | 'albums'
  const [flipbookImages, setFlipbookImages] = useState(null); // when set, opens the album flipbook viewer
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showAlbumPreview, setShowAlbumPreview] = useState(false);
  const [customColorLabPhotos, setCustomColorLabPhotos] = useState([]);
  const folderInputRef = useRef(null);

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

  /* Direct file picker trigger for custom album folder */
  const handleDirectFolderClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  /* Handle selected files from folder upload */
  const handleFolderFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f =>
      f.type.startsWith('image/') ||
      f.name.match(/\.(jpg|jpeg|png|webp|heic)$/i) ||
      f.type === 'application/pdf' ||
      f.name.endsWith('.pdf')
    );

    if (validFiles.length === 0) {
      alert('Please select valid photos (JPG, PNG, WEBP) or an Album PDF.');
      return;
    }

    const urls = [];
    const pdfFile = validFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFile) {
      setPdfLoading(true);
      try {
        const blobUrl = URL.createObjectURL(pdfFile);
        const pages = await loadPdfPages(blobUrl, 2);
        if (pages && pages.length > 0) urls.push(...pages);
      } catch (err) {
        console.warn('PDF preview extraction note:', err);
      } finally {
        setPdfLoading(false);
      }
    }

    const imageFiles = validFiles.filter(f => !f.type.includes('pdf') && !f.name.endsWith('.pdf'));
    imageFiles.forEach(f => {
      urls.push(URL.createObjectURL(f));
    });

    if (urls.length > 0) {
      setFlipbookImages(urls);
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
    }
  ];

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

          {/* Right Corner Spread Photo (100% Clear & Crisp) */}
          <div className="absolute right-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={colorLabHeaderRight}
              alt="KPR Color Lab - Signature Telugu Wedding Album Spread"
              className="w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105 select-none"
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
                  categorySubtitle="Transparent pricing for our fine art wedding album printing, framing, card printing, flex, and custom design services. Click Book Now to order via WhatsApp."
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

                  {/* 2. Upload Your Images Folder Card (Beside the Demo) */}
                  <div
                    onClick={handleDirectFolderClick}
                    className="bg-white border-2 border-dashed border-[#C5A880]/70 hover:border-[#C5A880] rounded-lg overflow-hidden shadow-sm group hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer bg-gradient-to-b from-[#FAF8F5] to-white relative"
                  >
                    {/* Folder Banner Area */}
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#1E1914] to-[#12100E] relative flex flex-col items-center justify-center p-6 text-center group-hover:from-[#2A231C] group-hover:to-[#1A1612] transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] group-hover:scale-110 transition-transform mb-2 shadow-inner">
                        <FolderUp className="w-8 h-8 text-[#E8D4B8]" />
                      </div>

                      <div className="absolute top-3 left-3 bg-[#C5A880] text-black px-2.5 py-0.5 text-[9.5px] tracking-widest uppercase rounded font-bold shadow-sm">
                        Custom Album
                      </div>

                      <h5 className="font-serif text-lg text-white font-medium">Upload Photos Folder</h5>
                      <p className="text-[11px] text-[#C5A880] mt-0.5 font-light">Click to select photos or album PDF</p>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-xl text-[#1A1A1A] group-hover:text-[#C5A880] transition-colors">
                          Upload Your Images
                        </h4>
                        <p className="text-xs text-[#666666] font-light leading-relaxed mt-1">
                          Directly upload your personal wedding photos or design files to generate an instant 3D page-turning preview.
                        </p>
                      </div>

                      {/* Direct Upload Action Button */}
                      <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectFolderClick();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C5A880] hover:bg-[#b89560] text-black text-[10px] tracking-widest uppercase font-bold transition-all rounded shadow-sm cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photos Directly</span>
                        </button>
                      </div>
                    </div>
                  </div>

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
    </div>
  );
}
