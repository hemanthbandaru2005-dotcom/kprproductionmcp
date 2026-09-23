import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { SOCIAL_LINKS } from './utils/socialLinks';
import { Loader2 } from 'lucide-react';

// Safe lazy loading with auto-retry on stale deployment chunk 404s or network glitches
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Lazy chunk load failed, retrying once...', error);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        return await componentImport();
      } catch (retryError) {
        const hashKey = 'kpr_chunk_retry_' + (window.location.hash || '#home');
        const alreadyRetried = sessionStorage.getItem(hashKey);
        if (!alreadyRetried) {
          sessionStorage.setItem(hashKey, 'true');
          window.location.reload();
          return new Promise(() => {}); // pause until page reloads
        }
        sessionStorage.removeItem(hashKey);
        throw retryError;
      }
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

// Lazy-loaded heavy components for ultra-fast initial mobile load & zero memory crashes
const MediaSection = lazyWithRetry(() => import('./components/MediaSection'));
const ColorLabSection = lazyWithRetry(() => import('./components/ColorLabSection'));
const EventsSection = lazyWithRetry(() => import('./components/EventsSection'));
const LoginSection = lazyWithRetry(() => import('./components/LoginSection'));
const AdminDashboard = lazyWithRetry(() => import('./components/admin/AdminDashboard'));
const WorkerDashboard = lazyWithRetry(() => import('./components/worker/WorkerDashboard'));
const ClientDashboard = lazyWithRetry(() => import('./components/client/ClientDashboard'));
const ContactSection = lazyWithRetry(() => import('./components/ContactSection'));
const AboutSection = lazyWithRetry(() => import('./components/AboutSection'));
const AlbumPreviewPage = lazyWithRetry(() => import('./components/AlbumPreviewPage'));
const PhotographyCostEstimator = lazyWithRetry(() => import('./components/estimator/PhotographyCostEstimator'));
const LightboxModal = lazyWithRetry(() => import('./components/LightboxModal'));
const MoodboardDrawer = lazyWithRetry(() => import('./components/MoodboardDrawer'));

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

export const ROUTE_SLUGS = {
  home: '',
  media: 'wedding-photography-warangal',
  colorlab: 'color-lab',
  events: 'event-photography-hanumakonda',
  about: 'about',
  contact: 'contact',
  login: 'login',
  estimator: 'cost-estimator',
  'album-preview': 'album-preview',
  'admin-dashboard': 'admin-dashboard',
  'worker-dashboard': 'worker-dashboard',
  'client-dashboard': 'client-dashboard',
};

export const SLUG_TO_PAGE = {
  '': 'home',
  'home': 'home',
  'wedding-photography-warangal': 'media',
  'media': 'media',
  'color-lab': 'colorlab',
  'colorlab': 'colorlab',
  'event-photography-hanumakonda': 'events',
  'events': 'events',
  'about': 'about',
  'contact': 'contact',
  'login': 'login',
  'cost-estimator': 'estimator',
  'estimator': 'estimator',
  'album-preview': 'album-preview',
  'admin-dashboard': 'admin-dashboard',
  'worker-dashboard': 'worker-dashboard',
  'client-dashboard': 'client-dashboard',
};

function getInitialPage() {
  try {
    const hash = window.location.hash.replace('#', '').replace(/^\//, '').trim();
    const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').trim();
    if (hash && SLUG_TO_PAGE[hash]) {
      return SLUG_TO_PAGE[hash];
    }
    if (pathname && SLUG_TO_PAGE[pathname]) {
      return SLUG_TO_PAGE[pathname];
    }
  } catch (e) {}
  return 'home';
}

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`SectionErrorBoundary [${this.props.sectionName || 'view'}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-[#F7F3EE]">
          <div className="w-12 h-12 rounded-xl bg-[#C5A880]/20 text-[#8C6D3F] border border-[#C5A880]/30 flex items-center justify-center mb-3">
            <span className="font-serif font-bold text-xl">KPR</span>
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
            Unable to display {this.props.sectionName || 'content'}
          </h3>
          <p className="text-xs text-[#777777] max-w-md mb-4 font-mono">
            {this.state.error?.message || 'A temporary display issue occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, profile, loading, isRecoveryMode } = useAuth();

  const [activePage, setActivePage] = useState(getInitialPage);
  const [loginTab, setLoginTab] = useState('admin');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [moodboardIds, setMoodboardIds] = useState(['21-photo-1', '21-photo-2']);
  const [moodboardOpen, setMoodboardOpen] = useState(false);

  // ── Per-Page SEO Metadata (unique title + description per route) ──
  const SEO_META = {
    home: {
      title: 'KPR Productions | Fine Art Wedding Photography & Cinematography in Warangal & Hanumakonda',
      description: 'KPR Productions is a premier fine art wedding photography and cinematography studio serving Warangal, Hanumakonda, and Telangana. Cinematic films, bespoke albums, and stage production.',
      ogTitle: 'KPR Productions | Fine Art Wedding Photography Warangal',
      ogDescription: 'Cinematic wedding films & editorial photography in Warangal and Hanumakonda.',
      twTitle: 'KPR Productions | Fine Art Wedding Photography',
      twDescription: "Warangal & Hanumakonda's fine art wedding photography studio.",
      keywords: 'wedding photography warangal, fine art wedding photography, wedding cinematographer hanumakonda, telangana wedding photographers, luxury wedding photography',
    },
    media: {
      title: 'Wedding Photography Portfolio | KPR Productions Warangal',
      description: 'Explore KPR Productions\' curated wedding portfolio: authentic candid moments, pre-wedding sessions, haldi, engagement, and traditional ceremonies across Warangal and Hanumakonda.',
      ogTitle: 'Wedding Photography Portfolio | KPR Productions Warangal',
      ogDescription: 'Curated fine art wedding photography and films from Warangal & Hanumakonda by KPR Productions.',
      twTitle: 'Wedding Photography Portfolio | KPR Productions Warangal',
      twDescription: 'Fine art wedding photography portfolio across Warangal, Hanumakonda and Telangana.',
      keywords: 'wedding photography portfolio warangal, pre wedding shoot warangal, haldi ceremony photography, wedding couple portraits telangana, candid wedding photographer hanumakonda',
    },
    colorlab: {
      title: 'Signature Color Grading Styles & Album Printing | KPR Productions',
      description: 'Discover KPR Colour Lab: master layflat photobook album manufacturing (12x36 to 18x24), custom embossed leather cases, cinematic color grading, and framing in Warangal.',
      ogTitle: 'Signature Color Grading Styles & Album Printing | KPR Productions',
      ogDescription: 'Master layflat album printing, custom embossed leather cases, and color grading services.',
      twTitle: 'Signature Color Grading Styles & Album Printing | KPR Productions',
      twDescription: 'Luxury photobook album printing and signature color grading by KPR Colour Lab.',
      keywords: 'photo album printing warangal, layflat wedding album printing, color lab hanumakonda, custom photobook album, signature color grading styles',
    },
    events: {
      title: 'Event Photography & Stage Production Packages | KPR Productions',
      description: 'Grand stage event production, high-definition LED video walls, truss rigging, stage lighting, and professional wedding choreography packages in Hanumakonda & Warangal.',
      ogTitle: 'Event Photography & Stage Production Packages | KPR Productions',
      ogDescription: 'Grand stage LED video walls, truss rigging, lighting, and wedding choreography in Warangal & Hanumakonda.',
      twTitle: 'Event Photography & Stage Production Packages | KPR Productions',
      twDescription: 'Grand stage production, LED walls, and wedding choreography packages by KPR Productions.',
      keywords: 'event photography hanumakonda, stage lighting warangal, wedding sangeet choreography hanumakonda, led wall stage rental telangana, event production warangal',
    },
    about: {
      title: 'About KPR Productions | Fine Art Wedding Photographers in Hanumakonda',
      description: 'Learn about KPR Productions\' 20-year legacy of visual storytelling, fine-art photobook manufacturing, and stagecraft across Warangal, Hanumakonda, and Telangana.',
      ogTitle: 'About KPR Productions | Fine Art Wedding Photographers in Hanumakonda',
      ogDescription: '20-year legacy of fine art photography, photobook printing, and stage production.',
      twTitle: 'About KPR Productions | Fine Art Wedding Photographers in Hanumakonda',
      twDescription: 'About KPR Productions - fine art wedding photography studio in Hanumakonda.',
      keywords: 'about kpr productions, best photographers in hanumakonda, wedding photography team warangal, photography studio history telangana',
    },
    contact: {
      title: 'Contact KPR Productions | Wedding Photography Warangal',
      description: 'Connect with KPR Productions. Visit our Warangal (Station Road) and Hyderabad (Hastinapuram) studios, request date availability, or chat instantly via WhatsApp.',
      ogTitle: 'Contact KPR Productions | Wedding Photography Warangal',
      ogDescription: 'Connect with KPR Productions for wedding photography, albums, and stage production in Warangal & Hyderabad.',
      twTitle: 'Contact KPR Productions | Wedding Photography Warangal',
      twDescription: 'Contact KPR Productions for wedding photography and event inquiries in Warangal.',
      keywords: 'contact wedding photographer warangal, kpr productions phone number, photography studio station road warangal, wedding photography studio hanumakonda contact',
    },
    estimator: {
      title: 'Wedding & Event Photography Cost Estimator | KPR Productions',
      description: 'Calculate estimated wedding photography, color lab photobook album, and event production investment with KPR Productions\' interactive 7-step pricing calculator.',
      ogTitle: 'Wedding & Event Photography Cost Estimator | KPR Productions',
      ogDescription: 'Interactive 7-step budget calculator for wedding photography, albums, and event production.',
      twTitle: 'Wedding & Event Photography Cost Estimator | KPR Productions',
      twDescription: 'Estimate your wedding photography and event production costs with KPR Productions.',
      keywords: 'wedding photography cost calculator, wedding photography prices warangal, photography package cost estimate telangana, photobook album pricing',
    },
    login: {
      title: 'Login | KPR Productions',
      description: 'Sign in to your KPR Productions account to access client galleries or studio staff dashboards.',
    },
    'album-preview': {
      title: 'Album Preview | KPR Productions',
      description: 'Preview your luxury photobook album design with KPR Productions\' 3D album viewer.',
    },
  };

  // Sync route on hash change (supports swipe-back, browser back/forward seamlessly across all mobile browsers)
  useEffect(() => {
    const handleHashChange = () => {
      const page = getInitialPage();
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // ── Dynamic SEO: Update document.title, meta description, keywords & canonical on page change ──
  useEffect(() => {
    const meta = SEO_META[activePage] || SEO_META.home;
    document.title = meta.title;

    // Update meta description
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', meta.description);

    // Update meta title
    const titleTag = document.querySelector('meta[name="title"]');
    if (titleTag) titleTag.setAttribute('content', meta.title);

    // Update keywords
    const kwTag = document.querySelector('meta[name="keywords"]');
    if (kwTag && meta.keywords) kwTag.setAttribute('content', meta.keywords);

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.ogTitle || meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.ogDescription || meta.description);
    const ogUrl = document.querySelector('meta[property="og:url"]');

    // Update Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', meta.twTitle || meta.title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', meta.twDescription || meta.description);

    // Update canonical and OG URL
    const slug = ROUTE_SLUGS[activePage];
    const canonicalUrl = slug ? `https://kprproductions.com/${slug}` : 'https://kprproductions.com/';
    
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    }
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    }
  }, [activePage]);

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

    const slug = ROUTE_SLUGS[pageName] !== undefined ? ROUTE_SLUGS[pageName] : pageName;
    const urlTarget = slug ? `#${slug}` : '#';

    if (replace) {
      window.history.replaceState({ page: pageName }, '', urlTarget);
    } else {
      window.history.pushState({ page: pageName }, '', urlTarget);
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
            <SectionErrorBoundary sectionName="Fotography">
              <Suspense fallback={<PageLoader />}>
                <MediaSection
                  initialTab="gallery"
                  onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                  moodboardIds={moodboardIds}
                  toggleMoodboardItem={toggleMoodboardItem}
                  onOpenEstimator={() => handleSelectPage('estimator')}
                />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'colorlab' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="Color Lab">
              <Suspense fallback={<PageLoader />}>
                <ColorLabSection />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'events' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="Events">
              <Suspense fallback={<PageLoader />}>
                <EventsSection onOpenPage={handleSelectPage} />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'login' && (
          <div className="pt-20 sm:pt-24 pb-12 animate-fadeIn">
            <SectionErrorBoundary sectionName="Login">
              <Suspense fallback={<PageLoader />}>
                <LoginSection
                  onLoginSuccess={handleLoginSuccess}
                  initialTab={loginTab}
                />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'contact' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="Contact">
              <Suspense fallback={<PageLoader />}>
                <ContactSection />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'about' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="About Us">
              <Suspense fallback={<PageLoader />}>
                <AboutSection />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'album-preview' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="Album Preview">
              <Suspense fallback={<PageLoader />}>
                <AlbumPreviewPage />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        )}

        {activePage === 'estimator' && (
          <div className="pt-14 sm:pt-16 pb-0 animate-fadeIn w-full m-0 p-0">
            <SectionErrorBoundary sectionName="Cost Estimator">
              <Suspense fallback={<PageLoader />}>
                <MediaSection
                  initialTab="estimator"
                  onSelectPhoto={(photo) => setSelectedPhoto(photo)}
                  moodboardIds={moodboardIds}
                  toggleMoodboardItem={toggleMoodboardItem}
                />
              </Suspense>
            </SectionErrorBoundary>
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
