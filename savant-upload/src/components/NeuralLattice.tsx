import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const LatticePoints = () => {
  const count = 2000;
  const meshRef = useRef<THREE.Points>(null);
  
  const [positions, connections] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const conn = [];
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    return [pos, conn];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.03;
  });

  return (
    <group>
      <Points ref={meshRef} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color="#e6c03b"
          size={0.03}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Neural Connections (Lines) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#e6c03b" transparent opacity={0.05} />
      </lineSegments>
    </group>
  );
};

export const NeuralLattice = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <LatticePoints />
      </Canvas>
    </div>
  );
};
