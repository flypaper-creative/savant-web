import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Text, MeshDistortMaterial, MeshWobbleMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { BRANDING } from '../styles/branding';

interface FractalNodeProps {
  position: [number, number, number];
  scale: number;
  depth: number;
  maxDepth: number;
}

function FractalNode({ position, scale, depth, maxDepth }: FractalNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(time * 0.2 + depth) * 0.1;
    meshRef.current.rotation.y = Math.cos(time * 0.1 + depth) * 0.1;
    
    const targetScale = hovered ? scale * 1.15 : scale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  const children = useMemo(() => {
    if (depth >= maxDepth) return [];
    const nextScale = scale * 0.45;
    const offset = scale * 0.85;
    
    // Architectural Fractal Pattern
    const positions: [number, number, number][] = [
      [offset, offset, offset],
      [-offset, offset, offset],
      [offset, -offset, offset],
      [-offset, -offset, offset],
      [offset, offset, -offset],
      [-offset, offset, -offset],
      [offset, -offset, -offset],
      [-offset, -offset, -offset],
    ];

    return positions.map((pos, i) => (
      <FractalNode 
        key={i} 
        position={pos} 
        scale={nextScale} 
        depth={depth + 1} 
        maxDepth={maxDepth} 
      />
    ));
  }, [depth, maxDepth, scale]);

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <MeshWobbleMaterial 
          color={hovered ? BRANDING.colors.gold.base : (depth % 2 === 0 ? BRANDING.colors.neonPink.base : "#ffffff")}
          factor={0.1}
          speed={1}
          emissive={hovered ? BRANDING.colors.gold.base : BRANDING.colors.neonPink.base}
          emissiveIntensity={hovered ? 4 : 0.2}
          transparent
          opacity={1 - depth * 0.2}
          wireframe={depth > 1}
        />
      </mesh>
      {children}
    </group>
  );
}

function Scene({ zoom }: { zoom: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const targetZ = 100 / zoom;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={100} color={BRANDING.colors.gold.base} />
      <pointLight position={[-10, -10, -10]} intensity={100} color={BRANDING.colors.neonPink.base} />
      <FractalNode position={[0, 0, 0]} scale={10} depth={0} maxDepth={3} />
    </>
  );
}

export default function FractalExplorer() {
  const [zoom, setZoom] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const handleScroll = (e: React.WheelEvent) => {
    setZoom(prev => Math.max(0.1, Math.min(10, prev - e.deltaY * 0.001)));
  };

  return (
    <div 
      className="w-full h-[600px] relative rounded-3xl overflow-hidden bg-black/40 border border-white/5 group"
      onWheel={handleScroll}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        <div className="text-[10px] font-mono text-neon-pink tracking-[0.4em]  font-bold">Fractal_Lattice_v2.0</div>
        <div className="text-2xl font-display text-white">RECURSIVE_EXPLORER</div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2">
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Zoom_Depth</div>
        <div className="text-xl font-mono text-gold font-bold">{(zoom * 100).toFixed(0)}%</div>
      </div>

      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} fov={50} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        <Scene zoom={zoom} />
      </Canvas>

      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">
              Use_Scroll_to_Navigate_Depths
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Elements */}
      <div className="absolute top-0 right-0 p-6 pointer-events-none">
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-8 bg-white/5 relative">
              <motion.div 
                className="absolute bottom-0 left-0 w-full bg-neon-pink"
                animate={{ height: ['20%', '80%', '40%'] }}
                transition={{ duration: 2 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
