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
    primary: 'bg-current/5 border-current/10 text-current hover:bg-[#FF4068] hover:border-[#FF4068] hover:text-white',
    secondary: 'bg-current/5 border-current/10 text-current hover:bg-[#E6C03B] hover:border-[#E6C03B] hover:text-white',
    ghost: 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-current/5',
    outline: 'bg-transparent border-current/20 text-current hover:bg-current/5 hover:border-current',
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
        backgroundColor: 'rgba(var(--color-current), 0.1)',
        borderColor: 'rgba(var(--color-current), 0.4)',
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      disabled={disabled}
      type={type}
      className={`px-12 py-5 border border-current/20 bg-current/5 backdrop-blur-xl text-current font-mono text-[10px] tracking-[1.2em] font-black transition-all duration-500 hover:tracking-[1.4em] hover:shadow-[0_0_60px_rgba(var(--color-current),0.1)] ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
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
          className="absolute inset-0 bg-gradient-to-r from-transparent via-current/5 to-transparent pointer-events-none"
        />
      )}
    </motion.button>
  );
};
