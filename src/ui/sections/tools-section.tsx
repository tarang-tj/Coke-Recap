import { tools } from '../../data/portfolio-content';

// Right-rail layout on desktop: eyebrow + grid of tool cards pushed to the
// right 40% of the viewport. On mobile: full-width single column.

export function ToolsSection() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row md:justify-end">
      <div className="w-full md:w-2/5 flex flex-col gap-8">
        {/* Eyebrow */}
        <span className="text-caramel text-xs uppercase tracking-widest font-body font-semibold">
          Stack
        </span>

        {/* Tool cards */}
        <ul className="flex flex-col gap-6">
          {tools.map((tool) => (
            <li key={tool.id} className="flex flex-col gap-1">
              <span className="font-display text-2xl md:text-3xl text-cream leading-snug">
                {tool.name}
              </span>
              <span className="font-body text-sm md:text-base text-cream/70 leading-relaxed">
                {tool.blurb}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
