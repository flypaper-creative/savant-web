import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Instances, Instance, Float, Stars, Line } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { BRANDING } from '../styles/branding';

const PARTICLE_COUNT = 100; // Significantly reduced for performance
const GRID_SIZE = 100;
const REPULSION_RADIUS = 10;
const REPULSION_STRENGTH = 0.3;

function NeuralLattice() {
  const lines = useMemo(() => {
    const temp = [];
    const size = 1000;
    const divisions = 10;
    for (let i = -divisions; i <= divisions; i++) {
      const pos = (i / divisions) * size;
      // Horizontal lines
      temp.push({ start: [-size, pos, -500], end: [size, pos, -500] });
      // Vertical lines
      temp.push({ start: [pos, -size, -500], end: [pos, size, -500] });
    }
    return temp;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.start as [number, number, number], line.end as [number, number, number]]}
          color={BRANDING.colors.neonPink.base}
          lineWidth={0.5}
          transparent
          opacity={0.05}
        />
      ))}
    </group>
  );
}

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [scrollVelocity, setScrollVelocity] = useState(0);
  const [totalScroll, setTotalScroll] = useState(0);
  const lastScrollY = useRef(window.scrollY);
  
  // Mouse tracking
  const mouse = useRef({ x: 0, y: 0 });
  
  // Frustum for culling
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  // Object pooling for geometries and materials
  const geometry = useMemo(() => new THREE.SphereGeometry(0.3, 8, 8), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    emissive: BRANDING.colors.neonPink.base,
    emissiveIntensity: 8,
    transparent: true,
    opacity: 0.6,
    metalness: 1,
    roughness: 0
  }), []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;
      setScrollVelocity(delta * 0.05);
      setTotalScroll(prev => prev + delta);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const particles = useMemo(() => {
    const temp = [];
    const colors = [
      BRANDING.colors.neonPink.base, // Neon Pink
      BRANDING.colors.gold.base,     // Gold
      '#ffffff',                     // White
      '#444444'                      // Dark Gray for depth
    ];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 1200;
      const y = (Math.random() - 0.5) * 1200;
      const z = (Math.random() - 0.5) * 1500;
      const speed = Math.random() * 0.4 + 0.1;
      const rotationSpeed = Math.random() * 0.01;
      const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
      
      temp.push({ x, y, z, speed, rotationSpeed, color, vx: 0, vy: 0 });
    }
    return temp;
  }, []);

  const dummy = new THREE.Object3D();
  const spatialGrid = useMemo(() => new Map<string, number[]>(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const currentVelocity = scrollVelocity;
    
    // Update frustum
    projScreenMatrix.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Decay scroll velocity
    setScrollVelocity(prev => prev * 0.95);

    const spiralIntensity = 0.0008 + Math.abs(currentVelocity) * 0.01;
    const spiralRotation = time * 0.05 + totalScroll * 0.0003;

    // Spatial Grid for Collision Avoidance (Repulsion)
    spatialGrid.clear();
    particles.forEach((p, i) => {
      const gx = Math.floor(p.x / GRID_SIZE);
      const gy = Math.floor(p.y / GRID_SIZE);
      const key = `${gx},${gy}`;
      if (!spatialGrid.has(key)) spatialGrid.set(key, []);
      spatialGrid.get(key)!.push(i);
    });

    particles.forEach((p, i) => {
      // Update Z position
      p.z += p.speed * 2 + Math.abs(currentVelocity) * 12;
      if (p.z > 1000) p.z = -1000;

      // Spiral Transform
      const angleOffset = (p.z + 1000) * spiralIntensity + spiralRotation;
      const cosA = Math.cos(angleOffset);
      const sinA = Math.sin(angleOffset);
      
      const rx = p.x * cosA - p.y * sinA;
      const ry = p.x * sinA + p.y * cosA;

      // Collision Avoidance (Simple Repulsion)
      const gx = Math.floor(p.x / GRID_SIZE);
      const gy = Math.floor(p.y / GRID_SIZE);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = `${gx + ox},${gy + oy}`;
          const neighbors = spatialGrid.get(key);
          if (neighbors) {
            neighbors.forEach(ni => {
              if (ni === i) return;
              const other = particles[ni];
              const dx = p.x - other.x;
              const dy = p.y - other.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < REPULSION_RADIUS * REPULSION_RADIUS && distSq > 0.01) {
                const dist = Math.sqrt(distSq);
                const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
                p.vx += (dx / dist) * force * REPULSION_STRENGTH;
                p.vy += (dy / dist) * force * REPULSION_STRENGTH;
              }
            });
          }
        }
      }

      // Apply velocity and friction
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;

      // Mouse influence
      const mouseTargetX = mouse.current.x * 400;
      const mouseTargetY = mouse.current.y * 400;
      const mdx = rx - mouseTargetX;
      const mdy = ry - mouseTargetY;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      
      let finalX = rx;
      let finalY = ry;
      
      if (mdist < 500) {
        const force = (500 - mdist) / 500;
        finalX += mdx * force * 0.2;
        finalY += mdy * force * 0.2;
      }

      dummy.position.set(finalX, finalY, p.z);
      
      // Frustum Culling
      if (!frustum.containsPoint(dummy.position)) {
        dummy.scale.setScalar(0);
      } else {
        dummy.rotation.set(time * p.rotationSpeed, time * p.rotationSpeed, time * p.rotationSpeed);
        const stretch = 1 + Math.abs(currentVelocity) * 0.8;
        dummy.scale.set(1, 1, stretch);
      }
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    // Camera movement
    state.camera.position.x += (mouse.current.x * 80 - state.camera.position.x) * 0.01;
    state.camera.position.y += (mouse.current.y * 80 - state.camera.position.y) * 0.01;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, PARTICLE_COUNT]} 
      frustumCulled={false} // We handle culling manually for instances
    />
  );
}

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-obsidian">
      <Canvas
        camera={{ position: [0, 0, 600], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1]}
      >
        <color attach="background" args={['#000000']} />
        <fogExp2 attach="fog" args={['#000000', 0.0008]} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 500]} intensity={50} color={BRANDING.colors.neonPink.base} />
        
        <NeuralLattice />
        <Particles />
      </Canvas>
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
