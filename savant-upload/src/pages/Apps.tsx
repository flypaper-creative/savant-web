import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { TechButton } from '../components/TechButton';
import { TextScramble } from '../components/TextScramble';
import { ZoomBlock } from '../components/ZoomBlock';
import { MagneticButton } from '../components/MagneticButton';
import { SavantButton } from '../components/ui/SavantButton';
import { GlassCard } from '../components/GlassCard';
import { BrandTerminal } from '../components/apps/BrandTerminal';
import { NeuralLattice } from '../components/apps/NeuralLattice';
import { TelemetryDashboard } from '../components/apps/TelemetryDashboard';
import { LatticeGraph } from '../components/apps/LatticeGraph';
import { SovereignVault } from '../components/apps/SovereignVault';

const APPS = [
  { id: '01', title: 'brand_terminal', desc: 'a high-impact branding interface built on recursive creative logic. real-time identity visualization and predictive market modeling.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop', color: 'gold', hex: '#E6C03B', colorClass: 'bg-[#E6C03B]', component: BrandTerminal },
  { id: '02', title: 'neural_lattice', desc: 'generative visualizer and neural network simulation. observe the flow of creative energy across the sovereign lattice.', img: 'https://images.unsplash.com/photo-1614064641913-a53b14683186?q=80&w=2574&auto=format&fit=crop', color: 'neon-pink', hex: '#FF4068', colorClass: 'bg-[#FF4068]', component: NeuralLattice },
  { id: '03', title: 'telemetry_dashboard', desc: 'studio telemetry and brand monitoring. real-time data visualization of global savant nodes and system health.', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2668&auto=format&fit=crop', color: 'white', hex: 'currentColor', colorClass: 'bg-current', component: TelemetryDashboard },
  { id: '04', title: 'lattice_graph', desc: '3d topology mapping of brand connections and neural nodes. visualize the structural integrity of the sovereign network.', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', color: 'gold', hex: '#E6C03B', colorClass: 'bg-[#E6C03B]', component: LatticeGraph },
  { id: '05', title: 'sovereign_vault', desc: 'secure asset explorer and file management matrix. encrypted storage for high-value creative artifacts.', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2670&auto=format&fit=crop', color: 'neon-pink', hex: '#FF4068', colorClass: 'bg-[#FF4068]', component: SovereignVault }
];

const AppInterface = ({ app, onClose }: { app: typeof APPS[0], onClose: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isBooted, setIsBooted] = useState(false);

  useEffect(() => {
    const bootSequence = [
      `>> initializing_savant_os_v80.0.0`,
      `>> loading_entity: ${app.title}`,
      '>> establishing_neural_link...',
      '>> decrypting_sovereign_lattice...',
      '>> truth_anchor: stable',
      '>> access_granted: welcome_operator'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < bootSequence.length) {
        setLines(prev => [...prev, bootSequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooted(true), 500);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [app.title]);

  const AppComponent = app.component;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-obsidian/98 backdrop-blur-3xl"
    >
      <div className="absolute inset-0 neural-lattice-overlay opacity-10" />
      <div className="absolute inset-0 scanlines-overlay opacity-5" />
      
      <div className="w-full h-full max-w-7xl border border-current/5 bg-current/5 relative overflow-hidden flex flex-col rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-10 py-6 border-b border-current/5 bg-current/5">
          <div className="flex items-center gap-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: app.hex }} />
            <div className="font-mono text-[10px] opacity-40 tracking-[0.5em]">
              {app.title} // system_id: {app.id}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="group flex items-center gap-4 font-mono text-[10px] opacity-30 hover:text-[#FF4068] hover:opacity-100 transition-all"
          >
            terminate_session [esc]
            <div className="w-8 h-8 border border-current/10 flex items-center justify-center rounded-lg group-hover:border-[#FF4068] transition-colors">
              x
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {!isBooted ? (
              <motion.div 
                key="boot"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-4 pt-20"
              >
                {lines.map((line, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-mono text-xs tracking-widest"
                    style={{ color: idx === lines.length - 1 ? app.hex : 'rgba(255,255,255,0.4)' }}
                  >
                    {line}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="app"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex-1 min-h-[500px]">
                  <AppComponent />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-10 py-4 border-t border-current/5 bg-current/5 flex justify-between items-center">
          <div className="flex gap-10">
            <div className="text-[9px] font-mono opacity-20">cpu: 12%</div>
            <div className="text-[9px] font-mono opacity-20">mem: 4.2gb</div>
          </div>
          <div className="text-[9px] font-mono opacity-20">savant_os_v80.0.0_stable</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Apps() {
  const [activeApp, setActiveApp] = useState<typeof APPS[0] | null>(null);

  return (
    <div className="savant-page-container">
      <AnimatePresence>
        {activeApp && (
          <AppInterface app={activeApp} onClose={() => setActiveApp(null)} />
        )}
      </AnimatePresence>

      <div className="savant-stack">
        <div className="relative mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="text-massive title-serif"
          >
            sovereign<br/>
            <span className="text-[#FF4068]">applications</span>
          </motion.h1>
          <div className="absolute top-0 right-0 rail-text h-full opacity-30">
            savant_os_app_ecosystem_v80.0.0_manifest
          </div>
        </div>

        <div className="savant-grid grid-cols-1 lg:grid-cols-2">
          {APPS.map((app, i) => (
            <GlassCard 
              key={app.id}
              className="p-8 md:p-12 savant-stack !gap-10 group"
            >
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 border border-current/10 flex items-center justify-center rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-1000">
                  <div className="w-6 h-6 rotate-45 group-hover:-rotate-45 transition-transform duration-1000" style={{ backgroundColor: app.hex }} />
                </div>
                <span className="font-mono text-[10px] opacity-20 tracking-[0.5em]">app_{app.id}</span>
              </div>

              <div className="savant-stack !gap-6">
                <h2 className="text-3xl md:text-5xl font-display">{app.title}</h2>
                <p className="text-base md:text-lg opacity-40 leading-relaxed font-light">{app.desc}</p>
              </div>

              <div className="pt-10">
                <MagneticButton strength={0.2} className="w-full">
                  <SavantButton 
                    onClick={() => setActiveApp(app)}
                    variant="outline"
                    className="w-full h-16"
                  >
                    launch_interface
                  </SavantButton>
                </MagneticButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
