import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

export const NeuralTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center bg-obsidian/20 backdrop-blur-sm"
          >
            {/* Fractal Grid Expansion */}
            <div className="relative w-full h-full">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0, rotate: 0 }}
                  animate={{ 
                    scale: [0, 2, 4], 
                    opacity: [0, 0.3, 0],
                    rotate: i * 45
                  }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "circOut",
                    delay: i * 0.1
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vh] h-[50vh] border border-gold/20"
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                />
              ))}
              
              {/* Scanning Lines */}
              <motion.div 
                initial={{ y: '-100%' }}
                animate={{ y: '100%' }}
                transition={{ duration: 1, ease: "linear" }}
                className="absolute inset-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-pink/50 to-transparent blur-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
