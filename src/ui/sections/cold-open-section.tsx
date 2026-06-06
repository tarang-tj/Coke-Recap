import { hero } from '../../data/portfolio-content';

// Hero section — Cold Open act. Typography dominates.
// No scroll listening here; Section wrapper handles opacity/translate.

export function ColdOpenSection() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      {/* Eyebrow */}
      <p className="font-body text-[0.65rem] uppercase tracking-[0.35em] text-caramel mb-6 md:mb-8">
        {hero.role}
      </p>

      {/* Massive name */}
      <h1
        className="font-display font-black text-7xl md:text-9xl text-cream leading-[0.92] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]"
        style={{ wordBreak: 'break-word' }}
      >
        {hero.name}
      </h1>

      {/* Org — italic, subdued */}
      <p className="mt-5 font-display italic text-2xl md:text-3xl text-cream/60">
        {hero.org}
      </p>

      {/* Tagline */}
      <p className="mt-4 font-body text-sm md:text-base italic text-cream/40 max-w-sm md:max-w-md leading-relaxed">
        {hero.tagline}
      </p>

      {/* Scroll cue */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3 text-cream/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 animate-bounce"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="font-body text-[0.6rem] uppercase tracking-[0.4em]">Scroll</span>
      </div>
    </section>
  );
}
