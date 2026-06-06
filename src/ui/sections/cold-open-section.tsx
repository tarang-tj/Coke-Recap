import { hero } from '../../data/portfolio-content';

// Cold Open — game title-screen overlay.
// The 3-D logo is rendered inside the Canvas (act-cold-open.tsx), so this DOM
// layer provides the text identity and the START / scroll prompt only.

export function ColdOpenSection() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      {/* Eyebrow — small caption above the name */}
      <p className="font-body text-[0.55rem] uppercase tracking-[0.6em] text-off-white/50 mb-4">
        Internship Recap
      </p>

      {/* Person name — primary identity on this screen */}
      <h1
        className="font-display font-black text-4xl md:text-6xl text-off-white leading-tight tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
        style={{ wordBreak: 'break-word' }}
      >
        {hero.name}
      </h1>

      {/* Role + org — one compact line */}
      <p className="mt-3 font-body text-[0.6rem] uppercase tracking-[0.4em] text-off-white/60">
        {hero.role} &middot; {hero.org}
      </p>

      {/* Game-style START / scroll prompt */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <StartPrompt />
      </div>
    </section>
  );
}

// Pill CTA that pulses like a "Press Start" arcade prompt.
// Uses a CSS keyframe animation defined inline so no Tailwind config change is needed.
function StartPrompt() {
  return (
    <>
      <style>{`
        @keyframes coke-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,254,246,0.0); }
          50%       { opacity: 0.55; box-shadow: 0 0 18px 4px rgba(255,254,246,0.18); }
        }
        .coke-start-pill {
          animation: coke-pulse 1.8s ease-in-out infinite;
        }
      `}</style>

      <button
        className="coke-start-pill rounded-full border border-off-white/60 px-9 py-3 font-body text-[0.65rem] uppercase tracking-[0.55em] text-off-white drop-shadow-[0_0_10px_rgba(255,254,246,0.25)] cursor-default select-none"
        aria-label="Scroll to enter"
        tabIndex={-1}
      >
        Scroll to Enter&ensp;▾
      </button>
    </>
  );
}
