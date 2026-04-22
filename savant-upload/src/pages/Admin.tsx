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
    <div className="savant-page-container bg-current/5 text-current">
      <div className="noise-overlay opacity-5" />
      
      <div className="relative z-10 savant-stack !gap-16">
        <header className="min-h-[30vh] flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="savant-stack !gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-[#FF4068]" />
              <span className="font-mono text-[10px] text-[#FF4068] tracking-[0.6em] font-bold">command_center // omega_level</span>
            </div>
            <h1 className="text-massive font-display">
              core_<br />
              <span className="text-[#FF4068] italic font-serif font-light text-[0.7em]">administration.</span>
            </h1>
          </motion.div>
        </header>

        <div className="savant-grid grid-cols-1 lg:grid-cols-3 !gap-10">
          {/* Real-time Telemetry */}
          <SavantCard className="lg:col-span-2 p-12 border-current/5 bg-current/5 rounded-[3rem] overflow-hidden">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-4">
                <Activity className="text-[#FF4068]" size={24} />
                <h2 className="font-display text-3xl">system_telemetry</h2>
              </div>
              <div className="font-mono text-[10px] opacity-20 tracking-widest">live_feed // v80.0.0</div>
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
                { label: 'cpu_load', val: `${cpuUsage.toFixed(1)}%`, icon: Cpu, color: 'text-[#FF4068]' },
                { label: 'mem_usage', val: `${memUsage.toFixed(1)}%`, icon: Database, color: 'text-[#E6C03B]' },
                { label: 'active_nodes', val: activeNodes, icon: Zap, color: 'text-current' },
                { label: 'neural_sync', val: `${neuralSync.toFixed(2)}%`, icon: Activity, color: 'text-emerald-500' }
              ].map((stat, i) => (
                <div key={i} className="p-6 border border-current/5 bg-current/5 rounded-2xl">
                  <stat.icon className={`${stat.color} mb-4`} size={20} />
                  <div className="font-mono text-[9px] opacity-20 mb-1 tracking-widest">{stat.label}</div>
                  <div className="text-2xl font-tech font-bold">{stat.val}</div>
                </div>
              ))}
            </div>
          </SavantCard>

          {/* Security Status */}
          <SavantCard className="p-12 border-current/5 bg-current/5 rounded-[3rem] flex flex-col">
            <div className="flex items-center gap-4 mb-12">
              <Shield className="text-[#FF4068]" size={24} />
              <h2 className="font-display text-3xl">security</h2>
            </div>

            <div className="flex-1 space-y-10">
              <div className="p-8 bg-[#FF4068]/10 border border-[#FF4068]/20 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] text-[#FF4068] tracking-widest">firewall_status</span>
                  <Lock size={14} className="text-[#FF4068]" />
                </div>
                <div className="text-3xl font-display">active</div>
              </div>

              <div className="space-y-6">
                <h3 className="font-mono text-[10px] opacity-20 tracking-widest">threat_logs</h3>
                <div className="space-y-4">
                  {[
                    'unauthorized_access_attempt // blocked',
                    'neural_lattice_integrity_check // passed',
                    'encryption_key_rotation // complete',
                    'anomaly_detected_in_sector_7 // resolved'
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-4 text-[9px] font-mono opacity-40 border-l border-[#FF4068]/30 pl-4">
                      <div className="w-1 h-1 bg-[#FF4068] rounded-full" />
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SavantCard>

          {/* System Logs */}
          <SavantCard className="lg:col-span-3 p-12 border-current/5 bg-current/5 rounded-[3rem]">
            <div className="flex items-center gap-4 mb-10">
              <Terminal className="text-[#E6C03B]" size={24} />
              <h2 className="font-display text-3xl">system_log_manifest</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {logs.slice(0, 12).map((log) => (
                <div key={log.id} className="flex gap-6 py-3 border-b border-current/5 group">
                  <span className="font-mono text-[9px] opacity-10 group-hover:text-[#FF4068] group-hover:opacity-100 transition-colors shrink-0">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className={`font-mono text-[10px] tracking-widest shrink-0 ${
                    log.level === 'ERROR' ? 'text-[#FF4068]' : 
                    log.level === 'CRITICAL' ? 'text-[#E6C03B]' : 
                    'opacity-40'
                  }`}>
                    {log.level.toLowerCase()}
                  </span>
                  <span className="font-mono text-[10px] opacity-60 truncate">{log.message.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </SavantCard>
        </div>
      </div>
    </div>
  );
}
