import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  MeshTransmissionMaterial, 
  Environment,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';

const Shard = ({ index }: { index: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const randomPos = useMemo(() => new THREE.Vector3(
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 15
  ), []);

  const randomRot = useMemo(() => new THREE.Euler(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  ), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x += 0.002;
    meshRef.current.rotation.y += 0.001;
    meshRef.current.position.y += Math.sin(t + index) * 0.002;
  });

  return (
    <mesh ref={meshRef} position={randomPos} rotation={randomRot}>
      <octahedronGeometry args={[Math.random() * 0.5 + 0.2, 0]} />
      <MeshTransmissionMaterial 
        backside
        samples={4}
        thickness={0.5}
        chromaticAberration={0.1}
        anisotropy={0.2}
        distortion={0.2}
        distortionScale={0.2}
        ior={1.2}
        color={index % 2 === 0 ? "#e6c03b" : "#ffffff"}
        transmission={1}
        roughness={0.2}
        opacity={0.3}
        transparent
      />
    </mesh>
  );
};

export const FractalBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
          {[...Array(30)].map((_, i) => (
            <Shard key={i} index={i} />
          ))}
        </Float>
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};
