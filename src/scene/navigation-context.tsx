import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useExperience } from './experience-context';

// Navigation is a small state machine (NOT scroll). The "machine" view is the
// vending-machine hub; the four chapter views are reached by selecting a bottle
// (or keys 1-4 / arrows), and ESC returns to the hub.

export type ViewId = 'exterior' | 'machine' | 'role' | 'tools' | 'agent' | 'takeaways';

// Chapter order for prev/next + the 1-4 number keys.
// 'exterior' and 'machine' are excluded — chapters are the four act views only.
export const CHAPTERS: Exclude<ViewId, 'machine' | 'exterior'>[] = ['role', 'tools', 'agent', 'takeaways'];

export interface NavState {
  view: ViewId;
  setView: (v: ViewId) => void;
  goHome: () => void;
  next: () => void;
  prev: () => void;
  /**
   * True while the camera is animating from the exterior view into the machine
   * pose (the ~1.6s dolly through the door). Used by the pharmacy exterior to
   * stay visible during the transition, and by overlay UI to stay hidden.
   */
  entering: boolean;
}

const NavigationContext = createContext<NavState | null>(null);

export function useNavigation(): NavState {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}

// Matches the camera-rig's ENTRY_DURATION constant.
const ENTRY_TRANSITION_MS = 1600;

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { started } = useExperience();
  const [view, setView] = useState<ViewId>('exterior');
  const [entering, setEntering] = useState(false);

  const goHome = useCallback(() => setView('machine'), []);

  type ChapterId = Exclude<ViewId, 'machine' | 'exterior'>;

  const next = useCallback(() => {
    setView((v) => {
      if (v === 'machine' || v === 'exterior') return CHAPTERS[0];
      const i = CHAPTERS.indexOf(v as ChapterId);
      return CHAPTERS[Math.min(CHAPTERS.length - 1, i + 1)];
    });
  }, []);

  const prev = useCallback(() => {
    setView((v) => {
      if (v === 'machine' || v === 'exterior') return 'machine';
      const i = CHAPTERS.indexOf(v as ChapterId);
      return i <= 0 ? 'machine' : CHAPTERS[i - 1];
    });
  }, []);

  // When the user presses the gate (started flips true) while on the exterior
  // view, advance to the machine AND flip `entering` true for the duration of
  // the camera dolly so the storefront stays visible while the camera moves
  // through the door. This is a one-way trip — Esc/home always goes to
  // 'machine', never back to 'exterior'.
  useEffect(() => {
    if (started && view === 'exterior') {
      setEntering(true);
      setView('machine');
      const t = window.setTimeout(() => setEntering(false), ENTRY_TRANSITION_MS);
      return () => window.clearTimeout(t);
    }
  }, [started, view]);

  // Keyboard navigation: 1-4 pick a chapter, ←/→ prev/next, ESC/Backspace home.
  // Only active once the experience has started, and never hijacks OS/browser
  // shortcut combos (Cmd/Ctrl/Alt + key).
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        goHome();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prev();
      } else if (e.key >= '1' && e.key <= '4') {
        setView(CHAPTERS[Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, goHome, next, prev]);

  const value = useMemo<NavState>(
    () => ({ view, setView, goHome, next, prev, entering }),
    [view, goHome, next, prev, entering],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
