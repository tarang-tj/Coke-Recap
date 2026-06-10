import { useEffect, useState } from 'react';
import { useRecap } from '../../scene/recap/recap-context';
import { CHAPTERS } from '../../scene/navigation-context';
import {
  CHAPTER_LABELS,
  CHAPTER_SECTIONS,
  type ChapterId,
} from '../sections/section-registry';
import { hero } from '../../data/portfolio-content';

// DOM half of the recap — story mode. Once the dispensed bottle reaches its
// hero pose (phase === 'reveal') the panel fades in over a left scrim and pages
// through the whole internship: an intro card, then the four chapters (reusing
// the same section components as the 3-D tour, via section-registry).
//
// Keys while the recap is ACTIVE (any phase but idle): ←/→ page, 1-4 jump to a
// chapter page, ESC/Backspace close. Listeners are registered CAPTURE-phase
// with stopPropagation so NavigationProvider's bubble-phase listener can't
// steal the same keys and silently cancel the sequence (its setView() resets
// the recap phase as a side effect).

type PageId = 'intro' | ChapterId;
const PAGES: PageId[] = ['intro', ...CHAPTERS];

const PAGE_LABELS: Record<PageId, string> = {
  intro: 'Freshly dispensed',
  ...CHAPTER_LABELS,
};

export function RecapPanel() {
  const { phase, reset } = useRecap();
  const open = phase === 'reveal';
  const [page, setPage] = useState(0);

  // Every fresh reveal starts the story from the intro card.
  useEffect(() => {
    if (open) setPage(0);
  }, [open]);

  // Capture-phase key handling for the whole active sequence — including the
  // coin/dispense beats, where a stray arrow key would otherwise fly the
  // camera away mid-animation.
  useEffect(() => {
    if (phase === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const swallow = () => {
        e.stopPropagation();
        e.preventDefault();
      };
      if (e.key === 'Escape' || e.key === 'Backspace') {
        swallow();
        reset();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        swallow();
        if (open) setPage((p) => Math.min(PAGES.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        swallow();
        if (open) setPage((p) => Math.max(0, p - 1));
      } else if (e.key >= '1' && e.key <= '4') {
        swallow();
        if (open) setPage(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [phase, open, reset]);

  if (!open) return null;

  const pageId = PAGES[page];
  const last = page === PAGES.length - 1;
  const Section = pageId === 'intro' ? null : CHAPTER_SECTIONS[pageId];

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Left readability scrim — bottle shows through on the right */}
      <div
        className="coke-fade-in absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(18,3,5,0.95) 0%, rgba(18,3,5,0.9) 32%, rgba(18,3,5,0.45) 54%, rgba(18,3,5,0) 70%)',
        }}
      />

      <div className="coke-fade-in absolute inset-y-0 left-0 flex items-center">
        <div className="w-[min(92vw,36rem)] px-8 md:px-16">
          <p className="mb-4 flex items-center gap-3 font-body text-[0.7rem] uppercase tracking-[0.4em] text-off-white">
            <span className="inline-flex h-7 items-center justify-center rounded-full bg-coke-red px-3 text-[0.6rem] font-semibold text-off-white">
              Recap
            </span>
            {PAGE_LABELS[pageId]}
          </p>

          {/* Page body — keyed so each page replays the fade */}
          <div
            key={pageId}
            className="coke-fade-in pointer-events-auto max-h-[58vh] overflow-y-auto pr-2"
          >
            {Section ? (
              <Section />
            ) : (
              <>
                <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight text-off-white">
                  {hero.role}
                </h2>
                <p className="mt-1 font-body text-sm uppercase tracking-[0.3em] text-coke-red">
                  {hero.org}
                </p>
                <p className="mt-6 font-body text-base md:text-lg leading-relaxed text-off-white/85">
                  {hero.tagline}
                </p>
                <p className="mt-4 font-body text-sm leading-relaxed text-off-white/60">
                  One internship, dispensed in four sips — the role, the stack,
                  the agent, the takeaways.
                </p>
              </>
            )}
          </div>

          {/* Pager — prev / progress dots / next */}
          <div className="pointer-events-auto mt-8 flex items-center gap-4">
            <button
              onClick={() => (page === 0 ? reset() : setPage(page - 1))}
              className="rounded-full border border-off-white/30 bg-coke-black/40 px-4 py-2.5 font-body text-[0.6rem] uppercase tracking-[0.25em] text-off-white/80 transition-colors hover:border-off-white/60 hover:text-off-white"
            >
              {page === 0 ? '◂ The machine' : '◂ Back'}
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Recap pages">
              {PAGES.map((id, i) => (
                <button
                  key={id}
                  onClick={() => setPage(i)}
                  role="tab"
                  aria-selected={i === page}
                  aria-label={id === 'intro' ? 'Intro' : CHAPTER_LABELS[id as ChapterId]}
                  className={[
                    'h-2 rounded-full transition-all duration-300',
                    i === page
                      ? 'w-6 bg-coke-red'
                      : 'w-2 bg-off-white/30 hover:bg-off-white/60',
                  ].join(' ')}
                />
              ))}
            </div>

            <button
              onClick={() => (last ? reset() : setPage(page + 1))}
              className="rounded-full bg-coke-red px-4 py-2.5 font-body text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-off-white shadow-[0_0_18px_rgba(244,0,9,0.4)] transition-transform hover:scale-[1.03]"
            >
              {last ? 'Done ▸' : `${CHAPTER_LABELS[PAGES[page + 1] as ChapterId]} ▸`}
            </button>
          </div>

          <p className="mt-4 font-body text-[0.5rem] uppercase tracking-[0.35em] text-off-white/30 select-none">
            ◂ ▸ arrow keys · esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
