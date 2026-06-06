import { learnings, contact } from '../../data/portfolio-content';

// Chapter content — left column. Closing takeaways + contact.

export function LearningsSection() {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-display italic text-2xl md:text-3xl text-coke-red leading-snug">
        Taste the insight.
      </p>

      <ul className="flex flex-col gap-4">
        {learnings.map((line, i) => (
          <li
            key={i}
            className="border-l-2 border-coke-red/80 pl-4 font-display italic text-xl md:text-2xl leading-snug text-off-white"
          >
            &ldquo;{line}&rdquo;
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-6">
        {[
          { label: 'GitHub', href: contact.github },
          { label: 'LinkedIn', href: contact.linkedin },
          { label: 'Email', href: `mailto:${contact.email}` },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-body text-[0.65rem] uppercase tracking-[0.3em] text-off-white/70 underline-offset-4 hover:underline hover:text-off-white transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
