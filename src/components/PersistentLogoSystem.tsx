import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
// @ts-ignore
import { SVGLoader } from 'three/addons/loaders/SVGLoader';
import { useLoading } from '../contexts/LoadingContext';

const SVG_MARKUP = `
<svg viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg">
  <g id="top-loop">
    <path d="m47.67,37.07l-2.67,1.54a0.62,0.62 0 0 1 -0.89,-0.75q1.43,-3.96 1.47,-5.02c0.34,-10.74 -15.97,-7.15 -11.12,2.26q0.99,1.9 4.64,6.77a1.35,1.35 0 0 1 -0.06,1.69l-1.2,1.39a0.86,0.85 47.6 0 1 -1.35,-0.07c-4.32,-6.16 -10.05,-11.78 -4.62,-18.81c6.72,-8.71 20.69,-1.03 17.23,9.25a3.23,3.18 84.7 0 1 -1.43,1.75z" fill="#ffffff"/>
  </g>
  <path id="middle-loop" d="m30.29,41.13q-2.55,-0.05 -3.6,0.11c-6.01,0.9 -6.62,8.78 -1.66,11.21q4.03,1.96 7.59,-1.57q8.7,-8.65 9.6,-9.62q3.72,-3.99 8.93,-3.91c8.35,0.13 12.15,10 6.99,16.13c-4.55,5.4 -12.91,4.27 -16.55,-1.84a0.2,0.2 0 0 1 0,-0.22q1.08,-1.68 2.55,-2.86a0.11,0.11 0 0 1 0.16,0.03q2,3.44 3.83,4.1q3.88,1.38 6.54,-1.15c5.86,-5.59 -2.23,-14.35 -8.51,-8.58q-3.54,3.26 -10.92,10.77c-4.56,4.64 -12.2,4.14 -15.81,-1.33c-2.46,-3.73 -1.98,-9.15 1.32,-12.34q2.79,-2.71 7.11,-2.89a1.51,1.5 73.4 0 1 1.36,0.74l1.46,2.55a0.45,0.44 -14.8 0 1 -0.39,0.67z" fill="#ffffff"/>
</svg>
`;

const PersistentLogo = () => {
  const { phase } = useLoading();
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);
  const { camera, size } = useThree();
  
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (phase !== 'complete') return;
    const anchor = document.getElementById('logo-anchor');
    if (!anchor) return;

    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);

    anchor.addEventListener('mouseenter', onEnter);
    anchor.addEventListener('mouseleave', onLeave);

    return () => {
      anchor.removeEventListener('mouseenter', onEnter);
      anchor.removeEventListener('mouseleave', onLeave);
    };
  }, [phase]);

  const shapes = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(SVG_MARKUP);
    return svgData.paths.flatMap(p => SVGLoader.createShapes(p));
  }, []);

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetScale = useMemo(() => new THREE.Vector3(), []);
  const targetRot = useMemo(() => new THREE.Euler(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (!groupRef.current || !materialRef.current) return;

    if (phase === 'booting' || phase === 'cinematic') {
      // --- CINEMATIC PRELOADER STATE ---
      // 0 to 2s: Spin in
      const spinProgress = Math.min(t / 2, 1);
      const easeOutExpo = spinProgress === 1 ? 1 : 1 - Math.pow(2, -10 * spinProgress);

      // Spin into place (3 full rotations on Y)
      targetRot.set(
        (1 - easeOutExpo) * Math.PI * 2,
        (1 - easeOutExpo) * Math.PI * 6,
        0
      );

      // Scale down from large to normal
      const baseScale = 0.15;
      const startScale = 0.5;
      const currentScale = baseScale + (startScale - baseScale) * (1 - easeOutExpo);
      targetScale.set(currentScale, -currentScale, currentScale);

      // Move from front to center, with a subtle hover once settled
      targetPos.set(0, Math.sin(t * 2) * 0.5, (1 - easeOutExpo) * 20);

    } else {
      // --- TRANSITION & COMPLETE STATE ---
      const anchor = document.getElementById('logo-anchor');
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        
        // 1. Calculate NDC
        const x = (rect.left + rect.width / 2) / size.width * 2 - 1;
        const y = -(rect.top + rect.height / 2) / size.height * 2 + 1;

        // 2. Unproject
        vec.set(x, y, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        const distance = -camera.position.z / vec.z;
        targetPos.copy(camera.position).add(vec.multiplyScalar(distance));

        // 3. Calculate Scale
        const fov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
        const visibleHeight = 2 * Math.tan(fov / 2) * Math.abs(camera.position.z);
        const scaleY = (rect.height / size.height) * visibleHeight;
        
        const s = scaleY * 0.012; 
        
        const finalScale = (phase === 'complete' && isHovered) ? s * 1.1 : s;
        targetScale.set(finalScale, -finalScale, finalScale);

        // 4. Rotation
        if (phase === 'complete' && isHovered) {
          targetRot.set(0, Math.sin(t * 2) * 0.2, 0);
        } else {
          targetRot.set(0, 0, 0);
        }
      }
    }

    // --- APPLY LERPING ---
    const lerpSpeed = phase === 'transition' ? 0.04 : 0.1;
    
    groupRef.current.position.lerp(targetPos, lerpSpeed);
    groupRef.current.scale.lerp(targetScale, lerpSpeed);

    const currentQuat = new THREE.Quaternion().setFromEuler(groupRef.current.rotation);
    const targetQuat = new THREE.Quaternion().setFromEuler(targetRot);
    currentQuat.slerp(targetQuat, lerpSpeed);
    groupRef.current.rotation.setFromQuaternion(currentQuat);
  });

  return (
    <Center>
      <group ref={groupRef}>
        {shapes.map((shape, i) => (
          <mesh key={i} castShadow receiveShadow>
            <extrudeGeometry args={[shape, { depth: 20, bevelEnabled: true, bevelThickness: 3, bevelSize: 0.8, bevelSegments: 64 }]} />
            <meshPhysicalMaterial 
              ref={materialRef}
              color="#ffffff"
              metalness={1}
              roughness={0.05}
              envMapIntensity={2.5}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          </mesh>
        ))}
      </group>
    </Center>
  );
};

const CameraRig = () => {
  const { camera, mouse } = useThree();
  
  useFrame(() => {
    // Subtle camera drift based on mouse to keep focus on the logo
    const targetX = mouse.x * 2;
    const targetY = mouse.y * 2;
    camera.position.lerp(new THREE.Vector3(targetX, targetY, 40), 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

const FloatingDebris = () => {
  const instances = useRef<THREE.InstancedMesh>(null);
  const count = 75; // Reduced for performance
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      scale: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.02 + 0.005,
    }));
  }, [count]);

  useFrame(() => {
    if (!instances.current) return;
    
    particles.forEach((particle, i) => {
      particle.rotation.x += particle.speed;
      particle.rotation.y += particle.speed;
      particle.position.y += Math.sin(particle.speed * 100) * 0.05;
      
      dummy.position.copy(particle.position);
      dummy.rotation.copy(particle.rotation);
      dummy.scale.setScalar(particle.scale);
      
      dummy.updateMatrix();
      instances.current!.setMatrixAt(i, dummy.matrix);
    });
    instances.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instances} args={[undefined, undefined, count]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial 
        color="#000000"
        emissive="#00e5ff"
        emissiveIntensity={0.8}
        roughness={0.1}
        metalness={0.9}
        wireframe={true}
      />
    </instancedMesh>
  );
};

export const PersistentLogoSystem = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 10, 80]} />
        
        <CameraRig />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[20, 50, 20]} angle={0.3} penumbra={1} intensity={3} color="#ff2a5f" />
        <spotLight position={[-20, -50, -20]} angle={0.3} penumbra={1} intensity={3} color="#00e5ff" />
        <pointLight position={[0, 0, 0]} intensity={1} color="#ffffff" distance={30} />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -15, 0]} opacity={0.6} scale={60} blur={3} far={30} />
        <Sparkles count={300} scale={40} size={2} speed={0.2} opacity={0.3} color="#ffd700" />

        <PersistentLogo />
        <FloatingDebris />

        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};