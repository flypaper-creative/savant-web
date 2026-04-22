import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Glich } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Savant3DLogo } from './Savant3DLogo';

const AlienRing = ({ progress }: { progress: number }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 128;

  const [particles, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Uneven, "menacing" distribution
      const radius = 24 + Math.random() * 2; 
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      sz[i] = Math.random() * 2;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Organic, uneven "breathing" logic
      const wave = Math.sin(t * 2 + i * 0.1) * 0.5;
      positions[i3 + 2] = wave * (progress / 100);
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = t * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.4} 
        transparent 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `
            float dist = length(gl_PointCoord - vec2(0.5));
            float strength = 0.05 / dist;
            gl_FragColor = vec4(vec3(1.0, 0.8, 0.3) * strength, diffuseColor.a * strength);
            `
          );
        }}
      />
    </points>
  );
};

export const SavantPreloader3D = ({ progress, phase }: { progress: number, phase: string }) => {
  return (
    <AnimatePresence>
      {phase !== 'complete' && (
        <motion.div 
          className="fixed inset-0 z-[20000] bg-[#020202]"
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
        >
          <Canvas camera={{ position: [0, 0, 50] }}>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 10]} intensity={5} color="#e6c03b" />
            
            <AlienRing progress={progress} />
            
            <group scale={0.8} rotation={[0, 0, progress * 0.01]}>
              <Savant3DLogo />
            </group>

            <EffectComposer>
              <Bloom intensity={2} luminanceThreshold={0.1} mipmapBlur />
            </EffectComposer>
          </Canvas>

          {/* Futuristic Data Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] border border-white/5 rounded-full opacity-20 animate-pulse" />
            <div className="absolute bottom-20 font-mono text-[9px] tracking-[1em] text-gold/40 uppercase">
              System_Integrity: {Math.floor(progress)}% // UNSTABLE_GEOMETRY
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
