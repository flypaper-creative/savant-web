import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from 'motion/react';
import { uiSound } from '../utils/audio';
import { TextScramble } from './TextScramble';

interface TechButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: React.ReactNode;
  colorClass?: string;
  borderClass?: string;
  width?: string;
  height?: string;
  magnetic?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
}

export const TechButton: React.FC<TechButtonProps> = ({
  children,
  colorClass = 'bg-[#FF4068]',
  borderClass = 'border-[#FF4068]',
  width = 'w-48',
  height = 'h-16',
  className = '',
  magnetic = false,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Magnetic effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Mouse position for border glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    
    // For magnetic effect
    if (magnetic) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      x.set(distanceX * 0.2);
      y.set(distanceY * 0.2);
    }

    // For border glow
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    if (props.disabled) return;
    setIsHovered(true);
    uiSound.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (magnetic) {
      x.set(0);
      y.set(0);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled) return;
    uiSound.playClick();
    
    // Generate particles
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      const newParticles = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + i,
        x: clickX,
        y: clickY,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 60 + 20,
        size: Math.random() * 4 + 2,
      }));
      
      setParticles(prev => [...prev, ...newParticles]);
    }

    if (onClick) onClick(e);
  };

  const removeParticle = (id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  // Glitch text effect on hover
  const [glitchText, setGlitchText] = useState<string | null>(null);
  const originalText = typeof children === 'string' ? children : null;

  useEffect(() => {
    if (isHovered && originalText) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      let iterations = 0;
      
      const interval = setInterval(() => {
        setGlitchText(
          originalText
            .split('')
            .map((char, index) => {
              if (index < iterations) return originalText[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        
        if (iterations >= originalText.length) {
          clearInterval(interval);
          setGlitchText(null);
        }
        iterations += 1 / 3;
      }, 30);
      
      return () => clearInterval(interval);
    } else {
      setGlitchText(null);
    }
  }, [isHovered, originalText]);

  const backgroundGlow = useMotionTemplate`radial-gradient(circle 80px at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.15), transparent 100%)`;

  return (
    <motion.button
      ref={buttonRef}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`group relative ${width} ${height} flex items-center justify-center focus:outline-none overflow-hidden bg-current/5 border border-current/10 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {/* Dynamic Border Glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: backgroundGlow }}
      />

      {/* Hover Fill */}
      <div 
        className={`absolute inset-0 ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`}
      />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

      {/* Particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
            animate={{ 
              x: p.x + Math.cos(p.angle) * p.speed, 
              y: p.y + Math.sin(p.angle) * p.speed, 
              opacity: 0,
              scale: 0
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => removeParticle(p.id)}
            className="absolute pointer-events-none bg-white rounded-full mix-blend-overlay"
            style={{ width: p.size, height: p.size, marginLeft: -p.size/2, marginTop: -p.size/2 }}
          />
        ))}
      </AnimatePresence>

      {/* Content */}
      <span className="relative z-10 font-mono text-[10px] font-bold tracking-[0.2em] text-current group-hover:text-white transition-colors duration-500 text-center leading-tight px-8">
        {glitchText || children}
      </span>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current/30 group-hover:border-white/50 transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current/30 group-hover:border-white/50 transition-colors duration-300" />
    </motion.button>
  );
};
