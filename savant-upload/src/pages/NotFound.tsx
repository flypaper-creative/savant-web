import React, { Suspense } from 'react';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Float, Text, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Glitch, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SavantButton } from '../components/ui/SavantButton';
import { Terminal, AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const GlitchText = ({ text }: { text: string }) => {
  return (
    <div className="relative inline-block group">
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 text-neon-pink opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-100 animate-pulse">
        {text}
      </span>
      <span className="absolute top-0 left-0 -z-10 text-gold opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:translate-y-1 transition-all duration-100 animate-pulse">
        {text}
      </span>
    </div>
  );
};

const ErrorScene = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#e6c03b" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ff4068" />
      
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Center>
          <Text
            font="/fonts/Inter-Bold.woff"
            fontSize={4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={10}
            textAlign="center"
          >
            404
            <meshStandardMaterial 
              emissive="#ffffff" 
              emissiveIntensity={0.5} 
              roughness={0.1} 
              metalness={1} 
            />
          </Text>
        </Center>
      </Float>

      <Environment preset="night" />
      
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.1} luminanceSmoothing={0.9} />
        <Noise opacity={0.1} />
        <Glitch 
          delay={new THREE.Vector2(1.5, 3.5)} 
          duration={new THREE.Vector2(0.6, 1.0)} 
          strength={new THREE.Vector2(0.3, 0.5)} 
          mode={1} 
          active 
          ratio={0.85} 
        />
        <ChromaticAberration offset={new THREE.Vector2(0.004, 0.004)} />
      </EffectComposer>
    </>
  );
};

const NotFound = () => {
  return (
    <div className="min-h-screen bg-obsidian text-white flex flex-col relative overflow-hidden">
      {/* Background Overlays */}
      <div className="absolute inset-0 noise-overlay opacity-10 pointer-events-none" />
      <div className="absolute inset-0 scanlines-overlay opacity-5 pointer-events-none" />
      <div className="absolute inset-0 grid-overlay opacity-10 pointer-events-none" />
      
      {/* 3D Scene Container */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={null}>
            <ErrorScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="savant-stack !gap-12 max-w-3xl"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center bg-white/[0.02] relative group overflow-hidden">
              <AlertTriangle className="text-gold group-hover:scale-110 transition-transform duration-500" size={32} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-gold/20 rounded-full"
              />
            </div>
            <div className="font-mono text-xs text-gold tracking-[0.8em]  font-black italic">ERROR_CODE: 404_NULL_POINTER</div>
          </div>

          <h1 className="text-7xl md:text-9xl font-display leading-none tracking-tighter">
            REALITY_<br/>
            <span className="text-gold italic font-light">Fragmented.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/40 font-light leading-relaxed max-w-xl mx-auto">
            The requested coordinate does not exist within the current sovereign lattice. 
            The path has been de-materialized or never existed.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
            <Link to="/">
              <SavantButton variant="primary" className="px-12 h-16 rounded-full font-black italic tracking-[0.2em] flex items-center gap-4">
                <Home size={18} />
                RETURN_TO_BASE
              </SavantButton>
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 h-16 border border-white/10 rounded-full font-mono text-[10px] tracking-widest uppercase hover:bg-white/5 hover:border-gold/30 transition-all flex items-center justify-center gap-4"
            >
              <RefreshCw size={18} className="text-gold" />
              RE_SYNC_LATTICE
            </button>
          </div>
        </motion.div>
      </main>

      {/* Terminal Footer */}
      <footer className="relative z-10 p-10 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <Terminal className="text-white/20" size={20} />
            <div className="font-mono text-[10px] text-white/20 tracking-widest uppercase">
              SYSTEM_LOG: [404] ATTEMPTED_ACCESS_TO_UNDEFINED_NODE // TIMESTAMP: {new Date().toISOString()}
            </div>
          </div>
          <div className="flex gap-10">
            <div className="font-mono text-[9px] text-white/10 tracking-widest uppercase">NODE_ID: UNKNOWN</div>
            <div className="font-mono text-[9px] text-white/10 tracking-widest uppercase">PROTOCOL: SOVEREIGN_OS_v80.0.0</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
