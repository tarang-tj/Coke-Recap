import { useSyncExternalStore } from 'react';

// Effective reduced-motion = user override, falling back to the OS setting.
// One module-level store merges both sources so EVERY consumer — camera-rig
// glide/snap, diorama smoke + vehicles, street-lamp flicker, recap dispenser
// timing, machine beacon, start-gate fade — reacts the moment either changes.
// (Before this store the Motion toggle only wrote a body attribute nothing
// consumed: the visible control did not actually affect the 3-D scene.)

export type MotionPref = 'system' | 'reduced' | 'full';

const KEY = 'coke-recap:motion';

function readStoredPref(): MotionPref {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'reduced' || v === 'full' ? v : 'system';
  } catch {
    return 'system'; // storage blocked
  }
}

let override: MotionPref = readStoredPref();
const listeners = new Set<() => void>();

const mq =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
// App-lifetime subscription — the module lives as long as the page.
mq?.addEventListener('change', () => listeners.forEach((l) => l()));

export function getMotionPref(): MotionPref {
  return override;
}

export function setMotionPref(pref: MotionPref): void {
  override = pref;
  try {
    window.localStorage.setItem(KEY, pref);
  } catch {
    /* storage blocked — preference just won't persist */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): boolean {
  if (override === 'reduced') return true;
  if (override === 'full') return false;
  return !!mq?.matches;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
