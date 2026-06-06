import { useState, useEffect } from 'react';
import { Logo } from './brand/logo';
import { ACT_WINDOWS, ACT_ORDER, type ActId } from '../data/act-windows';

// Human-readable labels for each act
const ACT_NAMES: Record<ActId, string> = {
  'cold-open': 'Title',
  role: 'The Role',
  tools: 'The Stack',
  agent: 'The Agent',
  bottle: 'The Bottle',
};

function calcScrollProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

// Returns the 0-based index of the latest act whose start has been reached.
function getChapterIndex(progress: number): number {
  let idx = 0;
  for (let i = 0; i < ACT_ORDER.length; i++) {
    if (progress >= ACT_WINDOWS[ACT_ORDER[i]][0]) idx = i;
  }
  return idx;
}

// Throttled scroll state — same rAF + 100 ms pattern as use-section-progress.ts
function useHudScrollState() {
  const [progress, setProgress] = useState(calcScrollProgress);

  useEffect(() => {
    let rafId: number | null = null;
    let lastUpdate = 0;
    const THROTTLE_MS = 100;

    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate >= THROTTLE_MS) {
        lastUpdate = now;
        setProgress(calcScrollProgress());
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return progress;
}

// Game-style HUD overlay — pointer-events-none so it never blocks scroll or clicks.
// Contains: top-edge progress bar, top-left brand logo, top-right chapter indicator.
export function Hud() {
  const progress = useHudScrollState();
  const chapterIdx = getChapterIndex(progress);
  const actId = ACT_ORDER[chapterIdx];
  const chapterName = ACT_NAMES[actId];
  const chapterNum = String(chapterIdx + 1).padStart(2, '0');
  const totalChapters = String(ACT_ORDER.length).padStart(2, '0');

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none"
      aria-hidden="true"
    >
      {/* Thin scroll-progress bar pinned to the very top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
        <div
          className="h-full bg-off-white"
          style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
        />
      </div>

      {/* Top-left: Coca-Cola logo */}
      <div className="absolute top-4 left-4 md:top-5 md:left-5">
        <Logo variant="white" className="w-28 md:w-36" />
      </div>

      {/* Top-right: chapter / level indicator */}
      <div className="absolute top-4 right-4 md:top-5 md:right-5 text-right leading-tight">
        <p
          className="font-body uppercase tracking-widest text-[10px] text-off-white/50"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          CH {chapterNum} / {totalChapters}
        </p>
        <p
          className="font-body uppercase tracking-widest text-xs text-off-white mt-0.5"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
        >
          {chapterName}
        </p>
      </div>
    </div>
  );
}
