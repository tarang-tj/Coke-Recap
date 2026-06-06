import { type ElementType, type ReactNode } from 'react';

// Coca-Cola script wordmark using Pacifico — the open-source script that evokes
// the iconic lettering. Purely presentational; callers control size via className
// (e.g. className="text-7xl"). Includes the registered mark ® as a superscript.

export interface WordmarkProps {
  /** Additional Tailwind / CSS classes merged onto the root element. */
  className?: string;
  /** HTML tag to render as. Default 'span'. */
  as?: ElementType;
  /** Override the display text. Defaults to "Coca‑Cola". */
  text?: string;
  /** Slot children take priority over `text` if provided. */
  children?: ReactNode;
}

export function Wordmark({
  className = '',
  as: Tag = 'span',
  text = 'Coca\u2011Cola',
  children,
}: WordmarkProps) {
  return (
    <Tag
      className={[
        'font-brand',
        'text-off-white',
        // Soft drop shadow for legibility on the red gradient background
        '[text-shadow:0_2px_12px_rgba(0,0,0,0.45),0_1px_4px_rgba(0,0,0,0.3)]',
        'select-none',
        'inline-flex',
        'items-baseline',
        'gap-[0.08em]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children ?? text}
      {/* ® superscript — ~0.3em, top-aligned */}
      <sup
        className="text-[0.3em] leading-none align-super opacity-80"
        aria-label="registered trademark"
      >
        ®
      </sup>
    </Tag>
  );
}
