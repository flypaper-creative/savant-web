import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

const LatticePoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { systemLoad } = useStore();
  
  const count = 3000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = time * 0.02;
      pointsRef.current.rotation.x = time * 0.01;
      
      // React to system load - increase turbulence
      const turbulence = 0.05 + systemLoad * 0.5;
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        positions[i * 3] += Math.sin(time + y) * turbulence * 0.01;
        positions[i * 3 + 1] += Math.cos(time + x) * turbulence * 0.01;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#FF4068"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.1 + systemLoad * 0.2}
      />
    </Points>
  );
};

const LatticeLines = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const { systemLoad } = useStore();
  
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const size = 10;
    const step = 2;
    
    for (let x = -size; x <= size; x += step) {
      for (let y = -size; y <= size; y += step) {
        for (let z = -size; z <= size; z += step) {
          if (Math.random() > 0.8) {
            vertices.push(x, y, z);
            vertices.push(x + step, y, z);
            vertices.push(x, y, z);
            vertices.push(x, y + step, z);
            vertices.push(x, y, z);
            vertices.push(x, y, z + step);
          }
        }
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      const time = state.clock.getElapsedTime();
      linesRef.current.rotation.y = time * 0.01;
      
      // React to system load - glitch effect
      if (systemLoad > 0.7 && Math.random() > 0.95) {
        linesRef.current.position.x = (Math.random() - 0.5) * 0.1;
      } else {
        linesRef.current.position.x = 0;
      }
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry}>
      <lineBasicMaterial 
        color="#FF4068" 
        transparent 
        opacity={0.02 + systemLoad * 0.05} 
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

export const GlobalLattice = () => {
  const { systemLoad } = useStore();
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <LatticePoints />
        <LatticeLines />

        <EffectComposer>
          <Bloom luminanceThreshold={0.1} intensity={0.5 + systemLoad} radius={0.4} />
          <Noise opacity={0.02} />
        </EffectComposer>

        <color attach="background" args={['#050505']} />
      </Canvas>
    </div>
  );
};
