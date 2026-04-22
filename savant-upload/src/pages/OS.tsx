import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  Network, 
  Shield, 
  Cpu, 
  Activity, 
  SplitSquareHorizontal, 
  SplitSquareVertical, 
  X, 
  Lock, 
  Database, 
  Radio, 
  Fingerprint, 
  Box, 
  Search, 
  Command as CommandIcon, 
  Zap, 
  Globe, 
  Settings, 
  User,
  Maximize2,
  Minimize2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  AreaChart, 
  Area, 
  XAxis, 
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useMedia } from 'react-use';
import { Lattice3D } from '../components/Lattice3D';
import { NeuralLatticeViz } from '../components/NeuralLatticeViz';
import { GlobalLattice } from '../components/GlobalLattice';
import { BiometricScanner } from '../components/BiometricScanner';
import { NeuralLattice } from '../components/NeuralLattice';
import { useStore } from '../store/useStore';
import * as d3 from 'd3';
import { SavantCard } from '../components/ui/SavantCard';
import { SavantButton } from '../components/ui/SavantButton';
import { GlassCard } from '../components/GlassCard';
import { MagneticButton } from '../components/MagneticButton';
import { SystemStatus } from '../components/SystemStatus';
import { AmbientAudioController } from '../components/AmbientAudioController';
import { TaskManager } from '../components/apps/TaskManager';

type AppType = 'terminal' | 'network' | 'vault' | 'system' | 'matrix' | 'comms' | 'auth' | 'lattice' | 'diagnostics' | 'neural' | 'quantum' | 'settings' | 'tasks';

interface PaneNode {
  id: string;
  type: 'leaf' | 'split';
  direction?: 'horizontal' | 'vertical';
  ratio?: number;
  children?: PaneNode[];
  appType?: AppType;
}

const APPS: Record<AppType, { name: string; icon: any; color: string; hex: string; description: string }> = {
  terminal: { 
    name: 'fractal_terminal', 
    icon: TerminalIcon, 
    color: 'text-[#E6C03B]', 
    hex: '#E6C03B',
    description: 'direct kernel access and fractal command execution.'
  },
  network: { 
    name: 'neural_lattice', 
    icon: Network, 
    color: 'text-[#FF4068]', 
    hex: '#FF4068',
    description: 'real-time neural node synchronization and topology.'
  },
  vault: { 
    name: 'oblivion_vault', 
    icon: Shield, 
    color: 'text-current', 
    hex: 'currentColor',
    description: 'hyper-encrypted data storage and sector management.'
  },
  system: { 
    name: 'system_telemetry', 
    icon: Cpu, 
    color: 'text-[#E6C03B]', 
    hex: '#E6C03B',
    description: 'ultra-core processing metrics and hardware health.'
  },
  matrix: { 
    name: 'recursive_matrix', 
    icon: Activity, 
    color: 'text-[#FF4068]', 
    hex: '#FF4068',
    description: 'recursive data stream analysis and pattern recognition.'
  },
  comms: { 
    name: 'encrypted_comms', 
    icon: Radio, 
    color: 'text-current', 
    hex: 'currentColor',
    description: 'quantum-encrypted peer-to-peer communication channels.'
  },
  auth: { 
    name: 'biometric_auth', 
    icon: Fingerprint, 
    color: 'text-[#E6C03B]', 
    hex: '#E6C03B',
    description: 'multi-factor biometric verification and gate control.'
  },
  lattice: { 
    name: 'spatial_lattice', 
    icon: Box, 
    color: 'text-[#FF4068]', 
    hex: '#FF4068',
    description: '3d spatial lattice visualization and manipulation.'
  },
  diagnostics: { 
    name: 'system_diagnostics', 
    icon: Activity, 
    color: 'text-current', 
    hex: 'currentColor',
    description: 'comprehensive system integrity and diagnostic suite.'
  },
  neural: { 
    name: 'neural_map', 
    icon: CommandIcon, 
    color: 'text-[#E6C03B]', 
    hex: '#E6C03B',
    description: 'global neural topology and architecture mapping.'
  },
  quantum: {
    name: 'quantum_telemetry',
    icon: Zap,
    color: 'text-[#FF4068]',
    hex: '#FF4068',
    description: 'advanced quantum state monitoring and entanglement analysis.'
  },
  settings: {
    name: 'system_settings',
    icon: Settings,
    color: 'text-current',
    hex: 'currentColor',
    description: 'configure system core parameters and visual aesthetics.'
  },
  tasks: {
    name: 'mission_objectives',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    hex: '#10b981',
    description: 'strategic task management and objective tracking.'
  }
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Command Palette ---
const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const addLog = useStore(state => state.addLog);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAction = (action: string) => {
    addLog(`Executing command: ${action.toLowerCase()}`, 'INFO');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-black border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl md:rounded-3xl"
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

            <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-white/[0.02] relative z-10">
              <Search className="w-5 h-5 text-white/20" />
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="EXECUTE_COMMAND..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm md:text-base text-white placeholder:text-white/10 tracking-widest"
              />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white/30">
                <CommandIcon className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>
            
            <div className="p-4 max-h-[60vh] md:max-h-[500px] overflow-y-auto custom-scrollbar relative z-10">
              <div className="px-4 py-2 font-mono text-[9px] text-white/20 uppercase tracking-[0.4em] mb-2">available_protocols</div>
              {[
                { id: 'SYNC_LATTICE', icon: Network, desc: 'Synchronize neural nodes across global sectors.' },
                { id: 'PURGE_LOGS', icon: Database, desc: 'Clear all system telemetry and kernel logs.' },
                { id: 'REBOOT_CORE', icon: Cpu, desc: 'Initiate full system core restart sequence.' },
                { id: 'INIT_BIOMETRIC_SCAN', icon: Fingerprint, desc: 'Begin multi-factor biometric verification.' }
              ].filter(cmd => cmd.id.toLowerCase().includes(query.toLowerCase())).map((cmd) => (
                <button 
                  key={cmd.id}
                  onClick={() => handleAction(cmd.id)}
                  className="w-full text-left p-4 rounded-xl hover:bg-white/[0.05] transition-all flex items-center gap-6 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                    <cmd.icon className="w-4 h-4 text-white/20 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-[11px] text-white/60 group-hover:text-white tracking-widest transition-colors">{cmd.id}</div>
                    <div className="font-mono text-[9px] text-white/20 group-hover:text-white/40 tracking-wider transition-colors mt-1">{cmd.desc}</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-neon-pink font-black tracking-widest transition-all translate-x-4 group-hover:translate-x-0">EXECUTE</div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center relative z-10">
              <div className="flex gap-6 font-mono text-[8px] text-white/20 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">ESC</span>
                  <span>close</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">ENTER</span>
                  <span>execute</span>
                </div>
              </div>
              <div className="font-mono text-[8px] text-gold/40 uppercase tracking-widest">svt_os_v80.0</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- App Components ---

const TerminalApp = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const { addLog, quantumEntanglement, neuralSync, biometricStatus } = useStore();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const msgs = [
      'SAVANT_OS [VERSION 80.0.0_ULTRA]',
      '(C) 2026 SOVEREIGN FRACTAL ARCHITECTURE',
      '',
      'initializing kernel...',
      'mapping neural lattice...',
      'allocating quantum shard memory...',
      'uplink secured via aes-4096-gcm.',
      'ready.',
      'type "help" for command list.',
      ''
    ];
    let i = 0;
    const int = setInterval(() => {
      if (i < msgs.length) {
        setLines(p => [...p, msgs[i]]);
        i++;
      } else {
        clearInterval(int);
      }
    }, 50);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const args = cmd.split(' ');
    const baseCmd = args[0];

    setLines(p => [...p, `> ${input}`]);
    
    switch (baseCmd) {
      case 'help':
        setLines(p => [...p, 
          'available commands:',
          '  help       - show this list',
          '  clear      - clear terminal',
          '  status     - system integrity report',
          '  sync       - force lattice synchronization',
          '  quantum    - quantum entanglement telemetry',
          '  biometric  - biometric scanner status',
          '  neural     - neural sync data',
          '  reboot     - restart system core'
        ]);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'status':
        setLines(p => [...p, 
          `system_integrity: 99.998%`, 
          `core_temp: 32.4°C`, 
          `lattice_sync: optimal`,
          `quantum_stability: ${quantumEntanglement.toFixed(2)}%`,
          `neural_coherence: ${(neuralSync * 100).toFixed(1)}%`
        ]);
        break;
      case 'sync':
        setLines(p => [...p, 'synchronizing neural nodes...', 'done.']);
        addLog('Manual lattice synchronization initiated', 'INFO');
        break;
      case 'quantum':
        setLines(p => [...p, 
          `quantum_entanglement: ${quantumEntanglement.toFixed(4)}`,
          `shard_integrity: ${(Math.random() * 100).toFixed(2)}%`,
          `entropy_level: low`
        ]);
        break;
      case 'biometric':
        setLines(p => [...p, `biometric_status: ${biometricStatus.toLowerCase()}`]);
        break;
      case 'neural':
        setLines(p => [...p, `neural_sync_index: ${neuralSync.toFixed(6)}`]);
        break;
      case 'reboot':
        setLines(p => [...p, 'rebooting system core...', 'please wait...']);
        setTimeout(() => window.location.reload(), 2000);
        break;
      default:
        setLines(p => [...p, `command_not_found: ${cmd}`]);
    }
    
    setInput('');
  };

  return (
    <div className="h-full w-full p-6 font-mono text-[10px] text-gold overflow-hidden flex flex-col relative bg-black/60 backdrop-blur-xl">
      <div className="absolute top-8 right-8 text-gold/5 pointer-events-none">
        <TerminalIcon className="w-48 h-48" />
      </div>
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 opacity-40">
        <div className="flex gap-4">
          <span>svt_os_kernel_v80.0.0</span>
          <span>//</span>
          <span>sector_01_root</span>
        </div>
        <div className="flex gap-4">
          <span>latency: 0.02ms</span>
          <span>uplink: stable</span>
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scrollbar mb-4 relative z-10">
        {lines.map((l, i) => (
          <div key={i} className="opacity-80 leading-relaxed py-1 flex gap-4">
            <span className="opacity-20 shrink-0">[{i.toString().padStart(3, '0')}]</span>
            {l.startsWith('>') ? (
              <span className="text-neon-pink font-black tracking-wider">{l}</span>
            ) : l.startsWith(' ') ? (
              <span className="text-white/40 italic">{l}</span>
            ) : (
              <span className="text-gold/90">{l}</span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-4 mt-4">
          <span className="opacity-20 shrink-0">[{lines.length.toString().padStart(3, '0')}]</span>
          <span className="text-neon-pink font-black animate-pulse">{'>'}</span>
          <form onSubmit={handleCommand} className="flex-1">
            <input 
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-gold font-mono placeholder:text-white/5 tracking-wider"
              placeholder="EXECUTE_COMMAND..."
            />
          </form>
        </div>
      </div>
      
      {/* Terminal Footer */}
      <div className="h-6 border-t border-white/5 flex items-center justify-between px-2 opacity-20 text-[7px] tracking-[0.4em] uppercase">
        <span>neural_sync_active</span>
        <span>encryption_aes_4096_gcm</span>
      </div>
    </div>
  );
};

const SystemApp = () => {
  const { cpuUsage, memUsage, updateMetrics, quantumEntanglement, shardIntegrity, neuralSync } = useStore();
  const [data, setData] = useState<{val: number, val2: number, val3: number, time: string}[]>([]);
  
  useEffect(() => {
    const initialData = Array.from({ length: 30 }, (_, i) => ({
      val: 30 + Math.random() * 40,
      val2: 20 + Math.random() * 50,
      val3: 99.99 + Math.random() * 0.01,
      time: `${i}:00`
    }));
    setData(initialData);
  }, []);

  useEffect(() => {
    const int = setInterval(() => {
      updateMetrics();
      setData(p => {
        const next = [...p.slice(1), { 
          val: cpuUsage,
          val2: memUsage,
          val3: quantumEntanglement,
          time: new Date().toLocaleTimeString().split(' ')[0]
        }];
        return next;
      });
    }, 1000);
    return () => clearInterval(int);
  }, [cpuUsage, memUsage, quantumEntanglement, updateMetrics]);

  return (
    <div className="h-full w-full p-6 md:p-8 flex flex-col gap-6 md:gap-8 relative overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-xl">
      <div className="absolute top-12 right-12 text-gold/5 pointer-events-none">
        <Cpu className="w-48 h-48 md:w-96 md:h-96" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        <GlassCard title="cpu_load" subtitle="core_frequency" className="p-6">
          <div className="flex items-end justify-between mb-4">
            <div className="font-mono text-3xl text-gold font-black tracking-tighter">
              {cpuUsage.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">%</span>
            </div>
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">{(4.2 + (cpuUsage / 100) * 0.8).toFixed(2)} GHz</div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gold shadow-[0_0_10px_rgba(230,192,59,0.5)]" 
              animate={{ width: `${cpuUsage}%` }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            />
          </div>
        </GlassCard>
        
        <GlassCard title="mem_alloc" subtitle="shard_memory" className="p-6">
          <div className="flex items-end justify-between mb-4">
            <div className="font-mono text-3xl text-neon-pink font-black tracking-tighter">
              {memUsage.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">%</span>
            </div>
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">{(64 * (memUsage / 100)).toFixed(1)} GB</div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-neon-pink shadow-[0_0_10px_rgba(255,64,104,0.5)]" 
              animate={{ width: `${memUsage}%` }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            />
          </div>
        </GlassCard>

        <GlassCard title="neural_sync" subtitle="coherence_index" className="p-6">
          <div className="font-mono text-3xl text-white font-black tracking-tighter mb-4">
            {neuralSync.toFixed(3)}<span className="text-[10px] ml-1 opacity-50">SYNC</span>
          </div>
          <div className="flex gap-1.5">
            {[...Array(16)].map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-sm transition-colors duration-500 ${i < (neuralSync * 16) ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'bg-white/5'}`} />
            ))}
          </div>
        </GlassCard>

        <GlassCard title="integrity" subtitle="quantum_stability" className="p-6">
          <div className="font-mono text-3xl text-emerald-400 font-black tracking-tighter mb-4">
            {(shardIntegrity * 100).toFixed(3)}<span className="text-[10px] ml-1 opacity-50">%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="font-mono text-[8px] text-emerald-400/50 tracking-[0.4em] uppercase">status: optimal</div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-[400px] relative z-10">
        <GlassCard title="cpu_telemetry" subtitle="real-time_core_analysis" className="p-8 flex flex-col">
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e6c03b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e6c03b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#e6c03b' }}
                />
                <Area type="monotone" dataKey="val" stroke="#e6c03b" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="quantum_entanglement" subtitle="entanglement_stability_stream" className="p-8 flex flex-col">
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#ff4068' }}
                />
                <Line type="monotone" dataKey="val3" stroke="#ff4068" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const VaultApp = () => {
  return (
    <div className="h-full w-full p-8 flex flex-col relative overflow-hidden bg-black/60 backdrop-blur-xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 pointer-events-none">
        <Lock className="w-64 h-64 md:w-96 md:h-96" />
      </div>
      
      <div className="flex justify-between items-center mb-10 relative z-10 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <div className="text-label">encrypted_sectors // v80.0</div>
          <div className="font-mono text-[8px] opacity-30 tracking-[0.4em] uppercase">aes-4096-gcm // quantum_resistant</div>
        </div>
        <div className="flex gap-8 font-mono text-[10px] opacity-40 uppercase tracking-widest">
          <span>total_shards: 4096</span>
          <span>allocated: 1024</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3 relative z-10 overflow-y-auto pr-4 custom-scrollbar">
        {[...Array(96)].map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.005, duration: 0.5 }}
            className="aspect-square border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center p-2 group hover:bg-gold/10 hover:border-gold/30 transition-all duration-500 cursor-pointer rounded-lg relative overflow-hidden"
          >
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            
            <Database className="w-4 h-4 text-white/20 group-hover:text-gold mb-2 transition-colors duration-500 relative z-10" />
            <span className="text-[8px] text-white/20 group-hover:text-white font-mono tracking-widest transition-colors duration-500 relative z-10">0x{i.toString(16).padStart(2, '0').toUpperCase()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const NetworkApp = () => {
  return (
    <div className="h-full w-full p-8 relative overflow-hidden flex flex-col bg-black/60 backdrop-blur-xl">
      <div className="flex justify-between items-center mb-10 relative z-10 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <div className="text-label">global_lattice_topology</div>
          <div className="font-mono text-[8px] opacity-30 tracking-[0.4em] uppercase">neural_node_synchronization // live</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-neon-pink uppercase tracking-widest">active_uplink</span>
        </div>
      </div>

      <div className="flex-1 relative border border-white/5 bg-black/40 rounded-2xl overflow-hidden group">
        <NeuralLatticeViz />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
        <div className="absolute top-6 left-6 font-mono text-[9px] text-white/40 uppercase tracking-[0.3em] bg-black/60 p-4 backdrop-blur-xl border border-white/5 rounded-lg pointer-events-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-1 bg-neon-pink rounded-full" />
            <span>sector: global_core</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-1 bg-gold rounded-full" />
            <span>protocol: svt_v80</span>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 font-mono text-[9px] text-neon-pink bg-black/60 p-6 backdrop-blur-xl border border-neon-pink/20 rounded-lg pointer-events-none">
          <div className="flex justify-between gap-12 mb-2">
            <span className="opacity-40">ACTIVE_NODES</span>
            <span className="font-black">{Math.floor(Math.random() * 1000) + 5000}</span>
          </div>
          <div className="flex justify-between gap-12 mb-2">
            <span className="opacity-40">LATENCY</span>
            <span className="font-black">{Math.floor(Math.random() * 10) + 2}ms</span>
          </div>
          <div className="flex justify-between gap-12">
            <span className="opacity-40">PACKET_LOSS</span>
            <span className="font-black">0.00%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatrixApp = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const savantGlyphs = 'SAVANT_OS_FRACTAL_CORE_OBLIVION_VOID_LATTICE_0123456789';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    let animationFrame: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff4068';
      ctx.font = `${fontSize}px JetBrains Mono`;

      for (let i = 0; i < drops.length; i++) {
        const text = savantGlyphs.charAt(Math.floor(Math.random() * savantGlyphs.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-6xl md:text-8xl font-display font-black tracking-[0.5em] text-white/5 uppercase">recursive</div>
      </div>
      
      {/* Telemetry Overlay */}
      <div className="absolute bottom-8 left-8 font-mono text-[8px] text-neon-pink/40 tracking-[0.5em] uppercase">
        matrix_stream_active // sector_01
      </div>
    </div>
  );
};

const DiagnosticsApp = () => {
  const { activeNodes, latency, cpuUsage, memUsage, updateMetrics } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-black/60 backdrop-blur-xl custom-scrollbar">
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <div className="text-label">system_diagnostics</div>
          <div className="font-mono text-[8px] opacity-30 tracking-[0.4em] uppercase">deep_kernel_analysis // v80.0</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          <span className="font-mono text-[10px] text-gold uppercase tracking-widest">monitoring_active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="border border-white/5 p-6 bg-white/[0.02] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          <div className="font-mono text-[8px] opacity-20 mb-4 tracking-widest uppercase relative z-10">cpu_load_telemetry</div>
          <div className="text-4xl font-black text-gold tracking-tighter relative z-10">{cpuUsage.toFixed(1)}%</div>
          <div className="w-full h-1.5 bg-white/5 mt-4 rounded-full overflow-hidden relative z-10">
            <motion.div className="h-full bg-gold shadow-[0_0_10px_rgba(230,192,59,0.5)]" animate={{ width: `${cpuUsage}%` }} />
          </div>
        </div>
        <div className="border border-white/5 p-6 bg-white/[0.02] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          <div className="font-mono text-[8px] opacity-20 mb-4 tracking-widest uppercase relative z-10">mem_alloc_telemetry</div>
          <div className="text-4xl font-black text-neon-pink tracking-tighter relative z-10">{memUsage.toFixed(1)}%</div>
          <div className="w-full h-1.5 bg-white/5 mt-4 rounded-full overflow-hidden relative z-10">
            <motion.div className="h-full bg-neon-pink shadow-[0_0_10px_rgba(255,64,104,0.5)]" animate={{ width: `${memUsage}%` }} />
          </div>
        </div>
      </div>

      <div className="border border-white/5 p-8 bg-white/[0.02] rounded-2xl mb-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        <div className="font-mono text-[8px] opacity-20 tracking-widest uppercase mb-6 relative z-10">lattice_health_metrics</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">active_nodes</span>
            <span className="font-mono text-[12px] text-white font-black">{activeNodes}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">signal_latency</span>
            <span className="font-mono text-[12px] text-gold font-black">{latency.toFixed(4)}ms</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">uptime</span>
            <span className="font-mono text-[12px] text-white font-black">142:12:44:09</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">encryption</span>
            <span className="font-mono text-[12px] text-neon-pink font-black uppercase">aes-4096-quantum</span>
          </div>
        </div>
      </div>

      <div className="border border-white/5 p-8 bg-black/40 rounded-2xl h-48 relative overflow-hidden">
        <div className="font-mono text-[8px] opacity-20 tracking-widest uppercase mb-4">telemetry_stream</div>
        <div className="flex flex-col gap-2 opacity-40 text-[9px] font-mono">
          <div className="flex gap-4"><span className="text-gold">[INFO]</span> <span>NEURAL_LATTICE_SYNC_OK</span></div>
          <div className="flex gap-4"><span className="text-gold">[INFO]</span> <span>QUANTUM_ENTANGLEMENT_STABLE</span></div>
          <div className="flex gap-4"><span className="text-neon-pink">[WARN]</span> <span>MINOR_PACKET_LOSS_IN_SECTOR_7G</span></div>
          <div className="flex gap-4"><span className="text-gold">[INFO]</span> <span>RE-ROUTING_TRAFFIC_THROUGH_CORE_3</span></div>
          <div className="flex gap-4"><span className="text-gold">[INFO]</span> <span>SYSTEM_INTEGRITY_99.998%</span></div>
        </div>
      </div>
    </div>
  );
};

const CommsApp = () => {
  return (
    <div className="h-full w-full p-4 savant-stack !gap-4 relative overflow-hidden">
      <div className="font-mono text-[10px] opacity-50 relative z-10 tracking-widest">
        secure_channels // p2p_encrypted
      </div>
      <div className="flex-1 savant-stack !gap-2 relative z-10 overflow-y-auto custom-scrollbar">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border border-white/10 p-2 md:p-3 flex items-center gap-3 md:gap-4 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
              <Radio className="w-3 h-3 md:w-4 md:h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] md:text-[10px] text-white tracking-widest truncate">agent_{Math.random().toString(36).substring(2, 6).toLowerCase()}</div>
              <div className="font-mono text-[7px] md:text-[8px] text-white/30 tracking-widest truncate">status: online // encrypted</div>
            </div>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

const NeuralMapApp = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const nodes = [
      { id: 'CORE', group: 1, label: 'SAVANT_CORE' },
      { id: 'OS', group: 2, label: 'LATTICE_OS' },
      { id: 'JOURNAL', group: 2, label: 'NEURAL_JOURNAL' },
      { id: 'BLOG', group: 2, label: 'DATA_STREAM' },
      { id: 'ADMIN', group: 3, label: 'ROOT_CONTROL' },
      { id: 'AUTH', group: 3, label: 'BIOMETRIC_GATE' },
      { id: 'LATTICE', group: 4, label: 'SPATIAL_LATTICE' },
      { id: 'NETWORK', group: 4, label: 'NEURAL_NETWORK' },
    ];

    const links = [
      { source: 'CORE', target: 'OS' },
      { source: 'CORE', target: 'JOURNAL' },
      { source: 'CORE', target: 'BLOG' },
      { source: 'OS', target: 'ADMIN' },
      { source: 'OS', target: 'AUTH' },
      { source: 'OS', target: 'LATTICE' },
      { source: 'OS', target: 'NETWORK' },
      { source: 'ADMIN', target: 'AUTH' },
    ];

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height] as any);

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#e6c03b')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g');

    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.group === 1 ? '#e6c03b' : d.group === 2 ? '#ff4068' : '#ffffff')
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', '#ffffff')
      .attr('font-family', 'monospace')
      .attr('font-size', '8px')
      .attr('letter-spacing', '1px');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
    });

    return () => simulation.stop();
  }, []);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 font-mono text-[10px] text-gold bg-black/60 p-2 border border-gold/20 backdrop-blur-md">
        neural_topology // sector: global
      </div>
    </div>
  );
};

const AuthApp = () => {
  return (
    <div className="h-full w-full bg-obsidian/40">
      <BiometricScanner />
    </div>
  );
};

const QuantumTelemetry = () => {
  const { quantumEntanglement, neuralSync, updateMetrics } = useStore();
  const d3Container = useRef<SVGSVGElement>(null);
  const [history, setHistory] = useState<any[]>(
    Array.from({ length: 20 }, (_, i) => ({
      entanglement: 99.99 + Math.random() * 0.01,
      sync: 0.98 + Math.random() * 0.02,
      time: Date.now() - (20 - i) * 1000
    }))
  );

  useEffect(() => {
    const int = setInterval(() => {
      updateMetrics();
      setHistory(prev => [...prev.slice(-19), { 
        entanglement: quantumEntanglement, 
        sync: neuralSync,
        time: Date.now() 
      }]);
    }, 1000);
    return () => clearInterval(int);
  }, [quantumEntanglement, neuralSync, updateMetrics]);

  useEffect(() => {
    if (!d3Container.current) return;
    const svg = d3.select(d3Container.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const nodes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }));

    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.95) {
          links.push({ source: i, target: j });
        }
      }
    }

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-20))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);
      });

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#ff4068')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 2)
      .attr('fill', '#e6c03b')
      .attr('box-shadow', '0 0 10px #e6c03b');

    return () => simulation.stop();
  }, []);

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 bg-obsidian/40 overflow-y-auto custom-scrollbar relative">
      <div className="flex items-center justify-between relative z-10">
        <div className="font-mono text-xs text-crimson tracking-[0.3em] font-bold">quantum_state_analysis</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-crimson animate-ping" />
          <span className="font-mono text-[10px] text-[#FF4068]/50">live_feed</span>
        </div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <svg ref={d3Container} viewBox="0 0 600 400" className="w-full h-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <GlassCard title="entanglement" subtitle="stability_index" className="p-4">
          <div className="text-3xl font-black text-white font-mono">{quantumEntanglement.toFixed(2)}%</div>
          <div className="mt-4 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <YAxis hide domain={[99, 100]} />
                <Bar dataKey="entanglement">
                  {history.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.entanglement > 80 ? '#ff4068' : '#ffffff'} opacity={0.3 + (index / 20) * 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="neural_sync" subtitle="coherence_level" className="p-4">
          <div className="text-3xl font-black text-gold font-mono">{(neuralSync * 100).toFixed(1)}%</div>
          <div className="mt-4 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <YAxis hide domain={[0, 1]} />
                <Area type="monotone" dataKey="sync" stroke="#e6c03b" fill="#e6c03b" fillOpacity={0.1} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="border border-white/5 bg-black/20 p-4 font-mono text-[10px] text-white/40 leading-relaxed relative z-10">
        <div className="text-white/60 mb-2 border-b border-white/5 pb-1">quantum_log_stream</div>
        {history.slice(-5).reverse().map((h, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
            <span>[stability_check] entanglement_coherence: {h.entanglement.toFixed(4)}%</span>
            <span className="text-neon-pink/50">{new Date(h.time).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsApp = () => {
  const { 
    addLog, 
    chromaticAberration, 
    scanlines, 
    neuralOverlay, 
    toggleEffect 
  } = useStore();

  const effects = [
    { id: 'chromaticAberration', name: 'CHROMATIC_ABERRATION', active: chromaticAberration },
    { id: 'scanlines', name: 'SCANLINE_OVERLAY', active: scanlines },
    { id: 'neuralOverlay', name: 'NEURAL_OVERLAY', active: neuralOverlay },
  ];

  return (
    <div className="h-full w-full p-6 flex flex-col gap-8 bg-obsidian/40 overflow-y-auto custom-scrollbar">
      <section className="savant-stack !gap-4">
        <div className="font-mono text-xs opacity-50 tracking-[0.3em]">post_processing_effects</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {effects.map((e) => (
            <button 
              key={e.id}
              onClick={() => {
                toggleEffect(e.id as any);
                addLog(`Effect ${e.name} ${!e.active ? 'ENABLED' : 'DISABLED'}`, 'INFO');
              }}
              className={`p-3 md:p-4 border border-white/10 bg-white/5 flex items-center justify-between group hover:bg-white/10 transition-all ${e.active ? 'border-neon-pink/50' : ''}`}
            >
              <div className="flex flex-col items-start">
                <span className="font-mono text-[9px] md:text-[10px] text-white tracking-widest text-left">{e.name}</span>
                <span className={`font-mono text-[7px] md:text-[8px] mt-1 ${e.active ? 'text-neon-pink' : 'text-white/20'}`}>
                  {e.active ? 'STATUS: ACTIVE' : 'STATUS: INACTIVE'}
                </span>
              </div>
              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${e.active ? 'bg-neon-pink shadow-[0_0_10px_#ff4068]' : 'bg-white/10'}`} />
            </button>
          ))}
        </div>
      </section>

      <div className="border border-white/5 p-4 bg-black/20 font-mono text-[10px] text-white/40">
        <div className="text-white/60 mb-2 border-b border-white/5 pb-1">kernel_visual_override</div>
        <p>Adjusting post-processing effects modifies the primary fractal shard rendering engine. Some configurations may require additional GPU cycles for complex shader calculations.</p>
      </div>
    </div>
  );
};

// --- Pane Component ---

interface PaneProps {
  node: PaneNode;
  onSplit: (id: string, direction: 'horizontal' | 'vertical') => void;
  onClose: (id: string) => void;
  onChangeApp: (id: string, app: AppType) => void;
  isRoot?: boolean;
}

const Pane: React.FC<PaneProps> = ({ node, onSplit, onClose, onChangeApp, isRoot }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMobile = useMedia('(max-width: 1024px)');

  if (node.type === 'split' && node.children) {
    const isHoriz = node.direction === 'horizontal';
    
    // On mobile, we stack splits vertically regardless of direction
    const layoutClass = isMobile ? 'flex-col' : (isHoriz ? 'flex-row' : 'flex-col');
    
    return (
      <div className={`flex ${layoutClass} w-full h-full gap-2 md:gap-3 p-1 md:p-2 bg-black`}>
        <div className="flex-1 min-w-0 min-h-0">
          <Pane node={node.children[0]} onSplit={onSplit} onClose={onClose} onChangeApp={onChangeApp} />
        </div>
        <div className="flex-1 min-w-0 min-h-0">
          <Pane node={node.children[1]} onSplit={onSplit} onClose={onClose} onChangeApp={onChangeApp} />
        </div>
      </div>
    );
  }

  const appType: AppType = node.appType || 'terminal';
  const AppConfig = APPS[appType];
  const Icon = AppConfig.icon;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full h-full border border-white/5 bg-white/[0.02] flex flex-col relative group overflow-hidden min-w-[260px] min-h-[200px] transition-all duration-500 rounded-xl md:rounded-2xl ${isMaximized ? 'z-[60] !fixed !inset-0 !m-0 !rounded-none' : ''}`}
    >
      {/* Header */}
      <div className="h-12 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 select-none relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-white/5 pointer-events-none"
          animate={{ opacity: [0, 0.05, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${AppConfig.color}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${AppConfig.color} animate-pulse hidden sm:block`} />
          </div>
          <div className="relative">
            <select 
              value={appType}
              onChange={(e) => onChangeApp(node.id, e.target.value as AppType)}
              className={`bg-transparent font-mono text-[10px] font-black tracking-[0.2em] outline-none appearance-none cursor-pointer hover:brightness-125 transition-all pr-6 uppercase ${AppConfig.color}`}
              style={{ color: AppConfig.hex }}
            >
              {Object.entries(APPS).map(([k, v]) => (
                <option key={k} value={k} className="bg-obsidian text-white">{v.name}</option>
              ))}
            </select>
            <ChevronRight className={`w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none ${AppConfig.color} opacity-50`} />
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 border border-white/5 bg-white/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-[8px] opacity-30 tracking-[0.2em] uppercase">node_active</span>
          </div>

          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            {!isMobile && (
              <>
                <button onClick={() => onSplit(node.id, 'horizontal')} className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-lg" title="Split Horizontal">
                  <SplitSquareHorizontal className="w-4 h-4" />
                </button>
                <button onClick={() => onSplit(node.id, 'vertical')} className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-lg" title="Split Vertical">
                  <SplitSquareVertical className="w-4 h-4" />
                </button>
              </>
            )}
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-lg"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {!isRoot && (
              <button onClick={() => onClose(node.id)} className="p-2 hover:bg-neon-pink/20 text-white/40 hover:text-neon-pink transition-colors rounded-lg" title="Close Pane">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative bg-black/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={appType}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="w-full h-full"
          >
            {appType === 'terminal' && <TerminalApp />}
            {appType === 'system' && <SystemApp />}
            {appType === 'vault' && <VaultApp />}
            {appType === 'network' && <NetworkApp />}
            {appType === 'matrix' && <MatrixApp />}
            {appType === 'comms' && <CommsApp />}
            {appType === 'auth' && <AuthApp />}
            {appType === 'lattice' && <Lattice3D />}
            {appType === 'diagnostics' && <DiagnosticsApp />}
            {appType === 'neural' && <NeuralMapApp />}
            {appType === 'quantum' && <QuantumTelemetry />}
            {appType === 'settings' && <SettingsApp />}
            {appType === 'tasks' && <TaskManager />}
          </motion.div>
        </AnimatePresence>
        
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_3px] opacity-30" />
      </div>
    </motion.div>
  );
};

// --- Main OS Page ---

export default function OS() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const isMobile = useMedia('(max-width: 1024px)');
  const { systemLoad, updateMetrics, scanlines, neuralOverlay } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateMetrics]);
  
  const [rootNode, setRootNode] = useState<PaneNode>({
    id: 'root',
    type: 'split',
    direction: 'horizontal',
    children: [
      {
        id: 'left',
        type: 'split',
        direction: 'vertical',
        children: [
          { id: 'l1', type: 'leaf', appType: 'terminal' },
          { id: 'l2', type: 'leaf', appType: 'lattice' }
        ]
      },
      {
        id: 'right',
        type: 'split',
        direction: 'vertical',
        children: [
          { id: 'r1', type: 'leaf', appType: 'network' },
          {
            id: 'r2',
            type: 'split',
            direction: 'horizontal',
            children: [
              { id: 'r2a', type: 'leaf', appType: 'vault' },
              { id: 'r2b', type: 'leaf', appType: 'auth' }
            ]
          }
        ]
      }
    ]
  });

  // Simplified layout for mobile
  useEffect(() => {
    if (isMobile) {
      setRootNode({
        id: 'root',
        type: 'split',
        direction: 'vertical',
        children: [
          { id: 'm1', type: 'leaf', appType: 'system' },
          { id: 'm2', type: 'leaf', appType: 'terminal' }
        ]
      });
    }
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const findAndSplit = (node: PaneNode, targetId: string, direction: 'horizontal' | 'vertical'): PaneNode => {
    if (node.id === targetId && node.type === 'leaf') {
      return {
        id: generateId(),
        type: 'split',
        direction,
        children: [
          { ...node, id: generateId() },
          { id: generateId(), type: 'leaf', appType: 'matrix' }
        ]
      };
    }
    if (node.type === 'split' && node.children) {
      return {
        ...node,
        children: [
          findAndSplit(node.children[0], targetId, direction),
          findAndSplit(node.children[1], targetId, direction)
        ]
      };
    }
    return node;
  };

  const findAndClose = (node: PaneNode, targetId: string): PaneNode | null => {
    if (node.id === targetId) return null;
    if (node.type === 'split' && node.children) {
      const c0 = findAndClose(node.children[0], targetId);
      const c1 = findAndClose(node.children[1], targetId);
      
      if (!c0 && c1) return c1;
      if (c0 && !c1) return c0;
      if (c0 && c1) return { ...node, children: [c0, c1] };
      return null;
    }
    return node;
  };

  const findAndChangeApp = (node: PaneNode, targetId: string, appType: AppType): PaneNode => {
    if (node.id === targetId) {
      return { ...node, appType };
    }
    if (node.type === 'split' && node.children) {
      return {
        ...node,
        children: [
          findAndChangeApp(node.children[0], targetId, appType),
          findAndChangeApp(node.children[1], targetId, appType)
        ]
      };
    }
    return node;
  };

  const handleSplit = (id: string, direction: 'horizontal' | 'vertical') => {
    if (isMobile) return; // Disable splitting on mobile
    setRootNode(prev => findAndSplit(prev, id, direction));
  };

  const handleClose = (id: string) => {
    setRootNode(prev => {
      const res = findAndClose(prev, id);
      return res || { id: 'root', type: 'leaf', appType: 'terminal' };
    });
  };

  const handleChangeApp = (id: string, appType: AppType) => {
    setRootNode(prev => findAndChangeApp(prev, id, appType));
  };

  return (
    <div className="fixed inset-0 z-40 bg-obsidian flex flex-col overflow-hidden select-none">
      <NeuralLattice />
      <GlobalLattice />
      {neuralOverlay && <div className="fixed inset-0 z-30 pointer-events-none opacity-20"><NeuralLatticeViz /></div>}
      <div className="noise-overlay opacity-10" />
      {scanlines && <div className="scanlines-overlay opacity-5" />}
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
      
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between px-6 md:px-12 z-50 relative group">
        <div className="flex items-center gap-6 md:gap-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:border-gold/50 transition-all duration-700">
              <Cpu className="w-5 h-5 text-gold" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg md:text-xl tracking-tighter text-white group-hover:glitch-text transition-all">
                SAVANT<span className="text-neon-pink">_</span>OS
              </span>
              <span className="font-mono text-[8px] text-white/30 tracking-[0.4em] uppercase">kernel_v80.0_ultra</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 border-l border-white/5 pl-12">
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-white/20 uppercase tracking-[0.3em] mb-2">system_load</span>
              <div className="flex gap-1.5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`w-4 h-1 rounded-full transition-all duration-500 ${i < (systemLoad * 12) ? 'bg-gold shadow-[0_0_5px_rgba(230,192,59,0.5)]' : 'bg-white/5'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] text-white/20 uppercase tracking-[0.3em] mb-1">neural_sync</span>
              <span className="font-mono text-[11px] text-emerald-400 font-black tracking-widest">99.998%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-10 font-mono text-[10px]">
          <div 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-4 px-4 md:px-6 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group/search"
          >
            <Search className="w-4 h-4 text-white/20 group-hover/search:text-white transition-colors" />
            <span className="text-white/20 hidden sm:inline tracking-widest">EXECUTE_COMMAND...</span>
            <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-white/30">
              <CommandIcon className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-gold/30 transition-all cursor-help">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold animate-pulse shadow-[0_0_15px_#e6c03b]" />
            <span className="text-white/40 tracking-[0.3em] hidden lg:inline-block uppercase">uplink_stable</span>
          </div>

          <div className="hidden xl:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-white/20 tracking-[0.2em] font-black">{new Date().toISOString().split('T')[1].substring(0, 8)}</span>
              <span className="text-[8px] text-white/10 tracking-[0.4em] uppercase">utc_time_sync</span>
            </div>
            <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/savant/100/100" alt="User" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden bg-obsidian relative z-10">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        
        <div className="w-full h-full relative overflow-hidden">
          <Pane 
            node={rootNode} 
            onSplit={handleSplit} 
            onClose={handleClose} 
            onChangeApp={handleChangeApp}
            isRoot={true}
          />
        </div>
      </div>

      <AmbientAudioController />
      <SystemStatus />
    </div>
  );
}
