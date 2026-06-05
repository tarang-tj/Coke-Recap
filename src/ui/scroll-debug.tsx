import { useEffect, useRef } from 'react';
import { useScrollRef } from '../scene/scroll-context';
import { ACT_ORDER, ACT_WINDOWS } from '../data/act-windows';

// Tiny diagnostic overlay (bottom-left) showing global scroll T + active act.
// Hidden in production via VITE_SHOW_DEBUG flag check at build time.
// Reads scrollRef via rAF — never re-renders.

export function ScrollDebug() {
  const ref = useScrollRef();
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      const t = ref.current;
      const active = ACT_ORDER.find((id) => {
        const [s, e] = ACT_WINDOWS[id];
        return t >= s && t <= e;
      }) ?? '\u2014';
      if (elRef.current) {
        elRef.current.textContent = `t=${t.toFixed(3)} \u2022 ${active}`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [ref]);

  return (
    <div
      ref={elRef}
      className="fixed bottom-3 left-3 z-50 px-2 py-1 rounded bg-black/60 text-xs font-mono text-cream/80 pointer-events-none"
    >
      t=0.000
    </div>
  );
}
