import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Terminal, Shield, Zap, Eye, EyeOff, Activity, Cpu, Database, Globe, Lock, Unlock, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { uiSound } from '../utils/audio';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  category: 'SYSTEM' | 'NAVIGATION' | 'SECURITY' | 'VISUALS';
}

export const NeuralCommand = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { 
    addLog, 
    toggleEffect, 
    chromaticAberration, 
    scanlines, 
    neuralOverlay,
    clearance,
    setClearance
  } = useStore();

  const commands: CommandItem[] = [
    {
      id: 'nav-home',
      title: 'NAVIGATE_TO_CORE',
      description: 'Return to the primary interface matrix.',
      icon: Globe,
      action: () => navigate('/'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-os',
      title: 'INITIALIZE_SOVEREIGN_OS',
      description: 'Access the recursive spatial operating environment.',
      icon: Terminal,
      action: () => navigate('/os'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-journal',
      title: 'ACCESS_SYSTEM_LOGS',
      description: 'Retrieve encrypted journal entries and logs.',
      icon: Database,
      action: () => navigate('/journal'),
      category: 'NAVIGATION'
    },
    {
      id: 'nav-admin',
      title: 'COMMAND_CENTER',
      description: 'Restricted administrative data controls.',
      icon: Shield,
      action: () => navigate('/admin'),
      category: 'NAVIGATION'
    },
    {
      id: 'effect-chroma',
      title: chromaticAberration ? 'DISABLE_CHROMATIC_DISTORTION' : 'ENABLE_CHROMATIC_DISTORTION',
      description: 'Toggle RGB shift post-processing layer.',
      icon: Zap,
      action: () => toggleEffect('chromaticAberration'),
      category: 'VISUALS'
    },
    {
      id: 'effect-scanlines',
      title: scanlines ? 'DISABLE_SCANLINE_OVERLAY' : 'ENABLE_SCANLINE_OVERLAY',
      description: 'Toggle CRT-style horizontal scanlines.',
      icon: Activity,
      action: () => toggleEffect('scanlines'),
      category: 'VISUALS'
    },
    {
      id: 'effect-neural',
      title: neuralOverlay ? 'DISABLE_NEURAL_OVERLAY' : 'ENABLE_NEURAL_OVERLAY',
      description: 'Toggle immersive neural lattice visualization.',
      icon: Eye,
      action: () => toggleEffect('neuralOverlay'),
      category: 'VISUALS'
    },
    {
      id: 'sec-root',
      title: 'ELEVATE_TO_ROOT',
      description: 'Bypass standard security protocols (Requires clearance).',
      icon: clearance === 'ROOT' ? Lock : Unlock,
      action: () => {
        if (clearance === 'ROOT') {
          setClearance('USER');
          addLog('Clearance downgraded to USER', 'WARN');
        } else {
          setClearance('ROOT');
          addLog('Clearance elevated to ROOT', 'CRITICAL');
        }
      },
      category: 'SECURITY'
    },
    {
      id: 'sys-purge',
      title: 'PURGE_LOCAL_CACHE',
      description: 'Clear all persistent system data and logs.',
      icon: LogOut,
      action: () => {
        localStorage.clear();
        window.location.reload();
      },
      category: 'SYSTEM'
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        if (!isOpen) uiSound.playHover();
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      uiSound.playHover();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      uiSound.playHover();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        cmd.action();
        setIsOpen(false);
        uiSound.playClick();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[25000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            className="relative w-full max-w-2xl bg-obsidian/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-2xl"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-8 border-b border-white/10 bg-white/[0.02]">
              <Search className="w-6 h-6 text-neon-pink" />
              <input 
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="EXECUTE_COMMAND..."
                className="flex-1 bg-transparent border-none outline-none font-display font-black text-2xl text-white placeholder:text-white/5 tracking-tighter"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-white/40 tracking-widest">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button 
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                          uiSound.playClick();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full text-left p-5 flex items-center gap-6 transition-all relative group ${isSelected ? 'bg-white text-black' : 'hover:bg-white/5 text-white/50'}`}
                      >
                        <div className={`p-3 border ${isSelected ? 'border-black/20 bg-black/5' : 'border-white/10 bg-white/5'} group-hover:scale-110 transition-transform rounded-lg`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-neon-pink' : 'text-white/40'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-bold text-sm tracking-tight">{cmd.title}</span>
                            <span className={`font-mono text-[8px] px-2 py-0.5 border rounded ${isSelected ? 'border-black/20 text-black/40' : 'border-white/10 text-white/20'}`}>
                              {cmd.category}
                            </span>
                          </div>
                          <div className={`font-mono text-[10px] tracking-wide ${isSelected ? 'text-black/60' : 'text-white/30'}`}>
                            {cmd.description}
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div 
                            layoutId="active-indicator"
                            className="absolute right-0 w-1.5 h-full bg-neon-pink"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="font-mono text-xs text-white/20 tracking-widest uppercase">No matching commands found in lattice.</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-obsidian/50 flex items-center justify-between font-mono text-[9px] text-white/30 tracking-widest">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 border border-white/10 rounded">↑↓</kbd> NAVIGATE</span>
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 border border-white/10 rounded">ENTER</kbd> EXECUTE</span>
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 border border-white/10 rounded">ESC</kbd> CLOSE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-pulse" />
                <span>SOVEREIGN_CORE_v5.5</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};