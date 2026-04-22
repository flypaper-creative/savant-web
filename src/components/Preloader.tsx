import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoading } from '../contexts/LoadingContext';

export const Preloader: React.FC = () => {
  const { phase, progress } = useLoading();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const showUI = phase === 'booting' || phase === 'cinematic';
  const showBackground = phase !== 'complete';

  return (
    <AnimatePresence>
      {showBackground && (
        <motion.div
          className="fixed inset-0 z-[14000] overflow-hidden pointer-events-none"
          exit={{ opacity: 0, transition: { duration: 1.5, ease: [0.19, 1, 0.22, 1] } }}
        >
          {/* Solid Background - Fades out to reveal the site underneath */}
          <motion.div 
            className="absolute inset-0 bg-obsidian"
            animate={{ opacity: phase === 'transition' ? 0 : 1 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          />

          {/* 2D UI Overlay */}
          <AnimatePresence>
            {showUI && (
              <motion.div 
                className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12 overflow-hidden"
                exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 1 } }}
              >
                {/* Top Left */}
                <motion.div 
                  animate={{ x: mouse.x * -20, y: mouse.y * 20 }}
                  className="font-mono text-[8px] md:text-[10px] text-white/40 tracking-[0.5em] uppercase"
                >
                  System_Boot // Sequence_V36.1<br/>
                  <span className="text-neon-pink">God_Tier_Protocol_Active</span>
                </motion.div>

                {/* Center */}
                <div className="flex-1 flex flex-col items-center justify-end pb-20">
                  <motion.div
                    className="flex flex-col items-center gap-8 w-full max-w-md"
                  >
                    <div className="text-7xl md:text-9xl font-display font-black text-white tracking-tighter mix-blend-overlay opacity-80">
                      {progress.toString().padStart(3, '0')}<span className="text-4xl text-neon-pink">%</span>
                    </div>
                    <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink to-gold"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="font-mono text-[8px] md:text-[10px] text-white/40 tracking-[1em] uppercase text-center">
                      Synthesizing_Core_Architecture
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Right */}
                <motion.div 
                  animate={{ x: mouse.x * 20, y: mouse.y * -20 }}
                  className="absolute bottom-6 md:bottom-12 right-6 md:right-12 text-right font-mono text-[6px] md:text-[8px] text-white/20 tracking-[0.5em] uppercase"
                >
                  <div>Neural_Lattice: {progress < 100 ? 'Syncing...' : 'Active'}</div>
                  <div>Data_Sovereignty: Verified</div>
                  <div className="text-gold mt-2">© 2026 SAVANT_CORE</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};