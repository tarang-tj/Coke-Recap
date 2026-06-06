import { role } from '../../data/portfolio-content';

// Editorial spread layout — large display quote left, focus areas right.

export function RoleSection() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
      {/* Left: 3/5 */}
      <div className="md:col-span-3 flex flex-col gap-8">
        {/* Eyebrow */}
        <span className="font-body text-[0.65rem] uppercase tracking-[0.35em] text-off-white">
          01 / Role
        </span>

        {/* Large editorial quote */}
        <h2 className="font-display text-5xl md:text-7xl text-cream leading-[1.05] drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]">
          {role.body[0]}
        </h2>

        {/* Secondary body */}
        <p className="font-body text-lg text-cream/85 leading-relaxed max-w-prose">
          {role.body[1]}
        </p>
      </div>

      {/* Right: 2/5 */}
      <div className="md:col-span-2 flex flex-col gap-6 md:pt-20">
        <span className="font-body text-[0.65rem] uppercase tracking-[0.35em] text-off-white">
          Focus Areas
        </span>

        <ul className="flex flex-col gap-0">
          {role.focusAreas.map((area) => (
            <li key={area} className="flex flex-col gap-0 py-4 border-b border-off-white/25 first:border-t">
              {/* Warm accent bar */}
              <span className="block w-5 h-px bg-off-white/60 mb-2" aria-hidden="true" />
              <span className="font-body text-base md:text-lg text-cream/90 leading-snug">
                {area}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
