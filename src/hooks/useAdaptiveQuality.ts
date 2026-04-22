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
