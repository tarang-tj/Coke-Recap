import { useEffect } from 'react';
import { useRecap } from '../../scene/recap/recap-context';
import { hero, role } from '../../data/portfolio-content';

// DOM half of the recap. Fades in once the dispensed bottle reaches its hero
// pose (phase === 'reveal'): the contour bottle floats on the right of the
// frame while the internship story reads over a left scrim. ESC / close resets
// the whole sequence back to the clickable machine.

export function RecapPanel() {
  const { phase, reset } = useRecap();
  const open = phase === 'reveal';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, reset]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Left readability scrim — bottle shows through on the right */}
      <div
        className="coke-fade-in absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(18,3,5,0.95) 0%, rgba(18,3,5,0.9) 32%, rgba(18,3,5,0.45) 54%, rgba(18,3,5,0) 70%)',
        }}
      />

      <div className="coke-fade-in absolute inset-y-0 left-0 flex items-center">
        <div className="w-[min(92vw,36rem)] px-8 md:px-16">
          <p className="mb-4 flex items-center gap-3 font-body text-[0.7rem] uppercase tracking-[0.4em] text-off-white">
            <span className="inline-flex h-7 items-center justify-center rounded-full bg-coke-red px-3 text-[0.6rem] font-semibold text-off-white">
              Recap
            </span>
            Freshly dispensed
          </p>

          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight text-off-white">
            {hero.role}
          </h2>
          <p className="mt-1 font-body text-sm uppercase tracking-[0.3em] text-coke-red">
            {hero.org}
          </p>

          <div className="mt-6 space-y-4">
            {role.body.map((para) => (
              <p key={para} className="font-body text-base leading-relaxed text-off-white/85">
                {para}
              </p>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {role.focusAreas.map((area) => (
              <li
                key={area}
                className="rounded-full border border-off-white/25 bg-coke-black/40 px-3 py-1.5 font-body text-[0.6rem] uppercase tracking-[0.18em] text-off-white/75"
              >
                {area}
              </li>
            ))}
          </ul>

          <button
            onClick={reset}
            className="pointer-events-auto mt-9 rounded-full border border-off-white/30 bg-coke-black/40 px-5 py-2.5 font-body text-[0.6rem] uppercase tracking-[0.25em] text-off-white/80 transition-colors hover:border-off-white/60 hover:text-off-white"
          >
            ◂ Back to the machine
          </button>
        </div>
      </div>
    </div>
  );
}
