import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Center } from '@react-three/drei';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { ObsidianTransmissionMaterial } from '../lib/materials';

const SVG_MARKUP = '<svg viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg"><path d="m47.67,37.07l-2.67,1.54a0.62,0.62 0 0 1 -0.89,-0.75q1.43,-3.96 1.47,-5.02c0.34,-10.74 -15.97,-7.15 -11.12,2.26q0.99,1.9 4.64,6.77a1.35,1.35 0 0 1 -0.06,1.69l-1.2,1.39a0.86,0.85 47.6 0 1 -1.35,-0.07c-4.32,-6.16 -10.05,-11.78 -4.62,-18.81c6.72,-8.71 20.69,-1.03 17.23,9.25a3.23,3.18 84.7 0 1 -1.43,1.75z" fill="#ffffff"/><path d="m30.29,41.13q-2.55,-0.05 -3.6,0.11c-6.01,0.9 -6.62,8.78 -1.66,11.21q4.03,1.96 7.59,-1.57q8.7,-8.65 9.6,-9.62q3.72,-3.99 8.93,-3.91c8.35,0.13 12.15,10 6.99,16.13c-4.55,5.4 -12.91,4.27 -16.55,-1.84a0.2,0.2 0 0 1 0,-0.22q1.08,-1.68 2.55,-2.86a0.11,0.11 0 0 1 0.16,0.03q2,3.44 3.83,4.1q3.88,1.38 6.54,-1.15c5.86,-5.59 -2.23,-14.35 -8.51,-8.58q-3.54,3.26 -10.92,10.77c-4.56,4.64 -12.2,4.14 -15.81,-1.33c-2.46,-3.73 -1.98,-9.15 1.32,-12.34q2.79,-2.71 7.11,-2.89a1.51,1.5 73.4 0 1 1.36,0.74l1.46,2.55a0.45,0.44 -14.8 0 1 -0.39,0.67z" fill="#ffffff"/></svg>';

export const Savant3DLogo = () => {
  const group = useRef<THREE.Group>(null!);
  const shapes = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(SVG_MARKUP);
    return svgData.paths.flatMap(path => SVGLoader.createShapes(path));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.2) * 0.5;
    group.current.children.forEach((child, i) => {
      child.rotation.z = t * (0.1 + i * 0.05);
      child.position.z = Math.sin(t + i) * 5;
    });
  });

  return (
    <Center>
      <group ref={group}>
        {[...Array(6)].map((_, i) => (
          <group key={i} scale={0.05 + i * 0.01}>
            {shapes.map((shape, j) => (
              <mesh key={j} rotation={[Math.PI, 0, 0]}>
                <extrudeGeometry args={[shape, { depth: 2, bevelEnabled: true, bevelThickness: 0.5 }]} />
                <MeshTransmissionMaterial {...ObsidianTransmissionMaterial} 
                  opacity={1 - (i * 0.15)} 
                  emissive={i === 0 ? "#e6c03b" : "#ff4068"} 
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Center>
  );
};
