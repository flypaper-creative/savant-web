import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  Environment,
  Points,
  PointMaterial,
  shaderMaterial,
  Center,
  MeshTransmissionMaterial
} from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { useLoading } from '../contexts/LoadingContext';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

const SVG_MARKUP = `<svg viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg"><path transform="translate(0, -2)" d="m47.67,37.07l-2.67,1.54a0.62,0.62 0 0 1 -0.89,-0.75q1.43,-3.96 1.47,-5.02c0.34,-10.74 -15.97,-7.15 -11.12,2.26q0.99,1.9 4.64,6.77a1.35,1.35 0 0 1 -0.06,1.69l-1.2,1.39a0.86,0.85 47.6 0 1 -1.35,-0.07c-4.32,-6.16 -10.05,-11.78 -4.62,-18.81c6.72,-8.71 20.69,-1.03 17.23,9.25a3.23,3.18 84.7 0 1 -1.43,1.75z" fill="#ffffff"/><path d="m30.29,41.13q-2.55,-0.05 -3.6,0.11c-6.01,0.9 -6.62,8.78 -1.66,11.21q4.03,1.96 7.59,-1.57q8.7,-8.65 9.6,-9.62q3.72,-3.99 8.93,-3.91c8.35,0.13 12.15,10 6.99,16.13c-4.55,5.4 -12.91,4.27 -16.55,-1.84a0.2,0.2 0 0 1 0,-0.22q1.08,-1.68 2.55,-2.86a0.11,0.11 0 0 1 0.16,0.03q2,3.44 3.83,4.1q3.88,1.38 6.54,-1.15c5.86,-5.59 -2.23,-14.35 -8.51,-8.58q-3.54,3.26 -10.92,10.77c-4.56,4.64 -12.2,4.14 -15.81,-1.33c-2.46,-3.73 -1.98,-9.15 1.32,-12.34q2.79,-2.71 7.11,-2.89a1.51,1.5 73.4 0 1 1.36,0.74l1.46,2.55a0.45,0.44 -14.8 0 1 -0.39,0.67z" fill="#ffffff"/></svg>`;

// --- SHADERS ---

const BioluminescenceMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#00E5FF"),
    uPulseSpeed: 2.0,
  },
  `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulseSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float pulse = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = pow(rim, 3.0);
    
    vec3 col = uColor * (0.5 + pulse * 0.5);
    col += vec3(1.0) * rim * 2.0;
    
    gl_FragColor = vec4(col, 1.0);
  }
  `
);

extend({ BioluminescenceMaterial });

// --- COMPONENTS ---

const MarineSnow = ({ count = 2000 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 40;
      p[i * 3 + 1] = (Math.random() - 0.5) * 40;
      p[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.position.y -= 0.01;
      if (pointsRef.current.position.y < -20) pointsRef.current.position.y = 20;
      pointsRef.current.rotation.y += 0.001;
    }
  });

  return (
    <Points ref={pointsRef} positions={points} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.2}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const Octopus = ({ onSquirt }: { onSquirt: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const tentaclesRef = useRef<THREE.Group>(null);
  const hasSquirtted = useRef(false);

  useEffect(() => {
    if (!groupRef.current) return;

    // Cinematic movement: Octopus shoots by swiftly
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    
    tl.set(groupRef.current.position, { x: -30, y: -5, z: -20 });
    tl.set(groupRef.current.rotation, { y: Math.PI / 2 });

    tl.to(groupRef.current.position, {
      x: 0,
      y: 0,
      z: 5,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        // Squirt ink when near camera
        if (groupRef.current && groupRef.current.position.z > 0 && !hasSquirtted.current) {
          onSquirt();
          hasSquirtted.current = true;
        }
      }
    });

    tl.to(groupRef.current.position, {
      x: 30,
      y: 5,
      z: -20,
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => {
        hasSquirtted.current = false;
      }
    });

    return () => { tl.kill(); };
  }, [onSquirt]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (headRef.current) {
      headRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
    }
    if (tentaclesRef.current) {
      tentaclesRef.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 4 + i) * 0.5;
        child.rotation.x = Math.cos(t * 4 + i) * 0.2;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh ref={headRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        {/* @ts-ignore */}
        <bioluminescenceMaterial uColor="#00E5FF" />
      </mesh>
      
      {/* Tentacles */}
      <group ref={tentaclesRef} position={[0, -0.5, 0]}>
        {[...Array(8)].map((_, i) => (
          <group key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
            <mesh position={[0, -2, 0]}>
              <cylinderGeometry args={[0.2, 0.05, 4, 8]} />
              {/* @ts-ignore */}
              <bioluminescenceMaterial uColor="#FF2A5F" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Eyes */}
      <mesh position={[0.5, 0.5, 0.8]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[-0.5, 0.5, 0.8]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
};

const InkReveal = ({ isSquirting }: { isSquirting: boolean }) => {
  const count = 4000;
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, targetPositions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const loader = new SVGLoader();
    const svgData = loader.parse(SVG_MARKUP);
    const allPaths: THREE.Vector3[] = [];
    
    svgData.paths.forEach((path) => {
      const shapes = path.toShapes(true);
      shapes.forEach((shape) => {
        const shapePoints = shape.getPoints(200);
        shapePoints.forEach((p) => {
          allPaths.push(new THREE.Vector3(p.x * 0.1, -p.y * 0.1, 0));
        });
      });
    });

    const colorPalette = [
      new THREE.Color("#00E5FF"), // Cyan
      new THREE.Color("#FF2A5F"), // Magenta
      new THREE.Color("#FFB800"), // Gold
    ];

    for (let i = 0; i < count; i++) {
      // Initial positions (at the octopus mouth area)
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      // Target positions (Logo shape)
      if (allPaths.length > 0) {
        const p = allPaths[i % allPaths.length];
        target[i * 3] = p.x - 3; // Center adjustment
        target[i * 3 + 1] = p.y + 4;
        target[i * 3 + 2] = 2;
      } else {
        target[i * 3] = (Math.random() - 0.5) * 10;
        target[i * 3 + 1] = (Math.random() - 0.5) * 10;
        target[i * 3 + 2] = 2;
      }

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, target, cols];
  }, []);

  const currentPositions = useRef(new Float32Array(positions));

  useEffect(() => {
    if (isSquirting) {
      // Explode ink towards camera
      for (let i = 0; i < count; i++) {
        const delay = Math.random() * 0.5;
        gsap.to(currentPositions.current, {
          [i * 3]: targetPositions[i * 3],
          [i * 3 + 1]: targetPositions[i * 3 + 1],
          [i * 3 + 2]: targetPositions[i * 3 + 2],
          duration: 2 + Math.random() * 2,
          delay: delay,
          ease: "expo.out"
        });
      }
    } else {
      // Reset positions
      for (let i = 0; i < count; i++) {
        currentPositions.current[i * 3] = 0;
        currentPositions.current[i * 3 + 1] = 0;
        currentPositions.current[i * 3 + 2] = 0;
      }
    }
  }, [isSquirting, targetPositions]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.array.set(currentPositions.current);
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <Points ref={pointsRef} positions={positions} colors={colors} stride={3}>
        <PointMaterial
          transparent
          vertexColors
          size={0.15}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>
    </group>
  );
};

const SavantLogo3D = ({ visible }: { visible: boolean }) => {
  const shapes = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(SVG_MARKUP);
    return svgData.paths.flatMap(p => p.toShapes(true));
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Center position={[0, 0, 2.5]}>
      <group ref={groupRef} scale={visible ? [0.08, -0.08, 0.08] : [0, 0, 0]}>
        {shapes.map((shape, i) => (
          <mesh key={i}>
            <extrudeGeometry args={[shape, { depth: 4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.2 }]} />
            <MeshTransmissionMaterial 
              thickness={2}
              roughness={0.1}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.05}
              color="#111111"
              metalness={0.9}
            />
          </mesh>
        ))}
      </group>
    </Center>
  );
};

export const SavantPreloader3D = () => {
  const { phase, isLoading, progress } = useLoading();
  const [isSquirting, setIsSquirting] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  const handleSquirt = () => {
    setIsSquirting(true);
    // After ink settles, show the 3D logo
    setTimeout(() => setLogoVisible(true), 3000);
  };

  useEffect(() => {
    if (phase === 'complete') {
      setIsSquirting(false);
      setLogoVisible(false);
    }
  }, [phase]);

  if (!isLoading && phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-[13000] pointer-events-none bg-[#000814]">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={["#000814"]} />
        <fogExp2 attach="fog" color={0x000814} density={0.05} />
        
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00E5FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF2A5F" />

        <MarineSnow />
        
        <Octopus onSquirt={handleSquirt} />
        
        <InkReveal isSquirting={isSquirting} />
        
        <SavantLogo3D visible={logoVisible} />

        <Environment preset="night" />
        
        <EffectComposer multisampling={4}>
          <Bloom intensity={1.5} luminanceThreshold={0.1} mipmapBlur />
          <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
          <Noise opacity={0.05} />
          <Vignette offset={0.5} darkness={0.8} />
        </EffectComposer>
      </Canvas>
      
      {/* Loading Progress Text */}
      <div className="absolute bottom-12 left-12 font-mono text-[10px] text-white/40 tracking-[0.5em] uppercase">
        system_initialization: {progress}%
      </div>
    </div>
  );
};
