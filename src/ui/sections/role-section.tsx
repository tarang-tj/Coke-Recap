import { role } from '../../data/portfolio-content';

// Chapter content — left column. The chapter tab ("01 — The Role") is rendered
// by ChapterOverlay; this provides the headline, body, and focus areas.

export function RoleSection() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-3xl md:text-[2.75rem] leading-[1.1] text-off-white">
        {role.body[0]}
      </h2>

      <p className="font-body text-base md:text-lg leading-relaxed text-cream/90 max-w-prose">
        {role.body[1]}
      </p>

      <div className="mt-1">
        <p className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-coke-red/90 mb-3">
          Focus Areas
        </p>
        <ul className="flex flex-col gap-2.5">
          {role.focusAreas.map((area) => (
            <li key={area} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-coke-red" aria-hidden="true" />
              <span className="font-body text-base md:text-lg text-off-white/95 leading-snug">
                {area}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
