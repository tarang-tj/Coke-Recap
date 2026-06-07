import { useCallback, useState } from 'react';
import { ExperienceContext } from './scene/experience-context';
import { NavigationProvider, useNavigation } from './scene/navigation-context';
import { SceneRoot } from './scene/scene-root';
import { SceneTransitionProvider } from './scene/scene-transition-context';
import { FluidEnvironment } from './scene/fluid-environment';
import { ActRole } from './scene/acts/act-role';
import { ActTools } from './scene/acts/act-tools';
import { ActAgent } from './scene/acts/act-agent';
import { ActBottle } from './scene/acts/act-bottle';
import { JacobsPharmacyExterior } from './scene/jacobs-pharmacy-exterior';
import { ChapterOverlay } from './ui/chapter-overlay';
import { StartGate } from './ui/start-gate';
import { SceneLoader } from './ui/scene-loader';
import { ReducedMotionToggle } from './ui/reduced-motion-toggle';
import { CreditHud } from './ui/credit-hud';
import type { ViewId } from './scene/navigation-context';

// Root shell — a single-viewport spatial experience (no scroll).
//   - persistent <Canvas> holds the corner-block home scene + the 4 chapter stages
//   - navigation is a view state machine (NavigationProvider): click a bottle,
//     keys 1-4 / arrows, or ESC home. The camera-rig flies between views.
//   - PRESS START (ExperienceContext) removes the start gate.

// Inner component has access to NavigationProvider context
function SceneContent() {
  const { setView } = useNavigation();
  type ChapterId = Exclude<ViewId, 'machine'>;
  const handleSelectChapter = useCallback((chapter: ChapterId) => setView(chapter), [setView]);

  return (
    <SceneTransitionProvider>
      <FluidEnvironment />
      <JacobsPharmacyExterior onSelectChapter={handleSelectChapter} />
      <ActRole />
      <ActTools />
      <ActAgent />
      <ActBottle />
    </SceneTransitionProvider>
  );
}

export function App() {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);

  return (
    <ExperienceContext.Provider value={{ started, start }}>
      <NavigationProvider>
        <div className="relative h-screen w-screen overflow-hidden bg-coke-black text-cream font-body">
          <div className="fixed inset-0 z-0">
            <SceneRoot>
              <SceneContent />
            </SceneRoot>
          </div>

          <ChapterOverlay />
          <StartGate />
          <ReducedMotionToggle />
          <CreditHud />
          <SceneLoader />
        </div>
      </NavigationProvider>
    </ExperienceContext.Provider>
  );
}
