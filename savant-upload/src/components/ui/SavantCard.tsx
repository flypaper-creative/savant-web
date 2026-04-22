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
      className={`savant-card flex flex-col group border border-white/5 transition-all duration-700 ${className} bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden`}
    >
      {/* Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] group-hover:opacity-[0.05] transition-opacity duration-700" />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-10 h-10 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-[1px] h-4 bg-gold" />
        <div className="absolute top-0 left-0 w-4 h-[1px] bg-gold" />
      </div>
      <div className="absolute bottom-0 right-0 w-10 h-10 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-700 rotate-180">
        <div className="absolute top-0 left-0 w-[1px] h-4 bg-gold" />
        <div className="absolute top-0 left-0 w-4 h-[1px] bg-gold" />
      </div>

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
          
          {/* Subtle animated line */}
          <motion.div 
            className="absolute bottom-0 left-0 h-[1px] bg-[#FF4068]/30"
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
