import { learnings, contact } from '../../data/portfolio-content';
import { Logo } from '../brand/logo';

// Closing chapter — brand sign-off wordmark, large italic quotes, contact row.

export function LearningsSection() {
  return (
    <footer className="flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center">
      {/* Brand sign-off — closing identity stamp */}
      <Logo variant="white" className="w-[min(80vw,560px)] mx-auto mb-4" />
      <p className="font-body text-base md:text-lg text-cream/80 tracking-widest mb-16">
        Taste the insight.
      </p>

      {/* Eyebrow */}
      <p className="font-body text-[0.65rem] tracking-[0.35em] uppercase text-caramel mb-12">
        04 / Takeaways
      </p>

      {/* Learning quotes — full-width hairlines between each */}
      <div className="w-full max-w-3xl">
        {learnings.map((line, i) => (
          <div key={i}>
            {i > 0 && (
              <hr className="border-0 border-t border-cream/20 w-full my-0" />
            )}
            <p className="font-display italic text-3xl md:text-5xl text-cream leading-snug py-10 md:py-12">
              &ldquo;{line}&rdquo;
            </p>
          </div>
        ))}
        <hr className="border-0 border-t border-cream/20 w-full" />
      </div>

      {/* Contact row — small caps, hover underline */}
      <div className="mt-16 flex items-center gap-8">
        {[
          { label: 'GitHub', href: contact.github },
          { label: 'LinkedIn', href: contact.linkedin },
          { label: 'Email', href: `mailto:${contact.email}` },
        ].map(({ label, href }, i, arr) => (
          <span key={label} className="flex items-center gap-8">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-cream/50 underline-offset-4 hover:underline hover:text-cream transition-colors duration-200"
            >
              {label}
            </a>
            {i < arr.length - 1 && (
              <span className="text-cream/20 text-xs" aria-hidden="true">·</span>
            )}
          </span>
        ))}
      </div>
    </footer>
  );
}
