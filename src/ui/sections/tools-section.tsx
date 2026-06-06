import { tools } from '../../data/portfolio-content';

// Chapter content — left column. Compact, readable list of the stack.

export function ToolsSection() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-3xl md:text-[2.5rem] leading-[1.1] text-off-white">
        The tools behind the insight.
      </h2>

      <ul className="flex flex-col divide-y divide-off-white/15">
        {tools.map((tool, i) => (
          <li key={tool.id} className="flex items-baseline gap-4 py-3 first:pt-0">
            <span
              className="font-display text-lg md:text-xl text-coke-red/90 leading-none w-7 flex-shrink-0 tabular-nums"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-body font-semibold text-base md:text-lg text-off-white leading-tight">
                {tool.name}
              </span>
              <span className="font-body text-sm text-cream/80 leading-snug">
                {tool.blurb}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
