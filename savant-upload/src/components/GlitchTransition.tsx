import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const GlitchTransition = ({ isVisible, onComplete }: { isVisible: boolean, onComplete?: () => void }) => {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden bg-obsidian"
        >
          {/* Glitch Slices */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: '-100%' }}
              animate={{ 
                x: ['-100%', '0%', '100%'],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 0.4, 
                delay: i * 0.05,
                ease: "easeInOut"
              }}
              className="absolute w-full bg-neon-pink/20"
              style={{ 
                height: `${100 / 10}%`,
                top: `${i * (100 / 10)}%`
              }}
            />
          ))}

          {/* Random Noise Blocks */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`noise-${i}`}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                scaleX: [1, 2, 1]
              }}
              transition={{ 
                duration: 0.2, 
                delay: Math.random() * 0.3,
                repeat: 2
              }}
              className="absolute w-40 h-20 bg-white/10 blur-sm"
              style={{ 
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
            />
          ))}

          {/* Flash */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white/5"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
