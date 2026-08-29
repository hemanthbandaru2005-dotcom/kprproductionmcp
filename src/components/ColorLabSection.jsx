import React, { useState, useEffect, useRef } from 'react';
import RetouchSlider from './RetouchSlider';
import PackagesSection from './PackagesSection';
import AlbumFlipbookViewer from './AlbumFlipbookViewer';
import {
  Palette, Package, BookOpen, ChevronDown, Check, Sparkles,
  Eye, Loader2, Image as ImageIcon, Mail, Phone, Upload, X,
  ImagePlus, FileText, CloudUpload, ArrowRight, CheckCircle2,
  AlertCircle, ExternalLink, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import { PRINTING_DESIGN_SERVICES } from '../data/servicesData';
import { loadPdfPages } from '../utils/pdfLoader';
import { fetchCustomSitePhotos } from '../utils/sitePhotosService';
import { uploadClientFile, formatFileSize } from '../utils/clientUploadsService';
import kprColorLabLogo from '../assets/kpr_colorlab_logo.png';
import colorLabHeaderLeft from '../assets/colorlab_header_left.jpg';
import colorLabHeaderRight from '../assets/colorlab_header_right.jpg';

// Official Album Formats
const ALBUM_FORMATS = [
  {
    id: 'format-12x18-one-page',
    size: '12 × 18',
    title: '12 × 18 — One Page (Horizontal)',
    subtitle: 'Single Sheet Layflat Format',
    dimensions: '12" × 18" (30.5 × 45.7 cm)',
    tag: 'One Page Horizontal',
    image: '/albums/kpr_album/page_01.jpg',
    desc: 'High-definition 12 × 18 horizontal sheet printing on museum archival layflat paper. Perfect for single page ceremonial moments, portrait spreads, and heirloom portfolios.',
    features: [
      '12 × 18 inch horizontal sheet',
      'Ultra-HD archival color printing',
      'Layflat single page binding',
      'Anti-glare scratch resistant coating'
    ],
    samplePreviewImages: [
      '/albums/kpr_album/page_01.jpg',
      '/albums/kpr_album/page_02.jpg',
      '/albums/kpr_album/page_04.jpg',
      '/albums/kpr_album/page_05.jpg'
    ]
  },
  {
    id: 'format-24x18-open-album',
    size: '24 × 18',
    title: '24 × 18 — Open Album (Horizontal)',
    subtitle: 'Full Panoramic Spread Format',
    dimensions: '24" × 18" (61.0 × 45.7 cm Open)',
    tag: 'Open Album Spread',
    image: '/albums/kpr_album/page_03.jpg',
    desc: 'Grand 24 × 18 seamless panoramic open spread layout. Full edge-to-edge flush mount binding with zero image cut in the center fold for royal wedding stories.',
    features: [
      '24 × 18 inch grand open spread',
      'Zero-gutter seamless panoramic fold',
      'Custom handcrafted leatherette / acrylic cover',
      '100+ year anti-fade archival guarantee'
    ],
    samplePreviewImages: [
      '/albums/kpr_album/page_03.jpg',
      '/albums/kpr_album/page_06.jpg',
      '/albums/kpr_album/page_07.jpg',
      '/albums/kpr_album/page_08.jpg',
      '/albums/kpr_album/page_09.jpg',
      '/albums/kpr_album/page_10.jpg'
    ]
  }
];

export default function ColorLabSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('designs'); // 'designs' | 'packages' | 'albums'
  const [flipbookImages, setFlipbookImages] = useState(null); // when set, opens the album flipbook viewer
  const [customColorLabPhotos, setCustomColorLabPhotos] = useState([]);

  // Direct Upload State
  const fileInputRef = useRef(null);
  const [selectedFormat, setSelectedFormat] = useState(ALBUM_FORMATS[0]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadSpeedText, setUploadSpeedText] = useState('');
  const [uploadedFilesList, setUploadedFilesList] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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

  /* Trigger Direct File Picker for a specific Album Format */
  const handleDirectUploadClick = (format) => {
    setSelectedFormat(format);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  /* Handle Files Chosen from File Picker */
  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await processDirectUpload(files, selectedFormat);
  };

  /* Process Direct File Upload with Google Drive & Local Preview Sync */
  const processDirectUpload = async (files, format) => {
    const currentFormat = format || selectedFormat || ALBUM_FORMATS[0];

    // Filter valid image / pdf files
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

    setUploadModalOpen(true);
    setUploading(true);
    setUploadProgress(5);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadedFilesList([]);

    const total = validFiles.length;
    const uploadedUrls = [];

    // Handle PDF files specially by converting pages for instant flipbook preview
    const pdfFile = validFiles.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFile) {
      setUploadStatusText(`Rendering pages from ${pdfFile.name}...`);
      try {
        const blobUrl = URL.createObjectURL(pdfFile);
        const pdfPages = await loadPdfPages(blobUrl, 2);
        if (pdfPages && pdfPages.length > 0) {
          uploadedUrls.push(...pdfPages);
        }
      } catch (err) {
        console.warn('PDF preview extraction note:', err);
      }
    }

    // Process each image file
    for (let i = 0; i < total; i++) {
      const file = validFiles[i];
      setUploadStatusText(`Uploading photo ${i + 1} of ${total}: ${file.name}`);

      try {
        if (!file.type.includes('pdf')) {
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        }

        // Upload using clientUploadsService directly to Google Drive
        await uploadClientFile({
          file,
          clientId: 'client-album-order',
          clientName: 'Valued Album Client',
          projectTitle: `Album Order — ${currentFormat.title}`,
          onProgress: (pct, speed) => {
            const overallPct = Math.min(Math.round(((i + (pct / 100)) / total) * 100), 99);
            setUploadProgress(overallPct);
            if (speed) setUploadSpeedText(speed);
          }
        });
      } catch (err) {
        console.error('File upload error for:', file.name, err);
      }

      setUploadProgress(Math.round(((i + 1) / total) * 100));
    }

    setUploading(false);
    setUploadProgress(100);
    setUploadSuccess(true);
    setUploadedFilesList(uploadedUrls);
  };

  /* Open WhatsApp with Order Details for the Uploaded Album */
  const getWhatsAppOrderUrl = () => {
    const count = uploadedFilesList.length;
    const formatName = selectedFormat?.title || '12 × 18 / 24 × 18 Album';
    const message = `Hi KPR Colour Lab, I have uploaded ${count} photos for the *${formatName}* order. Please review and confirm the printing schedule.`;
    return `https://wa.me/919849443648?text=${encodeURIComponent(message)}`;
  };

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
                <span>Albums (Direct Upload)</span>
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
                  categoryTitle="PRINTING PACKAGES"
                  categorySubtitle="Transparent pricing for our fine art wedding album printing, framing, card printing, flex, and custom design services. Click Book Now to order via WhatsApp."
                />
              </div>
            )}

            {/* ALBUMS SUBSECTION — DIRECT UPLOAD FLOW */}
            {activeSubTab === 'albums' && (
              <div className="animate-fadeIn space-y-10">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#C5A880] font-semibold block mb-1">
                    CHOOSE ALBUM SIZE → UPLOAD DIRECTLY
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">
                    Direct Album Photo Upload
                  </h3>
                  <p className="text-xs text-[#666666] font-light mt-2 leading-relaxed">
                    Select your preferred album format below and click <strong>Upload Photos</strong> to select files directly from your phone or computer.
                  </p>
                </div>

                {/* Hidden Global File Input for Instant Triggering */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                {/* ═══ Album Formats Grid (12x18 & 24x18) with Direct Upload Buttons ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {ALBUM_FORMATS.map((format) => (
                    <div
                      key={format.id}
                      className="bg-white border border-[#E2D9CC] hover:border-[#C5A880] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col group relative"
                    >
                      {/* Image Preview & Format Badge */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
                        <img
                          src={format.image}
                          alt={format.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                        {/* Size Badge */}
                        <div className="absolute top-3.5 left-3.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] tracking-widest text-[#E8D4B8] uppercase font-bold border border-[#C5A880]/40 shadow-sm">
                          {format.dimensions}
                        </div>

                        {/* Tag */}
                        <div className="absolute top-3.5 right-3.5 bg-[#C5A880]/90 text-black px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                          {format.tag}
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <span className="text-[10px] tracking-widest text-[#C5A880] uppercase font-semibold block">
                            {format.subtitle}
                          </span>
                          <h4 className="font-serif text-xl sm:text-2xl font-medium leading-tight mt-0.5">
                            {format.title}
                          </h4>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs text-[#666666] font-light leading-relaxed">
                          {format.desc}
                        </p>

                        {/* Feature Highlights */}
                        <div className="space-y-1.5 pt-2 border-t border-[#E8E1D5]">
                          <span className="text-[9.5px] uppercase tracking-wider text-[#999999] font-semibold block">
                            Format Specifications:
                          </span>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {format.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[#444444]">
                                <Check className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                                <span className="truncate">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Prominent Direct Upload Button & Sample Trigger */}
                        <div className="pt-4 border-t border-[#E8E1D5] flex flex-col sm:flex-row items-center gap-2.5">
                          {/* Main Prominent Direct Upload Button */}
                          <button
                            type="button"
                            onClick={() => handleDirectUploadClick(format)}
                            className="w-full sm:flex-1 py-3 px-4 bg-[#C5A880] hover:bg-[#b89560] text-black text-xs font-bold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group-hover:scale-[1.02]"
                          >
                            <CloudUpload className="w-4 h-4 text-black shrink-0" />
                            <span>Upload Photos ({format.size})</span>
                          </button>

                          {/* Secondary: Sample Album Viewer */}
                          <button
                            type="button"
                            onClick={() => setFlipbookImages(format.samplePreviewImages)}
                            className="w-full sm:w-auto py-3 px-4 bg-[#F7F3EE] hover:bg-[#EAE4DC] text-[#1A1A1A] text-xs font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 border border-[#E2D9CC] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Sample</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Direct Dropzone Banner */}
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processDirectUpload(Array.from(e.dataTransfer.files), selectedFormat);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleDirectUploadClick(selectedFormat)}
                  className="mt-6 border-2 border-dashed border-[#C5A880]/50 hover:border-[#C5A880] bg-white rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 group hover:bg-[#FAF8F5]"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] group-hover:scale-110 transition-transform">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <h5 className="font-serif text-lg text-[#1A1A1A] font-medium">
                      Drag & Drop Wedding Photos or Album PDF Here
                    </h5>
                    <p className="text-xs text-[#777777] font-light max-w-md">
                      Supports JPG, PNG, WEBP, and high-resolution Album PDF. Uploads stream directly to KPR Color Lab production queue.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ═══ Direct Upload Progress & Success Modal ═══ */}
            {uploadModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                <div className="bg-[#1C1C1C] border border-[#C5A880]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
                  
                  {/* Close button */}
                  {!uploading && (
                    <button
                      onClick={() => setUploadModalOpen(false)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C5A880]/20 text-[#E8D4B8] text-[9px] uppercase tracking-widest font-semibold">
                      {selectedFormat?.title || 'Album Upload'}
                    </span>
                  </div>

                  {uploading ? (
                    <div className="space-y-5 py-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#C5A880]/20 mx-auto flex items-center justify-center text-[#C5A880]">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>

                      <div>
                        <h4 className="font-serif text-xl text-white font-medium">
                          Uploading Your Album Photos
                        </h4>
                        <p className="text-xs text-white/60 font-light mt-1 truncate max-w-xs mx-auto">
                          {uploadStatusText || 'Streaming directly to cloud storage...'}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/70">
                          <span>Progress: {uploadProgress}%</span>
                          {uploadSpeedText && <span>{uploadSpeedText}</span>}
                        </div>
                        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#C5A880] to-[#E8D4B8] transition-all duration-300 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-white/40 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                        Direct chunked upload with Google Drive sync
                      </p>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="space-y-5 py-3 text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>

                      <div>
                        <h4 className="font-serif text-2xl text-white font-medium">
                          Upload Complete!
                        </h4>
                        <p className="text-xs text-white/70 font-light mt-1">
                          Successfully uploaded <strong>{uploadedFilesList.length} photos</strong> for <strong>{selectedFormat?.title}</strong>.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2.5 pt-2">
                        {/* 1. Preview in 3D Flipbook */}
                        {uploadedFilesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setUploadModalOpen(false);
                              setFlipbookImages(uploadedFilesList);
                            }}
                            className="w-full py-3 px-4 bg-[#C5A880] hover:bg-[#b89560] text-black font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Preview in 3D Flipbook</span>
                          </button>
                        )}

                        {/* 2. Order Confirmation via WhatsApp */}
                        <a
                          href={getWhatsAppOrderUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Confirm Order on WhatsApp</span>
                        </a>

                        {/* 3. Upload More Photos */}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadModalOpen(false);
                            handleDirectUploadClick(selectedFormat);
                          }}
                          className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold tracking-wider uppercase rounded-xl transition-all duration-300"
                        >
                          Upload More Photos
                        </button>
                      </div>
                    </div>
                  ) : null}

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
