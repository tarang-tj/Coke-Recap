import type { ReactElement } from 'react';
import { useNavigation, CHAPTERS, type ViewId } from '../scene/navigation-context';
import { Logo } from './brand/logo';
import { RoleSection } from './sections/role-section';
import { ToolsSection } from './sections/tools-section';
import { AgentSection } from './sections/agent-section';
import { LearningsSection } from './sections/learnings-section';

// DOM navigation layer for the vending-machine experience (no scroll).
//   - top-left: white Coca-Cola logo = home button
//   - bottom: persistent chapter selector (also navigable via 3D bottles / keys)
//   - chapter views: the matching content section fades in over the 3D motif

const SECTIONS: Record<Exclude<ViewId, 'machine'>, () => ReactElement> = {
  role: RoleSection,
  tools: ToolsSection,
  agent: AgentSection,
  takeaways: LearningsSection,
};

const LABELS: Record<Exclude<ViewId, 'machine'>, string> = {
  role: 'The Role',
  tools: 'The Stack',
  agent: 'The Agent',
  takeaways: 'Takeaways',
};

export function ChapterOverlay() {
  const { view, setView, goHome } = useNavigation();
  const isMachine = view === 'machine';
  const Section = isMachine ? null : SECTIONS[view];

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Home / brand — top-left */}
      <button
        onClick={goHome}
        aria-label="Back to the machine"
        className="pointer-events-auto fixed top-5 left-6 z-40 transition-opacity hover:opacity-80"
      >
        <Logo variant="white" className="w-24 md:w-32" />
      </button>

      {/* Chapter content — fades in per view, sits over the 3D motif.
          Links re-enable pointer events; the rest stays click-through so the
          3D behind it can still be dragged. */}
      {Section && (
        <div
          key={view}
          className="coke-fade-in absolute inset-0 flex items-center justify-center px-4
                     [&_a]:pointer-events-auto"
        >
          <Section />
        </div>
      )}

      {/* Machine-view prompt */}
      {isMachine && (
        <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-2 text-center">
          <p className="font-body text-[0.6rem] uppercase tracking-[0.55em] text-off-white/70">
            Select a chapter
          </p>
          <p className="font-body text-[0.5rem] uppercase tracking-[0.4em] text-off-white/40">
            click a bottle · keys 1&ndash;4 · arrows
          </p>
        </div>
      )}

      {/* Persistent chapter selector — bottom center */}
      <nav className="pointer-events-auto fixed inset-x-0 bottom-6 z-40 flex items-center justify-center gap-2 md:gap-3 px-4">
        {CHAPTERS.map((id, i) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              aria-current={active}
              className={[
                'rounded-full border px-3 py-2 md:px-4 font-body text-[0.55rem] md:text-[0.6rem]',
                'uppercase tracking-[0.25em] transition-colors duration-200 backdrop-blur',
                active
                  ? 'border-off-white/80 bg-off-white/15 text-off-white'
                  : 'border-off-white/25 bg-coke-black/30 text-off-white/60 hover:text-off-white hover:border-off-white/50',
              ].join(' ')}
            >
              <span className="mr-1.5 opacity-50">{i + 1}</span>
              {LABELS[id]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
