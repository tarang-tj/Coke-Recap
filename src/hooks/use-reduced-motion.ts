import { useEffect, useState } from 'react';

// Honor system-level reduced-motion preference. Used by:
//   - camera-rig.tsx: hard-cuts between act keyframes instead of dollying
//   - fluid-environment.tsx: freezes bubble rise + slows curl noise
//   - acts/*: dampens or skips secondary motion
//
// Re-renders are fine here: this value rarely changes.

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
