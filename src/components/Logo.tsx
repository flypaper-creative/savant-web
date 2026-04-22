import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Logo() {
  const { booted } = useStore();

  return (
    <Link to="/" className="group flex items-center gap-4 py-2 pointer-events-auto min-h-[40px]">
      <div className={`relative flex items-center justify-center transition-all duration-700 ${booted ? 'w-0 h-0 opacity-0' : 'w-10 h-10 opacity-100'}`}>
        {!booted && (
          <>
            <motion.div
              className="absolute inset-0 border border-white/20 rotate-45 group-hover:border-gold/50 group-hover:rotate-90 transition-all duration-700"
            />
            <motion.div
              className="w-3 h-3 bg-white group-hover:bg-neon-pink transition-colors duration-500 shadow-[0_0_15px_rgba(255,64,104,0)] group-hover:shadow-[0_0_20px_rgba(255,64,104,0.8)]"
            />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-neon-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        )}
      </div>

      <div className={`flex flex-col overflow-hidden transition-all duration-700 ${booted ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[12rem] opacity-100 translate-x-0'}`}>
        <span className="font-display font-black text-2xl text-white tracking-tighter leading-none whitespace-nowrap">
          savant<span className="text-gold">.</span>
        </span>
        <span className="font-mono text-[7px] text-white/30 tracking-[0.6em] leading-none mt-1 whitespace-nowrap">
          sovereign_os
        </span>
      </div>
    </Link>
  );
}
