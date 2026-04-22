import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { path: '/', label: 'home', meta: 'core index' },
    { path: '/cognition', label: 'cognition', meta: 'thinking surfaces' },
    { path: '/systems', label: 'systems', meta: 'architectural logic' },
    { path: '/interface', label: 'interface', meta: 'display doctrine' },
    { path: '/lab', label: 'lab', meta: 'active experiments' },
    { path: '/signal', label: 'signal', meta: 'written transmissions' },
    { path: '/archive', label: 'archive', meta: 'project memory' },
    { path: '/contact', label: 'uplink', meta: 'direct line' },
  ];

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="pointer-events-auto">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative z-[10000] flex h-14 w-14 flex-col items-center justify-center gap-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
        aria-label="toggle navigation"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 6 : 0 }}
          className="h-px w-7 bg-white"
        />
        <motion.div
          animate={{ opacity: isOpen ? 0 : 1, x: isOpen ? 10 : 0 }}
          className="h-px w-7 bg-white"
        />
        <motion.div
          animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -6 : 0 }}
          className="h-px w-7 bg-white"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] bg-[#050608] text-white"
          >
            <div className="absolute inset-0 noise-overlay opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_50%)]" />

            <div className="absolute top-8 left-8 md:top-12 md:left-12 font-mono text-[10px] tracking-[0.5em] text-gold lowercase">
              savant // navigation field
            </div>

            <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-16 items-start">
                <nav className="flex flex-col gap-3 md:gap-5">
                  {items.map((item, index) => {
                    const active = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className="group text-left"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -24 }}
                          transition={{
                            duration: 0.7,
                            delay: 0.06 * index,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="flex items-start gap-5 md:gap-8"
                        >
                          <span className="mt-3 font-mono text-[10px] md:text-xs tracking-[0.4em] text-white/20">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div>
                            <div
                              className={`text-[clamp(2.4rem,7vw,7.5rem)] font-black tracking-[-0.06em] lowercase leading-[0.92] transition-colors duration-500 ${
                                active ? 'text-gold' : 'text-white group-hover:text-gold'
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="mt-1 font-mono text-[9px] md:text-[10px] tracking-[0.28em] text-white/28 lowercase">
                              {item.meta}
                            </div>
                          </div>
                        </motion.div>
                      </button>
                    );
                  })}
                </nav>

                <div className="max-w-md">
                  <div className="font-mono text-[10px] tracking-[0.4em] text-white/25 lowercase mb-6">
                    current doctrine
                  </div>

                  <p className="text-lg md:text-xl leading-[1.6] text-white/55 lowercase">
                    savant is not arranged like a conventional agency site.
                    each page is meant to feel like a distinct chamber in a
                    larger cognitive structure, with its own rhythm,
                    atmosphere, and purpose.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row justify-between gap-6 font-mono text-[9px] tracking-[0.32em] text-white/25 lowercase">
              <span>system state // nominal</span>
              <span>render field // coherent</span>
              <span>signal quality // elevated</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}