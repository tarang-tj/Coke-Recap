import { useCallback, useState } from 'react';
import { ExperienceContext } from './scene/experience-context';
import { NavigationProvider } from './scene/navigation-context';
import { SceneRoot } from './scene/scene-root';
import { SceneTransitionProvider } from './scene/scene-transition-context';
import { FluidEnvironment } from './scene/fluid-environment';
import { MachineHub } from './scene/machine-hub';
import { ActRole } from './scene/acts/act-role';
import { ActTools } from './scene/acts/act-tools';
import { ActAgent } from './scene/acts/act-agent';
import { ActBottle } from './scene/acts/act-bottle';
import { ChapterOverlay } from './ui/chapter-overlay';
import { StartGate } from './ui/start-gate';
import { SceneLoader } from './ui/scene-loader';
import { ReducedMotionToggle } from './ui/reduced-motion-toggle';
import { CreditHud } from './ui/credit-hud';

// Root shell — a single-viewport spatial experience (no scroll).
//   - persistent <Canvas> holds the vending-machine hub + the 4 chapter "stages"
//   - navigation is a view state machine (NavigationProvider): click a bottle,
//     keys 1-4 / arrows, or ESC home. The camera-rig flies between views.
//   - PRESS START (ExperienceContext) gates the entry dive.

export function App() {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);

  return (
    <ExperienceContext.Provider value={{ started, start }}>
      <NavigationProvider>
        <div className="relative h-screen w-screen overflow-hidden bg-coke-black text-cream font-body">
          <div className="fixed inset-0 z-0">
            <SceneRoot>
              <SceneTransitionProvider>
                <FluidEnvironment />
                <MachineHub />
                <ActRole />
                <ActTools />
                <ActAgent />
                <ActBottle />
              </SceneTransitionProvider>
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
