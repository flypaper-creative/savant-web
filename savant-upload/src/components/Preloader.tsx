import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLoading } from '../contexts/LoadingContext';

import { useStore } from '../store/useStore';

export const Preloader: React.FC = () => {
  const { phase, progress, enterSite } = useLoading();
  const { template } = useStore();
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

  const showUI = phase === 'booting' || phase === 'ready';
  const showBackground = phase !== 'complete';
  const shardCount = 40;

  // Custom easing for Awwwards-style motion
  const customEase = [0.19, 1, 0.22, 1];

  const getTemplateBg = () => {
    switch (template) {
      case 1: return "bg-[#0a0c10]"; // Gunmetal Dark
      case 2: return "bg-[#050505]"; // Deep Obsidian
      case 3: return "bg-[#0d1117]"; // Midnight Blue/Gray
      default: return "bg-[#0a0c10]";
    }
  };

  return (
    <AnimatePresence>
      {showBackground && (
        <motion.div
          className="fixed inset-0 z-[14000] overflow-hidden text-white"
          exit={{ 
            opacity: 0, 
            transition: { duration: 4, ease: [0.19, 1, 0.22, 1] } 
          }}
        >
          {/* Flash Effect on Exit */}
          <motion.div 
            className="absolute inset-0 bg-white z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'transition' ? [0, 1, 0] : 0 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
          
          {/* Scanlines Overlay */}
          <div className="absolute inset-0 pointer-events-none z-[1] opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          
          {/* Semi-transparent Overlay - Allows 3D scene to be visible during loading */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{ 
              opacity: phase === 'transition' ? 0 : 1,
              scale: phase === 'transition' ? 1.5 : 1
            }}
            transition={{ duration: 4, ease: [0.19, 1, 0.22, 1] }}
            style={{
              background: `radial-gradient(circle at center, transparent 0%, rgba(10, 12, 16, 0.4) 40%, rgba(10, 12, 16, 0.95) 100%)`,
              backdropFilter: 'blur(0px)'
            }}
          />

          {/* 2D UI Overlay */}
          <AnimatePresence>
            {showUI && (
              <motion.div 
                className="absolute inset-0 z-10 flex flex-col justify-center items-center p-6 md:p-12 overflow-hidden text-white pointer-events-none"
                exit={{ 
                  opacity: 0, 
                  scale: 1.1,
                  filter: 'blur(20px)', 
                  transition: { duration: 2, ease: [0.19, 1, 0.22, 1] } 
                }}
              >
                {/* Minimalist Progress UI */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute bottom-[15%] flex flex-col items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                      {phase === 'booting' ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex flex-col items-center"
                        >
                          <div className="font-mono text-[10px] font-bold text-[#E6C03B] tracking-[1em] uppercase text-center leading-loose mb-8">
                            <motion.span
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 0.1, repeat: Infinity, repeatType: "reverse" }}
                            >
                              [ INITIALIZING_SAVANT_CORE ]
                            </motion.span>
                            <br/>
                            neural_sync // v80.0.0 // {progress.toString().padStart(3, '0')}%
                          </div>
                          <div className="w-[400px] h-[2px] bg-white/5 overflow-hidden relative border border-white/10 backdrop-blur-xl">
                            <motion.div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00E5FF] via-[#FF4068] to-[#E6C03B]"
                              style={{ width: `${progress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          
                          {/* Telemetry Data */}
                          <div className="mt-12 grid grid-cols-3 gap-12 opacity-20 font-mono text-[8px] tracking-widest uppercase">
                            <div className="flex flex-col gap-1">
                              <span>depth: abyssal</span>
                              <span>bioluminescence: active</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span>entities: 01</span>
                              <span>sync: stable</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span>lattice: locked</span>
                              <span>sovereignty: verified</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="enter"
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
                          onClick={(e) => {
                            e.stopPropagation();
                            enterSite();
                          }}
                          className="pointer-events-auto font-sans text-[12px] tracking-[1.5em] font-black text-white px-16 py-6 border border-white/20 bg-black/40 backdrop-blur-xl uppercase whitespace-nowrap outline-none relative overflow-hidden group transition-all duration-500 hover:border-white/60 hover:tracking-[1.8em] hover:shadow-[0_0_100px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <span className="relative z-10 ml-[1.5em]">[ initialize ]</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
