/**
 * Scene transition mixer — exclusive crossfade between machine hub and chapter
 * stages so models never overlap during tab/view changes.
 */
import {
  createContext,
  useContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { useNavigation, type ViewId } from './navigation-context';

const ALL_VIEWS: ViewId[] = ['machine', 'role', 'tools', 'agent', 'takeaways'];

export type SceneMix = Record<ViewId, number>;

const SceneTransitionContext = createContext<MutableRefObject<SceneMix> | null>(null);

export function useSceneMixes(): MutableRefObject<SceneMix> {
  const ctx = useContext(SceneTransitionContext);
  if (!ctx) throw new Error('useSceneMixes must be used inside <SceneTransitionProvider>');
  return ctx;
}

export function SceneTransitionProvider({ children }: { children: ReactNode }) {
  const { view } = useNavigation();
  const viewRef = useRef(view);
  viewRef.current = view;

  const mixesRef = useRef<SceneMix>({
    machine: 0,
    role: 0,
    tools: 0,
    agent: 0,
    takeaways: 0,
  });

  useFrame((_, dt) => {
    const active = viewRef.current;
    const mixes = mixesRef.current;

    for (const id of ALL_VIEWS) {
      const target = id === active ? 1 : 0;
      const rate = target === 1 ? 5.5 : 12;
      mixes[id] += (target - mixes[id]) * Math.min(1, dt * rate);
      if (mixes[id] < 0.001) mixes[id] = 0;
      if (mixes[id] > 0.999) mixes[id] = 1;
    }

    if (active !== 'machine' && mixes.machine > 0.12) {
      mixes[active] = 0;
    }
    if (active === 'machine') {
      const maxChapter = Math.max(mixes.role, mixes.tools, mixes.agent, mixes.takeaways);
      if (maxChapter > 0.12) {
        mixes.machine = 0;
      }
    }
  });

  return (
    <SceneTransitionContext.Provider value={mixesRef}>
      {children}
    </SceneTransitionContext.Provider>
  );
}
