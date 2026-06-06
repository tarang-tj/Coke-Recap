import { createContext, useContext } from 'react';

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
