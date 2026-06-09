import { useEffect, useRef, useState } from 'react';
import { useExperience } from '../scene/experience-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { hero } from '../data/portfolio-content';

// Full-screen intro gate. The 3-D world renders behind the translucent scrim.
// Dismissible by: button click, Enter/Space keydown, or wheel/touchmove.
// Fades out on start then unmounts after the transition completes.
// Scroll-locks the page while active so Lenis/window.scrollY stays at 0.

export function StartGate() {
  const { started, start } = useExperience();
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unmount after fade completes (skip delay for reduced motion).
  useEffect(() => {
    if (!started) return;
    const delay = reduced ? 0 : 600;
    timerRef.current = setTimeout(() => setGone(true), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [started, reduced]);

  // Lock page scroll so scrollRef stays 0 until the experience begins.
  useEffect(() => {
    if (started) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [started]);

  // Keyboard, wheel, and touch listeners — removed once started.
  useEffect(() => {
    if (started) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        start();
      }
    };
    const onWheel = () => start();
    const onTouch = () => start();

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [started, start]);

  if (gone) return null;

  return (
    <>
      <style>{`
        @keyframes gate-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,254,246,0.0); }
          50%       { opacity: 0.55; box-shadow: 0 0 28px 8px rgba(255,254,246,0.22); }
        }
        .gate-press-start {
          animation: gate-pulse 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .gate-press-start { animation: none; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-[20vh]"
        style={{
          // Vertical scrim — light up top so the diorama tease shows through,
          // heavy at the bottom where the name + PRESS START sit (they were
          // unreadable straight over the cream pharmacy facade).
          background: 'linear-gradient(180deg, rgba(18,3,5,0.30) 0%, rgba(18,3,5,0.46) 55%, rgba(18,3,5,0.90) 100%)',
          opacity: started ? 0 : 1,
          pointerEvents: started ? 'none' : 'auto',
          transition: reduced ? 'none' : 'opacity 0.5s ease',
        }}
        aria-hidden={started}
        role="dialog"
        aria-modal="true"
        aria-label="Experience start gate"
      >
        {/* Who + what — the gate is the first frame a visitor sees, so it
            carries the name and role instead of being an anonymous black
            screen with a lone button. */}
        <div className="mb-12 text-center px-6">
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight text-off-white">
            {hero.name}
          </h1>
          <p className="mt-3 font-body text-[0.62rem] md:text-[0.7rem] uppercase tracking-[0.4em] text-off-white/80">
            {hero.role} · {hero.org}
          </p>
        </div>

        {/* PRESS START — arcade-pill CTA (sits below the centered 3-D logo) */}
        <button
          onClick={start}
          className={[
            reduced ? '' : 'gate-press-start',
            'rounded-full border-2 border-off-white/70 px-12 py-4',
            'font-body text-sm uppercase tracking-[0.65em] text-off-white',
            'drop-shadow-[0_0_16px_rgba(255,254,246,0.35)]',
            'hover:border-off-white hover:text-white transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-off-white/60',
          ].join(' ')}
          aria-label="Press Start to enter the experience"
        >
          Press&ensp;Start
        </button>

        {/* Hint line */}
        <p className="mt-10 font-body text-[0.48rem] uppercase tracking-[0.5em] text-off-white/30 select-none">
          click&ensp;•&ensp;or press enter&ensp;•&ensp;or scroll
        </p>

        {/* Historical tidbit — rewards attention, fades with the gate */}
        <p className="mt-4 font-body text-[0.42rem] uppercase tracking-[0.45em] text-off-white/25 select-none">
          1886&ensp;•&ensp;atlanta&ensp;•&ensp;invented by john&nbsp;s. pemberton
        </p>

        {/* Music attribution (CC BY 3.0 requires credit) */}
        <p className="mt-6 font-body text-[0.4rem] uppercase tracking-[0.4em] text-off-white/20 select-none">
          music — “fig leaf times two” · kevin macleod · incompetech.com · cc&nbsp;by&nbsp;3.0
        </p>
      </div>
    </>
  );
}
