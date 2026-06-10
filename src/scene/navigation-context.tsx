import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useExperience } from './experience-context';

// Navigation is a small state machine (NOT scroll). The "machine" view is the
// home scene (corner block + vending machine outside); the four chapter views
// are reached by selecting a bottle (or keys 1-4 / arrows), and ESC returns home.

export type ViewId = 'machine' | 'role' | 'tools' | 'agent' | 'takeaways';

// Chapter order for prev/next + the 1-4 number keys.
// 'machine' is excluded — chapters are the four act views only.
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

// '#tools' → 'tools' when it names a chapter; anything else → null.
function viewFromHash(hash: string): ViewId | null {
  const h = hash.replace(/^#/, '');
  return (CHAPTERS as readonly string[]).includes(h) ? (h as ViewId) : null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const { started } = useExperience();
  // Deep links: arriving on /#tools starts the camera flying to that chapter
  // behind the start gate, so Press Start lands the visitor right in it.
  const [view, setView] = useState<ViewId>(
    () => viewFromHash(window.location.hash) ?? 'machine',
  );

  const goHome = useCallback(() => setView('machine'), []);

  // view → URL. One history entry per view change so the browser back button
  // walks the visit instead of exiting the site. The very first sync REPLACES
  // instead of pushing: arriving with an unknown hash (/#foo) must normalize
  // the URL without leaving the junk entry one Back-press away.
  const firstUrlSync = useRef(true);
  useEffect(() => {
    const desired = view === 'machine' ? '' : `#${view}`;
    const replace = firstUrlSync.current;
    firstUrlSync.current = false;
    if (window.location.hash === desired) return; // popstate/deep-link already in sync
    const url = desired || window.location.pathname + window.location.search;
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, [view]);

  // URL → view (back/forward buttons, manual hash edits).
  useEffect(() => {
    const onPop = () => setView(viewFromHash(window.location.hash) ?? 'machine');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  type ChapterId = Exclude<ViewId, 'machine'>;

  const next = useCallback(() => {
    setView((v) => {
      if (v === 'machine') return CHAPTERS[0];
      const i = CHAPTERS.indexOf(v as ChapterId);
      return CHAPTERS[Math.min(CHAPTERS.length - 1, i + 1)];
    });
  }, []);

  const prev = useCallback(() => {
    setView((v) => {
      if (v === 'machine') return 'machine';
      const i = CHAPTERS.indexOf(v as ChapterId);
      return i <= 0 ? 'machine' : CHAPTERS[i - 1];
    });
  }, []);

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
    () => ({ view, setView, goHome, next, prev }),
    [view, goHome, next, prev],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
