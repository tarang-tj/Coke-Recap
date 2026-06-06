import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Navigation is a small state machine (NOT scroll). The "machine" view is the
// vending-machine hub; the four chapter views are reached by selecting a bottle
// (or keys 1-4 / arrows), and ESC returns to the hub.

export type ViewId = 'machine' | 'role' | 'tools' | 'agent' | 'takeaways';

// Chapter order for prev/next + the 1-4 number keys.
export const CHAPTERS: Exclude<ViewId, 'machine'>[] = ['role', 'tools', 'agent', 'takeaways'];

export interface NavState {
  view: ViewId;
  setView: (v: ViewId) => void;
  goHome: () => void;
  next: () => void;
  prev: () => void;
}

const NavigationContext = createContext<NavState | null>(null);

export function useNavigation(): NavState {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('machine');

  const goHome = useCallback(() => setView('machine'), []);

  const next = useCallback(() => {
    setView((v) => {
      if (v === 'machine') return CHAPTERS[0];
      const i = CHAPTERS.indexOf(v as Exclude<ViewId, 'machine'>);
      return CHAPTERS[Math.min(CHAPTERS.length - 1, i + 1)];
    });
  }, []);

  const prev = useCallback(() => {
    setView((v) => {
      if (v === 'machine') return 'machine';
      const i = CHAPTERS.indexOf(v as Exclude<ViewId, 'machine'>);
      return i <= 0 ? 'machine' : CHAPTERS[i - 1];
    });
  }, []);

  // Keyboard navigation: 1-4 pick a chapter, ←/→ prev/next, ESC/Backspace home.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
  }, [goHome, next, prev]);

  const value = useMemo<NavState>(() => ({ view, setView, goHome, next, prev }), [view, goHome, next, prev]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
