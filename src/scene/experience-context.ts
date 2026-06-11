import { createContext, useContext, useSyncExternalStore } from 'react';

// Shared state for the "has the user pressed start" gate.
// Consumed by StartGate (UI) and CameraRig (scene) so both sides
// know when to transition from intro pose to scroll-driven mode.
//
// Mirror of scroll-context.ts: a tiny context with a throwing hook.

export interface ExperienceState {
  started: boolean;
  start: () => void;
}

export const ExperienceContext = createContext<ExperienceState | null>(null);

export function useExperience(): ExperienceState {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceContext.Provider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Panel-collapsed external store — shared between ChapterOverlay (UI) and
// CameraRig (scene) without requiring a provider change in app.tsx.
// Uses useSyncExternalStore so both consumers stay in sync with no extra
// boilerplate. Default = expanded (false), persists across chapter switches.
// ---------------------------------------------------------------------------

let _panelCollapsed = false;
const _listeners = new Set<() => void>();

function _notifyAll() {
  for (const fn of _listeners) fn();
}

export const panelCollapsedStore = {
  /** Subscribe / unsubscribe — passed directly to useSyncExternalStore. */
  subscribe(listener: () => void): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
  /** Current snapshot — passed directly to useSyncExternalStore. */
  getSnapshot(): boolean {
    return _panelCollapsed;
  },
  /** Toggle and notify all subscribers. */
  toggle() {
    _panelCollapsed = !_panelCollapsed;
    _notifyAll();
  },
};

/** React hook — returns [collapsed, toggle]. Re-renders on every change. */
export function usePanelCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    panelCollapsedStore.subscribe,
    panelCollapsedStore.getSnapshot,
  );
  return [collapsed, panelCollapsedStore.toggle];
}
