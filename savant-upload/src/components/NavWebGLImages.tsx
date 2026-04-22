import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const DistortionMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uHoverState: 0,
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uResolution: new THREE.Vector2(1, 1),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uHoverState;
    uniform vec2 uMouse;

    void main() {
      vUv = uv;
      
      vec3 pos = position;
      
      // Subtle wave effect on hover
      float dist = distance(uv, uMouse);
      float wave = sin(dist * 10.0 - uTime * 2.0) * 0.05 * uHoverState;
      pos.z += wave;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uHoverState;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      // RGB Shift based on hover
      float r = texture2D(uTexture, vUv + vec2(0.01 * uHoverState, 0.0)).r;
      float g = texture2D(uTexture, vUv).g;
      float b = texture2D(uTexture, vUv - vec2(0.01 * uHoverState, 0.0)).b;
      
      vec4 color = vec4(r, g, b, 1.0);
      
      // Grayscale conversion
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 finalColor = mix(vec3(gray), color.rgb, uHoverState);
      
      gl_FragColor = vec4(finalColor, uHoverState * 0.6); // Fade in/out
    }
  `
);

extend({ DistortionMaterial });

const ImagePlane = ({ url, isActive, mouseX, mouseY }: { url: string, isActive: boolean, mouseX: any, mouseY: any }) => {
  const texture = useTexture(url);
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (materialRef.current && meshRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      
      // Smoothly interpolate hover state
      materialRef.current.uHoverState = THREE.MathUtils.damp(
        materialRef.current.uHoverState,
        isActive ? 1 : 0,
        4,
        delta
      );
      
      // Smoothly interpolate scale
      const targetScale = isActive ? 1 : 1.2;
      meshRef.current.scale.x = THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, 4, delta);
      meshRef.current.scale.y = THREE.MathUtils.damp(meshRef.current.scale.y, targetScale, 4, delta);
      meshRef.current.scale.z = THREE.MathUtils.damp(meshRef.current.scale.z, targetScale, 4, delta);
      
      // Normalize mouse coordinates for shader
      const mx = (mouseX.get() / window.innerWidth) + 0.5;
      const my = 1.0 - ((mouseY.get() / window.innerHeight) + 0.5);
      materialRef.current.uMouse.set(mx, my);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, isActive ? 0 : -1]}>
      <planeGeometry args={[viewport.width, viewport.height, 32, 32]} />
      {/* @ts-ignore */}
      <distortionMaterial ref={materialRef} uTexture={texture} transparent depthWrite={false} />
    </mesh>
  );
};

export const NavWebGLImages = ({ items, activeIndex, mouseX, mouseY }: { items: any[], activeIndex: number | null, mouseX: any, mouseY: any }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <React.Suspense fallback={null}>
          {items.map((item, index) => (
            <ImagePlane 
              key={index} 
              url={item.img} 
              isActive={activeIndex === index} 
              mouseX={mouseX}
              mouseY={mouseY}
            />
          ))}
        </React.Suspense>
      </Canvas>
    </div>
  );
};
