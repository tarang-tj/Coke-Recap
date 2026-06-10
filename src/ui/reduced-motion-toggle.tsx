import { useState } from 'react';
import { useExperience } from '../scene/experience-context';
import {
  getMotionPref,
  setMotionPref,
  type MotionPref,
} from '../hooks/use-reduced-motion';

// User-controllable reduced-motion override. Cycles system → reduced → full;
// the shared motion store (use-reduced-motion.ts) merges this with the OS
// preference and re-renders every animation consumer, so the toggle REALLY
// freezes/unfreezes the scene (camera drift, smoke, vehicles, lamp flicker,
// beacon, dispense timing).

export function ReducedMotionToggle() {
  const { started } = useExperience();
  const [pref, setPref] = useState<MotionPref>(getMotionPref);

  const cycle = () => {
    const next: MotionPref =
      pref === 'system' ? 'reduced' : pref === 'reduced' ? 'full' : 'system';
    setMotionPref(next); // updates store + persists + notifies all consumers
    setPref(next);
  };

  const label =
    pref === 'system' ? 'Motion: Auto' : pref === 'reduced' ? 'Motion: Off' : 'Motion: On';

  // Behind the start gate this is an invisible tab stop under a modal —
  // same sweep as ChapterOverlay/MusicToggle.
  if (!started) return null;

  return (
    <button
      onClick={cycle}
      className="fixed top-[calc(max(1rem,env(safe-area-inset-top))+2.5rem)] right-4 md:top-auto md:right-auto md:bottom-4 md:left-4 z-40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 hover:text-cream border border-cream/20 hover:border-cream/40 rounded-full bg-coke-black/40 backdrop-blur transition"
      aria-label={`Toggle motion preference. Current: ${label}`}
    >
      {label}
    </button>
  );
}
