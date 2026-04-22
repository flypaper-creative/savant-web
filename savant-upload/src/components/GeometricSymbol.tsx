import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  PerspectiveCamera, 
  Environment,
  ContactShadows,
  MeshTransmissionMaterial,
  Text,
  Center,
  OrbitControls,
  Grid
} from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';

// --- CURVE GENERATORS ---

const createCircleCurve = (radius = 3) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createInfinityCurve = (scale = 3.5) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    const x = scale * Math.cos(t) / (Math.sin(t) * Math.sin(t) + 1);
    const y = scale * Math.sin(t) * Math.cos(t) / (Math.sin(t) * Math.sin(t) + 1);
    const z = Math.sin(t * 2) * 0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createFractalCurve = (scale = 2) => {
  const points = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const x = scale * (Math.sin(t) + 0.5 * Math.sin(5 * t));
    const y = scale * (Math.cos(t) + 0.5 * Math.cos(5 * t));
    const z = scale * Math.sin(10 * t) * 0.2;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createTorusKnotCurve = (p = 2, q = 3, scale = 2.5) => {
  const points = [];
  for (let i = 0; i <= 150; i++) {
    const t = (i / 150) * Math.PI * 2;
    const r = scale * (0.5 * (2 + Math.sin(q * t)));
    const x = r * Math.cos(p * t);
    const y = r * Math.sin(p * t);
    const z = scale * Math.cos(q * t) * 0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createHeartCurve = (scale = 0.25) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push(new THREE.Vector3(x * scale, y * scale, Math.sin(t * 4) * 0.5));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createSpiralLoop = (scale = 3) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    const r = scale * (1 + 0.2 * Math.sin(t * 5));
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    const z = Math.cos(t * 5) * 0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createMobiusCurve = (scale = 3) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    const x = scale * (1 + 0.5 * Math.cos(t / 2)) * Math.cos(t);
    const y = scale * (1 + 0.5 * Math.cos(t / 2)) * Math.sin(t);
    const z = scale * 0.5 * Math.sin(t / 2);
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createHexCurve = (scale = 3) => {
  const points = [];
  for (let i = 0; i <= 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * scale, Math.sin(t) * scale, 0));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

const createStarCurve = (scale = 3) => {
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? scale : scale * 0.4;
    points.push(new THREE.Vector3(Math.cos(t) * r, Math.sin(t) * r, Math.sin(t * 5) * 0.5));
  }
  return new THREE.CatmullRomCurve3(points, true);
};

// --- LOGO CELL COMPONENT ---

const LogoCell = ({ position, index, curve, font, materialProps, title }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Removed useFrame for static high-quality presentation as per user request
  
  return (
    <group position={position}>
      <Float speed={0} rotationIntensity={0} floatIntensity={0}>
        <mesh 
          ref={meshRef} 
          castShadow
        >
          <tubeGeometry args={[curve, 128, 0.25, 32, true]} />
          <MeshTransmissionMaterial 
            {...materialProps}
            samples={16}
            resolution={512}
            thickness={1}
            chromaticAberration={0.5}
            anisotropy={0.3}
            distortion={0.2}
            distortionScale={0.2}
            temporalDistortion={0.1}
          />
        </mesh>
      </Float>

      <Center position={[0, -2.5, 0]}>
        <Text
          font={font}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={4}
          textAlign="center"
        >
          fractal
        </Text>
      </Center>

      <Text
        position={[0, -3.2, 0]}
        fontSize={0.15}
        color="#4ade80"
        fillOpacity={0.5}
        font="https://fonts.gstatic.com/s/jetbrainsmono/v18/t6nu21tuWht9mXzE7h459uPzXOk9.woff2"
      >
        {`VAR_${index + 1} // ${title}`}
      </Text>
    </group>
  );
};

// --- MAIN SCENE ---

const Scene = () => {
  const variants = useMemo(() => [
    { 
      curve: createCircleCurve(), 
      title: "CORE_LOOP", 
      font: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff2",
      material: { color: "#ffffff", transmission: 1, roughness: 0.05, ior: 1.5 }
    },
    { 
      curve: createInfinityCurve(), 
      title: "INFINITE_SYNC", 
      font: "https://fonts.gstatic.com/s/jetbrainsmono/v18/t6nu21tuWht9mXzE7h459uPzXOk9.woff2",
      material: { color: "#8fd7ff", transmission: 1, roughness: 0.1, ior: 1.8, attenuationColor: "#8fd7ff" }
    },
    { 
      curve: createFractalCurve(), 
      title: "NEURAL_SHARD", 
      font: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD7K3a7mX7P9pW8khGnvD-iaU6GptX2vYvS6f.woff2",
      material: { color: "#ffd590", transmission: 0.9, roughness: 0.2, ior: 2.4, attenuationColor: "#ffd590" }
    },
    { 
      curve: createTorusKnotCurve(2, 3), 
      title: "QUANTUM_WEAVE", 
      font: "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-g.woff2",
      material: { color: "#f6d5ff", transmission: 1, roughness: 0.0, ior: 1.6, chromaticAberration: 1 }
    },
    { 
      curve: createHeartCurve(), 
      title: "BIO_CORE", 
      font: "https://fonts.gstatic.com/s/outfit/v11/QGYsz_MVcBeNP4NjuGObX1vH_07W.woff2",
      material: { color: "#ff8f8f", transmission: 0.8, roughness: 0.3, ior: 1.4, attenuationColor: "#ff0000" }
    },
    { 
      curve: createSpiralLoop(), 
      title: "VORTEX_FLOW", 
      font: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYpHtK.woff2",
      material: { color: "#4ade80", transmission: 1, roughness: 0.05, ior: 1.5, emissive: "#10b981", emissiveIntensity: 0.5 }
    },
    { 
      curve: createMobiusCurve(), 
      title: "RECURSIVE_LOGIC", 
      font: "https://fonts.gstatic.com/s/anton/v25/1Pt6g87L7UJq2Q3W.woff2",
      material: { color: "#333333", transmission: 0.5, roughness: 0.1, ior: 2.0, metalness: 1 }
    },
    { 
      curve: createHexCurve(), 
      title: "GRID_INTEGRITY", 
      font: "https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2",
      material: { color: "#ffffff", transmission: 1, roughness: 0.5, ior: 1.2, clearcoat: 1 }
    },
    { 
      curve: createStarCurve(), 
      title: "SINGULARITY_PT", 
      font: "https://fonts.gstatic.com/s/librebaskerville/v14/kmKiZf83YYDsTX39aJ29Go6Tg726XGvX.woff2",
      material: { color: "#000000", transmission: 0.2, roughness: 0.0, ior: 3.0, attenuationColor: "#ffffff" }
    }
  ], []);

  const spacing = 8;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={45} />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#4ade80" />
      
      <Environment preset="studio" />

      <group position={[-spacing, spacing, 0]}>
        {variants.map((v, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          return (
            <LogoCell 
              key={i}
              index={i}
              position={[col * spacing, -row * spacing, 0]}
              curve={v.curve}
              font={v.font}
              materialProps={v.material}
              title={v.title}
            />
          );
        })}
      </group>

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        cellSize={spacing} 
        sectionSize={spacing} 
        sectionThickness={1} 
        sectionColor="#10b981" 
        cellColor="#222222"
        position={[0, -15, 0]}
      />

      <ContactShadows position={[0, -15, 0]} opacity={0.4} blur={2} scale={50} far={20} color="#000000" />

      <EffectComposer multisampling={4}>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>

      <OrbitControls enablePan={true} enableZoom={true} makeDefault />
    </>
  );
};

export const GeometricSymbol: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-visible">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 25], fov: 45 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};
