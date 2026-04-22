import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function FlameS() {
  const ref = useRef<THREE.Mesh>(null!)

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(0.55, 0.62, 0.08),
      new THREE.Vector3(-0.45, 0.02, -0.04),
      new THREE.Vector3(0.62, -0.62, 0.06),
      new THREE.Vector3(0, -1.25, 0),
    ])
    return new THREE.TubeGeometry(curve, 96, 0.16, 16, false)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!ref.current) return

    ref.current.rotation.y = Math.sin(t * 0.55) * 0.22
    ref.current.rotation.x = Math.sin(t * 0.35) * 0.08

    const s = 1 + Math.sin(t * 1.5) * 0.02
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshPhysicalMaterial
        color="#3ccfff"
        emissive="#0ea5e9"
        emissiveIntensity={0.9}
        metalness={0.72}
        roughness={0.18}
        clearcoat={1}
        clearcoatRoughness={0.12}
        reflectivity={1}
      />
    </mesh>
  )
}

function GlowShell() {
  const ref = useRef<THREE.Mesh>(null!)

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(0.55, 0.62, 0.08),
      new THREE.Vector3(-0.45, 0.02, -0.04),
      new THREE.Vector3(0.62, -0.62, 0.06),
      new THREE.Vector3(0, -1.25, 0),
    ])
    return new THREE.TubeGeometry(curve, 72, 0.22, 12, false)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(t * 0.55) * 0.22
    ref.current.rotation.x = Math.sin(t * 0.35) * 0.08
    const s = 1 + Math.sin(t * 1.5) * 0.02
    ref.current.scale.setScalar(s * 1.015)
  })

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.18}
      />
    </mesh>
  )
}

export default function SavantFlameLogo3D() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background:
          'radial-gradient(circle at center, rgba(8,18,28,1) 0%, rgba(0,0,0,1) 68%)',
      }}
    >
      <Canvas
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-3, -2, 3]} intensity={1.2} color="#38bdf8" />
        <GlowShell />
        <FlameS />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at center, rgba(56,189,248,0.08) 0%, rgba(0,0,0,0) 45%)',
        }}
      />
    </div>
  )
}