import React, { useState, useEffect } from 'react';
import { SERVICES_PACKAGES as INITIAL_PHOTOGRAPHY_PACKAGES } from '../data/packagesData';
import { fetchSitePackages } from '../utils/packagesService';
import { Sparkles, ArrowLeft, PhoneCall } from 'lucide-react';

export default function PackagesSection({
  onBackToGallery,
  packageType = 'photography',
  whatsappNumber = '919849443648',
  displayPhone = '+91 98494 43648',
  categoryTitle = 'KPR PRODUCTION PACKAGES',
  categorySubtitle = 'Transparent pricing for our luxury photography, videography, aerial drone, live streaming, and post-production video editing services. Click Book Now to reserve your dates via WhatsApp.'
}) {
  const [packages, setPackages] = useState(INITIAL_PHOTOGRAPHY_PACKAGES);

  useEffect(() => {
    async function loadData() {
      const data = await fetchSitePackages(packageType);
      if (data && data.length > 0) {
        setPackages(data);
      }
    }
    loadData();
  }, [packageType]);

  // Function to build WhatsApp direct link with pre-typed message
  const getWhatsAppUrl = (serviceName, servicePrice, duration) => {
    const dur = duration || 'Coverage';
    const textMessage = `Hello KPR Production! I would like to book the *${serviceName}* package (₹${Number(servicePrice).toLocaleString('en-IN')}/- for ${dur}). Please confirm availability and booking process.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMessage)}`;
  };

  const getCustomWhatsAppUrl = () => {
    const textMessage = `Hello KPR Production! I want to book a custom package for my upcoming event. Please contact me.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMessage)}`;
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-12">
        
        {/* Back Button */}
        {onBackToGallery && (
          <div className="mb-6 sm:mb-8">
            <button
              onClick={onBackToGallery}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-medium text-[#1A1A1A] hover:text-[#C5A880] py-2 sm:py-2.5 px-4 sm:px-5 border border-[#E2D9CC] bg-white transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gallery</span>
            </button>
          </div>
        )}

        {/* Page Title & Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <p className="text-[10px] sm:text-[11px] md:text-[12px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#666666] font-medium mb-2 sm:mb-3">
            PRICING & INVESTMENT
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#1A1A1A] font-light tracking-wide mb-4 sm:mb-6">
            {categoryTitle}
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto mb-4 sm:mb-6" />
          <p className="text-[#666666] text-xs sm:text-sm md:text-base font-light leading-relaxed">
            {categorySubtitle}
          </p>
        </div>

        {/* Services Grid (Dynamic from Supabase / Admin Editor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-16">
          {packages.map((service, index) => {
            const whatsappLink = getWhatsAppUrl(service.name, service.price, service.duration);
            const imageSrc = service.image || '/images/packages/user_pkg_candid_photo.png';

            return (
              <div
                key={service.id || index}
                className="bg-white border border-[#E2D9CC] overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-500 hover:border-[#C5A880]/60 group"
              >
                {/* Thumbnail Image Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#121212]">
                  <img
                    src={imageSrc}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-md text-[#E8D4B8] text-[9px] tracking-widest uppercase px-3 py-1 font-medium border border-white/10">
                      {service.category}
                    </span>
                  </div>

                  {service.popular && (
                    <div className="absolute bottom-3 left-3 bg-[#C5A880] text-white text-[9px] tracking-[0.2em] uppercase px-3 py-1 font-semibold flex items-center gap-1 shadow">
                      <Sparkles className="w-3 h-3" />
                      <span>POPULAR</span>
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] font-medium leading-tight group-hover:text-[#C5A880] transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#666666] font-light leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Pricing + Duration Details */}
                  <div className="pt-4 border-t border-[#E8E1D5] space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#888888] block">Price</span>
                        <span className="font-serif text-2xl text-[#1A1A1A] font-bold">
                          ₹{Number(service.price).toLocaleString('en-IN')}/-
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-[#888888] block">Duration / Unit</span>
                        <span className="text-xs font-medium text-[#444444]">
                          {service.duration}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    {service.features && service.features.length > 0 && (
                      <ul className="space-y-1.5 text-[11px] text-[#555555]">
                        {service.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#C5A880] rounded-full shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Book Now Button */}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-[11px] font-semibold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow hover:shadow-md"
                    >
                      {/* WhatsApp Icon */}
                      <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.431 2.504 1.16 3.477l-.76 2.776 2.842-.746c.94.512 2.019.803 3.167.803 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.769-5.766zm4.186 8.163c-.174.492-.857.901-1.393.992-.367.062-.846.111-2.457-.557-2.062-.854-3.393-2.951-3.495-3.088-.103-.138-.834-1.112-.834-2.122 0-1.01.527-1.507.714-1.713.188-.206.411-.257.548-.257.137 0 .274.001.394.007.127.006.298-.048.466.356.174.419.599 1.463.651 1.567.052.103.086.223.018.36-.069.137-.103.223-.206.343-.103.12-.216.268-.309.36-.103.103-.211.215-.091.421.12.206.533.88 1.144 1.424.786.7 1.45.918 1.656 1.021.206.103.326.086.446-.052.12-.137.514-.6.651-.806.137-.206.274-.171.463-.103.188.069 1.2.566 1.406.669.206.103.343.154.394.24.051.086.051.497-.123.989zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.176L2 22l4.981-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                      <span>BOOK NOW</span>
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Global Booking Banner */}
        <div className="bg-[#121212] text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 rounded-sm shadow-2xl border border-white/10 max-w-5xl mx-auto">
          <div>
            <div className="flex items-center gap-2 text-[#C5A880] text-xs font-semibold tracking-[0.25em] uppercase mb-1">
              <PhoneCall className="w-4 h-4" />
              <span>CUSTOM PACKAGES AVAILABLE</span>
            </div>
            <h4 className="font-serif text-2xl md:text-4xl text-white font-light mt-1">
              NEED A TAILORED PACKAGE?
            </h4>
            <p className="text-xs text-white/60 mt-1 font-light">
              Contact us directly at <span className="font-semibold text-white">{displayPhone}</span> for custom bookings and requirements.
            </p>
          </div>

          <a
            href={getCustomWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#1EBE5A] text-white text-[11px] font-bold tracking-[0.25em] uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shrink-0 shadow-lg rounded-xs"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.431 2.504 1.16 3.477l-.76 2.776 2.842-.746c.94.512 2.019.803 3.167.803 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.769-5.766zm4.186 8.163c-.174.492-.857.901-1.393.992-.367.062-.846.111-2.457-.557-2.062-.854-3.393-2.951-3.495-3.088-.103-.138-.834-1.112-.834-2.122 0-1.01.527-1.507.714-1.713.188-.206.411-.257.548-.257.137 0 .274.001.394.007.127.006.298-.048.466.356.174.419.599 1.463.651 1.567.052.103.086.223.018.36-.069.137-.103.223-.206.343-.103.12-.216.268-.309.36-.103.103-.211.215-.091.421.12.206.533.88 1.144 1.424.786.7 1.45.918 1.656 1.021.206.103.326.086.446-.052.12-.137.514-.6.651-.806.137-.206.274-.171.463-.103.188.069 1.2.566 1.406.669.206.103.343.154.394.24.051.086.051.497-.123.989zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.438 5.176L2 22l4.981-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </svg>
            <span>BOOK NOW ({displayPhone})</span>
          </a>
        </div>

      </div>
    </div>
  );
}
