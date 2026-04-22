import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface SavantCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  delay?: number;
}

export const SavantCard = ({ children, title, subtitle, className = '', delay = 0 }: SavantCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(255,64,104,0.05)',
        borderColor: 'rgba(255,64,104,0.2)'
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
      className={`savant-card flex flex-col group border border-white/5 transition-colors duration-500 ${className}`}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-[1px] h-full bg-neon-pink" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-pink" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-500 rotate-180">
        <div className="absolute top-0 left-0 w-[1px] h-full bg-neon-pink" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-pink" />
      </div>

      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between relative overflow-hidden">
          <div className="flex flex-col relative z-10">
            {title && <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">{title}</span>}
            {subtitle && <span className="font-display font-bold text-sm tracking-tight text-white">{subtitle}</span>}
          </div>
          <div className="flex gap-1 relative z-10">
            <div className="w-1 h-1 rounded-full bg-neon-pink/40" />
            <div className="w-1 h-1 rounded-full bg-white/10" />
          </div>
          
          {/* Subtle animated line */}
          <motion.div 
            className="absolute bottom-0 left-0 h-[1px] bg-neon-pink/30"
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            transition={{ duration: 1.5, delay: delay + 0.5 }}
          />
        </div>
      )}
      <div className="p-6 flex-1 relative z-10">
        {children}
      </div>
    </motion.div>
  );
};