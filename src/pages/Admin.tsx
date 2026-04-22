import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Shield, Activity, Database, Cpu, Zap, Lock, Terminal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SavantCard } from '../components/ui/SavantCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function Admin() {
  const { logs, cpuUsage, memUsage, systemLoad, activeNodes, neuralSync } = useStore();
  const [history, setHistory] = useState<{time: string, cpu: number, mem: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const newData = [...prev, { 
          time: new Date().toLocaleTimeString(), 
          cpu: cpuUsage, 
          mem: memUsage 
        }].slice(-20);
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [cpuUsage, memUsage]);

  return (
    <div className="savant-page-container bg-obsidian">
      <div className="noise-overlay opacity-5" />
      
      <div className="relative z-10 savant-stack !gap-16">
        <header className="min-h-[30vh] flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="savant-stack !gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-neon-pink" />
              <span className="font-mono text-[10px] text-neon-pink tracking-[0.6em] uppercase font-bold">COMMAND_CENTER // OMEGA_LEVEL</span>
            </div>
            <h1 className="text-massive font-display">
              CORE_<br />
              <span className="text-neon-pink italic font-serif font-light text-[0.7em]">Administration.</span>
            </h1>
          </motion.div>
        </header>

        <div className="savant-grid grid-cols-1 lg:grid-cols-3 !gap-10">
          {/* Real-time Telemetry */}
          <SavantCard className="lg:col-span-2 p-12 border-white/5 bg-white/[0.01] rounded-[3rem] overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <Activity className="text-neon-pink" size={24} />
                <h2 className="font-display text-3xl text-white">SYSTEM_TELEMETRY</h2>
              </div>
              <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">LIVE_FEED // v80.0.0</div>
            </div>

            <div className="h-80 w-full mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4068" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4068" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e6c03b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e6c03b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="cpu" stroke="#ff4068" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="mem" stroke="#e6c03b" fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'CPU_LOAD', val: `${cpuUsage.toFixed(1)}%`, icon: Cpu, color: 'text-neon-pink' },
                { label: 'MEM_USAGE', val: `${memUsage.toFixed(1)}%`, icon: Database, color: 'text-gold' },
                { label: 'ACTIVE_NODES', val: activeNodes, icon: Zap, color: 'text-white' },
                { label: 'NEURAL_SYNC', val: `${neuralSync.toFixed(2)}%`, icon: Activity, color: 'text-emerald-400' }
              ].map((stat, i) => (
                <div key={i} className="p-6 border border-white/5 bg-white/[0.02] rounded-2xl">
                  <stat.icon className={`${stat.color} mb-4`} size={20} />
                  <div className="font-mono text-[9px] text-white/20 mb-1 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-2xl font-tech font-bold text-white">{stat.val}</div>
                </div>
              ))}
            </div>
          </SavantCard>

          {/* Security Status */}
          <SavantCard className="p-12 border-white/5 bg-white/[0.01] rounded-[3rem] flex flex-col">
            <div className="flex items-center gap-4 mb-12">
              <Shield className="text-neon-pink" size={24} />
              <h2 className="font-display text-3xl text-white">SECURITY</h2>
            </div>

            <div className="flex-1 space-y-10">
              <div className="p-8 bg-neon-pink/10 border border-neon-pink/20 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] text-neon-pink tracking-widest uppercase">FIREWALL_STATUS</span>
                  <Lock size={14} className="text-neon-pink" />
                </div>
                <div className="text-3xl font-display text-white">ACTIVE</div>
              </div>

              <div className="space-y-6">
                <h3 className="font-mono text-[10px] text-white/20 tracking-widest uppercase">THREAT_LOGS</h3>
                <div className="space-y-4">
                  {[
                    'UNAUTHORIZED_ACCESS_ATTEMPT // BLOCKED',
                    'NEURAL_LATTICE_INTEGRITY_CHECK // PASSED',
                    'ENCRYPTION_KEY_ROTATION // COMPLETE',
                    'ANOMALY_DETECTED_IN_SECTOR_7 // RESOLVED'
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-4 text-[9px] font-mono text-white/40 border-l border-neon-pink/30 pl-4">
                      <div className="w-1 h-1 bg-neon-pink rounded-full" />
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SavantCard>

          {/* System Logs */}
          <SavantCard className="lg:col-span-3 p-12 border-white/5 bg-white/[0.01] rounded-[3rem]">
            <div className="flex items-center gap-4 mb-10">
              <Terminal className="text-gold" size={24} />
              <h2 className="font-display text-3xl text-white">SYSTEM_LOG_MANIFEST</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {logs.slice(0, 12).map((log) => (
                <div key={log.id} className="flex gap-6 py-3 border-b border-white/5 group">
                  <span className="font-mono text-[9px] text-white/10 group-hover:text-neon-pink transition-colors shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-widest shrink-0 ${
                    log.level === 'ERROR' ? 'text-neon-pink' : 
                    log.level === 'CRITICAL' ? 'text-gold' : 
                    'text-white/40'
                  }`}>
                    {log.level}
                  </span>
                  <span className="font-mono text-[10px] text-white/60 truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </SavantCard>
        </div>
      </div>
    </div>
  );
}