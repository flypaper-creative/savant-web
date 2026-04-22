#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

mkdir -p 'src/components'
cat >> 'src/components/SavantFlameLogo3D.tsx' <<'EOT'

const PreloaderScene = ({
  phase,
  narrative,
  progress,
  initialized,
  booted,
  bloomBoost,
  isMobile
}: {
  phase: string;
  narrative: string;
  progress: number;
  initialized: boolean;
  booted: boolean;
  bloomBoost: number;
  isMobile: boolean;
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<any>(null);
  const initialRotation = useMemo(() => new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0), []);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!cameraRef.current || !groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (flameRef.current) {
      flameRef.current.uTime = t;
      const isIgnited = narrative.includes('03') || narrative.includes('04') || narrative === '05_CALIBRATION' || initialized;
      flameRef.current.uIntensity = THREE.MathUtils.lerp(flameRef.current.uIntensity, isIgnited ? 2.5 : 0.0, 0.05);
    }

    if (initialized) {
      const scale = 0.5;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      const targetX = -viewport.width / 2 + 1.2;
      const targetY = viewport.height / 2 - 1.2;
      const targetZ = 0;

      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.08);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.08);

      groupRef.current.rotation.y = t * 2.5;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;

      cameraRef.current.position.lerp(new THREE.Vector3(0, 0, 10), 0.1);
      cameraRef.current.lookAt(0, 0, 0);
      return;
    }

    if (phase === 'loading' || phase === 'ready') {
      const targetPos = new THREE.Vector3(0, 0, 40);
      const targetLook = new THREE.Vector3(0, 0, 0);

      if (narrative === '02_PROPULSION') {
        targetPos.set(40 * Math.sin(t), 10 * Math.cos(t), 20);
      } else if (narrative === '03_CHAMBER_DRIFT') {
        targetPos.set(-20, 4, 30);
      } else if (narrative === '04_CORE_SYNC') {
        targetPos.set(Math.sin(t * 40) * 0.8, Math.cos(t * 40) * 0.8, 20);
      } else if (narrative === '05_CALIBRATION') {
        targetPos.set(0, 0, 50);
      } else if (narrative === '06_STABILIZED') {
        targetPos.set(0, 0, 12);
      }

      cameraRef.current.position.lerp(targetPos, narrative === '04_CORE_SYNC' ? 0.1 : 0.035);
      cameraRef.current.lookAt(targetLook);

      const isVoid = narrative === '00_INITIATION';
      const isDis = narrative === '05_CALIBRATION';
      const isStab = narrative === '06_STABILIZED';

      const targetScale = isVoid ? 0 : (isDis ? 0.001 : 35);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), isDis ? 0.35 : 0.06);

      if (isStab) {
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.6;
        groupRef.current.rotation.y = t * 2.5;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      } else if (narrative === '04_CORE_SYNC') {
        groupRef.current.rotation.y += Math.sin(t * 25) * 1.2;
        groupRef.current.rotation.x += Math.cos(t * 20) * 1.0;
      } else if (narrative === '02_PROPULSION') {
        groupRef.current.position.x = Math.sin(t * 5) * 15;
        groupRef.current.position.y = Math.cos(t * 4) * 8;
        groupRef.current.rotation.z = Math.sin(t * 5) * 0.5;
        groupRef.current.rotation.y += 0.5;
      } else if (isVoid) {
        groupRef.current.rotation.copy(initialRotation);
      } else {
        groupRef.current.rotation.y = t * 0.4;
      }

      const speed = narrative === '02_PROPULSION' ? 3.5 : (narrative === '03_CHAMBER_DRIFT' ? 1.8 : 0.1);
      if (!isStab && !isDis) {
        groupRef.current.position.z += speed;
        if (groupRef.current.position.z > 100) groupRef.current.position.z = -150;
      } else if (isStab) {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.08);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 40]} fov={40} />
      <color attach="background" args={['#020202']} />
      <hemisphereLight args={['#9dd6ff', '#050505', 0.55]} />
      <directionalLight position={[8, 10, 16]} intensity={2.5} color="#fff1cb" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[-12, 4, 10]} intensity={55} distance={90} color="#62b7ff" />
      <pointLight position={[10, -2, 8]} intensity={42} distance={80} color="#ffbf52" />

      <Suspense fallback={null}>
        {!booted && (
          <>
            <Aurora intensity={narrative === '06_STABILIZED' ? 1.15 : 0.92} />
            <Lasers active={narrative.includes('02') || narrative.includes('03')} />
            <EnemyShips active={narrative.includes('02') || narrative.includes('03')} />
            <CelestialVoid narrative={narrative} progress={progress} />
          </>
        )}

        <group ref={groupRef}>
          <SavantCore3D scale={1} materialType={narrative.includes('04') ? 'obsidian' : 'gold'} emissiveIntensity={narrative.includes('04') ? 5 : 0.3} glow={false} />

          <ContactShadows
            position={[0, -8, 0]}
            opacity={0.48}
            scale={24}
            blur={2.8}
            far={12}
            color="#000000"
          />

          <mesh scale={3.8} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[1.5, 0.04, 16, 128]} />
            {/* @ts-ignore */}
            <blueFlameMaterial ref={flameRef} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
          </mesh>

          {!booted && <LogoFragments active={narrative === '05_CALIBRATION'} />}
        </group>
      </Suspense>

      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          intensity={(narrative === '01_SINGULARITY' ? 10 : narrative === '05_CALIBRATION' ? 16 : narrative === '06_STABILIZED' ? 1.8 : 1.35) * bloomBoost}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.22}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

export default function SavantFlameLogo3D() {
  const { booted, setBooted } = useStore();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'transition'>('loading');
  const [percent, setPercent] = useState(0);
  const [narrative, setNarrative] = useState('00_INITIATION');
  const [initializing, setInitializing] = useState(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const quality = useAdaptiveQuality();

  useEffect(() => {
    if (booted) return;

    const loadingTimeline = gsap.timeline();
    loadingTimeline
      .to({}, {
        duration: 2.0,
        onUpdate: function () {
          setPercent(Math.floor(this.progress() * 35));
        },
        onStart: () => setNarrative('01_SINGULARITY')
      })
      .to({}, {
        duration: 1.8,
        onUpdate: function () {
          setPercent(35 + Math.floor(this.progress() * 25));
        },
        onStart: () => setNarrative('02_PROPULSION')
      })
      .to({}, {
        duration: 1.4,
        onUpdate: function () {
          setPercent(60 + Math.floor(this.progress() * 15));
        },
        onStart: () => setNarrative('03_CHAMBER_DRIFT')
      })
      .to({}, {
        duration: 1.2,
        onUpdate: function () {
          setPercent(75 + Math.floor(this.progress() * 15));
        },
        onStart: () => setNarrative('04_CORE_SYNC')
      })
      .to({}, {
        duration: 0.9,
        onUpdate: function () {
          setPercent(90 + Math.floor(this.progress() * 10));
        },
        onStart: () => setNarrative('05_CALIBRATION'),
        onComplete: () => {
          setPercent(100);
          setNarrative('06_STABILIZED');
          setPhase('ready');
        }
      });

    return () => {
      loadingTimeline.kill();
    };
  }, [booted]);

  useEffect(() => {
    if (!booted) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tlRef.current = tl;
      tl.to({}, { duration: 0.1, onStart: () => setPhase('transition') });
      tl.to({}, { duration: 0.3, onStart: () => setNarrative('06_STABILIZED') });
      tl.to({}, { duration: 0.6, onComplete: () => setPhase('loading') });
    });

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, [booted]);

  const handleInitialize = () => {
    setInitializing(true);
    gsap.to('.preloader-ui', {
      opacity: 0,
      y: 50,
      duration: 1.2,
      ease: 'power4.inOut',
      onComplete: () => {
        setBooted(true);
      }
    });
  };
EOT
