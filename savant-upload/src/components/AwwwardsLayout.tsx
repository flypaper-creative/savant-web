import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface AwwwardsLayoutProps {
  children: React.ReactNode;
}

export const AwwwardsLayout: React.FC<AwwwardsLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Trigger entry animations
    const timer = setTimeout(() => setIsActive(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-current/5 selection:bg-[#FF4068] selection:text-white">
      {/* Immersive Overlays */}
      <div className="noise-overlay" />
      <div className="scanlines-overlay" />
      <div className="neural-lattice-overlay opacity-10" />
      <div className="vignette-heavy" />
      
      {/* Global UI Elements */}
      <div className={`anamorphic-flare ${isActive ? 'active' : ''}`} />
      
      <div className={`grid-overlay ${isActive ? 'active' : ''}`}>
        <div className="grid-line horizontal top-1/4" />
        <div className="grid-line horizontal top-1/2" />
        <div className="grid-line horizontal top-3/4" />
        <div className="grid-line vertical left-1/4" />
        <div className="grid-line vertical left-1/2" />
        <div className="grid-line vertical left-3/4" />
      </div>

      <div className={`corner-accent tl ${isActive ? 'active' : ''}`} />
      <div className={`corner-accent tr ${isActive ? 'active' : ''}`} />
      <div className={`corner-accent bl ${isActive ? 'active' : ''}`} />
      <div className={`corner-accent br ${isActive ? 'active' : ''}`} />

      <div className={`telemetry-hud left ${isActive ? 'active' : ''}`}>
        sys_status: optimal // latency: 0.001ms // sync: active
      </div>
      <div className={`telemetry-hud right ${isActive ? 'active' : ''}`}>
        savant_os_v80.0.0 // coord: 34.0522° n, 118.2437° w
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="relative z-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};
