import { useState, useEffect, type RefObject } from 'react';

// Returns a reactive 0..1 progress for a section element.
// 0 = section bottom just entered viewport bottom
// 0.5 = section center at viewport center
// 1 = section top just left viewport top
//
// Updates are throttled via requestAnimationFrame and limited to ~10/sec
// to keep re-render cost minimal across 5 concurrent sections.

function calcProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  // Distance from viewport bottom to section bottom (entry point) = vh - rect.bottom
  // We map: rect.bottom == vh → 0, rect.top == 0 → 1
  const total = rect.height + vh;
  const traveled = vh - rect.top;
  return Math.min(1, Math.max(0, traveled / total));
}

export function useSectionProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let lastUpdate = 0;
    const THROTTLE_MS = 100; // ~10fps updates

    const update = () => {
      const now = performance.now();
      if (now - lastUpdate >= THROTTLE_MS) {
        lastUpdate = now;
        setProgress(calcProgress(el));
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    // Initial calc
    setProgress(calcProgress(el));

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ref]);

  return progress;
}
