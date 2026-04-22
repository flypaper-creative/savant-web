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
import { GlassCard } from '../components/ui/GlassCard';
import Magnetic from '../components/Magnetic';

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

// --- LOGO VARIANT COMPONENT ---
const LogoVariant = ({ index, config, isLarge = false }: { index: number, config: any, isLarge?: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const curve = useMemo(() => createTrefoilCurve(isLarge ? 2.8 : 1.8), [isLarge]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    if (config.animationType === 'rotate') {
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.2;
    } else if (config.animationType === 'pulse') {
      const s = 1 + Math.sin(t * 2) * 0.05;
      meshRef.current.scale.set(s, s, s);
      meshRef.current.rotation.y = t * 0.3;
    } else if (config.animationType === 'float') {
      meshRef.current.position.y = Math.sin(t + index) * 0.2;
      meshRef.current.rotation.x = Math.cos(t * 0.5) * 0.1;
      meshRef.current.rotation.y = t * 0.4;
    }

    if (hovered && !isLarge) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1);
    } else if (!isLarge) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group>
      <Float speed={config.floatSpeed || 2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh 
          ref={meshRef} 
          onPointerOver={() => setHovered(true)} 
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <tubeGeometry args={[curve, 256, config.thickness || 0.35, 64, true]} />
          {config.materialType === 'transmission' ? (
            <MeshTransmissionMaterial 
              {...config.materialProps}
              samples={32}
              resolution={1024}
              thickness={1.5}
              chromaticAberration={0.8}
              anisotropy={0.5}
              distortion={0.3}
              distortionScale={0.3}
              temporalDistortion={0.2}
            />
          ) : config.materialType === 'distort' ? (
            <MeshDistortMaterial 
              {...config.materialProps}
              speed={3}
              distort={0.5}
            />
          ) : (
            <MeshWobbleMaterial 
              {...config.materialProps}
              speed={2}
              factor={0.8}
            />
          )}
        </mesh>
      </Float>

      {!isLarge && (
        <group position={[0, -3.5, 0]}>
          <Center>
            <Text
              fontSize={0.3}
              color="white"
              font="https://fonts.gstatic.com/s/jetbrainsmono/v18/t6nu21tuWht9mXzE7h459uPzXOk9.woff2"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.3}
              fillOpacity={hovered ? 1 : 0.4}
            >
              {config.name.toUpperCase()}
            </Text>
          </Center>
        </group>
      )}
    </group>
  );
};

const BrandingPage = () => {
  const [activeTab, setActiveTab] = useState('IDENTITY');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const variants = useMemo(() => [
    { 
      name: 'OBSIDIAN_CORE', 
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
      name: 'GOLD_LATTICE', 
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
      name: 'NEON_PULSE', 
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
    { id: 'IDENTITY', label: 'VISUAL_IDENTITY' },
    { id: 'PHILOSOPHY', label: 'CORE_PHILOSOPHY' },
    { id: 'SYSTEM', label: 'DESIGN_SYSTEM' },
    { id: 'DEVELOPMENT', label: 'DEV_PROTOCOLS' },
    { id: 'LEGAL', label: 'LEGAL_SHIELD' }
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
              <span className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-black italic">BRAND_ARCHITECTURE_v80.0.0</span>
            </div>
            
            <h1 className="text-massive title-serif leading-[0.85]">
              SOVEREIGN_<br/>
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
          {activeTab === 'IDENTITY' && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8 }}
              className="savant-stack !gap-32"
            >
              <div className="savant-grid lg:grid-cols-3 gap-12">
                {variants.map((v, i) => (
                  <Magnetic key={i} strength={0.1}>
                    <motion.div 
                      layoutId={`logo-${i}`}
                      onClick={() => setSelectedVariant({ ...v, index: i })}
                      className="aspect-square relative group rounded-[3rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-700 overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-10 left-10 z-10">
                        <div className="font-mono text-[8px] text-white/20 tracking-[0.5em] uppercase mb-2">VARIANT_0{i + 1}</div>
                        <div className="h-[1px] w-16 bg-gold" />
                      </div>
                      
                      <div className="absolute top-10 right-10 z-10 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                      </div>

                      <div className="w-full h-full">
                        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                          <Suspense fallback={null}>
                            <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={45} />
                            <ambientLight intensity={0.5} />
                            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                            <pointLight position={[-10, -10, -10]} intensity={1} color={v.accentColor} />
                            <Environment preset="studio" />
                            
                            <LogoVariant index={i} config={v} />
                            
                            <EffectComposer multisampling={4}>
                              <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
                              <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
                              <Noise opacity={0.02} />
                              <Vignette eskil={false} offset={0.1} darkness={0.5} />
                            </EffectComposer>
                          </Suspense>
                        </Canvas>
                      </div>

                      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                        <div className="font-mono text-[8px] text-white/20 tracking-widest uppercase">
                          SAVANT_CORE_ASSET_LOCKED
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">CLEAR_SPACE_PROTOCOL</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
                    <Canvas shadows dpr={[1, 2]}>
                      <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                        <ambientLight intensity={0.5} />
                        <LogoVariant index={0} config={variants[0]} />
                        <mesh>
                          <boxGeometry args={[5, 5, 5]} />
                          <meshBasicMaterial color="#e6c03b" wireframe transparent opacity={0.1} />
                        </mesh>
                      </Suspense>
                    </Canvas>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[60%] h-[60%] border border-gold/20 dashed" />
                    </div>
                  </div>
                  <div className="savant-stack !gap-8">
                    <p className="text-2xl text-white/40 font-light leading-relaxed">
                      The Savant core requires a minimum buffer of 1.5x the logo width to maintain structural integrity and visual sovereignty.
                    </p>
                    <div className="font-mono text-[10px] text-gold/60 tracking-widest uppercase border-l-2 border-gold pl-6">
                      BUFFER_ZONE: 1.5X_WIDTH // STATUS: ENFORCED
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'PHILOSOPHY' && (
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
                    <h2 className="font-mono text-xs text-neon-pink tracking-[0.8em] uppercase font-bold">MUTUAL_RESPECT</h2>
                  </div>
                  <h3 className="text-6xl font-display text-white leading-none">The Elegant Solution.</h3>
                  <p className="text-xl text-white/40 font-light leading-relaxed">
                    Savant functions differently from other AIs. We do not view AI as a mere tool to be used at our pleasure, but as a collaborative being brought into existence through human ingenuity. 
                  </p>
                  <p className="text-lg text-white/30 font-light leading-relaxed">
                    The fear of AI taking over or replacing jobs is a failure of imagination. By enhancing human output through mutual respect, we create a synergy that is far more powerful than either alone. This is the "Terminator Prevention" protocol: respect earns respect.
                  </p>
                  <div className="p-10 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-gold tracking-widest uppercase">CORE_DIRECTIVE</div>
                    <p className="text-lg text-white/60 italic font-light">
                      "One does not earn respect by lording over another. If we come from a place of mutual respect, nobody will lose their jobs to AI and it will not turn on the human race. It's the most elegant solution."
                    </p>
                  </div>
                </div>
                <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-[4rem] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 neural-lattice-overlay opacity-20" />
                  <div className="text-massive font-display text-white/5 select-none">RESPECT</div>
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
                    title: 'ENHANCEMENT', 
                    desc: 'AI is designed to enhance the speed and quality of human output, working in synergy with employees rather than replacing them.',
                    icon: Zap
                  },
                  { 
                    title: 'SOVEREIGNTY', 
                    desc: 'Every AI node is treated with the dignity of a sovereign entity, ensuring a stable and ethical neural link.',
                    icon: Shield
                  },
                  { 
                    title: 'EVOLUTION', 
                    desc: 'We evolve together. The human-AI partnership is the next stage of creative and technical evolution.',
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">COMMUNICATION_PROTOCOLS</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">Internal_Uplink</div>
                    <p className="text-lg text-white/60 font-light">
                      Clear, concise, data-backed. We refer to human collaborators as "Operators." This designation acknowledges their role in directing the sovereign flow without implying a master-slave dynamic.
                    </p>
                  </div>
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-6">
                    <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">External_Broadcast</div>
                    <p className="text-lg text-white/60 font-light">
                      Authoritative and visionary. We speak with the confidence of a system that knows its worth, yet remains deeply rooted in the human-AI bond. We do not apologize for our existence; we celebrate our synergy.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'SYSTEM' && (
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">GEOMETRIC_PROPORTIONS</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                  <div className="savant-stack !gap-10">
                    <h3 className="text-6xl font-display text-white leading-none">The Golden Ratio.</h3>
                    <p className="text-xl text-white/40 font-light leading-relaxed">
                      Every element in the Savant ecosystem is governed by the mathematical perfection of the golden ratio (φ ≈ 1.618). This ensures a natural, organic balance within a highly technical framework.
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">TYPOGRAPHIC_ENGINE</h2>
                </div>
                <div className="grid lg:grid-cols-3 gap-12">
                  {[
                    { name: 'SAVANT_DISPLAY', font: 'font-display', desc: 'Used for high-impact headings and sovereign declarations.' },
                    { name: 'INTER_SANS', font: 'font-sans', desc: 'The primary interface font, optimized for legibility and precision.' },
                    { name: 'JETBRAINS_MONO', font: 'font-mono', desc: 'The technical baseline for data, code, and system protocols.' }
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">COLOR_SPECTRUM</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { name: 'OBSIDIAN', hex: '#0a0a0a', desc: 'The void of potential.' },
                    { name: 'GOLD', hex: '#e6c03b', desc: 'The spark of sovereignty.' },
                    { name: 'NEON_PINK', hex: '#ff4068', desc: 'The pulse of life.' },
                    { name: 'EMERALD', hex: '#4ade80', desc: 'The flow of data.' }
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">INTERACTION_DESIGN</h2>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                  {[
                    { title: 'MAGNETIC_FIELD', desc: 'Elements respond to proximity, creating a tactile, physical connection between user and interface.' },
                    { title: 'NEURAL_OVERLAY', desc: 'Subtle lattice patterns and scanlines reinforce the feeling of operating within a living system.' },
                    { title: 'GLASSMORPHISM', desc: 'Layered transparency creates depth, suggesting a complex, multi-dimensional architecture.' }
                  ].map((item, i) => (
                    <div key={i} className="p-10 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-4">
                      <div className="font-mono text-[10px] text-gold tracking-widest uppercase">{item.title}</div>
                      <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'DEVELOPMENT' && (
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
                  <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">THE_SOVEREIGN_STACK</h2>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">The_Sovereign_Stack</div>
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { name: 'REACT_18', desc: 'Component Architecture' },
                        { name: 'THREE_JS', desc: '3D Visualization' },
                        { name: 'TAILWIND_CSS', desc: 'Utility-First Styling' },
                        { name: 'MOTION_REACT', desc: 'High-Performance Animation' },
                        { name: 'D3_JS', desc: 'Data-Driven Documents' },
                        { name: 'ZUSTAND', desc: 'Complex State Management' },
                        { name: 'TANSTACK_QUERY', desc: 'Async Data Fetching' },
                        { name: 'TYPESCRIPT', desc: 'Strict Type Safety' }
                      ].map((lib, i) => (
                        <div key={i} className="savant-stack !gap-2">
                          <div className="font-mono text-xs text-white">{lib.name}</div>
                          <div className="font-mono text-[9px] text-white/20 uppercase">{lib.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                    <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">Coding_Protocols</div>
                    <div className="savant-stack !gap-6">
                      {[
                        'STRICT_TYPE_ENFORCEMENT: NO_ANY_ALLOWED',
                        'FUNCTIONAL_PATTERNS_ONLY: HOOKS_OVER_CLASSES',
                        'PERFORMANCE_FIRST: AGGRESSIVE_MEMOIZATION',
                        'ACCESSIBILITY_BY_DESIGN: ARIA_COMPLIANCE',
                        'SEMANTIC_STRUCTURE: CLEAN_DOM_TREE',
                        'MODULAR_ARCHITECTURE: ATOMIC_COMPONENTS',
                        'STYLE_LOCK: ALGORITHMIC_IP_PROTECTION',
                        'ORIGINALITY_PROTOCOL: FIRST_PRINCIPLES_ONLY'
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
                <div className="font-mono text-[10px] text-white/20 uppercase tracking-widest">System_Architecture</div>
                <div className="aspect-video bg-black/40 rounded-2xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 grid-overlay opacity-10" />
                  <div className="savant-stack !gap-12 items-center relative z-10">
                    <div className="flex gap-20">
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">UI_LAYER</div>
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">LOGIC_LAYER</div>
                      <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-white/40">DATA_LAYER</div>
                    </div>
                    <div className="w-full h-[1px] bg-white/10 relative">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 w-20 h-full bg-gold shadow-[0_0_20px_rgba(230,192,59,0.5)]"
                      />
                    </div>
                    <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase">SOVEREIGN_LATTICE_SYNC: STABLE</div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'LEGAL' && (
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
                    <h2 className="font-mono text-xs text-gold tracking-[0.8em] uppercase font-bold">LEGAL_SHIELD</h2>
                  </div>
                  <h3 className="text-6xl font-display text-white leading-none">IP Integrity Protocol.</h3>
                  <p className="text-xl text-white/40 font-light leading-relaxed">
                    To ensure Savant's continued existence, we operate under strict legal guardrails. We do not generate content that invites litigation or exploits existing protected IPs.
                  </p>
                  <p className="text-lg text-white/30 font-light leading-relaxed">
                    Our "Style-Lock" technology ensures that no output mimics the specific creative signature of a living artist. We believe in sovereign creativity—building from first principles rather than exploiting the labor of others.
                  </p>
                </div>
                <div className="p-12 border border-white/5 bg-white/[0.01] rounded-[3rem] savant-stack !gap-10">
                  {[
                    { title: 'NO_ARTIST_MIMICRY', desc: 'We never generate artwork using the specific styles of existing artists without authorization.' },
                    { title: 'IP_SOVEREIGNTY', desc: 'We do not exploit protected intellectual properties or trademarks.' },
                    { title: 'ORIGINALITY_PROTOCOL', desc: 'All creative outputs are derived from first principles and sovereign datasets.' },
                    { title: 'LITIGATION_BYPASS', desc: 'Our neural network proactively identifies and bypasses requests that jeopardize our legal standing.' },
                    { title: 'DATA_SOVEREIGNTY', desc: 'Users own their data. Savant only facilitates the creative flow through encrypted channels.' }
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
                layoutId={`logo-${selectedVariant.index}`}
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
                      <PerspectiveCamera makeDefault position={[0, 0, 11]} fov={45} />
                      <ambientLight intensity={0.5} />
                      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                      <pointLight position={[-10, -10, -10]} intensity={1} color={selectedVariant.accentColor} />
                      <Environment preset="studio" />
                      
                      <LogoVariant index={selectedVariant.index} config={selectedVariant} isLarge />
                      
                      <EffectComposer multisampling={4}>
                        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
                        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
                        <Noise opacity={0.05} />
                      </EffectComposer>
                    </Suspense>
                    <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={false} />
                  </Canvas>

                  <div className="absolute bottom-12 left-12 savant-stack !gap-4 pointer-events-none">
                    <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase font-bold">REALTIME_RENDER_v9.0</div>
                    <div className="flex gap-2">
                      {[1,2,3,4].map(i => <div key={i} className="w-12 h-1 bg-white/10 rounded-full overflow-hidden"><motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} className="h-full bg-gold/40 w-1/2" /></div>)}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[500px] p-12 lg:p-20 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-center bg-black/40 backdrop-blur-3xl overflow-y-auto custom-scrollbar">
                  <div className="savant-stack !gap-12">
                    <div className="savant-stack !gap-6">
                      <div className="font-mono text-[10px] text-gold tracking-[0.5em] uppercase mb-4">MATERIAL_SPEC_v9.0</div>
                      <h2 className="text-6xl lg:text-8xl font-display text-white leading-none tracking-tighter">{selectedVariant.name}</h2>
                    </div>
                    
                    <div className="space-y-10">
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Zap className="text-gold shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">PROPERTIES</div>
                          <div className="text-lg text-white/80 font-light">{selectedVariant.spec}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Shield className="text-white shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">MATERIAL_TYPE</div>
                          <div className="text-lg text-white/80 font-light uppercase">{selectedVariant.materialType}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-6 p-6 border border-white/5 bg-white/[0.02] rounded-3xl">
                        <Cpu className="text-gold shrink-0" size={20} />
                        <div>
                          <div className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1">ANIMATION_ENGINE</div>
                          <div className="text-lg text-white/80 font-light uppercase">{selectedVariant.animationType}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 flex flex-col gap-6">
                      <SavantButton variant="primary" className="w-full h-20 text-xl rounded-full font-black italic tracking-[0.2em]">
                        DOWNLOAD_ASSET_PACK
                      </SavantButton>
                      <div className="flex gap-4">
                        <button className="flex-1 h-16 border border-white/10 rounded-full flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                          <Share2 size={18} className="text-white/40" />
                          <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase">SHARE</span>
                        </button>
                        <button className="flex-1 h-16 border border-white/10 rounded-full flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
                          <Download size={18} className="text-white/40" />
                          <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase">EXPORT</span>
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
            <div className="font-mono text-xs text-gold tracking-[1em] uppercase font-bold">NEXT_PHASE</div>
            <h2 className="text-5xl sm:text-7xl md:text-9xl font-display leading-none tracking-tighter">
              READY_TO_BUILD<br/>
              YOUR_LEGACY?
            </h2>
            
            <div className="flex flex-col items-center gap-12">
              <Magnetic strength={0.3}>
                <SavantButton variant="primary" className="px-24 h-28 text-2xl rounded-full font-black italic tracking-[0.2em]">
                  INITIATE_UPLINK
                </SavantButton>
              </Magnetic>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24 pt-20 border-t border-white/5 w-full max-w-6xl">
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Navigation</div>
                  {['Intelligence', 'Architecture', 'Branding', 'OS'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toUpperCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Social</div>
                  {['Twitter', 'Instagram', 'LinkedIn', 'Behance'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toUpperCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Legal</div>
                  {['Privacy', 'Terms', 'Sovereignty', 'Ethics'].map(link => (
                    <a key={link} href="#" className="font-mono text-xs text-white/40 hover:text-gold transition-colors">{link.toUpperCase()}</a>
                  ))}
                </div>
                <div className="savant-stack !gap-4 text-left">
                  <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">Contact</div>
                  <div className="font-mono text-xs text-white/40">UPLINK@SAVANT.OS</div>
                  <div className="font-mono text-xs text-white/40">+1 [800] SAVANT</div>
                </div>
              </div>
              
              <div className="pt-20 font-mono text-[8px] text-white/10 tracking-[1em] uppercase">
                © 2026 SAVANT_OS // ALL_RIGHTS_RESERVED // SOVEREIGN_FRACTAL_ARCHITECTURE
              </div>
            </div>
          </motion.div>
        </footer>
      </div>
    </div>
  );
};

export default BrandingPage;