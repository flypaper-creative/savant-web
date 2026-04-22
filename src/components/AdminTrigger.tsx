import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

interface AdminTriggerProps {
  onClick: () => void;
}

export const AdminTrigger: React.FC<AdminTriggerProps> = ({ onClick }) => {
  const { user, isAdmin } = useAuth();

  return (
    <motion.button
      onClick={onClick}
      className="pointer-events-auto flex items-center gap-3 px-5 py-3 border border-white/10 bg-obsidian/80 backdrop-blur-2xl hover:border-neon-pink/50 transition-all duration-500 group relative overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100"
        style={{ 
          background: 'linear-gradient(to bottom, transparent 0%, rgba(153,0,0,0.3) 50%, transparent 100%)',
          height: '2px',
          width: '100%'
        }}
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute top-0 left-0 w-[2px] h-full bg-neon-pink/50 group-hover:bg-neon-pink transition-all duration-500" />
      
      <Shield className={`w-4 h-4 ${user ? (isAdmin ? 'text-neon-pink' : 'text-gold') : 'text-white/40'} group-hover:text-neon-pink transition-colors duration-500 relative z-20`} />
      
      <span className="font-mono text-[10px] font-black tracking-[0.4em] text-white/60 group-hover:text-white transition-colors duration-500 uppercase relative z-20">
        {user ? (isAdmin ? 'ADMIN_ACTIVE' : 'USER_ACTIVE') : 'ADMIN_ACCESS'}
      </span>

      {user && (
        <div className="w-1.5 h-1.5 bg-neon-pink rounded-full animate-pulse ml-1 relative z-20 shadow-[0_0_10px_rgba(255,64,104,0.8)]" />
      )}
    </motion.button>
  );
};