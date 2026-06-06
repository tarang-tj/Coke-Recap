import type { ReactElement } from 'react';
import { useNavigation, CHAPTERS, type ViewId } from '../scene/navigation-context';
import { Logo } from './brand/logo';
import { RoleSection } from './sections/role-section';
import { ToolsSection } from './sections/tools-section';
import { AgentSection } from './sections/agent-section';
import { LearningsSection } from './sections/learnings-section';

// DOM navigation + content layer. Chapter copy lives in a high-contrast LEFT
// column over a dark-red scrim (so text is always readable, never floating on
// the busy 3-D scene); the chapter's 3-D motif shows through on the right.

type ChapterId = Exclude<ViewId, 'machine'>;

const SECTIONS: Record<ChapterId, () => ReactElement> = {
  role: RoleSection,
  tools: ToolsSection,
  agent: AgentSection,
  takeaways: LearningsSection,
};

const LABELS: Record<ChapterId, string> = {
  role: 'The Role',
  tools: 'The Stack',
  agent: 'The Agent',
  takeaways: 'Takeaways',
};

export function ChapterOverlay() {
  const { view, setView, goHome } = useNavigation();
  const isMachine = view === 'machine';
  const Section = isMachine ? null : SECTIONS[view];
  const chapterIndex = isMachine ? -1 : CHAPTERS.indexOf(view as ChapterId);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Left readability scrim — only in chapter views */}
      {!isMachine && (
        <div
          className="coke-fade-in absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,3,5,0.94) 0%, rgba(18,3,5,0.88) 30%, rgba(18,3,5,0.45) 52%, rgba(18,3,5,0) 68%)',
          }}
        />
      )}

      {/* Home / brand — top-left */}
      <button
        onClick={goHome}
        aria-label="Back to the machine"
        className="pointer-events-auto fixed top-6 left-7 z-40 transition-opacity hover:opacity-80"
      >
        <Logo variant="white" className="w-24 md:w-28" />
      </button>

      {/* Chapter content — left column, high contrast */}
      {Section && (
        <div
          key={view}
          className="coke-fade-in absolute inset-y-0 left-0 flex items-center"
        >
          <div className="w-[min(92vw,34rem)] px-8 md:px-16 [&_a]:pointer-events-auto">
            <p className="mb-5 flex items-center gap-3 font-body text-[0.7rem] uppercase tracking-[0.4em] text-off-white">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-coke-red text-off-white text-[0.7rem] font-semibold">
                {chapterIndex + 1}
              </span>
              {LABELS[view as ChapterId]}
            </p>
            <Section />
          </div>
        </div>
      )}

      {/* Machine-view prompt */}
      {isMachine && (
        <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-2 text-center">
          <p className="font-body text-[0.65rem] uppercase tracking-[0.55em] text-off-white/80">
            Select a chapter
          </p>
          <p className="font-body text-[0.55rem] uppercase tracking-[0.4em] text-off-white/45">
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
              aria-current={active ? 'true' : undefined}
              className={[
                'rounded-full border px-3.5 py-2 md:px-4 font-body text-[0.55rem] md:text-[0.6rem]',
                'uppercase tracking-[0.2em] transition-colors duration-200 backdrop-blur',
                active
                  ? 'border-transparent bg-coke-red text-off-white shadow-[0_0_18px_rgba(244,0,9,0.5)]'
                  : 'border-off-white/30 bg-coke-black/40 text-off-white/70 hover:text-off-white hover:border-off-white/60',
              ].join(' ')}
            >
              <span className="mr-1.5 opacity-60">{i + 1}</span>
              {LABELS[id]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
