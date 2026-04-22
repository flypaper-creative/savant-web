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

const LogoFragments = ({ active }: { active: boolean }) => {
  const fragments = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
      speed: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
      rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      size: 0.1 + Math.random() * 0.6
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    if (active) {
      groupRef.current.children.forEach((child, i) => {
        const f = fragments[i];
        child.position.add(f.speed);
        child.rotation.x += 0.15;
        child.rotation.y += 0.15;
      });
      groupRef.current.scale.lerp(new THREE.Vector3(3, 3, 3), 0.05);
    } else {
      groupRef.current.scale.setScalar(0);
    }
  });

  return (
    <group ref={groupRef}>
      {fragments.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot.toArray() as any}>
          <tetrahedronGeometry args={[f.size, 0]} />
          <meshPhysicalMaterial color="#FFD700" metalness={1} roughness={0.05} emissive="#FFD700" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
};

const Aurora = ({ intensity = 1 }: { intensity?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const auroraMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 345.45));
          p += dot(p, p + 34.345);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.03;
            amplitude *= 0.52;
          }
          return value;
        }

        void main() {
          vec2 uv = vUv;
          vec2 warped = uv;
          float t = uTime * 0.06;

          warped.x += sin(uv.y * 7.0 + t * 7.0) * 0.08;
          warped.y += sin(uv.x * 4.0 - t * 4.0) * 0.05;

          float ribbonA = fbm(vec2(warped.x * 2.5, warped.y * 7.0 - t * 3.0));
          float ribbonB = fbm(vec2(warped.x * 4.5 - 2.0, warped.y * 10.0 + t * 2.0));
          float ribbonC = fbm(vec2(warped.x * 8.0 + 10.0, warped.y * 16.0 - t * 5.0));
          float bands = smoothstep(0.28, 1.0, ribbonA * 0.65 + ribbonB * 0.25 + ribbonC * 0.1);

          float verticalMask = smoothstep(0.04, 0.45, uv.y) * (1.0 - smoothstep(0.58, 1.0, uv.y));
          float horizonFade = smoothstep(1.2, 0.2, abs(vWorldPosition.x) * 0.02);
          float intensityMask = bands * verticalMask * horizonFade * uIntensity;

          vec3 cyan = vec3(0.04, 0.86, 1.0);
          vec3 violet = vec3(0.47, 0.16, 0.98);
          vec3 gold = vec3(0.98, 0.72, 0.24);
          vec3 hot = vec3(1.0, 0.94, 0.78);

          vec3 color = mix(cyan, violet, smoothstep(0.05, 0.95, uv.x + ribbonB * 0.15));
          color = mix(color, gold, smoothstep(0.45, 0.95, ribbonC));
          color += hot * pow(max(ribbonA - 0.72, 0.0), 3.0) * 2.2;

          float alpha = pow(intensityMask, 1.25) * 0.78;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, [intensity]);

  useFrame((state) => {
    auroraMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={[0, 16, -64]} rotation={[Math.PI * 0.18, 0, 0]}>
      <planeGeometry args={[320, 180, 1, 1]} />
      <primitive object={auroraMaterial} attach="material" />
    </mesh>
  );
};

const Lasers = ({ active }: { active: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pool = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      active: false,
      progress: 0,
      speed: 0.025 + Math.random() * 0.03,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      color: new THREE.Color('#ff4068'),
    }));
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;

    if (active && Math.random() > 0.965) {
      const next = pool.find((laser) => !laser.active);
      if (next) {
        next.active = true;
        next.progress = 0;
        next.start.set((Math.random() - 0.5) * 110, (Math.random() - 0.5) * 65, -110);
        next.end.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, -6);
        next.color.set(Math.random() > 0.5 ? '#ff4068' : '#62b7ff');
      }
    }

    groupRef.current.children.forEach((child, i) => {
      const laser = pool[i];
      if (!laser.active || !active) {
        child.visible = false;
        return;
      }
      laser.progress += laser.speed;
      if (laser.progress >= 1) {
        laser.active = false;
        child.visible = false;
        return;
      }
      child.visible = true;
      child.position.lerpVectors(laser.start, laser.end, laser.progress);
      child.lookAt(laser.end);
      child.scale.setScalar(1.0 - laser.progress * 0.35);
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.color.copy(laser.color);
      material.opacity = 0.85 * (1.0 - laser.progress * 0.6);
    });
  });

  return (
    <group ref={groupRef}>
      {pool.map((_, i) => (
        <mesh key={i} visible={false}>
          <cylinderGeometry args={[0.025, 0.08, 14, 10]} />
          <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const EnemyShips = ({ active }: { active: boolean }) => {
  const ships = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      orbit: 30 + Math.random() * 20,
      speed: 0.1 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const s = ships[i];
      child.position.x = Math.sin(t * s.speed + s.offset) * s.orbit;
      child.position.y = Math.cos(t * s.speed + s.offset) * (s.orbit * 0.5);
      child.position.z = Math.sin(t * s.speed * 0.5 + s.offset) * 20 - 50;
    });
  });

  return (
    <group ref={groupRef} visible={active}>
      {ships.map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#222" emissive="#ff4068" emissiveIntensity={5} />
        </mesh>
      ))}
    </group>
  );
};

const PreloaderScene = ({
  phase,
  narrative,
  progress,
  initialized,
  booted,
  bloomBoost,
  isMobile
}: {
  phase: string;
  narrative: string;
  progress: number;
  initialized: boolean;
  booted: boolean;
  bloomBoost: number;
  isMobile: boolean;
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<any>(null);
  const initialRotation = useMemo(() => new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0), []);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!cameraRef.current || !groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (flameRef.current) {
      flameRef.current.uTime = t;
      const isIgnited = narrative.includes('03') || narrative.includes('04') || narrative === '05_CALIBRATION' || initialized;
      flameRef.current.uIntensity = THREE.MathUtils.lerp(flameRef.current.uIntensity, isIgnited ? 2.5 : 0.0, 0.05);
    }

    if (initialized) {
      const scale = 0.5;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      const targetX = -viewport.width / 2 + 1.2;
      const targetY = viewport.height / 2 - 1.2;
      const targetZ = 0;

      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.08);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);

      groupRef.current.rotation.y = t * 2.5;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;

      cameraRef.current.position.lerp(new THREE.Vector3(0, 0, 10), 0.1);
      cameraRef.current.lookAt(0, 0, 0);
      return;
    }

    if (phase === 'loading' || phase === 'ready') {
      const targetPos = new THREE.Vector3(0, 0, 40);
      const targetLook = new THREE.Vector3(0, 0, 0);

      if (narrative === '02_PROPULSION') {
        targetPos.set(40 * Math.sin(t), 10 * Math.cos(t), 20);
      } else if (narrative === '03_CHAMBER_DRIFT') {
        targetPos.set(-20, 4, 30);
      } else if (narrative === '04_CORE_SYNC') {
        targetPos.set(Math.sin(t * 40) * 0.8, Math.cos(t * 40) * 0.8, 20);
      } else if (narrative === '05_CALIBRATION') {
        targetPos.set(0, 0, 50);
      } else if (narrative === '06_STABILIZED') {
        targetPos.set(0, 0, 12);
      }

      cameraRef.current.position.lerp(targetPos, narrative === '04_CORE_SYNC' ? 0.1 : 0.035);
      cameraRef.current.lookAt(targetLook);

      const isVoid = narrative === '00_INITIATION';
      const isDis = narrative === '05_CALIBRATION';
      const isStab = narrative === '06_STABILIZED';

      const targetScale = isVoid ? 0 : (isDis ? 0.001 : 35);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), isDis ? 0.35 : 0.06);

      if (isStab) {
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.6;
        groupRef.current.rotation.y = t * 2.5;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      } else if (narrative === '04_CORE_SYNC') {
        groupRef.current.rotation.y += Math.sin(t * 25) * 1.2;
        groupRef.current.rotation.x += Math.cos(t * 20) * 1.0;
      } else if (narrative === '02_PROPULSION') {
        groupRef.current.position.x = Math.sin(t * 5) * 15;
        groupRef.current.position.y = Math.cos(t * 4) * 8;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.5;
        groupRef.current.rotation.y += 0.5;
      } else if (isVoid) {
        groupRef.current.rotation.copy(initialRotation);
      } else {
        groupRef.current.rotation.y = t * 0.4;
      }

      const speed = narrative === '02_PROPULSION' ? 3.5 : (narrative === '03_CHAMBER_DRIFT' ? 1.8 : 0.1);
      if (!isStab && !isDis) {
        groupRef.current.position.z += speed;
        if (groupRef.current.position.z > 100) groupRef.current.position.z = -150;
      } else if (isStab) {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.08);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 40]} fov={40} />
      <color attach="background" args={['#020202']} />
      <hemisphereLight args={['#9dd6ff', '#050505', 0.55]} />
      <directionalLight position={[8, 10, 16]} intensity={2.5} color="#fff1cb" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[-12, 4, 10]} intensity={55} distance={90} color="#62b7ff" />
      <pointLight position={[10, -2, 8]} intensity={42} distance={80} color="#ffbf52" />

      <Suspense fallback={null}>
        {!booted && (
          <>
            <Aurora intensity={narrative === '06_STABILIZED' ? 1.15 : 0.92} />
            <Lasers active={narrative.includes('02') || narrative.includes('03')} />
            <EnemyShips active={narrative.includes('02') || narrative.includes('03')} />
            <CelestialVoid narrative={narrative} progress={progress} />
          </>
        )}

        <group ref={groupRef}>
          <SavantCore3D scale={1} materialType={narrative.includes('04') ? 'obsidian' : 'gold'} emissiveIntensity={narrative.includes('04') ? 5 : 0.3} glow={false} />

          <ContactShadows
            position={[0, -8, 0]}
            opacity={0.48}
            scale={24}
            blur={2.8}
            far={12}
            color="#000000"
          />

          <mesh scale={3.8} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[1.5, 0.04, 16, 128]} />
            {/* @ts-ignore */}
            <blueFlameMaterial ref={flameRef} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </mesh>

          {!booted && <LogoFragments active={narrative === '05_CALIBRATION'} />}
        </group>
      </Suspense>

      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          intensity={(narrative === '01_SINGULARITY' ? 10 : narrative === '05_CALIBRATION' ? 16 : narrative === '06_STABILIZED' ? 1.8 : 1.35) * bloomBoost}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.22}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

export default function SavantFlameLogo3D() {
  const { booted, setBooted } = useStore();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'transition'>('loading');
  const [percent, setPercent] = useState(0);
  const [narrative, setNarrative] = useState('00_INITIATION');
  const [initializing, setInitializing] = useState(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const quality = useAdaptiveQuality();

  useEffect(() => {
    if (booted) return;

    const loadingTimeline = gsap.timeline();
    loadingTimeline
      .to({}, {
        duration: 2.0,
        onUpdate: function () {
          setPercent(Math.floor(this.progress() * 35));
        },
        onStart: () => setNarrative('01_SINGULARITY')
      })
      .to({}, {
        duration: 1.8,
        onUpdate: function () {
          setPercent(35 + Math.floor(this.progress() * 25));
        },
        onStart: () => setNarrative('02_PROPULSION')
      })
      .to({}, {
        duration: 1.4,
        onUpdate: function () {
          setPercent(60 + Math.floor(this.progress() * 15));
        },
        onStart: () => setNarrative('03_CHAMBER_DRIFT')
      })
      .to({}, {
        duration: 1.2,
        onUpdate: function () {
          setPercent(75 + Math.floor(this.progress() * 15));
        },
        onStart: () => setNarrative('04_CORE_SYNC')
      })
      .to({}, {
        duration: 0.9,
        onUpdate: function () {
          setPercent(90 + Math.floor(this.progress() * 10));
        },
        onStart: () => setNarrative('05_CALIBRATION'),
        onComplete: () => {
          setPercent(100);
          setNarrative('06_STABILIZED');
          setPhase('ready');
        }
      });

    return () => {
      loadingTimeline.kill();
    };
  }, [booted]);

  useEffect(() => {
    if (!booted) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tlRef.current = tl;
      tl.to({}, { duration: 0.1, onStart: () => setPhase('transition') });
      tl.to({}, { duration: 0.3, onStart: () => setNarrative('06_STABILIZED') });
      tl.to({}, { duration: 0.6, onComplete: () => setPhase('loading') });
    });

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [booted]);

  const handleInitialize = () => {
    setInitializing(true);
    gsap.to('.preloader-ui', {
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: 'power4.inOut',
      onComplete: () => {
        setBooted(true);
      }
    });
  };

  const isTransitioning = initializing || booted;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      style={{ pointerEvents: booted ? 'none' : 'auto' }}
      className={`fixed inset-0 z-[10000] overflow-hidden transition-colors duration-1000 ${booted ? 'bg-transparent' : 'bg-obsidian'}`}
    >
      <Canvas
        shadows
        dpr={quality.devicePixelRatioRange}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality.isMobile ? 1.0 : 1.08;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          (gl as THREE.WebGLRenderer & { useLegacyLights?: boolean }).useLegacyLights = false;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <PreloaderScene
            phase={phase}
            narrative={narrative}
            progress={percent}
            initialized={isTransitioning}
            booted={booted}
            bloomBoost={quality.bloomIntensity}
            isMobile={quality.isMobile}
          />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {!isTransitioning && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-1/2 left-16 -translate-y-1/2 flex flex-col gap-12 z-50 pointer-events-none"
          >
            <SavantNarrative label={SITE_CONFIG.MESSAGES.PROCESS_LOG} value={narrative} />
            <div className="w-px h-48 bg-gradient-to-b from-gold/40 via-gold/10 to-transparent self-start ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isTransitioning && (
        <div className="absolute inset-0 preloader-ui pointer-events-none flex flex-col justify-between p-6 md:p-16">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-4">
              <span className="text-[9px] md:text-[11px] font-mono text-gold tracking-[0.4em] md:tracking-[0.6em] font-black whitespace-nowrap">
                {SITE_CONFIG.MESSAGES.BOOT_SEQUENCE}
              </span>
              <div className="flex gap-1 md:gap-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
                    className="w-8 md:w-12 h-[1px] bg-white/20"
                  />
                ))}
              </div>
            </div>

            <div className="font-mono text-[7px] md:text-[9px] text-white/10 tracking-[0.3em] md:tracking-[0.4em] text-right leading-relaxed border-r border-white/5 pr-4 md:pr-6 whitespace-nowrap overflow-hidden">
              <div className="flex flex-col gap-1 md:gap-1.5">
                <span className="truncate">{SITE_CONFIG.IDENTITIES.NAME} // {SITE_CONFIG.IDENTITIES.ARCHITECTURE}</span>
                <span className={percent > 90 ? 'text-gold' : ''}>{SITE_CONFIG.MESSAGES.LATTICE.INTEGRITY} // {percent > 90 ? 'optimal' : 'calibrating'}</span>
                <span className={percent > 50 ? 'text-gold' : ''}>{SITE_CONFIG.MESSAGES.LATTICE.UPLINK} // {percent > 50 ? 'stable' : 'establishing'}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-12 pointer-events-none w-full">
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-96 -top-48">
              <motion.div
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                className="w-full h-[1px] bg-gold/10 shadow-[0_0_25px_rgba(230,192,59,0.2)]"
              />
            </div>

            <AnimatePresence mode="wait">
              {phase === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="font-mono text-7xl font-black text-white/[0.03] tracking-[0.2em] relative">
                    <span className="relative z-10">{percent.toString().padStart(3, '0')}</span>
                    <div className="absolute inset-0 flex items-center justify-center -z-10 blur-2xl opacity-20 text-gold">
                      {percent.toString().padStart(3, '0')}
                    </div>
                  </div>
                  <div className="w-80 h-[1px] bg-white/5 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gold shadow-[0_0_20px_rgba(230,192,59,0.5)]"
                      style={{ width: `${percent}%` }}
                    />
                    <motion.div
                      animate={{ left: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                  </div>
                  <div className="text-[10px] font-mono text-white/40 tracking-[0.8em] font-bold">
                    {SITE_CONFIG.MESSAGES.INITIALIZING}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex flex-col items-center gap-10 pointer-events-auto"
                >
                  <SavantButton
                    onClick={handleInitialize}
                    variant="primary"
                    size="lg"
                    className="pr-20 hover:pr-24 border border-gold/30"
                  >
                    initialize_system
                  </SavantButton>
                  <div className="font-mono text-[9px] text-white/25 tracking-[0.4em] text-center max-w-xs leading-loose">
                    uplink ready // click to establish core sync
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-gold animate-ping absolute inset-0" />
                  <div className="w-2 h-2 rounded-full bg-gold relative" />
                </div>
                <span className="font-mono text-[10px] text-white/50 tracking-[0.3em] font-bold">
                  {SITE_CONFIG.IDENTITIES.CORE_ACTIVE}
                </span>
              </div>
              <div className="h-[1px] w-64 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="text-[9px] font-mono text-white/5 tracking-[0.4em] text-right">
              {SITE_CONFIG.IDENTITIES.LEGAL}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {phase === 'transition' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.4, 1], ease: 'easeInOut' }}
            className="fixed inset-0 z-[10001] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
