import { useEffect, useState } from 'react';

// Bottle-shaped loader that fills with Coke red as assets parse, then
// fades away. Used outside the <Canvas> so it's always visible during
// first paint.
//
// We use a faux 2.5s timed progress curve for the MVP — a real
// drei <Loader> integration with useProgress can replace this later.

export function SceneLoader() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        // hold a beat then fade
        setTimeout(() => setHidden(true), 220);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-coke-black transition-opacity duration-500 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Bottle silhouette built from a clipped div. */}
        <div className="relative h-40 w-16 overflow-hidden rounded-b-[28px] rounded-t-[12px]" style={{ clipPath: 'polygon(35% 0, 65% 0, 65% 12%, 80% 22%, 70% 38%, 75% 60%, 70% 80%, 75% 96%, 50% 100%, 25% 96%, 30% 80%, 25% 60%, 30% 38%, 20% 22%, 35% 12%)' }}>
          <div className="absolute inset-0 bg-coke-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-coke-red transition-[height] duration-100"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-cream/40 font-body">
          Pouring
        </p>
      </div>
    </div>
  );
}
