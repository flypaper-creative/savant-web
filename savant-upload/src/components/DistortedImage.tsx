import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { useScroll, useTransform } from 'motion/react';

const StaticDistortionMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uScroll: 0,
    uIntensity: 0.5,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uScroll;
    uniform float uIntensity;

    void main() {
      vUv = uv;
      
      vec3 pos = position;
      
      // Wave effect based on scroll and time
      float wave = sin(uv.y * 10.0 + uTime + uScroll * 10.0) * 0.05 * uIntensity;
      pos.z += wave;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uScroll;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      // RGB Shift based on scroll
      float shift = uScroll * 0.05 * uIntensity;
      float r = texture2D(uTexture, vUv + vec2(shift, 0.0)).r;
      float g = texture2D(uTexture, vUv).g;
      float b = texture2D(uTexture, vUv - vec2(shift, 0.0)).b;
      
      vec4 color = vec4(r, g, b, 1.0);
      
      // Grayscale conversion
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 finalColor = mix(vec3(gray), color.rgb, 0.2); // Mostly grayscale
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ StaticDistortionMaterial });

const ImagePlane = ({ url, scrollYProgress, intensity }: { url: string, scrollYProgress: any, intensity: number }) => {
  const texture = useTexture(url);
  const materialRef = useRef<any>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uScroll = scrollYProgress.get();
      materialRef.current.uIntensity = intensity;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 32, 32]} />
      {/* @ts-ignore */}
      <staticDistortionMaterial ref={materialRef} uTexture={texture} transparent />
    </mesh>
  );
};

export const DistortedImage = ({ src, className = "", intensity = 0.5 }: { src: string, className?: string, intensity?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} className="absolute inset-0 w-full h-full pointer-events-none">
        <React.Suspense fallback={null}>
          <ImagePlane url={src} scrollYProgress={scrollYProgress} intensity={intensity} />
        </React.Suspense>
      </Canvas>
    </div>
  );
};
