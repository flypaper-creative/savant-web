#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

mkdir -p 'src/components'
cat > 'src/components/SavantFlameLogo3D.tsx' <<'EOT'
import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { useAdaptiveQuality } from '../hooks/useAdaptiveQuality';
import {
  PerspectiveCamera,
  shaderMaterial,
  Environment,
  ContactShadows
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import gsap from 'gsap';
import { SavantCore3D } from './SavantCore3D';
import { SITE_CONFIG } from '../constants/siteConfig';
import { SavantButton, SavantNarrative } from './SavantUI';

const BlueFlameMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uColorA: new THREE.Color('#3b82f6'),
    uColorB: new THREE.Color('#1e40af'),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;

    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      float dist = distance(vUv, vec2(0.5));
      float aura = smoothstep(0.4, 0.2, dist) * smoothstep(0.0, 0.1, dist);
      float n = noise(vUv * 6.0 + uTime * 0.2);

      vec3 color = mix(uColorA, uColorB, aura * n);
      color += uColorA * pow(aura, 3.0) * 2.0;

      float alpha = aura * uIntensity * (0.3 + 0.7 * n);
      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ BlueFlameMaterial });

const WarpTunnel = ({ active }: { active: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 3000;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 40;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(theta) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 500;
      spd[i] = 1 + Math.random() * 5;
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!active) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 2] += speeds[i] * 4;
      if (arr[i3 + 2] > 200) arr[i3 + 2] = -300;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={active}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#e6c03b"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const CelestialVoid = ({ narrative, progress }: { narrative: string; progress: number }) => {
  const isBang = narrative === '01_SINGULARITY';
  const isStreak = narrative.includes('02') || narrative.includes('03') || narrative.includes('04');
  const isFinal = narrative === '06_STABILIZED';

  const debris = useMemo(() => {
    return Array.from({ length: 150 }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 200),
      size: 0.2 + Math.random() * 3.5,
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      speed: 0.5 + Math.random() * 2
    }));
  }, []);

  const starField = useMemo(() => {
    return new Float32Array(20000 * 3).map(() => (Math.random() - 0.5) * 1200);
  }, []);

  const starRef = useRef<THREE.Points>(null!);
  const debrisRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (starRef.current) starRef.current.rotation.y = t * 0.01;

    if (debrisRef.current && isStreak) {
      debrisRef.current.children.forEach((child, i) => {
        const d = debris[i];
        child.position.z += d.speed * (narrative.includes('02') ? 2 : 0.5);
        if (child.position.z > 100) child.position.z = -100;
        child.rotation.x += 0.01;
      });
    }
  });

  return (
    <group>
      <points ref={starRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={20000} array={starField} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color="#ffffff" transparent opacity={0.4} />
      </points>

      <AlienRing progress={progress} visible={isStreak || isFinal} />
      <WarpTunnel active={narrative === '02_PROPULSION'} />

      <group ref={debrisRef}>
        {debris.map((d, i) => (
          <mesh key={i} position={d.pos} rotation={d.rotation} visible={isStreak}>
            <boxGeometry args={[d.size, d.size * 0.4, d.size]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.5} />
          </mesh>
        ))}
      </group>

      <pointLight position={[0, 0, 0]} intensity={isBang ? 15000 : 0} color="#ffffff" />
      <ambientLight intensity={0.1} />
      <Environment preset="city" />
    </group>
  );
};

const AlienRing = ({ progress, visible }: { progress: number; visible: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 256;

  const [particles, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 22 + Math.random() * 3;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sz[i] = Math.random() * 3;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 2] = Math.sin(t * 2 + i * 0.1) * 2 * (progress / 100);
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = t * 0.05;
  });

  return (
    <points ref={pointsRef} visible={visible}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `
            float dist = length(gl_PointCoord - vec2(0.5));
            float strength = 0.08 / dist;
            gl_FragColor = vec4(vec3(1.0, 0.8, 0.4) * strength, diffuseColor.a * strength);
            `
          );
        }}
      />
    </points>
  );
};
EOT
