import { tools } from '../../data/portfolio-content';

// Vertical numbered list — each tool gets a huge display number, name, blurb.

export function ToolsSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row md:justify-end">
      <div className="w-full md:w-3/5 flex flex-col gap-10">
        {/* Eyebrow */}
        <span className="font-body text-[0.65rem] uppercase tracking-[0.35em] text-caramel">
          02 / Stack
        </span>

        {/* Numbered tool list */}
        <ul className="flex flex-col divide-y divide-cream/10">
          {tools.map((tool, i) => (
            <li key={tool.id} className="flex items-start gap-6 py-8 first:pt-0 last:pb-0">
              {/* Huge number */}
              <span
                className="font-display font-black text-5xl md:text-7xl text-caramel leading-none select-none flex-shrink-0 w-16 md:w-24 text-right"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Name + blurb */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="font-display text-2xl md:text-3xl text-cream leading-tight">
                  {tool.name}
                </span>
                <span className="font-body text-sm md:text-base text-cream/70 leading-relaxed">
                  {tool.blurb}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
