import { agent } from '../../data/portfolio-content';

// Center-aligned manifesto layout for the Agent act.
// Eyebrow → display tagline → body paragraphs → 3-column pillar row.

export function AgentSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-10 text-center">
      {/* Eyebrow */}
      <span className="text-caramel text-xs uppercase tracking-widest font-body font-semibold">
        {agent.heading}
      </span>

      {/* Display tagline */}
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream leading-tight max-w-3xl">
        {agent.tagline}
      </h2>

      {/* Body paragraphs */}
      <div className="flex flex-col gap-4 max-w-2xl">
        {agent.body.map((para, i) => (
          <p
            key={i}
            className="font-body text-base md:text-lg text-cream/70 leading-relaxed"
          >
            {para}
          </p>
        ))}
      </div>

      {/* Pillar row — 3 columns on md+, stacked on mobile */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
        {agent.pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="flex flex-col items-center gap-2 px-4"
          >
            <span className="font-display text-xl md:text-2xl text-cream font-medium">
              {pillar.name}
            </span>
            <span className="font-body text-sm text-cream/60 leading-relaxed">
              {pillar.desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
