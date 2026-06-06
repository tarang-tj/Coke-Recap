import { useEffect } from 'react';
import Lenis from 'lenis';

// Initializes Lenis smooth scroll on mount. Drives a single rAF loop.
// Lenis still updates window.scrollY so useScrollProgressRef keeps working.
// Honors prefers-reduced-motion by disabling smooth scrolling.

const easing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function useLenisScroll(): void {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: 1.1,
      easing,
      wheelMultiplier: 0.9,
      smoothWheel: !reducedMotion,
    });

    let rafId: number;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
