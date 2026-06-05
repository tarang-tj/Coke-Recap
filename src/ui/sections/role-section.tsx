import { role } from '../../data/portfolio-content';

// Two-column layout: large quote + body left, focus areas right.
// Single column on mobile via Tailwind responsive grid.

export function RoleSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
      {/* Left: 3/5 width */}
      <div className="md:col-span-3 flex flex-col gap-6">
        {/* Eyebrow */}
        <span className="text-caramel text-xs uppercase tracking-widest font-body font-semibold">
          {role.heading}
        </span>

        {/* Large display quote */}
        <p className="font-display text-3xl md:text-4xl lg:text-5xl text-cream leading-snug">
          {role.body[0]}
        </p>

        {/* Secondary body */}
        <p className="font-body text-base md:text-lg text-cream/70 leading-relaxed max-w-prose">
          {role.body[1]}
        </p>
      </div>

      {/* Right: 2/5 width */}
      <div className="md:col-span-2 flex flex-col gap-4">
        <span className="text-caramel text-xs uppercase tracking-widest font-body font-semibold">
          Focus areas
        </span>

        <ul className="flex flex-col gap-3">
          {role.focusAreas.map((area) => (
            <li key={area} className="flex items-start gap-3 font-body text-cream/90 text-base md:text-lg">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-caramel flex-shrink-0" />
              {area}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
