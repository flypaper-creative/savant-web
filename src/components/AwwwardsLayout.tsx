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
    const timer = setTimeout(() => setIsActive(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-[#05070B] selection:bg-[#ff4068] selection:text-white">
      <div className="noise-overlay" />
      <div className="scanlines-overlay" />
      <div className="neural-lattice-overlay opacity-10" />
      <div className="vignette-heavy" />
      
      <div className={`anamorphic-flare ${isActive ? 'active' : ''}`} style={{ background: 'linear-gradient(90deg, transparent, rgba(230, 192, 59, 0.2), rgba(230, 192, 59, 0.5), rgba(230, 192, 59, 0.2), transparent)' }} />
      
      <div className={`grid-overlay ${isActive ? 'active' : ''}`}>
        <div className="grid-line horizontal top-1/4" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
        <div className="grid-line horizontal top-1/2" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
        <div className="grid-line horizontal top-3/4" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
        <div className="grid-line vertical left-1/4" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
        <div className="grid-line vertical left-1/2" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
        <div className="grid-line vertical left-3/4" style={{ background: 'rgba(61, 68, 77, 0.2)' }} />
      </div>

      <div className={`corner-accent tl ${isActive ? 'active' : ''}`} style={{ borderColor: 'rgba(255, 64, 104, 0.4)' }} />
      <div className={`corner-accent tr ${isActive ? 'active' : ''}`} style={{ borderColor: 'rgba(255, 64, 104, 0.4)' }} />
      <div className={`corner-accent bl ${isActive ? 'active' : ''}`} style={{ borderColor: 'rgba(230, 192, 59, 0.4)' }} />
      <div className={`corner-accent br ${isActive ? 'active' : ''}`} style={{ borderColor: 'rgba(230, 192, 59, 0.4)' }} />

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