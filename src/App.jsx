import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MediaSection from './components/MediaSection';
import ColorLabSection from './components/ColorLabSection';
import EventsSection from './components/EventsSection';
import LoginSection from './components/LoginSection';
import AdminDashboard from './components/admin/AdminDashboard';
import WorkerDashboard from './components/worker/WorkerDashboard';
import ClientDashboard from './components/client/ClientDashboard';
import LightboxModal from './components/LightboxModal';
import MoodboardDrawer from './components/MoodboardDrawer';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import IntroVideo from './components/IntroVideo';
import ServicesShowcase from './components/ServicesShowcase';

function getInitialPage() {
  try {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['home', 'media', 'colorlab', 'events', 'login', 'contact', 'admin-dashboard', 'worker-dashboard', 'client-dashboard'];
    if (validPages.includes(hash)) return hash;
  } catch (e) {}
  return 'home';
}

function AppContent() {
  const { user, profile, loading, isRecoveryMode } = useAuth();

  // 'home' | 'media' | 'colorlab' | 'login' | 'admin-dashboard' | 'worker-dashboard' | 'client-dashboard' | 'contact'
  const [activePage, setActivePage] = useState(getInitialPage);
  const [loginTab, setLoginTab] = useState('admin'); // which tab to pre-select on login page
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [moodboardIds, setMoodboardIds] = useState(['21-photo-1', '21-photo-2']);
  const [moodboardOpen, setMoodboardOpen] = useState(false);

  // Depth tracker: 0 is the root entry. > 0 are internal page navigations
  const historyDepthRef = useRef(0);
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const selectedPhotoRef = useRef(selectedPhoto);
  selectedPhotoRef.current = selectedPhoto;
  const moodboardOpenRef = useRef(moodboardOpen);
  moodboardOpenRef.current = moodboardOpen;

  // If password reset recovery link was clicked, immediately open login page to show password reset form
  useEffect(() => {
    if (isRecoveryMode) {
      handleSelectPage('login', { replace: true });
    }
  }, [isRecoveryMode]);

  // 1. Initial Mount: Initialize the exit guard history state
  useEffect(() => {
    const initial = getInitialPage();

    // Push the dummy exit guard state on mount
    window.history.pushState(
      { exitGuard: true, page: initial, depth: 0 },
      '',
      window.location.href
    );
    historyDepthRef.current = 0;

    // Popstate event listener
    const handlePopState = (event) => {
      // 1. If LightboxModal is open, close it on back press
      if (selectedPhotoRef.current) {
        setSelectedPhoto(null);
        window.history.pushState(
          { page: activePageRef.current, depth: historyDepthRef.current, exitGuard: historyDepthRef.current === 0 },
          '',
          `#${activePageRef.current}`
        );
        return;
      }

      // 2. If MoodboardDrawer is open, close it on back press
      if (moodboardOpenRef.current) {
        setMoodboardOpen(false);
        window.history.pushState(
          { page: activePageRef.current, depth: historyDepthRef.current, exitGuard: historyDepthRef.current === 0 },
          '',
          `#${activePageRef.current}`
        );
        return;
      }

      const state = event.state;

      // 3. INTERNAL BACK / FORWARD NAVIGATION (BUG 1)
      // If there is internal history (depth > 0 or state with valid internal page)
      if (state && state.page && typeof state.depth === 'number' && state.depth > 0) {
        setActivePage(state.page);
        historyDepthRef.current = state.depth;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // If returning to depth 0 (the site entry page) from an internal page
      if (state && state.page && state.depth === 0 && historyDepthRef.current > 0) {
        setActivePage(state.page);
        historyDepthRef.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 4. GENUINE EXIT ATTEMPT (BUG 2)
      // When the user has reached the entry page and presses Back to leave the site
      if (!state || !state.exitGuard || state.depth === undefined || historyDepthRef.current === 0) {
        const confirmed = window.confirm('Are you sure you want to exit?');
        if (confirmed) {
          // Allow exit
          window.removeEventListener('popstate', handlePopState);
          window.history.back();
        } else {
          // User cancelled — re-push the dummy guard state so back button is intercepted again next time
          window.history.pushState(
            { exitGuard: true, page: activePageRef.current, depth: 0 },
            '',
            window.location.href
          );
          historyDepthRef.current = 0;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleMoodboardItem = (id) => {
    if (moodboardIds.includes(id)) {
      setMoodboardIds(moodboardIds.filter(itemId => itemId !== id));
    } else {
      setMoodboardIds([...moodboardIds, id]);
    }
  };

  const handleSelectPage = (pageName, options = {}) => {
    const { replace = false, tab = null } = options;

    if (tab) {
      setLoginTab(tab);
    }

    // Route guards
    if (pageName === 'admin-dashboard') {
      if (!user || profile?.role !== 'admin') {
        setLoginTab('admin');
        navigateToPage('login', { replace: true });
        return;
      }
    }
    if (pageName === 'worker-dashboard') {
      if (!user || profile?.role !== 'worker') {
        setLoginTab('worker');
        navigateToPage('login', { replace: true });
        return;
      }
    }
    if (pageName === 'client-dashboard') {
      if (!user || profile?.role !== 'client') {
        setLoginTab('client');
        navigateToPage('login', { replace: true });
        return;
      }
    }

    navigateToPage(pageName, { replace });
  };

  const navigateToPage = (pageName, { replace = false } = {}) => {
    if (activePage === pageName && !replace) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (replace) {
      // Replace state: used for auth guards, login redirects, recovery mode
      window.history.replaceState(
        { page: pageName, depth: historyDepthRef.current, exitGuard: historyDepthRef.current === 0 },
        '',
        `#${pageName}`
      );
    } else {
      // Normal internal page navigation (BUG 1): creates a new history entry!
      historyDepthRef.current += 1;
      window.history.pushState(
        { page: pageName, depth: historyDepthRef.current, internalNav: true },
        '',
        `#${pageName}`
      );
    }

    setActivePage(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle successful login — navigate to the appropriate dashboard with replaceState
  // NOTE: We call navigateToPage directly instead of handleSelectPage because
  // handleSelectPage re-checks the route guards (user/profile state), which
  // haven't re-rendered yet at this point, causing a redirect loop back to login.
  const handleLoginSuccess = (role) => {
    let target = 'home';
    if (role === 'admin') target = 'admin-dashboard';
    else if (role === 'worker') target = 'worker-dashboard';
    else if (role === 'client') target = 'client-dashboard';

    navigateToPage(target, { replace: true });
  };

  // Handle logout — return to login page with replaceState
  const handleLogout = () => {
    handleSelectPage('login', { replace: true, tab: 'admin' });
  };

  // On initial load, if user is already logged in, go to dashboard
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin' && (activePage === 'login' || activePage === 'home')) {
        handleSelectPage('admin-dashboard', { replace: true });
      } else if (profile.role === 'worker' && (activePage === 'login' || activePage === 'home')) {
        handleSelectPage('worker-dashboard', { replace: true });
      } else if (profile.role === 'client' && (activePage === 'login' || activePage === 'home')) {
        handleSelectPage('client-dashboard', { replace: true });
      }
    }
  }, [loading, user, profile]);

  // Show nothing while checking auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs tracking-widest uppercase text-[#888888]">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin dashboard gets its own full-screen layout
  if (activePage === 'admin-dashboard') {
    if (!user || profile?.role !== 'admin') {
      handleSelectPage('login', { replace: true, tab: 'admin' });
      return null;
    }
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Worker dashboard gets its own full-screen layout
  if (activePage === 'worker-dashboard') {
    if (!user || profile?.role !== 'worker') {
      handleSelectPage('login', { replace: true, tab: 'worker' });
      return null;
    }
    return <WorkerDashboard onLogout={handleLogout} />;
  }

  // Client dashboard gets its own full-screen layout
  if (activePage === 'client-dashboard') {
    if (!user || profile?.role !== 'client') {
      handleSelectPage('login', { replace: true, tab: 'client' });
      return null;
    }
    return <ClientDashboard onLogout={handleLogout} />;
  }

  return (
    <div className={`min-h-screen ${activePage === 'home' ? 'bg-[#0D0B08]' : 'bg-[#F7F3EE]'} text-[#1A1A1A] font-sans selection:bg-[#C5A880] selection:text-white w-full m-0 p-0`}>

      {/* Top Navigation Header Bar */}
      <Navbar
        activePage={activePage}
        onSelectPage={handleSelectPage}
        moodboardCount={moodboardIds.length}
        onOpenMoodboard={() => setMoodboardOpen(true)}
      />

      {/* Multi-Page Route Views */}
      <main className="animate-fadeIn w-full m-0 p-0">
        {activePage === 'home' && (
          <div className="w-full h-full m-0 p-0 overflow-hidden">
            <Hero onOpenPage={handleSelectPage} />
          </div>
        )}

        {activePage === 'media' && (
          <div className="pt-24 sm:pt-28 pb-12 animate-fadeIn">
            <MediaSection
              initialTab="gallery"
              onSelectPhoto={(photo) => setSelectedPhoto(photo)}
              moodboardIds={moodboardIds}
              toggleMoodboardItem={toggleMoodboardItem}
            />
          </div>
        )}

        {activePage === 'colorlab' && (
          <div className="pt-24 sm:pt-28 pb-12 animate-fadeIn">
            <ColorLabSection />
          </div>
        )}

        {activePage === 'events' && (
          <div className="pt-24 sm:pt-28 pb-12 animate-fadeIn">
            <EventsSection onOpenPage={handleSelectPage} />
          </div>
        )}

        {activePage === 'login' && (
          <div className="pt-24 sm:pt-28 pb-12 animate-fadeIn">
            <LoginSection
              onLoginSuccess={handleLoginSuccess}
              initialTab={loginTab}
            />
          </div>
        )}

        {activePage === 'contact' && (
          <div className="pt-24 sm:pt-28 pb-12 animate-fadeIn">
            <ContactSection />
          </div>
        )}
      </main>

      {/* Footer (shown on inner pages) */}
      {activePage !== 'login' && activePage !== 'home' && (
        <footer id="footer">
          <Footer
            onOpenInquire={() => handleSelectPage('contact')}
            showInstagram={true}
          />
        </footer>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <LightboxModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onOpenInquireWithPhoto={() => {}}
          moodboardIds={moodboardIds}
          toggleMoodboardItem={toggleMoodboardItem}
          onSelectPhoto={(photo) => setSelectedPhoto(photo)}
        />
      )}

      {/* Saved Vision Moodboard Drawer */}
      <MoodboardDrawer
        isOpen={moodboardOpen}
        onClose={() => setMoodboardOpen(false)}
        moodboardIds={moodboardIds}
        toggleMoodboardItem={toggleMoodboardItem}
        onOpenInquireWithMoodboard={() => {}}
      />

    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#111827] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/30 flex items-center justify-center mb-4 text-[#C5A880] text-2xl font-bold font-serif">
            KPR
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-xs text-white/50 max-w-md mb-6 font-mono">{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#C5A880] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#D4BC9A] transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('intro') === '1' || urlParams.get('intro') === 'true' || urlParams.get('play_intro') === '1') {
        return true;
      }
      return !sessionStorage.getItem('kpr_intro_shown');
    } catch (e) {
      return true;
    }
  });

  return (
    <ErrorBoundary>
      {showIntro && (
        <IntroVideo onComplete={() => setShowIntro(false)} />
      )}
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
