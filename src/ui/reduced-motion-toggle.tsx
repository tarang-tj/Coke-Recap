import { useEffect, useState } from 'react';
import { useExperience } from '../scene/experience-context';

// User-controllable reduced-motion override. System preference is the
// default; this toggle persists an override in localStorage and exposes
// it via the `data-motion` body attribute so CSS / shaders can pick it up.
//
// Implementation note: we don't actually rewire R3F components here —
// the useReducedMotion hook reads matchMedia. To make the toggle truly
// override system pref, a follow-up will replace useReducedMotion with
// a store-backed version. For MVP the toggle just sets a body attribute
// for global CSS use and persistence.

const KEY = 'coke-recap:motion';
type Pref = 'system' | 'reduced' | 'full';

function readPref(): Pref {
  if (typeof window === 'undefined') return 'system';
  try {
    return (window.localStorage.getItem(KEY) as Pref) ?? 'system';
  } catch {
    return 'system'; // storage blocked
  }
}

export function ReducedMotionToggle() {
  const { started } = useExperience();
  const [pref, setPref] = useState<Pref>(readPref);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, pref);
    } catch {
      /* storage blocked — preference just won't persist */
    }
    document.body.dataset.motion = pref;
  }, [pref]);

  const cycle = () => {
    setPref((p) => (p === 'system' ? 'reduced' : p === 'reduced' ? 'full' : 'system'));
  };

  const label = pref === 'system' ? 'Motion: Auto' : pref === 'reduced' ? 'Motion: Off' : 'Motion: On';

  // Behind the start gate this is an invisible tab stop under a modal —
  // same sweep as ChapterOverlay/MusicToggle. The persisted pref is applied
  // via the body attribute on mount regardless.
  if (!started) return null;

  return (
    <button
      onClick={cycle}
      className="fixed top-14 right-4 md:top-auto md:right-auto md:bottom-4 md:left-4 z-40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 hover:text-cream border border-cream/20 hover:border-cream/40 rounded-full bg-coke-black/40 backdrop-blur transition"
      aria-label={`Toggle motion preference. Current: ${label}`}
    >
      {label}
    </button>
  );
}
