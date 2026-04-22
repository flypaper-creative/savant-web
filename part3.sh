#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

mkdir -p 'src/components'
cat >> 'src/components/SavantFlameLogo3D.tsx' <<'EOT'

const LogoFragments = ({ active }: { active: boolean }) => {
  const fragments = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
      speed: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
      rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      size: 0.1 + Math.random() * 0.6
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    if (active) {
      groupRef.current.children.forEach((child, i) => {
        const f = fragments[i];
        child.position.add(f.speed);
        child.rotation.x += 0.15;
        child.rotation.y += 0.15;
      });
      groupRef.current.scale.lerp(new THREE.Vector3(3, 3, 3), 0.05);
    } else {
      groupRef.current.scale.setScalar(0);
    }
  });

  return (
    <group ref={groupRef}>
      {fragments.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot.toArray() as any}>
          <tetrahedronGeometry args={[f.size, 0]} />
          <meshPhysicalMaterial color="#FFD700" metalness={1} roughness={0.05} emissive="#FFD700" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
};

const Aurora = ({ intensity = 1 }: { intensity?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const auroraMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 345.45));
          p += dot(p, p + 34.345);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.03;
            amplitude *= 0.52;
          }
          return value;
        }

        void main() {
          vec2 uv = vUv;
          vec2 warped = uv;
          float t = uTime * 0.06;

          warped.x += sin(uv.y * 7.0 + t * 7.0) * 0.08;
          warped.y += sin(uv.x * 4.0 - t * 4.0) * 0.05;

          float ribbonA = fbm(vec2(warped.x * 2.5, warped.y * 7.0 - t * 3.0));
          float ribbonB = fbm(vec2(warped.x * 4.5 - 2.0, warped.y * 10.0 + t * 2.0));
          float ribbonC = fbm(vec2(warped.x * 8.0 + 10.0, warped.y * 16.0 - t * 5.0));
          float bands = smoothstep(0.28, 1.0, ribbonA * 0.65 + ribbonB * 0.25 + ribbonC * 0.1);

          float verticalMask = smoothstep(0.04, 0.45, uv.y) * (1.0 - smoothstep(0.58, 1.0, uv.y));
          float horizonFade = smoothstep(1.2, 0.2, abs(vWorldPosition.x) * 0.02);
          float intensityMask = bands * verticalMask * horizonFade * uIntensity;

          vec3 cyan = vec3(0.04, 0.86, 1.0);
          vec3 violet = vec3(0.47, 0.16, 0.98);
          vec3 gold = vec3(0.98, 0.72, 0.24);
          vec3 hot = vec3(1.0, 0.94, 0.78);

          vec3 color = mix(cyan, violet, smoothstep(0.05, 0.95, uv.x + ribbonB * 0.15));
          color = mix(color, gold, smoothstep(0.45, 0.95, ribbonC));
          color += hot * pow(max(ribbonA - 0.72, 0.0), 3.0) * 2.2;

          float alpha = pow(intensityMask, 1.25) * 0.78;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, [intensity]);

  useFrame((state) => {
    auroraMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} position={[0, 16, -64]} rotation={[Math.PI * 0.18, 0, 0]}>
      <planeGeometry args={[320, 180, 1, 1]} />
      <primitive object={auroraMaterial} attach="material" />
    </mesh>
  );
};

const Lasers = ({ active }: { active: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pool = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      active: false,
      progress: 0,
      speed: 0.025 + Math.random() * 0.03,
      start: new THREE.Vector3(),
      end: new THREE.Vector3(),
      color: new THREE.Color('#ff4068'),
    }));
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;

    if (active && Math.random() > 0.965) {
      const next = pool.find((laser) => !laser.active);
      if (next) {
        next.active = true;
        next.progress = 0;
        next.start.set((Math.random() - 0.5) * 110, (Math.random() - 0.5) * 65, -110);
        next.end.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, -6);
        next.color.set(Math.random() > 0.5 ? '#ff4068' : '#62b7ff');
      }
    }

    groupRef.current.children.forEach((child, i) => {
      const laser = pool[i];
      if (!laser.active || !active) {
        child.visible = false;
        return;
      }
      laser.progress += laser.speed;
      if (laser.progress >= 1) {
        laser.active = false;
        child.visible = false;
        return;
      }
      child.visible = true;
      child.position.lerpVectors(laser.start, laser.end, laser.progress);
      child.lookAt(laser.end);
      child.scale.setScalar(1.0 - laser.progress * 0.35);
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.color.copy(laser.color);
      material.opacity = 0.85 * (1.0 - laser.progress * 0.6);
    });
  });

  return (
    <group ref={groupRef}>
      {pool.map((_, i) => (
        <mesh key={i} visible={false}>
          <cylinderGeometry args={[0.025, 0.08, 14, 10]} />
          <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

const EnemyShips = ({ active }: { active: boolean }) => {
  const ships = useMemo(() => {
    return Array.from({ length: 5 }).map(() => ({
      orbit: 30 + Math.random() * 20,
      speed: 0.1 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const s = ships[i];
      child.position.x = Math.sin(t * s.speed + s.offset) * s.orbit;
      child.position.y = Math.cos(t * s.speed + s.offset) * (s.orbit * 0.5);
      child.position.z = Math.sin(t * s.speed * 0.5 + s.offset) * 20 - 50;
    });
  });

  return (
    <group ref={groupRef} visible={active}>
      {ships.map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#222" emissive="#ff4068" emissiveIntensity={5} />
        </mesh>
      ))}
    </group>
  );
};
EOT
