import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Cpu, Zap, Activity } from 'lucide-react';

const commands = [
  { cmd: 'init_savant_core', response: 'core_v80.0.0_active' },
  { cmd: 'scan_operational_matrix', response: 'matrix_stable_100%' },
  { cmd: 'sync_neural_lattice', response: 'lattice_synchronized' },
  { cmd: 'verify_data_sovereignty', response: 'sovereignty_verified' },
  { cmd: 'deploy_bespoke_identity', response: 'identity_deployed' },
];

export const NeuralCommand = () => {
  const [history, setHistory] = useState<{ cmd: string, response: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < commands.length) {
        setIsTyping(true);
        setTimeout(() => {
          setHistory(prev => [...prev, commands[currentIndex]]);
          setCurrentIndex(prev => prev + 1);
          setIsTyping(false);
        }, 1500);
      } else {
        setHistory([]);
        setCurrentIndex(0);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="w-full max-w-md font-mono text-[10px] text-white/40 tracking-widest p-6 border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-3 h-3 text-gold opacity-50" />
          <span className="text-white/60">savant_os_terminal</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4 min-h-[160px] flex flex-col justify-end">
        <AnimatePresence mode="popLayout">
          {history.map((item, i) => (
            <motion.div 
              key={`${item.cmd}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="text-gold opacity-50">❯</span>
                <span className="text-white/80">{item.cmd}</span>
              </div>
              <div className="flex items-center gap-3 pl-6">
                <span className="text-white/20">↳</span>
                <span className="text-white/40 italic">{item.response}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-gold opacity-50">❯</span>
            <span className="w-2 h-4 bg-gold/40 animate-pulse" />
          </motion.div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-20">
        <div className="flex gap-4">
          <Shield className="w-3 h-3" />
          <Cpu className="w-3 h-3" />
          <Zap className="w-3 h-3" />
        </div>
        <Activity className="w-3 h-3 animate-pulse" />
      </div>

      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 w-full h-[1px] bg-gold/5 pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};
