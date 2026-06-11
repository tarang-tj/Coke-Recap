import { useEffect } from 'react';
import { useNavigation, CHAPTERS } from '../scene/navigation-context';
import { useRecap } from '../scene/recap/recap-context';
import { useExperience, usePanelCollapsed } from '../scene/experience-context';
import { Logo } from './brand/logo';
import {
  CHAPTER_LABELS as LABELS,
  CHAPTER_SECTIONS as SECTIONS,
  type ChapterId,
} from './sections/section-registry';

// DOM navigation + content layer. Chapter copy lives in a high-contrast LEFT
// column over a dark-red scrim (so text is always readable, never floating on
// the busy 3-D scene); the chapter's 3-D motif shows through on the right.
// Labels + section components come from section-registry (shared with the
// recap panel's story mode).

export function ChapterOverlay() {
  const { view, setView, goHome } = useNavigation();
  const { phase, activate } = useRecap();
  const { started } = useExperience();
  const isMachine = view === 'machine';

  // Panel-collapsed state lives in the external store (experience-context) so
  // CameraRig can read the same value without a provider change. Default =
  // expanded (false), persists across chapter switches.
  const [collapsed, toggle] = usePanelCollapsed();

  // Per-chapter tab title — distinct history entries + tab UX. Lives here
  // (not NavigationProvider) because the labels do: importing the section
  // registry into the provider would be a circular import.
  useEffect(() => {
    const base = 'Coke-Recap — Tarang Jammalamadaka';
    document.title = isMachine ? base : `${LABELS[view as ChapterId]} — ${base}`;
    // Reset on unmount: if the canvas dies mid-chapter the fallback page
    // would otherwise keep the stale chapter title.
    return () => {
      document.title = base;
    };
  }, [view, isMachine]);

  // Nothing here is usable behind the start gate — rendering it anyway would
  // leave invisible tab stops underneath the gate's modal.
  if (!started) return null;
  const Section = isMachine ? null : SECTIONS[view as ChapterId];
  const chapterIndex = isMachine ? -1 : CHAPTERS.indexOf(view as ChapterId);

  // Collapsed: scrim + content column slide left and fade out.
  // The re-expand tab stays visible at the left edge.
  const collapseStyle: React.CSSProperties = {
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? 'translateX(-2rem)' : 'translateX(0)',
    // Prevent hidden content from intercepting pointer events
    pointerEvents: collapsed ? 'none' : undefined,
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* Left readability scrim — only in chapter views */}
      {!isMachine && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(18,3,5,0.94) 0%, rgba(18,3,5,0.88) 30%, rgba(18,3,5,0.45) 52%, rgba(18,3,5,0) 68%)',
            ...collapseStyle,
          }}
        />
      )}

      {/* Home / brand — top-left. Shown on chapter views only. */}
      {!isMachine && (
        <button
          onClick={goHome}
          aria-label="Back to the machine"
          className="pointer-events-auto fixed top-6 left-7 z-40 transition-opacity hover:opacity-80"
          style={collapseStyle}
        >
          <Logo variant="white" className="w-24 md:w-28" />
        </button>
      )}

      {/* Chapter content — left column, high contrast */}
      {Section && (
        <div
          className="absolute inset-y-0 left-0 flex items-center"
          style={collapseStyle}
        >
          <div
            key={view}
            className="coke-fade-in w-[min(92vw,34rem)] px-8 md:px-16 [&_a]:pointer-events-auto"
          >
            <p className="mb-5 flex items-center gap-3 font-body text-[0.7rem] uppercase tracking-[0.4em] text-off-white">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-coke-red text-off-white text-[0.7rem] font-semibold">
                {chapterIndex + 1}
              </span>
              {LABELS[view as ChapterId]}
            </p>
            <Section />
            {/* Takeaways historical tidbit — museum caption, only on this chapter */}
            {view === 'takeaways' && (
              <p className="mt-8 font-body text-[0.5rem] uppercase tracking-[0.45em] text-off-white/30 select-none">
                sold for 5¢ from 1886&nbsp;–&nbsp;1959&ensp;•&ensp;73 years at the same price
              </p>
            )}
          </div>
        </div>
      )}

      {/* Collapse / expand toggle — only on chapter views (not machine) */}
      {!isMachine && Section && (
        <button
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand story panel' : 'Collapse story panel'}
          className={[
            'pointer-events-auto fixed z-40',
            // Vertical slim tab at left edge — shifts right when expanded so
            // it clears the home logo; anchors at left:0 when collapsed.
            'top-1/2 -translate-y-1/2',
            collapsed
              ? 'left-0 rounded-r-md border-r border-t border-b'
              : 'left-1 rounded-md border',
            'flex flex-col items-center justify-center gap-1',
            'border-off-white/25 bg-coke-black/60 backdrop-blur-sm',
            'px-1.5 py-3',
            'font-body text-[0.55rem] uppercase tracking-[0.25em] text-off-white/70',
            'transition-all duration-300 ease-out',
            'hover:text-off-white hover:border-off-white/50 hover:bg-coke-black/80',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-off-white/60 focus-visible:rounded-md',
            'motion-reduce:transition-none',
          ].join(' ')}
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          {/* Chevron indicator */}
          <svg
            width="8"
            height="10"
            viewBox="0 0 8 10"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path
              d="M2 2 L6 5 L2 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="select-none">{collapsed ? 'story' : 'hide'}</span>
        </button>
      )}

      {/* Machine-view prompt — hidden once the recap sequence is running.
          The prompt is a real button: the 3-D hotspot is the mouse path into
          the recap, this is the keyboard/switch/screen-reader path. */}
      {isMachine && phase === 'idle' && (
        <div className="absolute inset-x-0 bottom-24 flex flex-col items-center gap-2 text-center">
          <button
            onClick={activate}
            aria-label="Click the Coca-Cola machine — insert 5 cents to start the recap"
            className="pointer-events-auto font-body text-[0.65rem] uppercase tracking-[0.55em] text-off-white/80 transition-colors hover:text-off-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-off-white/60 rounded-sm px-2 py-1"
          >
            Click the Coca-Cola machine
          </button>
          <p className="font-body text-[0.55rem] uppercase tracking-[0.4em] text-off-white/45">
            drag to look around · or jump straight to a chapter
          </p>
        </div>
      )}

      {/* Persistent chapter selector — bottom center. Shown everywhere (it is
          the ONLY pointer path into the chapters on touch devices), except
          while the recap sequence is running so the reveal stays clean. */}
      {(!isMachine || phase === 'idle') && (
        <nav
          aria-label="Chapters"
          // max(1.5rem, safe-area) keeps the pills clear of the iPhone home
          // indicator with viewport-fit=cover; desktop env() is 0 → 1.5rem.
          className="pointer-events-auto fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex flex-wrap items-center justify-center gap-1.5 md:gap-3 px-3"
        >
          {CHAPTERS.map((id, i) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-current={active ? 'true' : undefined}
                className={[
                  'rounded-full border px-2.5 py-2 md:px-4 font-body text-[0.55rem] md:text-[0.6rem]',
                  'uppercase tracking-[0.2em] transition-colors duration-200 backdrop-blur',
                  active
                    ? 'border-transparent bg-coke-red text-off-white shadow-[0_0_18px_rgba(244,0,9,0.5)]'
                    : 'border-off-white/30 bg-coke-black/40 text-off-white/70 hover:text-off-white hover:border-off-white/60',
                ].join(' ')}
              >
                <span className="mr-1.5 opacity-60 hidden md:inline">{i + 1}</span>
                {LABELS[id]}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
