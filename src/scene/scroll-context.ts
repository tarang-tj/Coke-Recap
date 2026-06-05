import { createContext, useContext, type RefObject } from 'react';

// React context for sharing the scroll ref from the app shell down into
// the persistent <Canvas>. The ref itself is created in App and stays
// stable across the session.
//
// We pass a ref (not a number) so child components don't re-render on scroll.

export type ScrollRef = RefObject<number>;

export const ScrollContext = createContext<ScrollRef | null>(null);

export function useScrollRef(): ScrollRef {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScrollRef must be used inside <ScrollContext.Provider>');
  return ctx;
}
