import React from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';

export const SystemStatus: React.FC = () => {
  const { activeNodes, latency, clearance } = useStore();

  return (
    <div className="h-10 border-t border-current/5 bg-current/5 backdrop-blur-md flex items-center justify-between px-10 font-mono text-[10px] text-current/30">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 group cursor-help">
          <span className="tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">lattice_nodes:</span>
          <span className="text-current font-black font-tech">{activeNodes}</span>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <span className="tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">neural_latency:</span>
          <span className="text-[#E6C03B] font-black font-tech">{latency.toFixed(4)}ms</span>
        </div>
        <div className="flex items-center gap-3 group cursor-help">
          <span className="tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">core_state:</span>
          <span className="text-[#FF4068] font-black tracking-widest animate-pulse">stable_v80</span>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <span className="tracking-[0.2em] opacity-50">mem_allocation:</span>
          <div className="w-32 h-1 bg-current/5 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-[#FF4068]/40 to-[#FF4068]"
              animate={{ 
                width: ['40%', '85%', '60%'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="tracking-[0.2em] opacity-50">signal_strength:</span>
          <div className="flex gap-1 items-end h-3">
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={i} 
                className={`w-1 rounded-t-sm ${i < 4 ? 'bg-emerald-500' : 'bg-current/10'}`}
                animate={i < 4 ? { height: [4, 12, 8] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-current/10 pl-10">
          <div className={`w-2 h-2 rounded-full ${clearance === 'ROOT' ? 'bg-[#E6C03B]' : 'bg-[#FF4068]'} animate-ping`} />
          <div className="opacity-40 font-black tracking-[0.4em] text-[8px]">
            {clearance === 'ROOT' ? 'root_override_active' : 'sovereign_v80_ultra'}
          </div>
        </div>
      </div>
    </div>
  );
};
