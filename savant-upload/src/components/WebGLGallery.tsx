import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useScroll, useTransform, useSpring, motion } from 'motion/react';

const DistortionMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uScroll: 0,
    uIntensity: 0.5,
    uHover: 0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uScroll;
    uniform float uIntensity;
    uniform float uHover;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Bend based on scroll
      float bend = sin(uv.y * 3.0 + uScroll * 5.0) * 0.2 * uIntensity;
      pos.z += bend;
      
      // Expand on hover
      pos.z += uHover * 0.5;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uScroll;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // RGB Shift
      float shift = uScroll * 0.02 + uHover * 0.01;
      float r = texture2D(uTexture, uv + vec2(shift, 0.0)).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, uv - vec2(shift, 0.0)).b;
      
      vec3 color = vec3(r, g, b);
      
      // Vignette
      float dist = distance(vUv, vec2(0.5));
      color *= 1.0 - dist * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ DistortionMaterial });

const GalleryItem = ({ url, index, scrollProgress }: { url: string, index: number, scrollProgress: any }) => {
  const texture = useTexture(url);
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uScroll = scrollProgress.get();
      
      // Smooth hover transition
      materialRef.current.uHover = THREE.MathUtils.damp(
        materialRef.current.uHover,
        hovered ? 1 : 0,
        4,
        delta
      );
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={[0, -index * 12, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[8, 10, 32, 32]} />
      {/* @ts-ignore */}
      <distortionMaterial ref={materialRef} uTexture={texture} />
    </mesh>
  );
};

export const WebGLGallery = ({ items }: { items: any[] }) => {
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <ambientLight intensity={0.5} />
        <React.Suspense fallback={null}>
          {items.map((item, i) => (
            <GalleryItem 
              key={i} 
              url={item.img} 
              index={i} 
              scrollProgress={smoothScroll} 
            />
          ))}
        </React.Suspense>
      </Canvas>
    </div>
  );
};
