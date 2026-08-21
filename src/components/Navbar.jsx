import React, { useState, useEffect } from 'react';
import { Menu, X, User, ChevronDown } from 'lucide-react';

export default function Navbar({ activePage, onSelectPage }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePageClick = (pageName) => {
    setMobileMenuOpen(false);
    onSelectPage(pageName);
  };

  const isLightPage = activePage !== 'home';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${
        scrolled
          ? isLightPage
            ? 'bg-[#F7F3EE]/90 backdrop-blur-md shadow-sm border-b border-black/5 py-3 px-4 sm:px-10 lg:px-16'
            : 'bg-black/70 backdrop-blur-md shadow-lg border-b border-white/10 py-3 px-4 sm:px-10 lg:px-16'
          : 'pt-4 sm:pt-7 px-4 sm:px-10 lg:px-16'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* 1. LEFT: Brand Logo */}
        <button
          onClick={() => handlePageClick('home')}
          className="flex flex-col text-left group cursor-pointer focus:outline-none"
        >
          <span
            className={`font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-[0.18em] sm:tracking-[0.2em] transition-colors leading-none ${
              isLightPage
                ? 'text-[#1A1A1A] group-hover:text-[#C5A880]'
                : 'text-white group-hover:text-[#C5A880]'
            }`}
          >
            KPR
          </span>
          <span
            className={`text-[8px] sm:text-[9px] font-sans tracking-[0.3em] sm:tracking-[0.38em] uppercase transition-colors pt-0.5 ${
              isLightPage
                ? 'text-[#666666] group-hover:text-[#1A1A1A]'
                : 'text-white/70 group-hover:text-white'
            }`}
          >
            PRODUCTIONS
          </span>
        </button>

        {/* 2. CENTER: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 lg:space-x-10 text-xs font-semibold tracking-[0.2em] uppercase">
          
          {/* HOME */}
          <button
            onClick={() => handlePageClick('home')}
            className={`transition-all duration-300 py-1 cursor-pointer flex flex-col items-center ${
              activePage === 'home'
                ? isLightPage ? 'text-[#1A1A1A] font-bold' : 'text-white font-bold'
                : isLightPage ? 'text-[#555555] hover:text-[#1A1A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>HOME</span>
            {activePage === 'home' && (
              <span className="w-full h-0.5 bg-[#C5A880] mt-1 rounded-full animate-fadeIn" />
            )}
          </button>

          {/* PHOTOGRAPHY ▾ */}
          <button
            onClick={() => handlePageClick('media')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'media'
                ? 'text-[#C5A880] font-bold'
                : isLightPage ? 'text-[#555555] hover:text-[#1A1A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>PHOTOGRAPHY</span>
            <ChevronDown className={`w-3 h-3 ${activePage === 'media' ? 'text-[#C5A880]' : isLightPage ? 'text-[#777777]' : 'text-white/60'}`} />
          </button>

          {/* COLOR LAB ▾ */}
          <button
            onClick={() => handlePageClick('colorlab')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'colorlab'
                ? 'text-[#C5A880] font-bold'
                : isLightPage ? 'text-[#555555] hover:text-[#1A1A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>COLOR LAB</span>
            <ChevronDown className={`w-3 h-3 ${activePage === 'colorlab' ? 'text-[#C5A880]' : isLightPage ? 'text-[#777777]' : 'text-white/60'}`} />
          </button>

          {/* EVENTS ▾ */}
          <button
            onClick={() => handlePageClick('events')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'events'
                ? 'text-[#C5A880] font-bold'
                : isLightPage ? 'text-[#555555] hover:text-[#1A1A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>EVENTS</span>
            <ChevronDown className={`w-3 h-3 ${activePage === 'events' ? 'text-[#C5A880]' : isLightPage ? 'text-[#777777]' : 'text-white/60'}`} />
          </button>

          {/* CONTACT US */}
          <button
            onClick={() => handlePageClick('contact')}
            className={`transition-all duration-300 py-1 cursor-pointer ${
              activePage === 'contact'
                ? 'text-[#C5A880] font-bold'
                : isLightPage ? 'text-[#555555] hover:text-[#1A1A1A]' : 'text-white/70 hover:text-white'
            }`}
          >
            <span>CONTACT US</span>
          </button>

        </nav>

        {/* 3. RIGHT: LOGIN Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => handlePageClick('login')}
            className={`px-6 py-2 rounded-full border text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 flex items-center gap-2 ${
              isLightPage
                ? 'border-black/15 bg-black/5 hover:bg-[#C5A880] text-[#1A1A1A] hover:text-black hover:border-[#C5A880]'
                : 'border-white/30 bg-black/40 hover:bg-[#C5A880] text-white hover:text-black hover:border-[#C5A880]'
            }`}
          >
            <User className="w-4 h-4 stroke-[2]" />
            <span>LOGIN</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl backdrop-blur-md border cursor-pointer ${
              isLightPage
                ? 'bg-black/5 border-black/10 text-[#1A1A1A]'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 mx-2 p-6 bg-[#111111]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl space-y-4 text-white pointer-events-auto animate-fadeIn">
          <div className="flex flex-col space-y-3 text-sm font-semibold tracking-wider uppercase">
            <button
              onClick={() => handlePageClick('home')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'home' ? 'text-[#C5A880]' : 'text-white/80'}`}
            >
              HOME
            </button>
            <button
              onClick={() => handlePageClick('media')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'media' ? 'text-[#C5A880]' : 'text-white/80'}`}
            >
              PHOTOGRAPHY
            </button>
            <button
              onClick={() => handlePageClick('colorlab')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'colorlab' ? 'text-[#C5A880]' : 'text-white/80'}`}
            >
              COLOR LAB
            </button>
            <button
              onClick={() => handlePageClick('events')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'events' ? 'text-[#C5A880]' : 'text-white/80'}`}
            >
              EVENTS
            </button>
            <button
              onClick={() => handlePageClick('contact')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'contact' ? 'text-[#C5A880]' : 'text-white/80'}`}
            >
              CONTACT US
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handlePageClick('login')}
              className="w-full py-3 rounded-xl bg-[#C5A880] text-black font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>LOGIN</span>
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
