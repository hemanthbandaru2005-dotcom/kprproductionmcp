import React, { useRef, useState, useEffect } from 'react';
import { Play, Loader2 } from 'lucide-react';

/**
 * IntroVideo — Full-screen mobile & desktop video intro overlay.
 *
 * Plays /vd1.mp4 when the site first loads. The video is scaled
 * to fit completely (object-contain) on mobile so no logo text or
 * animation is cropped. When it ends (or user clicks "Skip Intro"),
 * it fades out smoothly.
 */
export default function IntroVideo({ onComplete }) {
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  /* Start fade-out, then notify parent after animation */
  const dismiss = () => {
    if (fading) return;
    setFading(true);
    try {
      sessionStorage.setItem('kpr_intro_shown', '1');
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      onComplete?.();
    }, 600);
  };

  /* Mobile-first Autoplay Initialization & Watchdog */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Hard watchdog timer: video is ~7.4s. Dismiss unconditionally after 8.5s so it never stacks/freezes
    const watchdogTimer = setTimeout(() => {
      dismiss();
    }, 8500);

    // Set DOM attributes required by mobile browsers for autoplay
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.setAttribute('x5-playsinline', '');

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setAutoplayBlocked(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Autoplay blocked by mobile browser policy:', err);
            setAutoplayBlocked(true);
            setIsLoading(false);
          });
      }
    };

    const handleEnded = () => {
      dismiss();
    };

    const handleTimeUpdate = () => {
      if (vid.duration && vid.currentTime >= vid.duration - 0.2) {
        dismiss();
      }
    };

    const handleError = (e) => {
      console.warn('Intro video error event:', e);
      setIsLoading(false);
      // Dismiss on fatal decode error
      setTimeout(dismiss, 1000);
    };

    vid.addEventListener('playing', handlePlaying);
    vid.addEventListener('canplay', handleCanPlay);
    vid.addEventListener('ended', handleEnded);
    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('error', handleError);

    // Initial attempt to start playback
    const initialPlay = vid.play();
    if (initialPlay !== undefined) {
      initialPlay
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setAutoplayBlocked(true);
          setIsLoading(false);
        });
    }

    return () => {
      clearTimeout(watchdogTimer);
      vid.removeEventListener('playing', handlePlaying);
      vid.removeEventListener('canplay', handleCanPlay);
      vid.removeEventListener('ended', handleEnded);
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('error', handleError);
    };
  }, []);

  /* User manual play if mobile browser blocked initial autoplay */
  const handleManualPlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        console.error('Manual play failed:', err);
      });
  };

  return (
    <div
      className="fixed inset-0 z-[99999] w-screen h-[100dvh] bg-[#000000] flex items-center justify-center overflow-hidden transition-opacity duration-600 ease-out select-none"
      style={{
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* ── Ambient Blurred Background (Cinematic Fill) ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center blur-2xl opacity-25 scale-110 pointer-events-none"
      >
        <source src="/vd1.mp4" type="video/mp4" />
      </video>

      {/* ── Main Video (Mobile: 16:9 uncropped, Laptop: full-bleed edge-to-edge) ── */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <div className="relative w-full aspect-video md:aspect-auto md:w-full md:h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            preload="auto"
            className="w-full h-full object-contain md:object-cover object-center pointer-events-none"
          >
            <source src="/vd1.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* ── Loading Spinner while buffering on mobile ── */}
      {isLoading && (
        <div className="absolute z-20 flex flex-col items-center gap-2 pointer-events-none">
          <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-sans">Loading Experience…</span>
        </div>
      )}

      {/* ── Tap to Play Overlay if mobile browser blocked initial autoplay ── */}
      {autoplayBlocked && !isPlaying && (
        <button
          onClick={handleManualPlay}
          className="absolute z-30 flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-black/85 backdrop-blur-xl border border-[#C5A880]/60 text-white cursor-pointer shadow-2xl active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-[#C5A880] text-black flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-[#C5A880] font-bold block">
              Tap to Play Intro
            </span>
            <span className="text-[9px] text-white/60 tracking-wider">
              KPR Productions Film
            </span>
          </div>
        </button>
      )}

      {/* ── Skip Intro Button (Bottom Right) ── */}
      <button
        onClick={dismiss}
        className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-30 px-4 sm:px-5 py-2 sm:py-2.5 bg-black/60 hover:bg-[#C5A880] backdrop-blur-md border border-white/30 hover:border-[#C5A880] text-white/90 hover:text-black text-[10px] sm:text-xs tracking-[0.2em] uppercase font-semibold rounded-md transition-all duration-300 cursor-pointer shadow-lg active:scale-95"
      >
        Skip Intro
      </button>
    </div>
  );
}
