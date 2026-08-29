import React, { useState, useEffect, useRef } from 'react';
import RetouchSlider from './RetouchSlider';
import PackagesSection from './PackagesSection';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import AlbumPreviewPage from './AlbumPreviewPage';
import {
  Palette, Package, BookOpen, ChevronDown, Check, Sparkles,
  Eye, Loader2, Image as ImageIcon, Mail, Phone, Upload, X,
  ImagePlus, FileText, UploadCloud, ArrowRight
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

  // Direct Outside Upload states
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  /* Direct Photo File Selection */
  const handleDirectPhotosSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processDirectFiles(Array.from(files));
    e.target.value = '';
  };

  /* Direct PDF File Selection */
  const handleDirectPdfSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processDirectPdf(file);
  };

  const processDirectPdf = async (file) => {
    setDirectLoading(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      const pages = await loadPdfPages(blobUrl, 2);
      if (pages && pages.length > 0) {
        setFlipbookImages(pages);
      } else {
        alert('Could not extract pages from the PDF.');
      }
    } catch (err) {
      console.error('Error rendering PDF:', err);
      alert('Could not render PDF pages. Please check the PDF or upload JPG/PNG images.');
    } finally {
      setDirectLoading(false);
    }
  };

  const processDirectFiles = (files) => {
    const imageFiles = files.filter(f =>
      f.type === 'image/jpeg' ||
      f.type === 'image/png' ||
      f.type === 'image/webp' ||
      f.name.match(/\.(jpg|jpeg|png|webp)$/i)
    );
    const pdfFile = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));

    if (pdfFile) {
      processDirectPdf(pdfFile);
      return;
    }

    if (imageFiles.length === 0) {
      alert('Please upload image files (JPG, PNG, WEBP) or an album PDF.');
      return;
    }

    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setFlipbookImages(urls);
  };

  const handleDirectDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDirectFiles(Array.from(e.dataTransfer.files));
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
    <div id="colorlab" className="w-full bg-[#F7F3EE] py-4 px-2 sm:px-6 lg:px-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto border border-[#E2D9CC] rounded-xl bg-white shadow-xl overflow-hidden transition-all duration-500">
        
        {/* 1. Main Collapsible "COLOR LAB" Header Bar with Corner Spread Showcase Photos */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-white hover:bg-[#FAF8F5] text-[#1A1A1A] px-2 py-2 sm:px-6 sm:py-4 md:px-8 md:py-5 flex items-center justify-between relative transition-all duration-300 group cursor-pointer focus:outline-none border-b border-[#E2D9CC] min-h-[105px] sm:min-h-[150px] md:min-h-[185px] overflow-hidden"
          aria-label="Toggle KPR Colour Lab section"
        >
          {/* Left Corner Spread Photo (Edge-to-Edge flush to corner, no box) */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={colorLabHeaderLeft}
              alt="KPR Color Lab - Luxury Heirloom Wedding Albums Stack"
              className="w-full h-full object-cover object-left transition-transform duration-700 group-hover:scale-105 select-none"
            />
            {/* Soft fade into white center */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white pointer-events-none" />
          </div>

          {/* Center Logo Area (Undisturbed & Prominent) */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 md:px-12 pointer-events-none">
            <img
              src={kprColorLabLogo}
              alt="KPR Colour Lab"
              className="h-14 sm:h-24 md:h-32 lg:h-40 w-auto max-w-[85%] sm:max-w-[75%] object-contain transition-transform duration-300 group-hover:scale-105 select-none drop-shadow-sm"
            />
          </div>

          {/* Right Corner Spread Photo (Edge-to-Edge flush to corner, no box) */}
          <div className="absolute right-0 top-0 bottom-0 h-full w-28 sm:w-44 md:w-60 lg:w-72 overflow-hidden pointer-events-none z-0">
            <img
              src={colorLabHeaderRight}
              alt="KPR Color Lab - Signature Telugu Wedding Album Spread"
              className="w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105 select-none"
            />
            {/* Soft fade into white center */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white pointer-events-none" />
          </div>

          {/* Chevron Rotate Animation */}
          <div className="relative z-20 mr-1.5 sm:mr-3 md:mr-5">
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
          <div className="bg-[#F7F3EE] border-b border-[#E2D9CC] px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#666666] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              Color Lab Subsections:
            </p>

            <div className="inline-flex w-full sm:w-auto justify-center flex-wrap items-center gap-1.5 sm:gap-2 p-1 bg-white border border-[#E2D9CC] rounded-lg shadow-sm">
              
              {/* PRINTING & CUTTING TAB */}
              <button
                onClick={() => setActiveSubTab('designs')}
                className={`flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase rounded-md transition-all duration-300 cursor-pointer ${
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
                <span>Upload Your Albums</span>
              </button>

            </div>

          </div>

          {/* 3. Subsections Content Area */}
          <div className="p-2 sm:p-6 lg:p-8 bg-[#F7F3EE]">
            
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

                {/* 1. Before / After Interactive Retouching Studio */}
                <div className="my-8">
                  <div className="text-center mb-6">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-semibold">
                      INTERACTIVE STUDIO
                    </span>
                    <h4 className="font-serif text-2xl text-[#1A1A1A] font-light mt-1">
                      Live Retouching & Color Grading Demo
                    </h4>
                    <p className="text-xs text-[#666666] font-light mt-1">
                      Drag the slider to see raw capture vs KPR color-graded output
                    </p>
                  </div>
                  <RetouchSlider />
                </div>

                {/* 2. Custom ColorLab Photos Showcase (from Admin Studio Photos) */}
                {customColorLabPhotos.length > 0 && (
                  <div className="my-12">
                    <div className="text-center mb-6">
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-semibold">
                        STUDIO SHOWCASE
                      </span>
                      <h4 className="font-serif text-2xl text-[#1A1A1A] font-light mt-1">
                        Featured Printing & Album Gallery
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {customColorLabPhotos.map((photo) => (
                        <div key={photo.id} className="relative group overflow-hidden rounded-xl border border-[#E2D9CC] bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                          <div className="aspect-[4/3] overflow-hidden bg-black/5">
                            <img
                              src={photo.url}
                              alt={photo.title || 'ColorLab Showcase'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                          {(photo.title || photo.caption) && (
                            <div className="p-3 bg-white">
                              {photo.title && <h5 className="font-serif text-sm text-[#1A1A1A] font-medium">{photo.title}</h5>}
                              {photo.caption && <p className="text-[11px] text-[#666666] font-light mt-0.5">{photo.caption}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Detailed Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
                  {PRINTING_DESIGN_SERVICES.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-[#E2D9CC] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-black">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <span className="text-[10px] tracking-widest text-[#C5A880] uppercase font-semibold">
                            {service.category}
                          </span>
                          <h4 className="font-serif text-xl font-medium leading-tight mt-0.5">
                            {service.title}
                          </h4>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs text-[#666666] font-light leading-relaxed">
                          {service.description}
                        </p>

                        {service.features && service.features.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-[#E8E1D5]">
                            <span className="text-[10px] uppercase tracking-wider text-[#999999] font-semibold block">
                              Service Highlights:
                            </span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {service.features.map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[#444444]">
                                  <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                                  <span className="truncate">{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-4 border-t border-[#E8E1D5] flex items-center justify-between gap-3">
                          <a
                            href={`https://wa.me/919849443648?text=${encodeURIComponent(`Hi KPR Colour Lab, I am interested in your ${service.title} service. Please share details and pricing.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-semibold tracking-wider uppercase rounded-lg transition-all duration-300 shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Inquire on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Equipment & Craftsmanship Guarantee Banner */}
                <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2E2820] text-white rounded-2xl p-6 sm:p-8 border border-[#C5A880]/30 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-[10px] tracking-[0.25em] text-[#C5A880] uppercase font-semibold">
                      STATE-OF-THE-ART LAB EQUIPMENT
                    </span>
                    <h4 className="font-serif text-2xl text-white font-medium">
                      ColourJet Flex & Canon 60" 7-Colour Precision Photo Printer
                    </h4>
                    <p className="text-xs text-white/70 max-w-2xl font-light">
                      Industry-leading Japanese & European printing hardware ensuring 100+ year archival anti-fade quality on every wedding album sheet, fine-art canvas, and commercial flex print.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/919849443648?text=Hi%20KPR%20Colour%20Lab,%20I'd%20like%20to%20place%20a%20printing%20order"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#C5A880] hover:bg-[#b89560] text-black font-semibold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shrink-0 shadow-md"
                  >
                    Place Print Order
                  </a>
                </div>

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
                  categoryTitle="PRINTING PACKAGES"
                  categorySubtitle="Transparent pricing for our fine art wedding album printing, framing, card printing, flex, and custom design services. Click Book Now to order via WhatsApp."
                />
              </div>
            )}

            {/* ALBUMS SUBSECTION (WITH DIRECT OUTSIDE UPLOADER) */}
            {activeSubTab === 'albums' && (
              <div className="animate-fadeIn space-y-10">
                <div className="text-center max-w-2xl mx-auto mb-6">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                    PHYSICAL HEIRLOOMS & 3D FLIPBOOK
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">Luxury Flush-Mount Wedding Albums</h3>
                  <p className="text-xs text-[#666666] font-light mt-2 leading-relaxed">
                    Designed sheet-by-sheet in our color lab, printed on museum archival paper that will be cherished for generations.
                  </p>
                </div>

                {/* ═══ Direct Outside Upload Your Albums Dropzone ═══ */}
                <div className="bg-gradient-to-br from-[#1C1C1C] via-[#141414] to-[#0E0E0E] border border-[#C5A880]/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white backdrop-blur-xl">
                  {/* Subtle golden ambient glow */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleDirectPhotosSelect}
                    className="hidden"
                  />
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleDirectPdfSelect}
                    className="hidden"
                  />

                  {/* Dropzone Card */}
                  <div
                    onDrop={handleDirectDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 ${
                      isDragOver
                        ? 'border-[#C5A880] bg-[#C5A880]/15 scale-[1.01]'
                        : 'border-[#C5A880]/40 hover:border-[#C5A880] bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    {directLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-10 h-10 text-[#C5A880] animate-spin" />
                        <p className="text-sm text-white font-medium">Processing your album pages...</p>
                        <p className="text-xs text-white/50">Rendering high-resolution 3D flipbook</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#E8D4B8] shadow-inner group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-7 h-7 text-[#C5A880]" />
                        </div>

                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A880]/20 text-[#E8D4B8] text-[9px] uppercase tracking-widest font-semibold mb-2">
                            <Sparkles className="w-3 h-3 text-[#C5A880]" /> Direct Instant Upload
                          </div>
                          <h4 className="font-serif text-xl sm:text-2xl text-white font-medium">
                            Upload Your Albums
                          </h4>
                          <p className="text-xs text-white/60 font-light mt-1.5 max-w-lg mx-auto leading-relaxed">
                            Drag & drop your wedding photos or album PDF here to instantly experience interactive 3D page-turning preview.
                          </p>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-5 py-2.5 bg-[#C5A880] hover:bg-[#b89560] text-black font-semibold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                            <ImagePlus className="w-4 h-4" />
                            <span>Upload Photos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => pdfInputRef.current?.click()}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 border border-white/15 flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-[#C5A880]" />
                            <span>Upload Album PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFlipbookImages(demoAlbumPages)}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium text-xs tracking-wider uppercase rounded-xl transition-all duration-300 border border-white/10 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Try Demo Album</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowAlbumPreview(prev => !prev)}
                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs tracking-wider uppercase rounded-xl transition-all duration-300 border border-white/5 flex items-center gap-1.5 cursor-pointer"
                          >
                            {showAlbumPreview ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5 text-[#C5A880]" />}
                            <span>{showAlbumPreview ? 'Close Customizer' : 'Advanced Studio'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Advanced Album Preview Tool */}
                {showAlbumPreview && (
                  <div className="border border-[#E2D9CC] rounded-2xl overflow-hidden bg-[#F7F3EE] shadow-inner animate-fadeIn">
                    <AlbumPreviewPage />
                  </div>
                )}

                {/* KPR Signature Heirloom Albums Showcase Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
