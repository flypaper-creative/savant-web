import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ArrowRight, Zap, Globe, Cpu, Shield } from 'lucide-react';

const ACTIONS = [
  { id: 'home', label: 'NAVIGATE_HOME', icon: Globe, path: '/' },
  { id: 'work', label: 'VIEW_WORK', icon: Zap, path: '/work' },
  { id: 'services', label: 'EXPLORE_SERVICES', icon: Cpu, path: '/services' },
  { id: 'apps', label: 'LAUNCH_APPS', icon: Shield, path: '/apps' },
  { id: 'journal', label: 'READ_JOURNAL', icon: Search, path: '/journal' },
  { id: 'contact', label: 'INITIATE_CONTACT', icon: ArrowRight, path: '/contact' },
];

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const filteredActions = ACTIONS.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        handleSelect(filteredActions[selectedIndex].path);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-industrial-gray/90 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center px-6 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-white/20 mr-4" />
              <input
                autoFocus
                type="text"
                placeholder="SEARCH_SAVANT_ECOSYSTEM..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/10"
              />
              <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/10">
                <Command className="w-3 h-3 text-white/40" />
                <span className="text-[9px] font-mono text-white/40">K</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              {filteredActions.length > 0 ? (
                filteredActions.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelect(action.path)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                      i === selectedIndex ? 'bg-white/10 translate-x-2' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg border transition-colors ${
                        i === selectedIndex ? 'border-neon-pink text-neon-pink' : 'border-white/5 text-white/20'
                      }`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className={`font-mono text-[11px] tracking-widest transition-colors ${
                        i === selectedIndex ? 'text-white' : 'text-white/40'
                      }`}>
                        {action.label}
                      </span>
                    </div>
                    {i === selectedIndex && (
                      <motion.div layoutId="arrow" className="text-neon-pink">
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-10 text-center font-mono text-[10px] text-white/20  tracking-[0.5em]">
                  NO_RESULTS_FOUND
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/20">↑↓</span>
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">NAVIGATE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/20">ENTER</span>
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">SELECT</span>
                </div>
              </div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                SAVANT_OS_v80.0.0
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
