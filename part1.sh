#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

mkdir -p 'src/components'
cat > 'src/components/Logo.tsx' <<'EOT'
import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Logo() {
  const { booted } = useStore();

  return (
    <Link to="/" className="group flex items-center gap-4 py-2 pointer-events-auto min-h-[40px]">
      <div className={`relative flex items-center justify-center transition-all duration-700 ${booted ? 'w-0 h-0 opacity-0' : 'w-10 h-10 opacity-100'}`}>
        {!booted && (
          <>
            <motion.div
              className="absolute inset-0 border border-white/20 rotate-45 group-hover:border-gold/50 group-hover:rotate-90 transition-all duration-700"
            />
            <motion.div
              className="w-3 h-3 bg-white group-hover:bg-neon-pink transition-colors duration-500 shadow-[0_0_15px_rgba(255,64,104,0)] group-hover:shadow-[0_0_20px_rgba(255,64,104,0.8)]"
            />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-neon-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        )}
      </div>

      <div className={`flex flex-col overflow-hidden transition-all duration-700 ${booted ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[12rem] opacity-100 translate-x-0'}`}>
        <span className="font-display font-black text-2xl text-white tracking-tighter leading-none whitespace-nowrap">
          savant<span className="text-gold">.</span>
        </span>
        <span className="font-mono text-[7px] text-white/30 tracking-[0.6em] leading-none mt-1 whitespace-nowrap">
          sovereign_os
        </span>
      </div>
    </Link>
  );
}
EOT

mkdir -p 'src/components'
cat > 'src/components/SavantCore3D.tsx' <<'EOT'
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ObsidianTransmissionMaterial } from '../lib/materials';

interface SavantCore3DProps {
  scale?: number;
  rotationSpeed?: number;
  materialType?: 'gold' | 'obsidian' | 'wireframe';
  emissiveIntensity?: number;
  glow?: boolean;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/flypaper-creative/savant-web@publish-clean/public/assets/logo7/logo7.glb';

export const SavantCore3D: React.FC<SavantCore3DProps> = ({
  scale = 1,
  rotationSpeed = 1,
  materialType = 'gold',
  emissiveIntensity = 0.5,
  glow = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    return clone;
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.geometry.computeVertexNormals();

      if (materialType === 'gold') {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: '#8f6a17',
          metalness: 1,
          roughness: 0.16,
          clearcoat: 1,
          clearcoatRoughness: 0.04,
          envMapIntensity: 2.6,
          reflectivity: 1,
          ior: 1.9,
          sheen: 1,
          sheenRoughness: 0.28,
          sheenColor: new THREE.Color('#f6deb0'),
          specularIntensity: 1,
          specularColor: new THREE.Color('#fff2cb'),
          emissive: new THREE.Color('#2b1d06'),
          emissiveIntensity: emissiveIntensity * 0.18,
        });
      } else if (materialType === 'obsidian') {
        mesh.material = new THREE.MeshPhysicalMaterial({
          ...ObsidianTransmissionMaterial,
          color: '#050505',
          roughness: 0.12,
          metalness: 0.9,
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          envMapIntensity: 2.4,
          emissive: new THREE.Color('#140b03'),
          emissiveIntensity: emissiveIntensity * 0.22,
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          wireframe: true,
          color: '#3b82f6',
          emissive: '#3b82f6',
          emissiveIntensity: emissiveIntensity * 4,
        });
      }
    });
  }, [clonedScene, materialType, emissiveIntensity]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y += 0.0045 * rotationSpeed;
    groupRef.current.rotation.x = Math.sin(t * 0.45) * 0.08;
    groupRef.current.rotation.z = Math.cos(t * 0.25) * 0.02;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
      {glow && (
        <mesh scale={1.08}>
          <icosahedronGeometry args={[1.1, 4]} />
          <meshBasicMaterial
            color={materialType === 'gold' ? '#d7a93f' : '#4d8cff'}
            transparent
            opacity={0.022}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_URL);
EOT
