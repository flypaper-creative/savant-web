import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { SavantCard } from './ui/SavantCard';

export const HUD = () => {
  const [coords, setCoords] = useState({ x: '000', y: '000' });
  const [activityData, setActivityData] = useState<{val: number}[]>(Array(10).fill({val: 50}));
  const { activeNodes, latency, logs, updateMetrics, clearance } = useStore();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({
        x: e.clientX.toString().padStart(3, '0'),
        y: e.clientY.toString().padStart(3, '0')
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const interval = setInterval(() => {
      updateMetrics();
      setActivityData(p => [...p.slice(1), { val: 20 + Math.random() * 60 }]);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [updateMetrics]);

  return (
    <SavantCard className="hidden lg:flex flex-col text-right font-mono text-[9px] text-white/40 tracking-widest pointer-events-auto p-8 relative overflow-hidden group min-w-[240px] max-w-[320px] max-h-[80vh] overflow-y-auto custom-scrollbar rounded-3xl border-white/5 bg-obsidian/80 backdrop-blur-2xl shadow-2xl">
      {/* Neural Pulse */}
      <motion.div 
        className="absolute inset-0 bg-neon-pink/5 z-0 pointer-events-none"
        animate={{ 
          opacity: [0, 0.1, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 w-full h-[1px] bg-neon-pink/10 z-0 pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="flex items-center justify-end gap-3 mb-8">
        <motion.div 
          animate={{ 
            opacity: [1, 0.3, 1],
            scale: [1, 1.2, 1],
            boxShadow: clearance === 'ROOT' ? ['0 0 5px #e6c03b', '0 0 20px #e6c03b', '0 0 5px #e6c03b'] : ['0 0 5px #ff4068', '0 0 20px #ff4068', '0 0 5px #ff4068']
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-2.5 h-2.5 rounded-full ${clearance === 'ROOT' ? 'bg-gold' : 'bg-neon-pink'}`} 
        />
        <span className="text-white font-black tracking-[0.5em] uppercase text-[11px] italic">
          {clearance === 'ROOT' ? 'ROOT_ACCESS_GRANTED' : 'SAVANT_LATTICE_ACTIVE'}
        </span>
      </div>

      <div className="space-y-6 mb-10">
        {[
          { label: 'COORD_X', val: coords.x, color: 'text-white' },
          { label: 'COORD_Y', val: coords.y, color: 'text-white' },
          { label: 'LATENCY', val: `${latency.toFixed(6)}MS`, color: 'text-gold' },
          { label: 'NODES', val: activeNodes, color: 'text-white' },
          { label: 'CPU_LOAD', val: `${(useStore.getState().cpuUsage).toFixed(1)}%`, color: 'text-neon-pink' },
          { label: 'MEM_USAGE', val: `${(useStore.getState().memUsage).toFixed(1)}%`, color: 'text-white' },
          { label: 'NEURAL_SYNC', val: `${(useStore.getState().neuralSync).toFixed(2)}%`, color: 'text-gold' },
          { label: 'UPTIME', val: '142:12:44:02', color: 'text-white/40' },
          { label: 'THREAT', val: 'MINIMAL', color: 'text-emerald-400' },
          { label: 'ENTROPY', val: '0.0042', color: 'text-neon-pink' }
        ].map((stat, i) => (
          <div key={i} className="flex justify-between gap-12 border-b border-white/5 pb-2 group/stat">
            <span className="opacity-30 uppercase tracking-[0.3em] group-hover/stat:opacity-60 transition-opacity">{stat.label}</span>
            <b className={`${stat.color} font-mono tracking-tighter`}>{stat.val}</b>
          </div>
        ))}
      </div>

      <div className="h-24 w-full border border-white/5 bg-black/60 mb-10 p-4 relative rounded-2xl overflow-hidden group/chart">
        <div className="absolute top-2 left-4 font-mono text-[7px] text-white/30 uppercase tracking-[0.4em]">Neural_Activity_v5.2</div>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityData}>
            <Line 
              type="monotone" 
              dataKey="val" 
              stroke={clearance === 'ROOT' ? '#e6c03b' : '#ff4068'} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-8 border-t border-white/5 flex flex-col gap-3">
        <div className="font-mono text-[9px] text-white/30 uppercase mb-4 tracking-[0.5em] flex justify-between">
          <span>System_Logs</span>
          <span className="animate-pulse">LIVE</span>
        </div>
        <div className="space-y-3">
          {logs.slice(0, 8).map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-[8px] font-mono leading-tight flex gap-3 ${
                log.level === 'ERROR' ? 'text-neon-pink' : 
                log.level === 'CRITICAL' ? 'text-gold' : 
                'text-white/50'
              }`}
            >
              <span className="opacity-20 shrink-0">[{log.level.substring(0, 3)}]</span> 
              <span className="tracking-wider">{log.message}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-4">
         <div className="flex justify-between items-center">
           <span className="opacity-30 uppercase">BUILD</span>
           <b className="text-neon-pink font-black tracking-widest">80_ULTRA</b>
         </div>
         <div className="flex justify-between items-center">
           <span className="opacity-30 uppercase">ARCH</span>
           <b className="text-white tracking-widest">SOVEREIGN_v80</b>
         </div>
      </div>
    </SavantCard>
  );
};