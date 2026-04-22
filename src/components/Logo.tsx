import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link 
      to="/" 
      className="relative group block pointer-events-auto"
    >
      <div className="flex items-center gap-4">
        {/* Anchor for the Persistent 3D Logo */}
        <div id="logo-anchor" className="w-12 h-12 relative" />

        <div className="flex flex-col">
          <div className="font-display font-black text-xl md:text-2xl text-white tracking-tighter leading-none uppercase">
            SAVANT<span className="text-neon-pink">.</span>
          </div>
          <div className="font-mono text-[6px] tracking-[0.4em] text-white/40 uppercase font-bold">
            sovereign_os
          </div>
        </div>
      </div>
    </Link>
  );
}