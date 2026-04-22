import React from 'react';
import { motion } from 'motion/react';

export default function SiteAtmosphere() {
  return (
    <div className="fixed inset-0 z-[50] pointer-events-none overflow-hidden">
      <motion.div
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 w-full h-[1px] bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_16%,rgba(3,3,3,0.82)_100%)]" />
      <div className="absolute inset-0 opacity-10 neural-lattice-overlay" />
      <div className="absolute inset-0 atmosphere-prismatic" />

      <motion.div
        animate={{ opacity: [0, 0.05, 0, 0.02, 0] }}
        transition={{ duration: 10, repeat: Infinity, times: [0, 0.1, 0.12, 0.5, 1] }}
        className="absolute inset-0 bg-neon-pink/5 mix-blend-overlay"
      />
    </div>
  );
}
