import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';

export const SystemStatus: React.FC = () => {
  const { activeNodes, latency, clearance } = useStore();

  return (
    <div className="h-10 border-t border-white/5 bg-obsidian/90 backdrop-blur-md flex items-center justify-between px-10 font-mono text-[10px] text-white/30">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 group cursor-help">
          <span className="uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">Lattice_Nodes:</span>
          <span className="text-white font-black font-tech">{activeNodes}</span>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <span className="uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">Neural_Latency:</span>
          <span className="text-gold font-black font-tech">{latency.toFixed(4)}ms</span>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <span className="uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">Core_State:</span>
          <span className="text-neon-pink font-black tracking-widest animate-pulse">STABLE_v80</span>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <span className="uppercase tracking-[0.2em] opacity-50">Mem_Allocation:</span>
          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-neon-pink/40 to-neon-pink"
              animate={{ 
                width: ['40%', '85%', '60%'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="uppercase tracking-[0.2em] opacity-50">Signal_Strength:</span>
          <div className="flex gap-1 items-end h-3">
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`w-1 rounded-t-sm ${i < 4 ? 'bg-emerald-500' : 'bg-white/10'}`}
                animate={i < 4 ? { height: [4, 12, 8] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-white/10 pl-10">
          <div className={`w-2 h-2 rounded-full ${clearance === 'ROOT' ? 'bg-gold' : 'bg-neon-pink'} animate-ping`} />
          <div className="text-white/40 font-black uppercase tracking-[0.4em] text-[8px]">
            {clearance === 'ROOT' ? 'ROOT_OVERRIDE_ACTIVE' : 'SOVEREIGN_v80_ULTRA'}
          </div>
        </div>
      </div>
    </div>
  );
};