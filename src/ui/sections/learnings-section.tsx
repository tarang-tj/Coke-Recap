import { learnings, contact } from '../../data/portfolio-content';

// Act 4 — Bottle: closing UI panel.
// Displays three takeaway "quote" lines and a minimal contact row.

export function LearningsSection() {
  return (
    <footer className="flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center">
      {/* Eyebrow */}
      <p className="font-body text-xs tracking-[0.25em] uppercase text-caramel mb-12">
        Takeaways
      </p>

      {/* Learning quotes */}
      <div className="max-w-2xl w-full space-y-0">
        {learnings.map((line, i) => (
          <div key={i}>
            <p className="font-display text-2xl md:text-3xl lg:text-4xl text-cream leading-snug py-8">
              &ldquo;{line}&rdquo;
            </p>
            {i < learnings.length - 1 && (
              <hr className="border-0 border-t border-cream/20 w-24 mx-auto" />
            )}
          </div>
        ))}
      </div>

      {/* Contact row */}
      <div className="mt-16 flex items-center gap-8 font-body text-sm text-cream/70">
        <a
          href={contact.github}
          target="_blank"
          rel="noreferrer"
          className="hover:text-cream underline-offset-4 hover:underline transition-colors duration-200"
        >
          GitHub
        </a>
        <span className="text-cream/30" aria-hidden="true">·</span>
        <a
          href={contact.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:text-cream underline-offset-4 hover:underline transition-colors duration-200"
        >
          LinkedIn
        </a>
        <span className="text-cream/30" aria-hidden="true">·</span>
        <a
          href={`mailto:${contact.email}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-cream underline-offset-4 hover:underline transition-colors duration-200"
        >
          Email
        </a>
      </div>
    </footer>
  );
}
