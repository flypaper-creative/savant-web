import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Savant3DLogo } from './components/Savant3DLogo';
import { Effects } from './components/Effects';
import { HUD } from './components/HUD';

export default function Layout() {
  return (
    <div className="h-screen w-full bg-[#0a0a0a] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 60], fov: 35 }} dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <Suspense fallback={null}>
            <Savant3DLogo />
            <Effects />
          </Suspense>
        </Canvas>
      </div>
      
      <HUD />
      <main className="relative z-10 h-full overflow-y-auto mix-blend-difference">
        <Outlet />
      </main>
      
      <div className="noise-overlay pointer-events-none fixed inset-0 z-[100] opacity-[0.03]" />
    </div>
  );
}
