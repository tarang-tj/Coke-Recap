import { useCallback, useState } from 'react';
import { ExperienceContext } from './scene/experience-context';
import { NavigationProvider } from './scene/navigation-context';
import { SceneRoot } from './scene/scene-root';
import { CocaColaDiorama } from './scene/coca-cola-diorama';
import { RecapProvider } from './scene/recap/recap-context';
import { VendingHotspot } from './scene/recap/vending-hotspot';
import { RecapDispenser } from './scene/recap/recap-dispenser';
import { RecapPanel } from './ui/recap/recap-panel';
import { ChapterOverlay } from './ui/chapter-overlay';
import { StartGate } from './ui/start-gate';
import { SceneLoader } from './ui/scene-loader';
import { ReducedMotionToggle } from './ui/reduced-motion-toggle';
import { MusicToggle } from './ui/music-toggle';
import { CreditHud } from './ui/credit-hud';
import { WebglFallbackBoundary } from './ui/webgl-fallback';

// Root shell — a single-viewport spatial experience (no scroll).
//   - persistent <Canvas> holds the one 1886 Atlanta diorama
//   - navigation is a view state machine (NavigationProvider): keys 1-4 /
//     arrows / chapter buttons; ESC home. The camera-rig flies between vantage
//     points inside the diorama.
//   - the recap layer (RecapProvider) drives the click-the-vending-machine
//     coin -> bottle -> internship-panel interaction, spanning canvas + DOM.
//   - PRESS START (ExperienceContext) removes the start gate.

function SceneContent() {
  return (
    <>
      <CocaColaDiorama />
      <VendingHotspot />
      <RecapDispenser />
    </>
  );
}

export function App() {
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);

  return (
    <ExperienceContext.Provider value={{ started, start }}>
      <NavigationProvider>
        <RecapProvider>
          <div className="relative h-screen w-screen overflow-hidden bg-coke-black text-cream font-body">
            <WebglFallbackBoundary>
              <div className="fixed inset-0 z-0">
                <SceneRoot>
                  <SceneContent />
                </SceneRoot>
              </div>
            </WebglFallbackBoundary>

            <ChapterOverlay />
            <RecapPanel />
            <StartGate />
            <ReducedMotionToggle />
            <MusicToggle />
            <CreditHud />
            <SceneLoader />
          </div>
        </RecapProvider>
      </NavigationProvider>
    </ExperienceContext.Provider>
  );
}
