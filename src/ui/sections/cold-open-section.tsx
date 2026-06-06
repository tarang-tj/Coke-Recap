import { hero } from '../../data/portfolio-content';
import { Wordmark } from '../brand/wordmark';

// Hero section — Cold Open act.
// Wordmark is the dominant headline; name + role are secondary identity.

export function ColdOpenSection() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      {/* Coca-Cola wordmark — largest element on screen */}
      <Wordmark as="h1" className="text-7xl md:text-9xl leading-none" />

      {/* Thin rule separates brand from person */}
      <div className="mt-6 mb-5 w-16 border-t border-off-white/40" aria-hidden="true" />

      {/* Context label */}
      <p className="font-body text-[0.6rem] uppercase tracking-[0.5em] text-off-white/60 mb-2">
        Internship Recap
      </p>

      {/* Person name — secondary identity */}
      <h2
        className="font-display font-black text-3xl md:text-5xl text-off-white leading-tight tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
        style={{ wordBreak: 'break-word' }}
      >
        {hero.name}
      </h2>

      {/* Role */}
      <p className="mt-2 font-body text-[0.65rem] uppercase tracking-[0.35em] text-off-white/70">
        {hero.role}
      </p>

      {/* Org */}
      <p className="mt-3 font-display italic text-lg md:text-xl text-off-white/60">
        {hero.org}
      </p>

      {/* Tagline */}
      <p className="mt-3 font-body text-sm md:text-base italic text-off-white/50 max-w-sm md:max-w-md leading-relaxed">
        {hero.tagline}
      </p>

      {/* Scroll cue */}
      <div className="absolute bottom-10 flex flex-col items-center gap-3 text-off-white/40">
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
