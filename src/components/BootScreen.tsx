import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, Suspense } from 'react';
import Savant3DLogo from './Savant3DLogo';
import { BRANDING } from '../styles/branding';

const bootStatuses = [
  "INITIALIZING_KERNEL",
  "MAPPING_FRACTAL_LATTICE",
  "ALLOCATING_SHARD_MEMORY",
  "UPLINK_SECURED",
  "WELCOME_SAVANT"
];

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % bootStatuses.length);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(statusInterval);
          setTimeout(onComplete, 1200);
          return 100;
        }
        return prev + 1.2;
      });
    }, 60);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.05,
        filter: 'blur(30px)',
        transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } 
      }}
      className="fixed inset-0 bg-obsidian z-[10000] flex items-center justify-center overflow-hidden"
    >
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-white/10 h-full" />
          ))}
        </div>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-2xl px-12">
        {/* Central 3D Logo */}
        <div className="w-full h-[40vh] mb-12">
          <Suspense fallback={null}>
            <Savant3DLogo className="w-full h-full" />
          </Suspense>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="flex flex-col items-center gap-8 w-full"
        >
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tighter uppercase">
              SAVANT<span className="text-neon-pink">.</span>
            </h1>
            <div className="font-mono text-[8px] text-white/20 tracking-[0.8em] uppercase">
              sovereign_os_v5.5
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="font-mono text-[9px] text-neon-pink tracking-[0.5em] h-4 uppercase font-bold">
              {bootStatuses[statusIdx]}
            </div>
            
            <div className="relative w-full h-[1px] bg-white/5 overflow-hidden">
              <motion.div 
                className="h-full bg-neon-pink shadow-[0_0_15px_rgba(255,64,104,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="font-mono text-[8px] text-white/10 tracking-[0.4em] uppercase">
              {Math.round(progress)}%_STABILIZED
            </div>
          </div>
        </motion.div>

        {/* Technical Data Stream - Minimalist */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-between opacity-10 font-mono text-[6px] tracking-[0.3em] uppercase">
          <span>[SYS] KERNEL_LOAD_SUCCESS</span>
          <span>[NET] UPLINK_ESTABLISHED</span>
          <span>[USR] IDENTITY_VERIFIED</span>
        </div>
      </div>
    </motion.div>
  );
}