import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { SOCIAL_LINKS } from './utils/socialLinks';
import { Loader2 } from 'lucide-react';

// Lazy-loaded heavy components for ultra-fast initial mobile load & zero memory crashes
const MediaSection = lazy(() => import('./components/MediaSection'));
const ColorLabSection = lazy(() => import('./components/ColorLabSection'));
const EventsSection = lazy(() => import('./components/EventsSection'));
const LoginSection = lazy(() => import('./components/LoginSection'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const WorkerDashboard = lazy(() => import('./components/worker/WorkerDashboard'));
const ClientDashboard = lazy(() => import('./components/client/ClientDashboard'));
const ContactSection = lazy(() => import('./components/ContactSection'));
const AboutSection = lazy(() => import('./components/AboutSection'));
const AlbumPreviewPage = lazy(() => import('./components/AlbumPreviewPage'));
const PhotographyCostEstimator = lazy(() => import('./components/estimator/PhotographyCostEstimator'));
const LightboxModal = lazy(() => import('./components/LightboxModal'));
const MoodboardDrawer = lazy(() => import('./components/MoodboardDrawer'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
      <div className="space-y-3">
        <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin mx-auto" />
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#888888]">Loading View…</p>
      </div>
    </div>
  );
}

function getInitialPage() {
  try {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = [
      'home', 'media', 'colorlab', 'events', 'login', 'contact', 'about',
      'album-preview', 'estimator', 'cost-estimator', 'admin-dashboard', 'worker-dashboard', 'client-dashboard'
    ];
    if (validPages.includes(hash)) {
      if (hash === 'cost-estimator') return 'estimator';
      return hash;
    }
  } catch (e) {}
  return 'home';
}

function AppContent() {
  const { user, profile, loading, isRecoveryMode } = useAuth();

  const [activePage, setActivePage] = useState(getInitialPage);
  const [loginTab, setLoginTab] = useState('admin');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [moodboardIds, setMoodboardIds] = useState(['21-photo-1', '21-photo-2']);
  const [moodboardOpen, setMoodboardOpen] = useState(false);

  // Sync route on hash change (supports swipe-back, browser back/forward seamlessly across all mobile browsers)
  useEffect(() => {
    const handleHashChange = () => {
      const page = getInitialPage();
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Password reset recovery mode
  useEffect(() => {
    if (isRecoveryMode) {
      handleSelectPage('login', { replace: true });
    }
  }, [isRecoveryMode]);

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
      if (!user || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) {
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
      window.history.replaceState({ page: pageName }, '', `#${pageName}`);
    } else {
      window.history.pushState({ page: pageName }, '', `#${pageName}`);
    }

    setActivePage(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role) => {
    let target = 'home';
    if (role === 'admin' || role === 'superadmin') target = 'admin-dashboard';
    else if (role === 'worker') target = 'worker-dashboard';
    else if (role === 'client') target = 'client-dashboard';

    navigateToPage(target, { replace: true });
  };

  const handleLogout = () => {
    handleSelectPage('login', { replace: true, tab: 'admin' });
  };

  // Only auto-redirect to dashboard if user deliberately opened #login with active session
  useEffect(() => {
    if (!loading && user && profile && activePage === 'login') {
      if (profile.role === 'admin' || profile.role === 'superadmin') {
        handleSelectPage('admin-dashboard', { replace: true });
      } else if (profile.role === 'worker') {
        handleSelectPage('worker-dashboard', { replace: true });
      } else if (profile.role === 'client') {
        handleSelectPage('client-dashboard', { replace: true });
      }
    }
  }, [loading, user, profile, activePage]);

  // Loading state
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

  // Admin dashboard (full screen)
  if (activePage === 'admin-dashboard') {
    if (!user || (profile?.role !== 'admin' && profile?.role !== 'superadmin')) {
      handleSelectPage('login', { replace: true, tab: 'admin' });
      return null;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminDashboard onLogout={handleLogout} />
      </Suspense>
    );
  }

  // Worker dashboard (full screen)
  if (activePage === 'worker-dashboard') {
    if (!user || profile?.role !== 'worker') {
      handleSelectPage('login', { replace: true, tab: 'worker' });
      return null;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <WorkerDashboard onLogout={handleLogout} />
      </Suspense>
    );
  }

  // Client dashboard (full screen)
  if (activePage === 'client-dashboard') {
    if (!user || profile?.role !== 'client') {
      handleSelectPage('login', { replace: true, tab: 'client' });
      return null;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <ClientDashboard onLogout={handleLogout} />
      </Suspense>
    );
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
          <div className="w-full h-full m-0 p-0">
            <Hero onOpenPage={handleSelectPage} />
          </div>
        )}

        {activePage === 'media' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <MediaSection
                initialTab="gallery"
                onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                moodboardIds={moodboardIds}
                toggleMoodboardItem={toggleMoodboardItem}
                onOpenEstimator={() => handleSelectPage('estimator')}
              />
            </Suspense>
          </div>
        )}

        {activePage === 'colorlab' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <ColorLabSection />
            </Suspense>
          </div>
        )}

        {activePage === 'events' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <EventsSection onOpenPage={handleSelectPage} />
            </Suspense>
          </div>
        )}

        {activePage === 'login' && (
          <div className="pt-20 sm:pt-24 pb-12 animate-fadeIn">
            <Suspense fallback={<PageLoader />}>
              <LoginSection
                onLoginSuccess={handleLoginSuccess}
                initialTab={loginTab}
              />
            </Suspense>
          </div>
        )}

        {activePage === 'contact' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <ContactSection />
            </Suspense>
          </div>
        )}

        {activePage === 'about' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <AboutSection />
            </Suspense>
          </div>
        )}

        {activePage === 'album-preview' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <AlbumPreviewPage />
            </Suspense>
          </div>
        )}

        {activePage === 'estimator' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <Suspense fallback={<PageLoader />}>
              <MediaSection
                initialTab="estimator"
                onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                moodboardIds={moodboardIds}
                toggleMoodboardItem={toggleMoodboardItem}
              />
            </Suspense>
          </div>
        )}
      </main>

      {/* Footer (shown on inner pages) */}
      {activePage !== 'login' && activePage !== 'home' && activePage !== 'estimator' && (
        <footer id="footer">
          <Footer
            onOpenInquire={() => handleSelectPage('contact')}
            showInstagram={true}
            showFacebook={activePage !== 'events' && activePage !== 'colorlab'}
            showYoutube={activePage !== 'colorlab'}
            showAddress={activePage === 'events' || activePage === 'colorlab' || activePage === 'contact'}
            addressLine1={
              activePage === 'events'
                ? 'KPR Dance Zone'
                : 'Grand Gayathri, 8-5-34'
            }
            addressLine2={
              activePage === 'events'
                ? '8GHV+HH5, Sriramana Colony, Hastinapuram, Hyderabad, Telangana – 500079, India'
                : 'TKS Commercial Complex, Station Road, Warangal 506002'
            }
            mapUrl={
              activePage === 'events'
                ? 'https://www.google.com/maps/search/?api=1&query=KPR+Dance+Zone+8GHV%2BHH5+Sriramana+Colony+Hastinapuram+Hyderabad+Telangana+500079'
                : 'https://goo.gl/maps/NtABjd1bV6S5kNHq8?g_st=ac'
            }
            instagramUrl={
              activePage === 'colorlab'
                ? SOCIAL_LINKS.instagramColorLab
                : activePage === 'events'
                ? SOCIAL_LINKS.instagramEvents
                : SOCIAL_LINKS.instagram
            }
            instagramHandle={
              activePage === 'colorlab'
                ? '@kpr_colourlab'
                : activePage === 'events'
                ? '@kpr_dance_.zone'
                : '@kpr_fotography'
            }
            youtubeUrl={
              activePage === 'events'
                ? 'https://youtube.com/@kprdancezone2022?si=9iyxnp5usQPmNeO9'
                : 'https://youtube.com/@kprfotography?si=b_8j81oMQPNZeS_3'
            }
            youtubeHandle={
              activePage === 'events'
                ? '@kprdancezone2022'
                : '@kprfotography'
            }
            contactEmail={
              activePage === 'colorlab'
                ? 'kprcolourlab@gmail.com'
                : activePage === 'events'
                ? 'kprevents@gmail.com'
                : 'kprfotography@gmail.com'
            }
            contactPhone={
              activePage === 'colorlab'
                ? '+91 98493 90876'
                : activePage === 'events'
                ? '+91 99489 72531'
                : '+91 98494 43648'
            }
          />
        </footer>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <Suspense fallback={null}>
          <LightboxModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onOpenInquireWithPhoto={() => {}}
            moodboardIds={moodboardIds}
            toggleMoodboardItem={toggleMoodboardItem}
            onSelectPhoto={(photo) => setSelectedPhoto(photo)}
          />
        </Suspense>
      )}

      {/* Saved Vision Moodboard Drawer */}
      {moodboardOpen && (
        <Suspense fallback={null}>
          <MoodboardDrawer
            isOpen={moodboardOpen}
            onClose={() => setMoodboardOpen(false)}
            moodboardIds={moodboardIds}
            toggleMoodboardItem={toggleMoodboardItem}
            onOpenInquireWithMoodboard={() => {}}
          />
        </Suspense>
      )}

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
              window.location.hash = '#home';
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
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
