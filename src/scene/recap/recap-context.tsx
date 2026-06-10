import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigation } from '../navigation-context';

// Recap interaction state machine. Entry point is clicking the vending machine
// on the home (machine) view, which runs a coin -> dispense -> reveal sequence:
//
//   idle      machine is clickable; nothing dispensed yet
//   coin      a 5¢ coin drops into the slot
//   dispense  a Coca-Cola contour bottle rises out of the tray
//   reveal    the bottle floats to a hero pose and the internship recap panel
//             materializes beside it ("the bottle turns into internship stuff")
//   closing   finished reading (Done / back-to-machine): the bottle returns
//             to the tray before the camera releases — a finish, not a cut.
//             (ESC stays an instant reset: escape means NOW.)
//
// The phase is shared by the in-canvas dispenser (3-D animation) and the DOM
// recap panel, so it lives above both trees alongside NavigationProvider.

export type RecapPhase = 'idle' | 'coin' | 'dispense' | 'reveal' | 'closing';

export interface RecapState {
  phase: RecapPhase;
  activate: () => void;
  reset: () => void;
  setPhase: (p: RecapPhase) => void;
}

const RecapContext = createContext<RecapState | null>(null);

export function useRecap(): RecapState {
  const ctx = useContext(RecapContext);
  if (!ctx) throw new Error('useRecap must be used inside <RecapProvider>');
  return ctx;
}

export function RecapProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<RecapPhase>('idle');
  const { view } = useNavigation();

  // The recap is a machine-view-only interaction. Leaving for any chapter snaps
  // it back to idle so its DOM words don't linger over the chapter copy and the
  // camera is free to fly to the chapter pose (instead of holding RECAP_POSE).
  useEffect(() => {
    if (view !== 'machine') setPhase('idle');
  }, [view]);

  // Only the idle -> coin edge is user-triggered; the dispenser advances the
  // rest on timers. Guard so a double-click can't restart mid-sequence.
  const activate = useCallback(() => {
    setPhase((p) => (p === 'idle' ? 'coin' : p));
  }, []);

  const reset = useCallback(() => setPhase('idle'), []);

  const value = useMemo<RecapState>(
    () => ({ phase, activate, reset, setPhase }),
    [phase, activate, reset],
  );

  return <RecapContext.Provider value={value}>{children}</RecapContext.Provider>;
}
