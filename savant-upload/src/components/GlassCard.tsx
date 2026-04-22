import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const GlassCard = ({ children, className = '', hoverEffect = true, title, subtitle, onClick }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { 
        y: -3, 
        scale: 1.005,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      } : {}}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border border-current/10 bg-current/5 backdrop-blur-xl group flex flex-col transition-colors duration-500 ${className}`}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-current/5 to-transparent pointer-events-none" />
      
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-current/5 bg-current/5 flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col relative z-10">
            {title && <span className="font-mono text-[10px] tracking-[0.3em] opacity-40 mb-1">{title.toLowerCase()}</span>}
            {subtitle && <span className="font-display font-bold text-sm tracking-tight">{subtitle.toLowerCase()}</span>}
          </div>
          <div className="flex gap-1 relative z-10">
            <div className="w-1 h-1 rounded-full bg-[#FF4068]/40" />
            <div className="w-1 h-1 rounded-full bg-current/10" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1">
        {children}
      </div>

      {/* Hover Glow */}
      {hoverEffect && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-current/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      )}
    </motion.div>
  );
};
