import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const COMMANDS: Record<string, string | (() => string)> = {
  help: 'AVAILABLE_COMMANDS: [status, clear, about, navigate, system_info, whoami]',
  status: 'SYSTEM_STATUS: OPTIMAL // NEURAL_LATTICE: ACTIVE // UPLINK: STABLE',
  about: 'SAVANT_OS v80.0.0 // A SOVEREIGN DIGITAL ECOSYSTEM FOR THE ELITE CREATIVE.',
  whoami: 'OPERATOR_ID: SAVANT_USER_001 // ACCESS_LEVEL: SOVEREIGN',
  system_info: () => `OS: SAVANT_OS_v80.0.0\nKERNEL: NEURAL_LATTICE_v3.2\nUPTIME: ${Math.floor(performance.now() / 1000)}s\nMEMORY: 4.2GB / 16GB`,
};

export const BrandTerminal: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['>> SAVANT_TERMINAL_v80.0.0_INITIALIZED', '>> TYPE "help" FOR COMMANDS']);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    if (!cmd) return;

    let response = '';
    if (COMMANDS[cmd]) {
      response = typeof COMMANDS[cmd] === 'function' ? (COMMANDS[cmd] as () => string)() : (COMMANDS[cmd] as string);
    } else if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else if (cmd.startsWith('navigate ')) {
      const path = cmd.split(' ')[1];
      response = `NAVIGATING TO: /${path}... [REDIRECTING]`;
      setTimeout(() => window.location.href = `/${path}`, 1000);
    } else {
      response = `ERROR: COMMAND_NOT_FOUND: "${cmd}"`;
    }

    setHistory(prev => [...prev, `> ${input}`, response]);
    setInput('');
  };

  return (
    <div className="w-full h-full flex flex-col font-mono text-xs md:text-sm bg-black/20 rounded-xl overflow-hidden border border-white/5">
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-2" ref={scrollRef}>
        {history.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={line.startsWith('>') ? 'text-neon-pink' : 'text-white/60'}
          >
            {line}
          </motion.div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center gap-4">
        <span className="text-neon-pink font-bold">{'>'}</span>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/10"
          placeholder="ENTER_COMMAND..."
        />
      </form>
    </div>
  );
};
