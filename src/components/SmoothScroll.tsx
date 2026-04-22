import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

type SmoothScrollProps = {
  children: React.ReactNode;
};

const SNAP_SELECTOR = '[data-snap-section="true"]';

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const isSnappingRef = useRef(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.25,
      smoothWheel: true,
      syncTouch: false,
      infinite: false,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };

    rafRef.current = requestAnimationFrame(raf);

    const getSnapTarget = () => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>(SNAP_SELECTOR)
      );

      if (!sections.length) return null;

      const viewportAnchor = window.innerHeight * 0.18;
      let closest: HTMLElement | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - viewportAnchor);

        if (distance < closestDistance) {
          closestDistance = distance;
          closest = section;
        }
      }

      return closest;
    };

    const snapToNearest = () => {
      if (!lenisRef.current || isSnappingRef.current) return;

      const target = getSnapTarget();
      if (!target) return;

      const targetTop =
        window.scrollY + target.getBoundingClientRect().top - 24;

      const delta = Math.abs(window.scrollY - targetTop);
      if (delta < 18) return;

      isSnappingRef.current = true;

      lenisRef.current.scrollTo(targetTop, {
        duration: 1.05,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        lock: true,
        onComplete: () => {
          isSnappingRef.current = false;
        },
      });
    };

    const scheduleSnap = () => {
      if (snapTimerRef.current) {
        window.clearTimeout(snapTimerRef.current);
      }

      snapTimerRef.current = window.setTimeout(() => {
        snapToNearest();
      }, 140);
    };

    const onScroll = () => {
      if (isSnappingRef.current) return;
      scheduleSnap();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);

      if (snapTimerRef.current) {
        window.clearTimeout(snapTimerRef.current);
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;