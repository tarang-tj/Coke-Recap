import { agent } from '../../data/portfolio-content';

// Manifesto layout — massive tagline, body paragraphs, 3-pillar row.

const PILLAR_NUMERALS = ['I', 'II', 'III'] as const;

export function AgentSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-10 text-center">
      {/* Eyebrow */}
      <span className="font-body text-[0.65rem] uppercase tracking-[0.35em] text-caramel">
        03 / Agent
      </span>

      {/* Massive display tagline */}
      <h2 className="font-display font-black text-6xl md:text-8xl text-cream leading-[0.95] tracking-tight max-w-4xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
        {agent.tagline}
      </h2>

      {/* Body paragraphs */}
      <div className="flex flex-col gap-4 max-w-2xl">
        {agent.body.map((para, i) => (
          <p key={i} className="font-body text-lg text-cream/70 leading-relaxed">
            {para}
          </p>
        ))}
      </div>

      {/* Pillar row */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-0 mt-6 border-t border-cream/10">
        {agent.pillars.map((pillar, i) => (
          <div
            key={pillar.name}
            className="flex flex-col items-center gap-2 px-6 py-8 border-b md:border-b-0 md:border-r border-cream/10 last:border-0"
          >
            {/* Roman numeral prefix */}
            <span className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-caramel mb-1">
              {PILLAR_NUMERALS[i]}
            </span>
            <span className="font-display text-xl md:text-2xl text-cream font-medium leading-snug">
              {pillar.name}
            </span>
            <span className="font-body text-sm text-cream/60 leading-relaxed max-w-[16ch]">
              {pillar.desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
