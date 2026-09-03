import React, { useState, useEffect } from 'react';
import { Menu, X, User, ChevronDown } from 'lucide-react';
import kprProductionsLogo from '../assets/kpr_productions_logo.png';

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

  // All pages (including light wooden flatlay home) use high-contrast dark typography
  const isLightNav = true;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${
        scrolled
          ? 'bg-[#F7F3EE]/95 backdrop-blur-md shadow-md border-b border-black/10 py-3 px-4 sm:px-10 lg:px-16'
          : 'pt-4 sm:pt-6 px-4 sm:px-10 lg:px-16'
      }`}
    >
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between pointer-events-auto">
        
        {/* 1. LEFT: Brand Logo */}
        <button
          onClick={() => handlePageClick('home')}
          className="flex items-center group cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-105"
        >
          <img
            src={kprProductionsLogo}
            alt="KPR PRODUCTIONS"
            className="h-8 sm:h-10 w-auto object-contain drop-shadow-sm"
          />
        </button>

        {/* 2. CENTER: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 lg:space-x-10 text-xs font-bold tracking-[0.2em] uppercase">
          
          {/* HOME */}
          <button
            onClick={() => handlePageClick('home')}
            className={`transition-all duration-300 py-1 cursor-pointer flex flex-col items-center ${
              activePage === 'home'
                ? 'text-[#000000] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>HOME</span>
            {activePage === 'home' && (
              <span className="w-full h-0.5 bg-[#D32F2F] mt-1 rounded-full animate-fadeIn" />
            )}
          </button>

          {/* FOTOGRAPHY ▾ */}
          <button
            onClick={() => handlePageClick('media')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'media'
                ? 'text-[#D32F2F] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>FOTOGRAPHY</span>
            <ChevronDown className={`w-3.5 h-3.5 ${activePage === 'media' ? 'text-[#D32F2F]' : 'text-[#555555]'}`} />
          </button>

          {/* COLOR LAB ▾ */}
          <button
            onClick={() => handlePageClick('colorlab')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'colorlab'
                ? 'text-[#1E88E5] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>COLOR LAB</span>
            <ChevronDown className={`w-3.5 h-3.5 ${activePage === 'colorlab' ? 'text-[#1E88E5]' : 'text-[#555555]'}`} />
          </button>

          {/* EVENTS ▾ */}
          <button
            onClick={() => handlePageClick('events')}
            className={`transition-all duration-300 py-1 cursor-pointer flex items-center gap-1.5 ${
              activePage === 'events'
                ? 'text-[#D32F2F] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>EVENTS</span>
            <ChevronDown className={`w-3.5 h-3.5 ${activePage === 'events' ? 'text-[#D32F2F]' : 'text-[#555555]'}`} />
          </button>

          {/* CONTACT US */}
          <button
            onClick={() => handlePageClick('contact')}
            className={`transition-all duration-300 py-1 cursor-pointer ${
              activePage === 'contact'
                ? 'text-[#D32F2F] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>CONTACT US</span>
          </button>

          {/* ABOUT US */}
          <button
            onClick={() => handlePageClick('about')}
            className={`transition-all duration-300 py-1 cursor-pointer ${
              activePage === 'about'
                ? 'text-[#D32F2F] font-black'
                : 'text-[#333333] hover:text-[#000000]'
            }`}
          >
            <span>ABOUT US</span>
          </button>

        </nav>

        {/* 3. RIGHT: LOGIN Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => handlePageClick('login')}
            className="px-6 py-2 rounded-full border border-black/25 bg-black/5 hover:bg-black text-[#000000] hover:text-white font-bold text-xs tracking-[0.2em] uppercase backdrop-blur-md transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 flex items-center gap-2"
          >
            <User className="w-4 h-4 stroke-[2.5]" />
            <span>LOGIN</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl backdrop-blur-md border border-black/15 bg-black/5 text-[#000000] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 mx-2 p-6 bg-[#111111]/98 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl space-y-4 text-white pointer-events-auto animate-fadeIn">
          <div className="flex flex-col space-y-3 text-sm font-bold tracking-wider uppercase">
            <button
              onClick={() => handlePageClick('home')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'home' ? 'text-[#D32F2F]' : 'text-white/90'}`}
            >
              HOME
            </button>
            <button
              onClick={() => handlePageClick('media')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'media' ? 'text-[#D32F2F]' : 'text-white/90'}`}
            >
              FOTOGRAPHY
            </button>
            <button
              onClick={() => handlePageClick('colorlab')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'colorlab' ? 'text-[#1E88E5]' : 'text-white/90'}`}
            >
              COLOR LAB
            </button>
            <button
              onClick={() => handlePageClick('events')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'events' ? 'text-[#D32F2F]' : 'text-white/90'}`}
            >
              EVENTS
            </button>
            <button
              onClick={() => handlePageClick('contact')}
              className={`text-left py-2 border-b border-white/5 ${activePage === 'contact' ? 'text-[#D32F2F]' : 'text-white/90'}`}
            >
              CONTACT US
            </button>
            <button
              onClick={() => handlePageClick('about')}
              className={`text-left py-2 ${activePage === 'about' ? 'text-[#D32F2F]' : 'text-white/90'}`}
            >
              ABOUT US
            </button>
          </div>
          
          <div className="pt-2">
            <button
              onClick={() => handlePageClick('login')}
              className="w-full py-3 rounded-xl bg-[#D32F2F] text-white font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
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
