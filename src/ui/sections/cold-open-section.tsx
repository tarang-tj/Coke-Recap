import { hero } from '../../data/portfolio-content';

// Hero section overlaid on the Cold Open act (scroll progress 0 – 0.18).
// Pure CSS — no scroll listening here; the parent section-overlay handles
// opacity/pointer-events via scroll position.

export function ColdOpenSection() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      {/* Name */}
      <h1 className="font-display text-5xl tracking-tight text-cream md:text-7xl">
        {hero.name}
      </h1>

      {/* Role + org */}
      <p className="mt-4 font-body text-base text-cream/70 md:text-lg">
        {hero.role}
        <span className="mx-2 opacity-50">•</span>
        {hero.org}
      </p>

      {/* Tagline */}
      <p className="mt-3 font-body text-sm italic text-cream/50 md:text-base">
        {hero.tagline}
      </p>

      {/* Scroll hint */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 text-cream/40">
        <span className="font-body text-xs uppercase tracking-widest">Scroll</span>
        {/* Animated chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 animate-bounce"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
