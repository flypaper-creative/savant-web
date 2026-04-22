import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Artifact = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    if (!groupRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    });

    tl.to(groupRef.current.position, { x: 4, y: -3, z: -2 })
      .to(groupRef.current.rotation, { x: Math.PI * 2, y: Math.PI * 4 }, 0)
      .to(groupRef.current.scale, { x: 1.5, y: 1.5, z: 1.5 }, 0);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current || !coreRef.current) return;
    
    const t = state.clock.getElapsedTime();
    
    // Smooth mouse follow
    const targetX = mouse.current.x * 0.3;
    const targetY = mouse.current.y * 0.3;
    
    meshRef.current.rotation.x += (targetY - meshRef.current.rotation.x) * 0.05;
    meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.05;
    
    coreRef.current.rotation.y = -t * 0.5;
    coreRef.current.rotation.z = t * 0.2;
  });

  return (
    <group ref={groupRef} position={[-4, 3, -3]}>
      {/* Outer Geometric Shell */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#ffffff"
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Inner Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#ff003c"
          emissive="#ff003c"
          emissiveIntensity={2}
          wireframe
        />
      </mesh>

      {/* Floating Shards */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 12) * Math.PI * 2) * 3,
            Math.sin((i / 12) * Math.PI * 2) * 3,
            0
          ]}
        >
          <tetrahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

export const ScrollScene = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff003c" />
        <Environment preset="night" />
        <Artifact />
      </Canvas>
    </div>
  );
};
