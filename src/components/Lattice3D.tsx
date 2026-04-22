import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, DepthOfField, ChromaticAberration } from '@react-three/postprocessing';
import { useStore } from '../store/useStore';

const DenseAtmosphere = () => {
  const { systemLoad } = useStore();
  const particlesRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const [positions, scales] = useMemo(() => {
    const count = 8000; // High density for cinematic depth
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 10 + Math.random() * 40;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      scl[i] = Math.random();
    }
    return [pos, scl];
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05 * (1 + systemLoad);
      particlesRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[4, 2]} />
          <meshPhysicalMaterial 
            color="#3d444d"
            wireframe
            transparent
            opacity={0.1}
            emissive="#ff4068"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Float>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-scale" count={scales.length} array={scales} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial 
          size={0.15}
          color="#e6c03b"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

export const Lattice3D = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen">
      <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>
        <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={45} />
        <fogExp2 attach="fog" color="#05070B" density={0.03} />
        
        <DenseAtmosphere />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />

        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.02} focalLength={0.1} bokehScale={4} height={480} />
          <Bloom intensity={2.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
          <Noise opacity={0.04} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};