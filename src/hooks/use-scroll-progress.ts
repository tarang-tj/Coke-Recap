import { useEffect, useRef } from 'react';

// Returns a stable ref whose .current is the normalized scroll progress 0..1.
// Reading the ref inside useFrame avoids React re-renders on scroll.
//
// Why a ref and not state: React state updates on every scroll tick would
// cause hundreds of re-renders per second. The 3D scene reads scroll inside
// useFrame, which is already a 60fps callback — a mutable ref is the right
// channel.

export function useScrollProgressRef() {
  const ref = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      ref.current = p;
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return ref;
}
