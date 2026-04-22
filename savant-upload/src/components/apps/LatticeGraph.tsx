import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, Text, Sphere, MeshDistortMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const Node = ({ position, label, color }: { position: [number, number, number], label: string, color: string }) => {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <Sphere args={[0.2, 32, 32]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        </Sphere>
        <Text
          position={[0, 0.4, 0]}
          fontSize={0.15}
          color="white"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </group>
    </Float>
  );
};

const Connection = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#ffffff", opacity: 0.1, transparent: true }))} />
  );
};

const Graph = () => {
  const nodes = useMemo(() => [
    { id: 1, pos: [0, 0, 0] as [number, number, number], label: 'SAVANT_CORE', color: '#ff4068' },
    { id: 2, pos: [2, 1, -1] as [number, number, number], label: 'OBLIVION', color: '#e6c03b' },
    { id: 3, pos: [-2, 2, 1] as [number, number, number], label: 'LATTICE', color: '#00E5FF' },
    { id: 4, pos: [1, -2, 2] as [number, number, number], label: 'VOID', color: '#ffffff' },
    { id: 5, pos: [-1, -1, -2] as [number, number, number], label: 'NEURAL', color: '#ff4068' },
    { id: 6, pos: [3, -1, 0] as [number, number, number], label: 'STRATEGY', color: '#e6c03b' },
    { id: 7, pos: [-3, 0, -1] as [number, number, number], label: 'DESIGN', color: '#00E5FF' },
  ], []);

  const connections = useMemo(() => [
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 6], [3, 7], [4, 6], [5, 7]
  ], []);

  return (
    <group>
      {nodes.map(node => (
        <Node key={node.id} position={node.pos} label={node.label} color={node.color} />
      ))}
      {connections.map(([startId, endId], i) => {
        const start = nodes.find(n => n.id === startId)?.pos;
        const end = nodes.find(n => n.id === endId)?.pos;
        if (start && end) return <Connection key={i} start={start} end={end} />;
        return null;
      })}
    </group>
  );
};

export const LatticeGraph: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-black/40 rounded-xl overflow-hidden border border-white/5">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Graph />
      </Canvas>
      <div className="absolute top-6 left-6 font-mono text-[10px] text-white/40 tracking-[0.5em] ">
        LATTICE_GRAPH_v1.0 // TOPOLOGY_MAPPING: ACTIVE
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[10px] text-white/40 tracking-[0.5em] uppercase">
        NODES_CONNECTED: 07 // SYNC_STABLE
      </div>
    </div>
  );
};
