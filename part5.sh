#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

mkdir -p 'src/components'
cat >> 'src/components/SavantFlameLogo3D.tsx' <<'EOT'

  const isTransitioning = initializing || booted;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      style={{ pointerEvents: booted ? 'none' : 'auto' }}
      className={`fixed inset-0 z-[10000] overflow-hidden transition-colors duration-1000 ${booted ? 'bg-transparent' : 'bg-obsidian'}`}
    >
      <Canvas
        shadows
        dpr={quality.devicePixelRatioRange}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality.isMobile ? 1.0 : 1.08;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          (gl as THREE.WebGLRenderer & { useLegacyLights?: boolean }).useLegacyLights = false;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <PreloaderScene
            phase={phase}
            narrative={narrative}
            progress={percent}
            initialized={isTransitioning}
            booted={booted}
            bloomBoost={quality.bloomIntensity}
            isMobile={quality.isMobile}
          />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {!isTransitioning && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-1/2 left-16 -translate-y-1/2 flex flex-col gap-12 z-50 pointer-events-none"
          >
            <SavantNarrative label={SITE_CONFIG.MESSAGES.PROCESS_LOG} value={narrative} />
            <div className="w-px h-48 bg-gradient-to-b from-gold/40 via-gold/10 to-transparent self-start ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      {!isTransitioning && (
        <div className="absolute inset-0 preloader-ui pointer-events-none flex flex-col justify-between p-6 md:p-16">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-4">
              <span className="text-[9px] md:text-[11px] font-mono text-gold tracking-[0.4em] md:tracking-[0.6em] font-black whitespace-nowrap">
                {SITE_CONFIG.MESSAGES.BOOT_SEQUENCE}
              </span>
              <div className="flex gap-1 md:gap-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity }}
                    className="w-8 md:w-12 h-[1px] bg-white/20"
                  />
                ))}
              </div>
            </div>

            <div className="font-mono text-[7px] md:text-[9px] text-white/10 tracking-[0.3em] md:tracking-[0.4em] text-right leading-relaxed border-r border-white/5 pr-4 md:pr-6 whitespace-nowrap overflow-hidden">
              <div className="flex flex-col gap-1 md:gap-1.5">
                <span className="truncate">{SITE_CONFIG.IDENTITIES.NAME} // {SITE_CONFIG.IDENTITIES.ARCHITECTURE}</span>
                <span className={percent > 90 ? 'text-gold' : ''}>{SITE_CONFIG.MESSAGES.LATTICE.INTEGRITY} // {percent > 90 ? 'optimal' : 'calibrating'}</span>
                <span className={percent > 50 ? 'text-gold' : ''}>{SITE_CONFIG.MESSAGES.LATTICE.UPLINK} // {percent > 50 ? 'stable' : 'establishing'}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-12 pointer-events-none w-full">
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-96 -top-48">
              <motion.div
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                className="w-full h-[1px] bg-gold/10 shadow-[0_0_25px_rgba(230,192,59,0.2)]"
              />
            </div>

            <AnimatePresence mode="wait">
              {phase === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="font-mono text-7xl font-black text-white/[0.03] tracking-[0.2em] relative">
                    <span className="relative z-10">{percent.toString().padStart(3, '0')}</span>
                    <div className="absolute inset-0 flex items-center justify-center -z-10 blur-2xl opacity-20 text-gold">
                      {percent.toString().padStart(3, '0')}
                    </div>
                  </div>
                  <div className="w-80 h-[1px] bg-white/5 relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gold shadow-[0_0_20px_rgba(230,192,59,0.5)]"
                      style={{ width: `${percent}%` }}
                    />
                    <motion.div
                      animate={{ left: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                  </div>
                  <div className="text-[10px] font-mono text-white/40 tracking-[0.8em] font-bold">
                    {SITE_CONFIG.MESSAGES.INITIALIZING}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="flex flex-col items-center gap-10 pointer-events-auto"
                >
                  <SavantButton
                    onClick={handleInitialize}
                    variant="primary"
                    size="lg"
                    className="pr-20 hover:pr-24 border border-gold/30"
                  >
                    initialize_system
                  </SavantButton>
                  <div className="font-mono text-[9px] text-white/25 tracking-[0.4em] text-center max-w-xs leading-loose">
                    uplink ready // click to establish core sync
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-gold animate-ping absolute inset-0" />
                  <div className="w-2 h-2 rounded-full bg-gold relative" />
                </div>
                <span className="font-mono text-[10px] text-white/50 tracking-[0.3em] font-bold">
                  {SITE_CONFIG.IDENTITIES.CORE_ACTIVE}
                </span>
              </div>
              <div className="h-[1px] w-64 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="text-[9px] font-mono text-white/5 tracking-[0.4em] text-right">
              {SITE_CONFIG.IDENTITIES.LEGAL}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {phase === 'transition' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.4, 1], ease: 'easeInOut' }}
            className="fixed inset-0 z-[10001] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
EOT

cat > 'src/components/SiteAtmosphere.tsx' <<'EOT'
import React from 'react';
import { motion } from 'motion/react';

export default function SiteAtmosphere() {
  return (
    <div className="fixed inset-0 z-[50] pointer-events-none overflow-hidden">
      <motion.div
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 w-full h-[1px] bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_16%,rgba(3,3,3,0.82)_100%)]" />
      <div className="absolute inset-0 opacity-10 neural-lattice-overlay" />
      <div className="absolute inset-0 atmosphere-prismatic" />

      <motion.div
        animate={{ opacity: [0, 0.05, 0, 0.02, 0] }}
        transition={{ duration: 10, repeat: Infinity, times: [0, 0.1, 0.12, 0.5, 1] }}
        className="absolute inset-0 bg-neon-pink/5 mix-blend-overlay"
      />
    </div>
  );
}
EOT

mkdir -p 'src/hooks'
cat > 'src/hooks/useAdaptiveQuality.ts' <<'EOT'
import { useEffect, useMemo, useState } from 'react';

export interface AdaptiveQuality {
  isMobile: boolean;
  prefersReducedMotion: boolean;
  devicePixelRatioRange: [number, number];
  postprocessingEnabled: boolean;
  bloomIntensity: number;
  particleBudget: number;
  shadowResolution: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useAdaptiveQuality(): AdaptiveQuality {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return useMemo(() => {
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 900;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const constrained = isMobile || cores <= 4 || memory <= 4 || prefersReducedMotion;

    return {
      isMobile,
      prefersReducedMotion,
      devicePixelRatioRange: constrained ? [1, Math.min(1.35, dpr)] : [1, dpr],
      postprocessingEnabled: !prefersReducedMotion,
      bloomIntensity: constrained ? 0.8 : 1.2,
      particleBudget: constrained ? 0.55 : 1,
      shadowResolution: constrained ? 1024 : 2048,
    };
  }, [prefersReducedMotion]);
}
EOT

mkdir -p 'src'
cat > 'src/index.css' <<'EOT'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&family=Outfit:wght@100;400;700;900&family=JetBrains+Mono:wght@100;400;700&family=Major+Mono+Display&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
  --font-accent: "Major Mono Display", monospace;
  --font-mono: "JetBrains Mono", monospace;

  --color-obsidian: #030303;
  --color-obsidian-light: #0a0a0a;
  --color-gunmetal: #121212;
  --color-gunmetal-light: #1a1a1a;
  --color-neon-pink: #ff4068;
  --color-gold: #e6c03b;
  --color-emerald: #4ade80;
  --color-ethereal: #4A90E2;
}

@layer base {
  html,
  body {
    overscroll-behavior: none;
    max-width: 100vw;
  }

  body {
    @apply bg-obsidian text-white font-sans antialiased overflow-x-hidden lowercase;
    cursor: none;
  }

  ::selection {
    @apply bg-gold/30 text-white;
  }
}

@layer utilities {
  .font-display { font-family: var(--font-display); }
  .title-serif { @apply font-display font-normal; }
  .text-massive { font-size: clamp(3rem, 12vw, 15rem); line-height: 0.8; letter-spacing: -0.04em; }
  .text-huge { font-size: clamp(2.5rem, 8vw, 8rem); line-height: 0.9; letter-spacing: -0.03em; }
  .savant-grid { @apply grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8; }
  .savant-stack { @apply flex flex-col gap-8 md:gap-16; }
  .savant-page-container { @apply min-h-screen pt-40 pb-32 px-6 md:px-12 max-w-[100vw] overflow-hidden; }
  .glass-panel { @apply bg-white/[0.01] backdrop-blur-3xl border border-white/[0.03]; }
  .text-glow-gold { text-shadow: 0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.1); }
  .text-glow-neon { text-shadow: 0 0 20px rgba(255, 0, 60, 0.3), 0 0 40px rgba(255, 0, 60, 0.1); }
  .bg-obsidian-dark { background-color: #050505; }

  .noise-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .scanlines-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 9998;
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
    background-size: 100% 4px; opacity: 0.3;
  }

  .neural-lattice-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 9997;
    background-image:
      radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.03) 0%, transparent 60%),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
  }

  .vignette-heavy {
    position: fixed; inset: 0; pointer-events: none; z-index: 9996;
    background: radial-gradient(circle at center, transparent 30%, rgba(3, 3, 3, 0.9) 100%);
  }

  .anamorphic-flare {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150vw; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.5), rgba(212, 175, 55, 0.2), transparent);
    filter: blur(4px); pointer-events: none; z-index: 9995; opacity: 1; animation: flare-pulse 8s infinite alternate;
  }

  .grid-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9994; opacity: 0.15; }
  .grid-line { position: absolute; background: rgba(255, 255, 255, 0.1); }
  .grid-line.horizontal { width: 100%; height: 1px; }
  .grid-line.vertical { height: 100%; width: 1px; }

  .corner-accent {
    position: fixed; width: 20px; height: 20px; border: 1px solid rgba(255, 255, 255, 0.2);
    pointer-events: none; z-index: 9999; opacity: 1;
  }

  .corner-accent.tl { top: 2rem; left: 2rem; border-right: none; border-bottom: none; }
  .corner-accent.tr { top: 2rem; right: 2rem; border-left: none; border-bottom: none; }
  .corner-accent.bl { bottom: 2rem; left: 2rem; border-right: none; border-top: none; }
  .corner-accent.br { bottom: 2rem; right: 2rem; border-left: none; border-top: none; }

  .telemetry-hud {
    position: fixed; font-family: var(--font-mono); font-size: 9px; color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.2em; pointer-events: none; z-index: 9999; opacity: 1;
  }

  .telemetry-hud.left { bottom: 2rem; left: 4rem; transform: rotate(-90deg); transform-origin: left bottom; }
  .telemetry-hud.right { top: 2rem; right: 4rem; transform: rotate(90deg); transform-origin: right top; }

  .atmosphere-prismatic {
    background:
      radial-gradient(circle at 18% 22%, rgba(230, 192, 59, 0.08), transparent 28%),
      radial-gradient(circle at 78% 18%, rgba(98, 183, 255, 0.08), transparent 26%),
      radial-gradient(circle at 50% 72%, rgba(180, 82, 255, 0.06), transparent 34%);
    mix-blend-mode: screen; filter: blur(32px); opacity: 0.8;
  }

  .savant-loader {
    width: 40px; height: 40px; border: 1px solid rgba(255, 255, 255, 0.1);
    border-top-color: #e6c03b; border-radius: 50%; animation: spin 1s linear infinite;
  }

  @keyframes scanline {
    from { transform: translateY(-100%); }
    to { transform: translateY(100%); }
  }

  .animate-scanline { animation: scanline 8s linear infinite; }
}

@keyframes flare-pulse {
  0% { transform: translate(-50%, -50%) scaleX(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scaleX(1.2); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scaleX(0.9); opacity: 0.4; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
EOT

echo "done"
