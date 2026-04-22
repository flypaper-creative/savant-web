import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { SavantCard } from '../ui/SavantCard';

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
    <SavantCard className="hidden lg:flex flex-col text-right font-mono text-[9px] opacity-40 tracking-widest pointer-events-auto p-8 relative overflow-hidden group min-w-[240px] max-w-[320px] max-h-[80vh] overflow-y-auto custom-scrollbar rounded-3xl border-current/5 bg-current/5 backdrop-blur-2xl shadow-2xl">
      {/* Neural Pulse */}
      <motion.div 
        className="absolute inset-0 bg-current/5 z-0 pointer-events-none"
        animate={{ 
          opacity: [0, 0.1, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Scanning Line */}
      <motion.div 
        className="absolute inset-0 w-full h-[1px] bg-current/10 z-0 pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="flex items-center justify-end gap-3 mb-8">
        <motion.div 
          animate={{ 
            opacity: [1, 0.3, 1],
            scale: [1, 1.2, 1],
            boxShadow: clearance === 'ROOT' ? ['0 0 5px currentColor', '0 0 20px currentColor', '0 0 5px currentColor'] : ['0 0 5px currentColor', '0 0 20px currentColor', '0 0 5px currentColor']
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-2.5 h-2.5 rounded-full bg-current`} 
        />
        <span className="font-black tracking-[0.5em] text-[11px] italic">
          {clearance === 'ROOT' ? 'root_access_granted' : 'savant_lattice_active'}
        </span>
      </div>

      <div className="space-y-6 mb-10">
        {[
          { label: 'coord_x', val: coords.x, color: '' },
          { label: 'coord_y', val: coords.y, color: '' },
          { label: 'latency', val: `${latency.toFixed(6)}ms`, color: 'opacity-70' },
          { label: 'nodes', val: activeNodes, color: '' },
          { label: 'cpu_load', val: `${(useStore.getState().cpuUsage).toFixed(1)}%`, color: 'opacity-70' },
          { label: 'mem_usage', val: `${(useStore.getState().memUsage).toFixed(1)}%`, color: '' },
          { label: 'neural_sync', val: `${(useStore.getState().neuralSync).toFixed(2)}%`, color: 'opacity-70' },
          { label: 'uptime', val: '142:12:44:02', color: 'opacity-40' },
          { label: 'threat', val: 'minimal', color: 'opacity-70' },
          { label: 'entropy', val: '0.0042', color: 'opacity-70' }
        ].map((stat, i) => (
          <div key={i} className="flex justify-between gap-12 border-b border-current/10 pb-2 group/stat">
            <span className="opacity-30 tracking-[0.3em] group-hover/stat:opacity-60 transition-opacity">{stat.label}</span>
            <b className={`${stat.color} font-mono tracking-tighter`}>{stat.val}</b>
          </div>
        ))}
      </div>

      <div className="h-24 w-full border border-current/10 bg-current/5 mb-10 p-4 relative rounded-2xl overflow-hidden group/chart">
        <div className="absolute top-2 left-4 font-mono text-[7px] opacity-30 tracking-[0.4em]">neural_activity_v5.2</div>
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:10px_10px]" />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityData}>
            <Line 
              type="monotone" 
              dataKey="val" 
              stroke="currentColor" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-8 border-t border-current/10 flex flex-col gap-3">
        <div className="font-mono text-[9px] opacity-30 mb-4 tracking-[0.5em] flex justify-between">
          <span>system_logs</span>
          <span className="animate-pulse">live</span>
        </div>
        <div className="space-y-3">
          {logs.slice(0, 8).map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-[8px] font-mono leading-tight flex gap-3 ${
                log.level === 'ERROR' ? 'text-[#FF4068]' : 
                log.level === 'CRITICAL' ? 'text-[#E6C03B]' : 
                'opacity-50'
              }`}
            >
              <span className="opacity-20 shrink-0">[{log.level.substring(0, 3).toLowerCase()}]</span> 
              <span className="tracking-wider">{log.message.toLowerCase()}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-current/10 flex flex-col gap-4">
         <div className="flex justify-between items-center">
           <span className="opacity-30">build</span>
           <b className="text-[#FF4068] font-black tracking-widest">80_ultra</b>
         </div>
         <div className="flex justify-between items-center">
           <span className="opacity-30">arch</span>
           <b className="tracking-widest">sovereign_v80</b>
         </div>
      </div>
    </SavantCard>
  );
};
