import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Float, PerspectiveCamera, Points, PointMaterial, OrbitControls, MeshTransmissionMaterial, Sphere, Trail, Line } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, DepthOfField, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

const NeuralConnections = ({ count = 150, radius = 3 }) => {
  const { systemLoad } = useStore();
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      p.push(new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.5,
        radius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 0.5,
        radius * Math.cos(phi) + (Math.random() - 0.5) * 0.5
      ));
    }
    return p;
  }, [count, radius]);

  const lines = useMemo(() => {
    const l = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = points[i].distanceTo(points[j]);
        if (dist < 1.5 && Math.random() > 0.5) {
          l.push([points[i], points[j]]);
        }
      }
    }
    return l;
  }, [points]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <Line 
          key={i} 
          points={line} 
          color="#FF4068" 
          lineWidth={1} 
          transparent 
          opacity={0.15 + systemLoad * 0.3} 
          blending={THREE.AdditiveBlending}
        />
      ))}
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

const CoreGeometry = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { systemLoad } = useStore();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = time * (0.5 + systemLoad);
      meshRef.current.rotation.x = time * 0.3;
      const s = (hovered ? 1.2 : 1) * (clicked ? 0.8 : 1) * (1 + Math.sin(time * 2) * 0.05);
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <Sphere 
        ref={meshRef} 
        args={[1.2, 64, 64]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        <MeshTransmissionMaterial
          backside
          samples={16}
          thickness={3}
          chromaticAberration={0.2}
          anisotropy={0.5}
          distortion={0.5}
          distortionScale={1}
          temporalDistortion={0.2}
          ior={1.5}
          color="#ffffff"
          resolution={2048}
          transmission={1}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
      {/* Internal Core Glow */}
      <Sphere args={[0.8, 32, 32]}>
        <meshBasicMaterial color="#E6C03B" transparent opacity={0.9} />
      </Sphere>
      <pointLight color="#E6C03B" intensity={5} distance={10} />
      <pointLight color="#FF4068" intensity={3} distance={15} position={[2, 2, 2]} />
    </group>
  );
};

export const Lattice3D = () => {
  const { cpuUsage, systemLoad } = useStore();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <div className="w-full h-full bg-obsidian relative overflow-hidden group/lattice">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={3} color="#ff4068" />
        <spotLight position={[0, 5, 0]} intensity={4} color="#e6c03b" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <NeuralConnections count={150} radius={3} />
          <CoreGeometry />
        </Float>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5 + systemLoad * 2}
          makeDefault
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />

        <EffectComposer enableNormalPass={false} multisampling={4}>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5 + systemLoad * 2} mipmapBlur />
          <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.002 * (1 + systemLoad), 0.002 * (1 + systemLoad))} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
        
        <color attach="background" args={['#050505']} />
      </Canvas>
      
      {/* UI Overlays */}
      <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
        <div className="font-mono text-[10px] text-white/20 tracking-[0.5em]">
          neural_lattice_v12.0_ultra
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-mono text-[8px] text-emerald-500/60 tracking-widest">sync_active</span>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 font-mono text-[10px] text-neon-pink/40 tracking-[0.3em] flex flex-col items-end pointer-events-none">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-neon-pink"
              animate={{ width: `${cpuUsage}%` }}
            />
          </div>
          <span>load: {cpuUsage.toFixed(1)}%</span>
        </div>
        <span className="text-[8px] opacity-50">symmetry_status: {systemLoad > 0.8 ? 'critical' : 'optimal'}</span>
      </div>

      {/* Interactive Legend */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveNode('core')}>
          <div className="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-gold transition-all" />
          <span className="font-mono text-[9px] text-white/30 group-hover:text-white tracking-widest">singularity_core</span>
        </div>
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveNode('lattice')}>
          <div className="w-8 h-[1px] bg-white/20 group-hover:w-12 group-hover:bg-neon-pink transition-all" />
          <span className="font-mono text-[9px] text-white/30 group-hover:text-white tracking-widest">neural_fabric</span>
        </div>
      </div>

      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-1/2 left-8 -translate-y-1/2 p-6 border border-white/10 bg-black/80 backdrop-blur-xl max-w-xs"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-display font-black text-xl text-white tracking-tighter">{activeNode}</h4>
              <button onClick={() => setActiveNode(null)} className="text-white/20 hover:text-white transition-colors">
                <span className="font-mono text-[10px]">close</span>
              </button>
            </div>
            <p className="font-mono text-[10px] text-white/40 leading-relaxed tracking-widest">
              {activeNode === 'core' 
                ? 'the central processing unit of the savant os. handles recursive fractal logic and sovereign data encryption.' 
                : 'a distributed network of neural nodes facilitating hyper-speed communication across the global lattice.'}
            </p>
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="font-mono text-[8px] text-white/20 tracking-widest">status: active</span>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 m-4">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20" />
      </div>
    </div>
  );
};

