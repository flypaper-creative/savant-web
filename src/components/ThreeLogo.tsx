import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Environment, 
  PerspectiveCamera,
  ContactShadows,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, SSAO } from '@react-three/postprocessing';

// 1. Constructing the Symmetrical "S" Geometry
const createSShapeCurve = (invert = false) => {
  const points = [];
  const scale = invert ? -1 : 1;
  
  // Generating a perfect, thick 'S' curve
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const angle = Math.PI * 1.5 - t * Math.PI; 
    const zDepth = Math.sin(t * Math.PI) * 0.4; // Z-variation for light catching
    points.push(new THREE.Vector3(Math.cos(angle) * 1.5 * scale, (Math.sin(angle) * 1.5 + 1.5) * scale, zDepth));
  }
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const angle = Math.PI * 0.5 - t * Math.PI; 
    const zDepth = -Math.sin(t * Math.PI) * 0.4;
    points.push(new THREE.Vector3(Math.cos(angle) * 1.5 * scale, (Math.sin(angle) * 1.5 - 1.5) * scale, zDepth));
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.8);
};

// 2. The Octane/ZBrush Material Injector
const injectZBrushSculpt = (shader: THREE.Shader) => {
  shader.uniforms.time = { value: 0 };
  shader.vertexShader = `
    varying vec2 vUv;
    varying vec3 vPos;
    ${shader.vertexShader}
  `.replace(
    `#include <begin_vertex>`,
    `#include <begin_vertex>
     vUv = uv;
     vPos = position;
    `
  );
  shader.fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vPos;
    
    // High-frequency procedural noise for ZBrush aesthetic
    float random(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }
    
    ${shader.fragmentShader}
  `.replace(
    `#include <normal_fragment_begin>`,
    `#include <normal_fragment_begin>
     // Procedural normal mapping mimicking intricate sculpted metal
     float noise1 = random(vPos * 50.0) * 0.05;
     float noise2 = random(vPos * 150.0) * 0.02;
     vec3 normalPerturbation = vec3(noise1, noise2, noise1);
     normal = normalize(normal + normalPerturbation);
    `
  );
};

const HyperrealScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef1 = useRef<any>(null);
  const materialRef2 = useRef<any>(null);
  
  // High-poly tube geometry for smooth rendering
  const geo1 = useMemo(() => new THREE.TubeGeometry(createSShapeCurve(false), 256, 0.6, 64, false), []);
  const geo2 = useMemo(() => new THREE.TubeGeometry(createSShapeCurve(true), 256, 0.6, 64, false), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // MANDATE: Continuous Z-axis rotation
      groupRef.current.rotation.z += delta * 0.3;
    }
    if (materialRef1.current) materialRef1.current.uniforms.time.value = state.clock.elapsedTime;
    if (materialRef2.current) materialRef2.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <>
      {/* MANDATE: Camera pointing directly at the face on the Z-axis */}
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={35} onUpdate={c => c.lookAt(0, 0, 0)} />
      
      {/* Cinematic Studio Lighting */}
      <Environment preset="studio" environmentIntensity={1.2} />
      <ambientLight intensity={0.5} />
      <spotLight position={[5, 10, 10]} angle={0.2} penumbra={1} intensity={8} color="#e6c03b" />
      <spotLight position={[-5, -10, 10]} angle={0.2} penumbra={1} intensity={8} color="#ff4068" />

      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <group ref={groupRef}>
          {/* Primary S - Gunmetal/Gold */}
          <mesh geometry={geo1} castShadow receiveShadow>
            <meshPhysicalMaterial
              color="#3d444d"
              metalness={1.0}
              roughness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              emissive="#e6c03b"
              emissiveIntensity={0.1}
              onBeforeCompile={injectZBrushSculpt}
              ref={materialRef1}
            />
          </mesh>
          
          {/* Inverse S - Gunmetal/Pink */}
          <mesh geometry={geo2} castShadow receiveShadow>
            <meshPhysicalMaterial
              color="#3d444d"
              metalness={1.0}
              roughness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              emissive="#ff4068"
              emissiveIntensity={0.15}
              onBeforeCompile={injectZBrushSculpt}
              ref={materialRef2}
            />
          </mesh>
        </group>
      </Float>

      <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={15} blur={2} far={10} color="#05070B" />

      {/* Awwwards-Tier Post Processing */}
      <EffectComposer multisampling={4}>
        <SSAO radius={0.1} intensity={15} luminanceInfluence={0.5} color="#000000" />
        <Bloom intensity={1.5} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
        <Noise opacity={0.05} />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

export default function ThreeLogo() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <HyperrealScene />
      </Canvas>
    </div>
  );
}