import { hero } from '../../data/portfolio-content';

// Cold Open — game title-screen overlay.
// The 3-D logo is rendered inside the Canvas (act-cold-open.tsx), so this DOM
// layer provides the text identity and the START / scroll prompt only.

export function ColdOpenSection() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-between px-6 py-[12vh] text-center">
      {/* Top block — eyebrow + name. The 3-D Coca-Cola logo (in-canvas) is the
          hero in the vertical center, so DOM identity sits above it. */}
      <div className="flex flex-col items-center">
        <p className="font-body text-[0.55rem] uppercase tracking-[0.6em] text-off-white/55 mb-3">
          Internship Recap
        </p>
        <h1
          className="font-display font-bold text-3xl md:text-5xl text-off-white leading-tight tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.7)]"
          style={{ wordBreak: 'break-word' }}
        >
          {hero.name}
        </h1>
      </div>

      {/* Bottom block — role/org. The entry CTA lives in the StartGate; once
          inside, the HUD progress bar conveys scrollability. */}
      <div className="flex flex-col items-center">
        <p className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-off-white/65">
          {hero.role} &middot; {hero.org}
        </p>
      </div>
    </section>
  );
}
