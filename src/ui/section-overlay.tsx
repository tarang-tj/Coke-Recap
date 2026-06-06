import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import { ACT_ORDER, ACT_WINDOWS } from '../data/act-windows';
import { useSectionProgress } from '../hooks/use-section-progress';

// Context so child sections can read their own scroll progress for staggers.
export const SectionProgressContext = createContext<number>(0);
export function useSectionProgressContext(): number {
  return useContext(SectionProgressContext);
}

// smoothstep: remaps t in [edge0, edge1] to smooth 0..1 curve
function smoothstep(edge0: number, edge1: number, t: number): number {
  const x = Math.min(1, Math.max(0, (t - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

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

type SectionProps = {
  actId: keyof typeof ACT_WINDOWS;
  children: ReactNode;
};

export function Section({ actId, children }: SectionProps) {
  const index = ACT_ORDER.indexOf(actId);
  const ref = useRef<HTMLElement | null>(null);
  const progress = useSectionProgress(ref as RefObject<HTMLElement | null>);

  // Fade in as section enters, fade out as it leaves
  const opacity =
    smoothstep(0.05, 0.4, progress) * (1 - smoothstep(0.6, 0.95, progress));

  // Subtle vertical parallax: starts 20px below center, ends 20px above
  const translateY = (0.5 - progress) * 40;

  return (
    <SectionProgressContext.Provider value={progress}>
      <section
        ref={ref}
        id={`section-${actId}`}
        data-act={actId}
        data-index={index}
        className="relative w-full h-screen flex items-center justify-center px-6 md:px-12"
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </section>
    </SectionProgressContext.Provider>
  );
}
