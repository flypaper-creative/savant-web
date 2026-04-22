import React from 'react';
import { motion } from 'motion/react';

interface MarqueeProps {
  items: string[];
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ 
  items, 
  speed = 20, 
  direction = 'left',
  className = ""
}) => {
  return (
    <div className={`relative flex overflow-hidden whitespace-nowrap py-12 border-y border-white/5 ${className}`}>
      <motion.div
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex gap-24 items-center"
      >
        {/* Render items twice for seamless loop */}
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-24">
            <span className="font-display font-black text-[clamp(4rem,15vw,12rem)] text-white/10 tracking-tighter  hover:text-neon-pink transition-colors duration-500 cursor-default">
              {item}
            </span>
            <div className="w-4 h-4 bg-neon-pink rotate-45" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
