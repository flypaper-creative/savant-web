import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { uiSound } from '../../utils/audio';

interface SavantButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  icon?: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const SavantButton = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  icon,
  disabled = false,
  type = 'button'
}: SavantButtonProps) => {
  const variantClasses = {
    primary: 'bg-white/[0.05] border-white/10 text-white hover:bg-neon-pink hover:border-neon-pink hover:text-white',
    secondary: 'bg-white/[0.05] border-white/10 text-white hover:bg-gold hover:border-gold hover:text-obsidian',
    ghost: 'bg-transparent border-transparent text-white/60 hover:text-white hover:bg-white/5',
    outline: 'bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white',
  };

  const handleClick = () => {
    if (disabled) return;
    uiSound.playClick();
    onClick?.();
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { 
        scale: 1.02,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      disabled={disabled}
      type={type}
      className={`px-12 py-5 border border-white/20 bg-black/40 backdrop-blur-xl text-white font-mono text-[10px] tracking-[1.2em] font-black uppercase transition-all duration-500 hover:tracking-[1.4em] hover:shadow-[0_0_60px_rgba(255,255,255,0.1)] ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
    >
      <div className="relative z-10 flex items-center justify-center gap-3">
        {icon && <motion.span 
          animate={disabled ? {} : { x: [0, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="opacity-60 group-hover:opacity-100 transition-opacity"
        >
          {icon}
        </motion.span>}
        <span>{children}</span>
      </div>
      
      {/* Subtle background glow on hover */}
      {!disabled && (
        <motion.div 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        />
      )}
    </motion.button>
  );
};