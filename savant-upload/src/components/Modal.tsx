import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TechButton } from './TechButton';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl border border-white/10 bg-obsidian/80 backdrop-blur-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Scanning Line */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[2px] bg-neon-pink/50 z-10"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink" />
              <h3 className="font-display font-black text-2xl text-white tracking-tighter ">{title}</h3>
              <button 
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto font-mono text-sm text-white/60 leading-relaxed">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
