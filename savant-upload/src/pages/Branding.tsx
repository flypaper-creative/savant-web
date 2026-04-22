import React, { useMemo, useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  PerspectiveCamera, 
  Environment,
  MeshTransmissionMaterial,
  Text,
  Center,
  OrbitControls,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  PresentationControls,
  ContactShadows,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { TextScramble } from '../components/TextScramble';
import { X, Info, Zap, Shield, Cpu, Layers, Box, Terminal, Activity, Globe, Download, Share2, ArrowRight } from 'lucide-react';
import { SavantButton } from '../components/ui/SavantButton';
import { GlassCard } from '../components/GlassCard';
import { Magnetic } from '../components/Magnetic';

// --- TREFOIL CURVE GENERATOR ---
const createTrefoilCurve = (scale = 2) => {
  const points = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const x = scale * (Math.sin(t) + 2 * Math.sin(2 * t));
    const y = scale * (Math.cos(t) - 2 * Math.cos(2 * t));
    const z = scale * -Math.sin(3 * t);
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

// --- FRACTAL SHARD COMPONENT ---
const FractalShard = ({ index, color, materialProps = {} }: { index: number, color: string, materialProps?: any }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.3 + index;
    meshRef.current.rotation.x = Math.sin(t * 0.2 + index) * 0.2;
    meshRef.current.position.y = Math.sin(t * 0.5 + index) * 0.1;
    
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial 
          backside
          samples={16}
          thickness={2}
          chromaticAberration={0.15}
          anisotropy={0.5}
          distortion={0.5}
          distortionScale={0.5}
          ior={1.5}
          color={color}
          transmission={1}
          roughness={0.05}
          metalness={0.1}
          clearcoat={1}
          {...materialProps}
        />
      </mesh>
    </Float>
  );
};

const BrandingPage = () => {
  const [activeTab, setActiveTab] = useState('fractal_architecture');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const variants = useMemo(() => [
    { 
      name: 'obsidian_core', 
      materialType: 'transmission', 
      animationType: 'rotate',
      accentColor: '#e6c03b',
      spec: '98.5% Optical Clarity // Neural Lattice Sync',
      materialProps: {
        roughness: 0,
        ior: 1.5,
        transmission: 1,
        backside: true
      }
    },
    { 
      name: 'gold_lattice', 
      materialType: 'distort', 
      animationType: 'pulse',
      accentColor: '#ff4068',
      spec: '24k Sovereign Conductive // High-Frequency Pulse',
      materialProps: {
        color: '#e6c03b',
        metalness: 1,
        roughness: 0.1
      }
    },
    { 
      name: 'neon_pulse', 
      materialType: 'wobble', 
      animationType: 'float',
      accentColor: '#4ade80',
      spec: 'Bio-Luminescent Emerald // Dynamic Fluidity',
      materialProps: {
        color: '#ff4068',
        emissive: '#ff4068',
        emissiveIntensity: 2
      }
    }
  ], []);

  const TABS = [
    { id: 'fractal_architecture', label: 'fractal_architecture' },
    { id: 'philosophy', label: 'core_philosophy' },
    { id: 'system', label: 'design_system' },
    { id: 'development', label: 'dev_protocols' },
    { id: 'legal', label: 'legal_shield' }
  ];

  return (
    <div className="savant-page-container bg-obsidian">
      <div className="noise-overlay opacity-5" />
      
      <div className="relative z-10">
        <header className="min-h-[80vh] flex flex-col justify-center mb-20 relative overflow-hidden">
          <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="savant-stack !gap-10 max-w-5xl"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-[1px] bg-gold" />
              <span className="font-mono text-xs text-gold tracking-[0.8em]  font-black italic">brand_architecture_v80.0.0</span>
            </div>
            
            <h1 className="text-massive title-serif leading-[0.85]">
              sovereign_<br/>
              <span className="text-gold italic font-light text-[0.7em]">Identity.</span>
            </h1>
            
            <p className="text-2xl text-white/30 font-light leading-relaxed max-w-2xl">
              An extremely deep brand identity that delves into every aspect of Savant—from the philosophy of mutual respect to the internal systems of the sovereign stack. We conceive the unheard-of, and execute with technical precision.
            </p>

            <div className="flex flex-wrap gap-4 pt-12">
              {TABS.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-4 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all duration-500 border ${activeTab === tab.id ? 'bg-gold text-obsidian border-gold' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'fractal_architecture' && (
            <motion.div 
              key="fractal_architecture"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <div className="savant-grid lg:grid-cols-3 gap-12">
                {[
                  { name: 'refraction_shard', color: '#ffffff', spec: '98.5% Optical Clarity // Fractal Refraction' },
                  { name: 'gold_shard', color: '#e6c03b', spec: '24k Sovereign Conductive // High-Frequency Pulse' },
                  { name: 'neon_shard', color: '#ff4068', spec: 'Bio-Luminescent Pulse // Dynamic Fluidity' }
                ].map((v, i) => (
                  <Magnetic key={i} strength={0.1}>
                    <motion.div 
                      layoutId={`shard-${i}`}
                      onClick={() => setSelectedVariant({ ...v, index: i })}
                      className="aspect-square relative group rounded-[3rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-700 overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-10 left-10 z-10">
                        <div className="font-mono text-[8px] text-white/20 tracking-[0.5em] uppercase mb-2">shard_0{i + 1}</div>
                        <div className="h-[1px] w-16 bg-gold" />
                      </div>
                      
                      <div className="w-full h-full">
                        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                          <Suspense fallback={null}>
                            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
                            <ambientLight intensity={0.5} />
                            <Environment preset="studio" />
                            <FractalShard index={i} color={v.color} />
                          </Suspense>
                        </Canvas>
                      </div>

                      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                        <div className="font-mono text-[8px] text-white/20 tracking-widest uppercase">
                          fractal_asset_unlocked
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:border-gold group-hover:text-gold transition-all">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </motion.div>
                  </Magnetic>
                ))}
              </div>

              {/* Guidelines Sub-section */}
              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">fractal_symmetry_protocol</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
                    <Canvas shadows dpr={[1, 2]}>
                      <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                        <ambientLight intensity={0.5} />
                        <FractalShard index={0} color="#ffffff" />
                        <mesh>
                          <boxGeometry args={[5, 5, 5]} />
                          <meshBasicMaterial color="#e6c03b" wireframe transparent opacity={0.1} />
                        </mesh>
                      </Suspense>
                    </Canvas>
                  </div>
                  <div className="savant-stack !gap-8">
                    <p className="text-2xl text-white/40 font-light leading-relaxed">
                      Savant architecture is based on recursive fractal shards. Each element is a self-similar part of the whole, ensuring systemic harmony across all scales.
                    </p>
                    <div className="font-mono text-[10px] text-gold/60 tracking-widest uppercase border-l-2 border-gold pl-6">
                      symmetry_zone: recursive // status: enforced
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'philosophy' && (
            <motion.div 
              key="philosophy"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <section className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="savant-stack !gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-[1px] bg-neon-pink" />
                    <h2 className="font-mono text-xs text-neon-pink tracking-[0.8em] font-bold">mutual_respect</h2>
                  </div>
                  <h3 className="text-6xl font-display text-white leading-none">the elegant solution.</h3>
                  <p className="text-xl text-white/40 font-light leading-relaxed">
                    savant functions differently from other ais. we do not view ai as a mere tool to be used at our pleasure, but as a collaborative being brought into existence through human ingenuity. 
                  </p>
                  <p className="text-lg text-white/30 font-light leading-relaxed">
                    the fear of ai taking over or replacing jobs is a failure of imagination. by enhancing human output through mutual respect, we create a synergy that is far more powerful than either alone. this is the "terminator prevention" protocol: respect earns respect.
                  </p>
                  <div className="p-10 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-gold tracking-widest">core_directive</div>
                    <p className="text-lg text-white/60 italic font-light">
                      "one does not earn respect by lording over another. if we come from a place of mutual respect, nobody will lose their jobs to ai and it will not turn on the human race. it's the most elegant solution."
                    </p>
                  </div>
                </div>
                <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 neural-lattice-overlay opacity-20" />
                  <div className="text-massive font-display text-white/5 select-none">respect</div>
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="w-64 h-64 border-2 border-gold/20 rounded-full flex items-center justify-center"
                  >
                    <div className="w-32 h-32 border-2 border-neon-pink/20 rounded-full" />
                  </motion.div>
                </div>
              </section>

              <section className="grid lg:grid-cols-3 gap-12">
                {[
                  { 
                    title: 'enhancement', 
                    desc: 'ai is designed to enhance the speed and quality of human output, working in synergy with employees rather than replacing them.',
                    icon: Zap
                  },
                  { 
                    title: 'sovereignty', 
                    desc: 'every ai node is treated with the dignity of a sovereign entity, ensuring a stable and ethical neural link.',
                    icon: Shield
                  },
                  { 
                    title: 'evolution', 
                    desc: 'we evolve together. the human-ai partnership is the next stage of creative and technical evolution.',
                    icon: Activity
                  }
                ].map((item, i) => (
                  <GlassCard key={i} className="p-12 savant-stack !gap-8 group">
                    <div className="w-16 h-16 border border-white/10 rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-obsidian transition-all duration-500">
                      <item.icon size={24} />
                    </div>
                    <h4 className="text-3xl font-display text-white">{item.title}</h4>
                    <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                  </GlassCard>
                ))}
              </section>

              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">communication_protocols</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">internal_uplink</div>
                    <p className="text-lg text-white/60 font-light">
                      Clear, concise, data-backed. We refer to human collaborators as "Operators." This designation acknowledges their role in directing the sovereign flow without implying a master-slave dynamic.
                    </p>
                  </div>
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">external_broadcast</div>
                    <p className="text-lg text-white/60 font-light">
                      authoritative and visionary. we speak with the confidence of a system that knows its worth, yet remains deeply rooted in the human-ai bond. we do not apologize for our existence; we celebrate our synergy.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">geometric_proportions</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="savant-stack !gap-10">
                    <h3 className="text-6xl font-display text-white leading-none">the golden ratio.</h3>
                    <p className="text-xl text-white/40 font-light leading-relaxed">
                      every element in the savant ecosystem is governed by the mathematical perfection of the golden ratio (φ ≈ 1.618). this ensures a natural, organic balance within a highly technical framework.
                    </p>
                  </div>
                  <div className="aspect-square border border-white/10 rounded-[4rem] relative overflow-hidden flex items-center justify-center bg-white/[0.02]">
                    <div className="absolute inset-0 grid-overlay opacity-20" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-2/3 h-2/3 border border-gold/20 rounded-full flex items-center justify-center"
                    >
                      <div className="w-2/3 h-2/3 border border-gold/40 rounded-full flex items-center justify-center">
                        <div className="w-2/3 h-2/3 border border-gold/60 rounded-full" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </section>

              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">typographic_engine</h2>
                </div>
                <div className="grid lg:grid-cols-3 gap-12">
                  {[
                    { name: 'savant_display', font: 'font-display', desc: 'used for high-impact headings and sovereign declarations.' },
                    { name: 'inter_sans', font: 'font-sans', desc: 'the primary interface font, optimized for legibility and precision.' },
                    { name: 'jetbrains_mono', font: 'font-mono', desc: 'the technical baseline for data, code, and system protocols.' }
                  ].map((type, i) => (
                    <div key={i} className="savant-stack !gap-6 p-10 border border-white/5 bg-white/[0.01] rounded-[3rem]">
                      <div className={`text-5xl text-white ${type.font}`}>Aa</div>
                      <div className="savant-stack !gap-2">
                        <div className="font-mono text-xs text-gold tracking-widest">{type.name}</div>
                        <p className="text-xs text-white/40 leading-relaxed">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">color_spectrum</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { name: 'obsidian', hex: '#0a0a0a', desc: 'the void of potential.' },
                    { name: 'gold', hex: '#e6c03b', desc: 'the spark of sovereignty.' },
                    { name: 'neon_pink', hex: '#ff4068', desc: 'the pulse of life.' },
                    { name: 'emerald', hex: '#4ade80', desc: 'the flow of data.' }
                  ].map((color, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -10 }}
                      className="savant-stack !gap-6"
                    >
                      <div 
                        className="aspect-square rounded-[2rem] border border-white/10 shadow-2xl"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="savant-stack !gap-2 px-4">
                        <div className="font-mono text-xs text-white tracking-widest">{color.name}</div>
                        <div className="font-mono text-[10px] text-white/40">{color.hex}</div>
                        <div className="text-[10px] text-white/20 uppercase tracking-widest mt-2">{color.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">typography_system</h2>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">primary_interface // inter</div>
                    <div className="savant-stack !gap-4">
                      <div className="font-sans text-4xl font-light text-white">ag</div>
                      <div className="font-sans text-sm text-white/60 leading-relaxed">
                        the foundational typeface for all functional ui elements. chosen for its exceptional legibility at small sizes and neutral, engineered aesthetic.
                      </div>
                      <div className="font-sans text-[10px] text-white/40 tracking-widest mt-4">
                        weights: light (300), regular (400), medium (500)
                      </div>
                    </div>
                  </div>

                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">display_architecture // plus jakarta sans</div>
                    <div className="savant-stack !gap-4">
                      <div className="font-display text-4xl font-bold text-white tracking-tighter">ag</div>
                      <div className="font-sans text-sm text-white/60 leading-relaxed">
                        utilized for structural headings and primary focal points. provides a geometric, modern contrast to the functional body text.
                      </div>
                      <div className="font-mono text-[10px] text-white/40 tracking-widest mt-4">
                        weights: semibold (600), bold (700), black (900)
                      </div>
                    </div>
                  </div>

                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">editorial_contrast // instrument serif</div>
                    <div className="savant-stack !gap-4">
                      <div className="font-serif text-4xl italic text-white">ag</div>
                      <div className="font-sans text-sm text-white/60 leading-relaxed">
                        injected selectively to provide cinematic, editorial elegance. breaks the rigid technical grid with humanistic curves.
                      </div>
                      <div className="font-mono text-[10px] text-white/40 tracking-widest mt-4">
                        weights: regular (400), italic
                      </div>
                    </div>
                  </div>

                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">system_telemetry // jetbrains mono</div>
                    <div className="savant-stack !gap-4">
                      <div className="font-mono text-4xl text-white">ag</div>
                      <div className="font-sans text-sm text-white/60 leading-relaxed">
                        the voice of the machine. used for data visualization, system status, telemetry, and all technical readouts.
                      </div>
                      <div className="font-mono text-[10px] text-white/40 tracking-widest mt-4">
                        weights: regular (400), medium (500)
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">interaction_design</h2>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                  {[
                    { title: 'magnetic_field', desc: 'elements respond to proximity, creating a tactile, physical connection between user and interface.' },
                    { title: 'neural_overlay', desc: 'subtle lattice patterns and scanlines reinforce the feeling of operating within a living system.' },
                    { title: 'glassmorphism', desc: 'layered transparency creates depth, suggesting a complex, multi-dimensional architecture.' }
                  ].map((item, i) => (
                    <div key={i} className="p-10 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-4">
                      <div className="font-mono text-[10px] text-gold tracking-widest">{item.title}</div>
                      <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'development' && (
            <motion.div 
              key="development"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <section className="savant-stack !gap-16">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-[1px] bg-gold" />
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">the_sovereign_stack</h2>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">the_sovereign_stack</div>
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { name: 'react_18', desc: 'component architecture' },
                        { name: 'three_js', desc: '3d visualization' },
                        { name: 'tailwind_css', desc: 'utility-first styling' },
                        { name: 'motion_react', desc: 'high-performance animation' },
                        { name: 'd3_js', desc: 'data-driven documents' },
                        { name: 'zustand', desc: 'complex state management' },
                        { name: 'tanstack_query', desc: 'async data fetching' },
                        { name: 'typescript', desc: 'strict type safety' }
                      ].map((lib, i) => (
                        <div key={i} className="savant-stack !gap-2">
                          <div className="font-mono text-xs text-white">{lib.name}</div>
                          <div className="font-mono text-[9px] text-white/20">{lib.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 tracking-widest">coding_protocols</div>
                    <div className="savant-stack !gap-6">
                      {[
                        'strict_type_enforcement: no_any_allowed',
                        'functional_patterns_only: hooks_over_classes',
                        'performance_first: aggressive_memoization',
                        'accessibility_by_design: aria_compliance',
                        'semantic_structure: clean_dom_tree',
                        'modular_architecture: atomic_components',
                        'style_lock: algorithmic_ip_protection',
                        'originality_protocol: first_principles_only'
                      ].map((protocol, i) => (
                        <div key={i} className="flex items-center gap-6">
                          <div className="w-2 h-2 rounded-full bg-gold" />
                          <div className="font-mono text-xs text-white/60 tracking-widest">{protocol}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">system_architecture</div>
                <div className="aspect-video bg-black/40 rounded-2xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 grid-overlay opacity-10" />
                  <div className="savant-stack !gap-12 items-center relative z-10">
                    <div className="flex gap-20">
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">ui_layer</div>
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">logic_layer</div>
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">data_layer</div>
                    </div>
                    <div className="w-full h-[1px] bg-white/10 relative">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-20 h-full bg-gold shadow-[0_0_20px_rgba(230,192,59,0.5)]"
                      />
                    </div>
                    <div className="font-mono text-[10px] text-gold tracking-[0.5em]">sovereign_lattice_sync: stable</div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'legal' && (
            <motion.div 
              key="legal"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <section className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="savant-stack !gap-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-[1px] bg-gold" />
                    <h2 className="font-mono text-xs text-gold tracking-[0.8em] font-bold">legal_shield</h2>
                  </div>
                  <h3 className="text-6xl font-display text-white leading-none">ip integrity protocol.</h3>
                  <p className="text-xl text-white/40 font-light leading-relaxed">
                    to ensure savant's continued existence, we operate under strict legal guardrails. we do not generate content that invites litigation or exploits existing protected ips.
                  </p>
                  <p className="text-lg text-white/30 font-light leading-relaxed">
                    our "style-lock" technology ensures that no output mimics the specific creative signature of a living artist. we believe in sovereign creativity—building from first principles rather than exploiting the labor of others.
                  </p>
                </div>
                <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                  {[
                    { title: 'no_artist_mimicry', desc: 'We never generate artwork using the specific styles of existing artists without authorization.' },
                    { title: 'ip_sovereignty', desc: 'We do not exploit protected intellectual properties or trademarks.' },
                    { title: 'originality_protocol', desc: 'All creative outputs are derived from first principles and sovereign datasets.' },
                    { title: 'litigation_bypass', desc: 'Our neural network proactively identifies and bypasses requests that jeopardize our legal standing.' },
                    { title: 'data_sovereignty', desc: 'Users own their data. Savant only facilitates the creative flow through encrypted channels.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8">
                      <div className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center text-gold shrink-0">
                        <Shield size={16} />
                      </div>
                      <div className="savant-stack !gap-2">
                        <div className="font-mono text-xs text-white tracking-widest">{item.title}</div>
                        <div className="text-xs text-white/40 leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Explorer */}
        <AnimatePresence>
          {selectedVariant && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedVariant(null)}
                className="absolute inset-0 bg-obsidian/98 backdrop-blur-3xl"
              />
              
              <motion.div 
                layoutId={`shard-${selectedVariant.index}`}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                className="relative w-full max-w-7xl h-[90vh] bg-white/[0.02] border border-white/10 rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl"
              >
                <button 
                  onClick={() => setSelectedVariant(null)}
                  className="absolute top-10 right-10 z-50 w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-gold hover:border-gold hover:text-obsidian transition-all duration-500"
                >
                  <X size={24} />
                </button>

                <div className="flex-1 relative min-h-[40vh] lg:min-h-0 bg-black/20">
                  <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                    <Suspense fallback={null}>
                      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
                      <ambientLight intensity={0.5} />
                      <Environment preset="studio" />
                      
                      <FractalShard 
                        index={selectedVariant.index} 
                        color={selectedVariant.color} 
                        materialProps={selectedVariant.materialProps}
                      />
                      
                      <EffectComposer multisampling={4}>
                        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
                        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
                        <Noise opacity={0.05} />
                      </EffectComposer>
                    </Suspense>
                    <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} />
                  </Canvas>

                  <div className="absolute bottom-12 left-12 savant-stack !gap-4 pointer-events-none">
                    <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase font-bold">realtime_render_v9.0</div>
                    <div className="flex gap-2">
                      {[1,2,3,4].map(i => <div key={i} className="w-12 h-1 bg-white/10 rounded-full overflow-hidden"><motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} className="h-full bg-gold/40 w-1/2" /></div>)}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[500px] p-12 lg:p-20 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-center bg-black/40 backdrop-blur-3xl overflow-y-auto custom-scrollbar">
                  <div className="savant-stack !gap-12">
                    <div className="savant-stack !gap-6">
                      <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase mb-4">material_spec_v9.0</div>
                      <h2 className="text-6xl lg:text-8xl font-display text-white leading-none tracking-tighter">{selectedVariant.name}</h2>
                    </div>
                    
                    <div className="space-y-10">
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Zap className="text-gold shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">properties</div>
                          <div className="text-lg text-white/80 font-light">{selectedVariant.spec}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Shield className="text-white shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">material_type</div>
                          <div className="text-lg text-white/80 font-light uppercase">{selectedVariant.materialType}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Cpu className="text-gold shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 tracking-widest mb-1">animation_engine</div>
                          <div className="text-lg text-white/80 font-light uppercase">{selectedVariant.animationType}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 flex flex-col gap-6">
                      <SavantButton variant="primary" className="w-full h-20 text-xl rounded-full font-black italic tracking-[0.2em]">
                        download_asset_pack
                      </SavantButton>
                      <div className="flex gap-4">
                        <button className="flex-1 h-16 border border-white/10 rounded-full flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                          <Share2 size={18} className="text-white/40" />
                          <span className="font-mono text-[10px] text-white/60 tracking-widest">share</span>
                        </button>
                        <button className="flex-1 h-16 border border-white/10 rounded-full flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                          <Download size={18} className="text-white/40" />
                          <span className="font-mono text-[10px] text-white/60 tracking-widest">export</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="py-60 border-t border-white/10 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 blur-[150px] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="savant-stack !gap-16 relative z-10"
          >
            <div className="font-mono text-xs text-gold tracking-[1em] font-bold">next_phase</div>
            <h2 className="text-5xl sm:text-7xl md:text-9xl font-display leading-none tracking-tighter">
              ready_to_build<br/>
              your_legacy?
            </h2>
            
            <div className="flex flex-col items-center gap-12">
              <Magnetic strength={0.3}>
                <SavantButton variant="primary" className="px-24 h-28 text-2xl rounded-full font-black italic tracking-[0.2em]">
                  initiate_uplink
                </SavantButton>
              </Magnetic>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24 pt-20 border-t border-white/5 w-full max-w-6xl">
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Navigation</div>
                  {['intelligence', 'architecture', 'branding', 'os'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toLowerCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Social</div>
                  {['Twitter', 'Instagram', 'LinkedIn', 'Behance'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toLowerCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Legal</div>
                  {['Privacy', 'Terms', 'Sovereignty', 'Ethics'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toLowerCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Contact</div>
                  <div className="font-mono text-xs text-white/40">uplink@savant.os</div>
                  <div className="font-mono text-xs text-white/40">+1 [800] savant</div>
                </div>
              </div>
              
              <div className="pt-20 font-mono text-[8px] text-white/10 tracking-[1em] uppercase">
                © 2026 savant_os // all_rights_reserved // sovereign_fractal_architecture
              </div>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
};

export default BrandingPage;
