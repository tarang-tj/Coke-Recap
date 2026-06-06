import { agent } from '../../data/portfolio-content';

// Chapter content — left column. Agent tagline, body, and the 3 pillars.

export function AgentSection() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-3xl md:text-[2.75rem] leading-[1.08] text-off-white">
        {agent.tagline}
      </h2>

      <div className="flex flex-col gap-3">
        {agent.body.map((para, i) => (
          <p key={i} className="font-body text-base md:text-lg leading-relaxed text-cream/90 max-w-prose">
            {para}
          </p>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-3">
        {agent.pillars.map((pillar, i) => (
          <div key={pillar.name} className="flex items-start gap-4">
            <span className="font-display text-sm text-coke-red/90 leading-none pt-1 w-5 flex-shrink-0">
              {['I', 'II', 'III'][i]}
            </span>
            <div className="flex flex-col">
              <span className="font-body font-semibold text-base md:text-lg text-off-white leading-tight">
                {pillar.name}
              </span>
              <span className="font-body text-sm text-cream/80 leading-snug">
                {pillar.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
