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
import { useStore } from '../store/useStore';
import * as d3 from 'd3';
import { SavantCard } from '../components/ui/SavantCard';
import { SavantButton } from '../components/ui/SavantButton';
import { GlassCard } from '../components/ui/GlassCard';
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
    name: 'FRACTAL_TERMINAL', 
    icon: TerminalIcon, 
    color: 'text-gold', 
    hex: '#e6c03b',
    description: 'Direct kernel access and fractal command execution.'
  },
  network: { 
    name: 'NEURAL_LATTICE', 
    icon: Network, 
    color: 'text-neon-pink', 
    hex: '#ff4068',
    description: 'Real-time neural node synchronization and topology.'
  },
  vault: { 
    name: 'OBLIVION_VAULT', 
    icon: Shield, 
    color: 'text-white', 
    hex: '#ffffff',
    description: 'Hyper-encrypted data storage and sector management.'
  },
  system: { 
    name: 'SYSTEM_TELEMETRY', 
    icon: Cpu, 
    color: 'text-gold', 
    hex: '#e6c03b',
    description: 'Ultra-core processing metrics and hardware health.'
  },
  matrix: { 
    name: 'RECURSIVE_MATRIX', 
    icon: Activity, 
    color: 'text-neon-pink', 
    hex: '#ff4068',
    description: 'Recursive data stream analysis and pattern recognition.'
  },
  comms: { 
    name: 'ENCRYPTED_COMMS', 
    icon: Radio, 
    color: 'text-white', 
    hex: '#ffffff',
    description: 'Quantum-encrypted peer-to-peer communication channels.'
  },
  auth: { 
    name: 'BIOMETRIC_AUTH', 
    icon: Fingerprint, 
    color: 'text-gold', 
    hex: '#e6c03b',
    description: 'Multi-factor biometric verification and gate control.'
  },
  lattice: { 
    name: 'SPATIAL_LATTICE', 
    icon: Box, 
    color: 'text-neon-pink', 
    hex: '#ff4068',
    description: '3D spatial lattice visualization and manipulation.'
  },
  diagnostics: { 
    name: 'SYSTEM_DIAGNOSTICS', 
    icon: Activity, 
    color: 'text-white', 
    hex: '#ffffff',
    description: 'Comprehensive system integrity and diagnostic suite.'
  },
  neural: { 
    name: 'NEURAL_MAP', 
    icon: CommandIcon, 
    color: 'text-gold', 
    hex: '#e6c03b',
    description: 'Global neural topology and architecture mapping.'
  },
  quantum: {
    name: 'QUANTUM_TELEMETRY',
    icon: Zap,
    color: 'text-neon-pink',
    hex: '#ff4068',
    description: 'Advanced quantum state monitoring and entanglement analysis.'
  },
  settings: {
    name: 'SYSTEM_SETTINGS',
    icon: Settings,
    color: 'text-white',
    hex: '#ffffff',
    description: 'Configure system core parameters and visual aesthetics.'
  },
  tasks: {
    name: 'MISSION_OBJECTIVES',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    hex: '#34d399',
    description: 'Strategic task management and objective tracking.'
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
    if (action.startsWith('SET_LOGO_')) {
      const variant = action.replace('SET_LOGO_', '').toLowerCase();
      useStore.getState().setLogoVariant(variant as any);
      addLog(`Logo variant updated to: ${variant.toUpperCase()}`, 'INFO');
    } else {
      addLog(`Executing command: ${action.toUpperCase()}`, 'INFO');
    }
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
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-industrial-gray border border-white/10 shadow-2xl overflow-hidden rounded-lg md:rounded-none"
          >
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-b border-white/10">
              <Search className="w-3.5 h-3.5 md:w-4 h-4 text-white/30" />
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="EXECUTE_COMMAND..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] md:text-sm text-white placeholder:text-white/10"
              />
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white/30">
                <CommandIcon className="w-2 h-2" />
                <span>K</span>
              </div>
            </div>
            <div className="p-1 md:p-2 max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
              {[
                'SYNC_LATTICE', 
                'PURGE_LOGS', 
                'REBOOT_CORE', 
                'SET_LOGO_TRIQUETRA', 
                'SET_LOGO_VARIANT4', 
                'SET_LOGO_VARIANT5',
                'INIT_BIOMETRIC_SCAN'
              ].map((cmd) => (
                <MagneticButton key={cmd} strength={0.1} className="w-full">
                  <button 
                    onClick={() => handleAction(cmd)}
                    className="w-full text-left p-3 font-mono text-[10px] text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between group"
                  >
                    <span>{cmd}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-neon-pink">EXECUTE</span>
                  </button>
                </MagneticButton>
              ))}
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
      'INITIALIZING KERNEL...',
      'MAPPING NEURAL LATTICE...',
      'ALLOCATING QUANTUM SHARD MEMORY...',
      'UPLINK SECURED VIA AES-4096-GCM.',
      'READY.',
      'TYPE "HELP" FOR COMMAND LIST.',
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
          'AVAILABLE COMMANDS:',
          '  HELP       - SHOW THIS LIST',
          '  CLEAR      - CLEAR TERMINAL',
          '  STATUS     - SYSTEM INTEGRITY REPORT',
          '  SYNC       - FORCE LATTICE SYNCHRONIZATION',
          '  QUANTUM    - QUANTUM ENTANGLEMENT TELEMETRY',
          '  BIOMETRIC  - BIOMETRIC SCANNER STATUS',
          '  NEURAL     - NEURAL SYNC DATA',
          '  REBOOT     - RESTART SYSTEM CORE'
        ]);
        break;
      case 'clear':
        setLines([]);
        break;
      case 'status':
        setLines(p => [...p, 
          `SYSTEM_INTEGRITY: 99.998%`, 
          `CORE_TEMP: 32.4°C`, 
          `LATTICE_SYNC: OPTIMAL`,
          `QUANTUM_STABILITY: ${quantumEntanglement.toFixed(2)}%`,
          `NEURAL_COHERENCE: ${(neuralSync * 100).toFixed(1)}%`
        ]);
        break;
      case 'sync':
        setLines(p => [...p, 'SYNCHRONIZING NEURAL NODES...', 'DONE.']);
        addLog('Manual lattice synchronization initiated', 'INFO');
        break;
      case 'quantum':
        setLines(p => [...p, 
          `QUANTUM_ENTANGLEMENT: ${quantumEntanglement.toFixed(4)}`,
          `SHARD_INTEGRITY: ${(Math.random() * 100).toFixed(2)}%`,
          `ENTROPY_LEVEL: LOW`
        ]);
        break;
      case 'biometric':
        setLines(p => [...p, `BIOMETRIC_STATUS: ${biometricStatus.toUpperCase()}`]);
        break;
      case 'neural':
        setLines(p => [...p, `NEURAL_SYNC_INDEX: ${neuralSync.toFixed(6)}`]);
        break;
      case 'reboot':
        setLines(p => [...p, 'REBOOTING SYSTEM CORE...', 'PLEASE WAIT...']);
        setTimeout(() => window.location.reload(), 2000);
        break;
      default:
        setLines(p => [...p, `COMMAND_NOT_FOUND: ${cmd}`]);
    }
    
    setInput('');
  };

  return (
    <div className="h-full w-full p-4 font-mono text-[10px] text-gold overflow-hidden flex flex-col relative bg-black/40">
      <div className="absolute top-4 right-4 text-gold/5 pointer-events-none">
        <TerminalIcon className="w-32 h-32" />
      </div>
      <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scrollbar mb-2 relative z-10">
        {lines.map((l, i) => (
          <div key={i} className="opacity-80 leading-relaxed py-0.5">
            {l.startsWith('>') ? (
              <span className="text-neon-pink font-bold">{l}</span>
            ) : l.startsWith(' ') ? (
              <span className="text-white/60">{l}</span>
            ) : (
              <span>{l}</span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-neon-pink font-bold animate-pulse">{'>'}</span>
          <form onSubmit={handleCommand} className="flex-1">
            <input 
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-gold font-mono placeholder:text-white/5"
              placeholder="ENTER_COMMAND..."
            />
          </form>
        </div>
      </div>
      <div className="h-4 border-t border-white/5 flex items-center justify-between px-2 opacity-30">
        <span className="text-[7px]">SVT_OS_KERNEL_v80.0.0</span>
        <span className="text-[7px]">UPLINK_STABLE</span>
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
    <div className="h-full w-full p-4 md:p-6 flex flex-col gap-4 md:gap-6 relative overflow-y-auto custom-scrollbar bg-obsidian/40">
      <div className="absolute top-8 right-8 text-gold/5 pointer-events-none">
        <Cpu className="w-32 h-32 md:w-64 md:h-64" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
        <GlassCard title="CPU_LOAD" subtitle="Core_Frequency" className="p-3 md:p-4">
          <div className="flex items-end justify-between">
            <div className="font-mono text-2xl text-gold font-black">
              {cpuUsage.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">%</span>
            </div>
            <div className="font-mono text-[9px] text-white/20">{(4.2 + (cpuUsage / 100) * 0.8).toFixed(2)} GHz</div>
          </div>
          <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gold" 
              animate={{ width: `${cpuUsage}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </GlassCard>
        
        <GlassCard title="MEM_ALLOC" subtitle="Shard_Memory" className="p-3 md:p-4">
          <div className="flex items-end justify-between">
            <div className="font-mono text-xl md:text-2xl text-neon-pink font-black">
              {memUsage.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">%</span>
            </div>
            <div className="font-mono text-[8px] md:text-[9px] text-white/20">{(64 * (memUsage / 100)).toFixed(1)} GB</div>
          </div>
          <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-neon-pink" 
              animate={{ width: `${memUsage}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </GlassCard>

        <GlassCard title="QUANTUM_SYNC" subtitle="Neural_Sync_Index" className="p-3 md:p-4">
          <div className="font-mono text-xl md:text-2xl text-white font-black">
            {neuralSync.toFixed(3)}<span className="text-[10px] ml-1 opacity-50">SYNC</span>
          </div>
          <div className="flex gap-1 mt-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`flex-1 h-1 ${i < (neuralSync * 12) ? 'bg-emerald-500/50' : 'bg-white/5'}`} />
            ))}
          </div>
        </GlassCard>

        <GlassCard title="INTEGRITY" subtitle="Shard_Integrity" className="p-3 md:p-4">
          <div className="font-mono text-xl md:text-2xl text-emerald-500 font-black">
            {(shardIntegrity * 100).toFixed(3)}<span className="text-[10px] ml-1 opacity-50">%</span>
          </div>
          <div className="font-mono text-[7px] md:text-[8px] text-emerald-500/50 mt-2 uppercase tracking-widest">Status: Optimal</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[300px] relative z-10">
        <GlassCard title="CPU_TELEMETRY" subtitle="Real-time_Core_Analysis" className="p-4 md:p-6 flex flex-col">
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e6c03b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e6c03b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#e6c03b' }}
                />
                <Area type="monotone" dataKey="val" stroke="#e6c03b" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title="QUANTUM_ENTANGLEMENT" subtitle="Entanglement_Stability_Stream" className="p-4 md:p-6 flex flex-col">
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#ff4068' }}
                />
                <Line type="monotone" dataKey="val3" stroke="#ff4068" strokeWidth={2} dot={false} isAnimationActive={false} />
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
    <div className="h-full w-full p-4 flex flex-col relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5">
        <Lock className="w-48 h-48" />
      </div>
      <div className="font-mono text-[10px] text-white/50 mb-4 relative z-10">
        ENCRYPTED_SECTORS // AES-256-GCM
      </div>
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 relative z-10 overflow-y-auto pr-2">
        {[...Array(48)].map((_, i) => (
          <div key={i} className="aspect-square border border-white/10 bg-white/5 flex flex-col items-center justify-center p-1 md:p-2 group hover:bg-white/20 transition-colors cursor-pointer">
            <Database className="w-3 h-3 md:w-4 md:h-4 text-white/30 group-hover:text-white mb-1" />
            <span className="text-[7px] md:text-[8px] text-white/30 group-hover:text-white font-mono">0x{i.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NetworkApp = () => {
  return (
    <div className="h-full w-full p-4 relative overflow-hidden flex flex-col">
      <div className="font-mono text-[10px] text-neon-pink/50 mb-4 relative z-10 flex justify-between">
        <span>GLOBAL_LATTICE_TOPOLOGY</span>
        <span className="animate-pulse">LIVE_FEED</span>
      </div>
      <div className="flex-1 relative border border-white/5 bg-black/20">
        <NeuralLatticeViz />
        
        <div className="absolute bottom-4 left-4 font-mono text-[9px] text-neon-pink bg-black/60 p-2 backdrop-blur-sm border border-neon-pink/20">
          ACTIVE_NODES: {Math.floor(Math.random() * 1000) + 5000}<br/>
          LATENCY: {Math.floor(Math.random() * 10) + 2}ms<br/>
          PACKET_LOSS: 0.00%
        </div>
      </div>
    </div>
  );
};

const MatrixApp = () => {
  const [columns, setColumns] = useState<number[]>([]);

  useEffect(() => {
    setColumns(Array.from({ length: 20 }, () => Math.floor(Math.random() * 100)));
  }, []);

  return (
    <div className="h-full w-full p-4 font-mono text-[10px] text-neon-pink overflow-hidden bg-black flex justify-between">
      {columns.map((start, i) => (
        <motion.div
          key={i}
          initial={{ y: -100 }}
          animate={{ y: [ -100, 400 ] }}
          transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
          className="flex flex-col gap-1"
        >
          {Array.from({ length: 20 }).map((_, j) => (
            <span key={j} className="opacity-40">{Math.random() > 0.5 ? '1' : '0'}</span>
          ))}
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-4xl font-black tracking-[1em] opacity-10">RECURSIVE</div>
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
    <div className="h-full w-full savant-stack !gap-6 p-6 overflow-y-auto bg-obsidian/20 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-white/5 p-4 bg-black/20">
          <div className="font-mono text-[8px] text-white/20 uppercase mb-2 tracking-widest">CPU_LOAD</div>
          <div className="text-2xl font-black text-gold">{cpuUsage.toFixed(1)}%</div>
          <div className="w-full h-1 bg-white/5 mt-2 overflow-hidden">
            <motion.div className="h-full bg-gold" animate={{ width: `${cpuUsage}%` }} />
          </div>
        </div>
        <div className="border border-white/5 p-4 bg-black/20">
          <div className="font-mono text-[8px] text-white/20 uppercase mb-2 tracking-widest">MEM_ALLOC</div>
          <div className="text-2xl font-black text-neon-pink">{memUsage.toFixed(1)}%</div>
          <div className="w-full h-1 bg-white/5 mt-2 overflow-hidden">
            <motion.div className="h-full bg-neon-pink" animate={{ width: `${memUsage}%` }} />
          </div>
        </div>
      </div>

      <div className="border border-white/5 p-4 bg-black/20 savant-stack !gap-4">
        <div className="font-mono text-[8px] text-white/20 uppercase tracking-widest">LATTICE_HEALTH_METRICS</div>
        <div className="savant-stack !gap-3">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-white/60">ACTIVE_NODES</span>
            <span className="text-white">{activeNodes}</span>
          </div>
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-white/60">SIGNAL_LATENCY</span>
            <span className="text-gold">{latency.toFixed(4)}ms</span>
          </div>
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-white/60">UPTIME</span>
            <span className="text-white">142:12:44:09</span>
          </div>
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-white/60">ENCRYPTION_STRENGTH</span>
            <span className="text-neon-pink">AES-4096-QUANTUM</span>
          </div>
        </div>
      </div>

      <div className="border border-white/5 p-4 bg-black/20 h-32 savant-stack !gap-2">
        <div className="font-mono text-[8px] text-white/20 uppercase tracking-widest">TELEMETRY_STREAM</div>
        <div className="savant-stack !gap-1 opacity-40 text-[8px] font-mono">
          <div>[INFO] NEURAL_LATTICE_SYNC_OK</div>
          <div>[INFO] QUANTUM_ENTANGLEMENT_STABLE</div>
          <div>[WARN] MINOR_PACKET_LOSS_IN_SECTOR_7G</div>
          <div>[INFO] RE-ROUTING_TRAFFIC_THROUGH_CORE_3</div>
          <div>[INFO] SYSTEM_INTEGRITY_99.998%</div>
        </div>
      </div>
    </div>
  );
};

const CommsApp = () => {
  return (
    <div className="h-full w-full p-4 savant-stack !gap-4 relative overflow-hidden">
      <div className="font-mono text-[10px] text-white/50 relative z-10 tracking-widest uppercase">
        SECURE_CHANNELS // P2P_ENCRYPTED
      </div>
      <div className="flex-1 savant-stack !gap-2 relative z-10 overflow-y-auto custom-scrollbar">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border border-white/10 p-2 md:p-3 flex items-center gap-3 md:gap-4 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
              <Radio className="w-3 h-3 md:w-4 md:h-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] md:text-[10px] text-white tracking-widest truncate">AGENT_{Math.random().toString(36).substring(2, 6).toUpperCase()}</div>
              <div className="font-mono text-[7px] md:text-[8px] text-white/30 tracking-widest truncate">STATUS: ONLINE // ENCRYPTED</div>
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
        NEURAL_TOPOLOGY // SECTOR: GLOBAL
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

  return (
    <div className="h-full w-full p-6 flex flex-col gap-6 bg-obsidian/40 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-crimson tracking-[0.3em] font-bold">QUANTUM_STATE_ANALYSIS</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-crimson animate-ping" />
          <span className="font-mono text-[10px] text-crimson/50 uppercase">Live_Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard title="ENTANGLEMENT" subtitle="Stability_Index" className="p-4">
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

        <GlassCard title="NEURAL_SYNC" subtitle="Coherence_Level" className="p-4">
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

      <div className="border border-white/5 bg-black/20 p-4 font-mono text-[10px] text-white/40 leading-relaxed">
        <div className="text-white/60 mb-2 border-b border-white/5 pb-1">QUANTUM_LOG_STREAM</div>
        {history.slice(-5).reverse().map((h, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-white/5 last:border-0">
            <span>[STABILITY_CHECK] ENTANGLEMENT_COHERENCE: {h.entanglement.toFixed(4)}%</span>
            <span className="text-neon-pink/50">{new Date(h.time).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsApp = () => {
  const { 
    logoVariant, 
    setLogoVariant, 
    addLog, 
    chromaticAberration, 
    scanlines, 
    neuralOverlay, 
    toggleEffect 
  } = useStore();

  const variants = [
    { id: 'triquetra', name: 'TRIQUETRA_CORE', description: 'Original fractal geometry.' },
    { id: 'variant4', name: 'OPALINE_SHELL', description: 'Translucent opaline transmission.' },
    { id: 'variant5', name: 'BIOTIC_SHELL', description: 'Organic moss-covered structure.' },
  ];

  const effects = [
    { id: 'chromaticAberration', name: 'CHROMATIC_ABERRATION', active: chromaticAberration },
    { id: 'scanlines', name: 'SCANLINE_OVERLAY', active: scanlines },
    { id: 'neuralOverlay', name: 'NEURAL_OVERLAY', active: neuralOverlay },
  ];

  return (
    <div className="h-full w-full p-6 flex flex-col gap-8 bg-obsidian/40 overflow-y-auto custom-scrollbar">
      <section className="savant-stack !gap-4">
        <div className="font-mono text-xs text-white/50 tracking-[0.3em] uppercase">Visual_Aesthetics_Config</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((v) => (
            <GlassCard 
              key={v.id} 
              title={v.name} 
              subtitle={v.id.toUpperCase()} 
              className={`p-3 md:p-4 cursor-pointer transition-all border-2 ${logoVariant === v.id ? 'border-gold bg-gold/5' : 'border-white/5 hover:border-white/20'}`}
              onClick={() => {
                setLogoVariant(v.id as any);
                addLog(`Logo variant changed to ${v.name}`, 'INFO');
              }}
            >
              <div className="font-mono text-[8px] md:text-[9px] text-white/40 mt-2 leading-relaxed">{v.description}</div>
              {logoVariant === v.id && (
                <div className="mt-3 md:mt-4 flex items-center gap-2 text-gold font-mono text-[9px] md:text-[10px]">
                  <CheckCircle2 className="w-2.5 h-2.5 md:w-3 h-3" />
                  <span>ACTIVE_CORE</span>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="savant-stack !gap-4">
        <div className="font-mono text-xs text-white/50 tracking-[0.3em] uppercase">Post_Processing_Effects</div>
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
        <div className="text-white/60 mb-2 border-b border-white/5 pb-1">KERNEL_VISUAL_OVERRIDE</div>
        <p>Adjusting the logo variant and post-processing effects modifies the primary fractal core rendering engine. Some configurations may require additional GPU cycles for complex shader calculations.</p>
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
      <div className={`flex ${layoutClass} w-full h-full gap-4 p-2 md:p-4 bg-obsidian`}>
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
      className={`w-full h-full border border-white/10 bg-industrial-gray/50 flex flex-col relative group overflow-hidden min-w-[260px] min-h-[200px] transition-all duration-500 ${isMaximized ? 'z-[60] !fixed !inset-0 !m-0 !rounded-none' : ''}`}
    >
      {/* Header */}
      <div className="h-10 border-b border-white/10 bg-obsidian/90 flex items-center justify-between px-2 md:px-4 select-none relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-white/5 pointer-events-none"
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="flex items-center gap-2 md:gap-3 relative z-10">
          <div className="flex items-center gap-1.5">
            <Icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${AppConfig.color}`} />
            <div className={`w-1 h-1 rounded-full ${AppConfig.color} animate-pulse hidden sm:block`} />
          </div>
          <div className="relative">
            <select 
              value={appType}
              onChange={(e) => onChangeApp(node.id, e.target.value as AppType)}
              className={`bg-transparent font-mono text-[9px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] outline-none appearance-none cursor-pointer hover:brightness-125 transition-all pr-3 md:pr-4 ${AppConfig.color}`}
              style={{ color: AppConfig.hex }}
            >
              {Object.entries(APPS).map(([k, v]) => (
                <option key={k} value={k} className="bg-obsidian text-white">{v.name}</option>
              ))}
            </select>
            <ChevronRight className={`w-2 h-2 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none ${AppConfig.color} opacity-50`} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 relative z-10">
          <div className="hidden lg:flex items-center gap-2 px-2 py-0.5 border border-white/5 bg-white/5 rounded-full">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="font-mono text-[7px] text-white/30 uppercase tracking-tighter">Node_Active</span>
          </div>

          <div className="flex items-center gap-0.5 md:gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            {!isMobile && (
              <>
                <button onClick={() => onSplit(node.id, 'horizontal')} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Split Horizontal">
                  <SplitSquareHorizontal className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onSplit(node.id, 'vertical')} className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Split Vertical">
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            {!isRoot && (
              <button onClick={() => onClose(node.id)} className="p-1.5 hover:bg-crimson/20 text-white/40 hover:text-crimson transition-colors" title="Close Pane">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative bg-obsidian/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={appType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
      <GlobalLattice />
      {neuralOverlay && <div className="fixed inset-0 z-30 pointer-events-none opacity-20"><NeuralLatticeViz /></div>}
      <div className="noise-overlay opacity-10" />
      {scanlines && <div className="scanlines-overlay opacity-5" />}
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
      
      {/* Top Bar */}
      <div className="h-12 border-b border-white/10 bg-obsidian/95 backdrop-blur-xl flex items-center justify-between px-3 md:px-8 z-50 relative group">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex gap-1 group-hover:gap-2 transition-all duration-500">
            <div className="w-1.5 h-1.5 bg-neon-pink rotate-45 shadow-[0_0_10px_#ff4068]" />
            <div className="w-1.5 h-1.5 bg-white/10 rotate-45" />
          </div>
          <span className="font-display font-black text-base md:text-lg tracking-tighter text-white group-hover:glitch-text transition-all">
            SAVANT<span className="text-neon-pink">_</span>OS
          </span>
          <div className="hidden md:block h-4 w-[1px] bg-white/10 mx-2" />
          <span className="font-mono text-[9px] text-white/30 tracking-[0.3em] hidden xl:inline-block uppercase">
            Sovereign_Fractal_Architecture_v80.0.0_ULTRA
          </span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-8 font-mono text-[10px]">
          <div 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Search className="w-3 h-3 text-white/40" />
            <span className="text-white/20 hidden sm:inline">SEARCH...</span>
            <div className="hidden md:flex items-center gap-1 px-1 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-white/30">
              <CommandIcon className="w-2 h-2" />
              <span>K</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full hover:border-gold/30 transition-colors cursor-help">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#e6c03b]" />
            <span className="text-white/40 tracking-widest hidden lg:inline-block">UPLINK_STABLE</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-white/[0.03] border border-white/5 rounded-full">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[7px] text-white/20 uppercase tracking-tighter">System_Load</span>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-neon-pink"
                  animate={{ width: `${systemLoad * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <span className="text-white/40 font-mono text-[10px] w-8">{(systemLoad * 100).toFixed(0)}%</span>
          </div>
          
          <div className="text-white/20 tracking-widest hidden sm:inline-block font-tech">
            {new Date().toISOString().split('T')[1].substring(0, 8)} <span className="text-[8px] opacity-50">UTC</span>
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