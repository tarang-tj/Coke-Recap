import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Historical garnish for the longest dead moment of the visit — slow-4G
// mobile spends 10 s+ here. Cycles unless reduced motion is on.
const TIDBITS = [
  'first served · jacobs’ pharmacy · may 8, 1886',
  'sold for 5¢ from 1886 to 1959',
  'invented by john s. pemberton · atlanta',
];

// Bottle-shaped loader that fills with Coke red as the real assets parse, then
// fades away. Rendered outside the <Canvas> so it covers first paint.
//
// Progress is driven by drei's loading store (useProgress) — the honest count
// of GLTF/texture bytes resolving via the three.js LoadingManager — not a
// faux timer, so the fill tracks the real multi-MB download.

export function SceneLoader() {
  const { active, progress } = useProgress(); // progress is 0..100
  const [hidden, setHidden] = useState(false);
  const [display, setDisplay] = useState(0);
  const [tidbit, setTidbit] = useState(0);
  const everActive = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || hidden) return;
    const id = setInterval(() => setTidbit((t) => (t + 1) % TIDBITS.length), 2800);
    return () => clearInterval(id);
  }, [reduced, hidden]);

  // Monotonic display value — only ever climbs, so the pour never visibly snaps
  // backward when a new asset group registers and dilutes the percentage.
  useEffect(() => {
    setDisplay((d) => Math.max(d, progress));
  }, [progress]);

  // Remember that loading actually started (distinguishes "still loading" from
  // "warm cache, nothing to load").
  useEffect(() => {
    if (active) everActive.current = true;
  }, [active]);

  // Dismiss when loading finishes (saw activity, now idle) or when nothing ever
  // loaded (warm cache) after a short grace beat.
  useEffect(() => {
    if (active) return;
    const wait = everActive.current ? 450 : 1200;
    const t = setTimeout(() => setHidden(true), wait);
    return () => clearTimeout(t);
  }, [active]);

  // Failsafe: never trap the visitor behind the loader if the store stalls.
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 12000);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.round(everActive.current ? display : Math.max(display, 8));

  return (
    <div
      aria-hidden={hidden}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label="Loading the 3-D scene"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-coke-black transition-opacity duration-500 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Bottle silhouette built from a clipped div. */}
        <div className="relative h-40 w-16 overflow-hidden rounded-b-[28px] rounded-t-[12px]" style={{ clipPath: 'polygon(35% 0, 65% 0, 65% 12%, 80% 22%, 70% 38%, 75% 60%, 70% 80%, 75% 96%, 50% 100%, 25% 96%, 30% 80%, 25% 60%, 30% 38%, 20% 22%, 35% 12%)' }}>
          <div className="absolute inset-0 bg-coke-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-coke-red transition-[height] duration-200 ease-out"
            style={{ height: `${pct}%` }}
          />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-cream/40 font-body tabular-nums">
          Pouring&nbsp;·&nbsp;{pct}%
        </p>
        {/* keyed so each tidbit replays the entrance fade; fixed-height slot
            so a two-line wrap on narrow phones doesn't bounce the bottle
            every 2.8 s (the flex column is centered) */}
        <p
          key={tidbit}
          className="coke-fade-in h-10 px-6 text-center font-body text-[0.5rem] uppercase tracking-[0.45em] text-cream/25 select-none"
        >
          {TIDBITS[tidbit]}
        </p>
      </div>
    </div>
  );
}
