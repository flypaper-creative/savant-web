import React from 'react';
import { motion } from 'motion/react';

interface GlowProps {
  children: React.ReactNode;
  color?: string;
  blur?: string;
  opacity?: number;
  className?: string;
}

export default function Glow({ 
  children, 
  color = "rgba(255,0,60,0.3)", 
  blur = "100px", 
  opacity = 0.5,
  className = "" 
}: GlowProps) {
  return (
    <div className={`relative group ${className}`}>
      <motion.div
        className="absolute inset-0 -z-10 rounded-full"
        style={{ 
          backgroundColor: color, 
          filter: `blur(${blur})`,
          opacity: 0
        }}
        whileHover={{ opacity }}
        transition={{ duration: 0.5 }}
      />
      {children}
    </div>
  );
}
