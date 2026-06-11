import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAPTERS, useNavigation, type ViewId } from '../scene/navigation-context';
import { useExperience } from '../scene/experience-context';
import { useRecap } from '../scene/recap/recap-context';

// Guided tour: auto-plays through machine → role → tools → agent → takeaways.
// Dwell: ~14s per stop (camera ~4s + ~10s reading time).
// Any manual navigation or Escape stops the tour without jumping.

const TOUR_VIEWS: ViewId[] = ['machine', ...CHAPTERS];
const DWELL_MS = 14_000;

export function TourMode() {
  const { started } = useExperience();
  const { view, setView } = useNavigation();
  const { phase } = useRecap();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // current stop index within TOUR_VIEWS
  const [elapsed, setElapsed] = useState(0);     // 0..100 (%) for progress bar

  // Track the view the tour most recently commanded so we can detect manual nav.
  const expectedViewRef = useRef<ViewId>('machine');
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickStartRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (dwellTimerRef.current) { clearTimeout(dwellTimerRef.current); dwellTimerRef.current = null; }
    if (tickTimerRef.current) { clearInterval(tickTimerRef.current); tickTimerRef.current = null; }
  }, []);

  const stopTour = useCallback(() => {
    clearTimers();
    setActive(false);
    setElapsed(0);
  }, [clearTimers]);

  // Advance to a specific stop index.
  const goToStep = useCallback((index: number) => {
    if (index >= TOUR_VIEWS.length) {
      // Tour finished — end quietly.
      stopTour();
      return;
    }
    const target = TOUR_VIEWS[index];
    expectedViewRef.current = target;
    setView(target);
    setStepIndex(index);
    setElapsed(0);
    tickStartRef.current = Date.now();

    // Tick the progress bar every 100ms.
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - tickStartRef.current) / DWELL_MS) * 100);
      setElapsed(pct);
    }, 100);

    // After dwell, advance.
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    dwellTimerRef.current = setTimeout(() => {
      goToStep(index + 1);
    }, DWELL_MS);
  }, [setView, stopTour]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTour = useCallback(() => {
    // Continue from the next chapter after current view (or start from machine).
    const currentIdx = TOUR_VIEWS.indexOf(view);
    const nextIdx = currentIdx >= 0 && currentIdx < TOUR_VIEWS.length - 1
      ? currentIdx + 1
      : 0;
    setActive(true);
    goToStep(nextIdx);
  }, [view, goToStep]);

  // Stop tour when user manually changes view (e.g. clicks a nav pill).
  useEffect(() => {
    if (!active) return;
    if (view !== expectedViewRef.current) {
      stopTour();
    }
  }, [view, active, stopTour]);

  // Stop tour when recap activates.
  useEffect(() => {
    if (active && phase !== 'idle') {
      stopTour();
    }
  }, [phase, active, stopTour]);

  // Stop on Escape.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopTour();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, stopTour]);

  // Cleanup on unmount.
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Hidden until experience started, and hidden while recap is running.
  if (!started || phase !== 'idle') return null;

  const stopIndex = active ? TOUR_VIEWS.indexOf(expectedViewRef.current) : 0;
  const countLabel = active ? `${stopIndex}/${TOUR_VIEWS.length - 1}` : '';

  return (
    <button
      onClick={active ? stopTour : startTour}
      aria-pressed={active}
      aria-label={active ? 'Stop guided tour' : 'Start guided tour'}
      className={[
        'pointer-events-auto',
        'fixed bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] right-4',
        'md:bottom-14 md:right-7',
        'z-40',
        'flex flex-col items-center overflow-hidden',
        'rounded-full border border-off-white/30 bg-coke-black/40 backdrop-blur',
        'px-3 py-1.5',
        'font-body text-[0.55rem] uppercase tracking-[0.35em] text-off-white/70',
        'transition-colors duration-200',
        'hover:border-off-white/60 hover:text-off-white',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-off-white/60',
        'motion-reduce:transition-none',
        'min-w-[5.5rem]',
      ].join(' ')}
    >
      {/* Label row */}
      <span className="flex items-center gap-1.5 select-none">
        <span aria-hidden="true">{active ? '■' : '▶'}</span>
        <span>{active ? 'stop' : 'tour'}</span>
        {active && (
          <span className="opacity-50 text-[0.5rem]">{countLabel}</span>
        )}
      </span>

      {/* Progress bar — only visible while touring */}
      {active && (
        <span
          aria-hidden="true"
          className="mt-1 h-[2px] w-full rounded-full bg-off-white/15 overflow-hidden"
        >
          <span
            className="block h-full bg-off-white/60 rounded-full"
            style={{ width: `${elapsed}%`, transition: 'width 100ms linear' }}
          />
        </span>
      )}
    </button>
  );
}
