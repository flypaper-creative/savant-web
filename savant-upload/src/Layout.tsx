import { Outlet, useLocation, Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import Navigation from './components/Navigation';
import { HUD } from './components/apps/HUD';
import { AdminPanel } from './components/AdminPanel';
import { AdminTrigger } from './components/AdminTrigger';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { useStore } from './store/useStore';
import { useLoading } from './contexts/LoadingContext';
import { NeuralTransition } from './components/NeuralTransition';
import { AmbientAudioController } from './components/AmbientAudioController';

export default function Layout() {
  const { booted, setBooted, scanlines, neuralOverlay, template, setTemplate } = useStore();
  const { isLoading } = useLoading();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();
  const isOS = location.pathname === '/os';

  useEffect(() => {
    if (!isLoading && !booted) {
      setBooted(true);
    }
  }, [isLoading, booted, setBooted]);

  useEffect(() => {
    if (isOS) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [isOS]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const getTemplateClasses = () => {
    switch (template) {
      case 1: return "bg-[#0a0c10] text-white selection:bg-[#00E5FF]/30 selection:text-white";
      case 2: return "bg-[#050505] text-white selection:bg-[#FF4068]/30 selection:text-white";
      case 3: return "bg-[#0d1117] text-white selection:bg-[#E6C03B]/30 selection:text-white";
      default: return "bg-[#0a0c10] text-white selection:bg-[#00E5FF]/30 selection:text-white";
    }
  };

  const { phase } = useLoading();
  const isTransitioning = phase === 'transition';
  const isComplete = phase === 'complete';

  return (
    <div className={`min-h-screen ${getTemplateClasses()} antialiased relative z-10 font-sans transition-colors duration-1000 overflow-x-hidden`}>
      <CustomCursor />
      
      {/* Zoom-in Content Wrapper */}
      <motion.div
        animate={{ 
          scale: isTransitioning ? [0.8, 1] : (isComplete ? 1 : 0.8),
          opacity: isTransitioning || isComplete ? 1 : 0,
          filter: isTransitioning ? 'blur(10px)' : 'blur(0px)'
        }}
        transition={{ 
          duration: 4, 
          ease: [0.19, 1, 0.22, 1],
          filter: { duration: 2.5 }
        }}
        className="relative w-full"
      >
        {/* Immersive Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <div className="noise-overlay" />
        {scanlines && <div className="scanlines-overlay" />}
        {neuralOverlay && <div className="neural-lattice-overlay opacity-10" />}
        <div className="vignette-heavy" />
      </div>
      
      {/* Global UI Elements */}
      <div className={`anamorphic-flare ${booted ? 'active' : ''}`} />
      
      <div className={`grid-overlay ${booted ? 'active' : ''}`}>
        <div className="grid-line horizontal top-1/4" />
        <div className="grid-line horizontal top-1/2" />
        <div className="grid-line horizontal top-3/4" />
        <div className="grid-line vertical left-1/4" />
        <div className="grid-line vertical left-1/2" />
        <div className="grid-line vertical left-3/4" />
      </div>

      <div className={`corner-accent tl ${booted ? 'active' : ''}`} />
      <div className={`corner-accent tr ${booted ? 'active' : ''}`} />
      <div className={`corner-accent bl ${booted ? 'active' : ''}`} />
      <div className={`corner-accent br ${booted ? 'active' : ''}`} />

      <div className={`telemetry-hud left ${booted ? 'active' : ''}`}>
        sys_status: optimal // latency: 0.001ms // sync: active
      </div>
      <div className={`telemetry-hud right ${booted ? 'active' : ''}`}>
        savant_os_v80.0.0 // coord: 34.0522° n, 118.2437° w
      </div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-gold z-[10000] origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      {!isOS && (
        <header className="fixed top-0 left-0 w-full p-8 md:p-12 z-[5000] flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-8 pointer-events-auto">
            {/* Logo removed as per request */}
          </div>

          <div className="flex items-center gap-12 pointer-events-auto">
            <Navigation />
          </div>
        </header>
      )}

      {/* Template Switcher */}
      <div className="fixed bottom-12 left-12 z-[5000] pointer-events-auto flex gap-4">
        {[1, 2, 3].map((t) => (
          <button
            key={t}
            onClick={() => setTemplate(t)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-[10px] transition-all ${
              template === t 
                ? 'border-current bg-current text-white mix-blend-difference' 
                : 'border-current/20 hover:border-current/50'
            }`}
          >
            t{t}
          </button>
        ))}
      </div>

      {/* HUD & Admin */}
      <div className="fixed bottom-12 right-12 z-[5000] pointer-events-auto flex flex-col items-end gap-6">
        <HUD />
        <AdminTrigger onClick={() => setIsAdminPanelOpen(true)} />
      </div>

      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />

      {/* Main Content */}
      <NeuralTransition>
        <motion.main
          key={location.pathname}
          className={`relative z-10 ${isOS ? 'h-screen overflow-hidden' : 'pt-48'}`}
        >
          <Outlet />
        </motion.main>
      </NeuralTransition>

      <AmbientAudioController />

      {/* Footer */}
      {!isOS && <Footer />}
      </motion.div>
    </div>
  );
}
