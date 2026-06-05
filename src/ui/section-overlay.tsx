import type { ReactNode } from 'react';
import { ACT_ORDER, ACT_WINDOWS } from '../data/act-windows';

// Document-flow column of full-viewport-height sections, one per act.
// Each section is positioned relative to its act window so its mid-point
// roughly aligns with peak scene focus for that act.
//
// We use a 500vh body (configured at app level). Each section is 100vh tall;
// sections are stacked linearly via flex column.

type Props = {
  children: ReactNode;
};

export function SectionOverlay({ children }: Props) {
  return (
    <div className="relative w-full">
      {children}
    </div>
  );
}

// Wrapper for a single section, anchored to its act ID for debugging.
// Children should render the actual section UI.
type SectionProps = {
  actId: keyof typeof ACT_WINDOWS;
  children: ReactNode;
};

export function Section({ actId, children }: SectionProps) {
  const index = ACT_ORDER.indexOf(actId);
  return (
    <section
      id={`section-${actId}`}
      data-act={actId}
      data-index={index}
      className="relative w-full h-screen flex items-center justify-center px-6 md:px-12"
    >
      {children}
    </section>
  );
}
