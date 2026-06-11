import { useCallback, useState } from 'react';
import { ExperienceContext } from './scene/experience-context';
import { NavigationProvider } from './scene/navigation-context';
import { SceneRoot } from './scene/scene-root';
import { CocaColaDiorama } from './scene/coca-cola-diorama';
import { StreetLamps } from './scene/street-lamps';
import { ViewAccentLights } from './scene/view-accent-lights';
import { RecapProvider } from './scene/recap/recap-context';
import { VendingHotspot } from './scene/recap/vending-hotspot';
import { RecapDispenser } from './scene/recap/recap-dispenser';
import { MetricsDisplay } from './scene/metrics-display';
import { MartechPipeline } from './scene/martech-pipeline';
import { ConsumerFunnel } from './scene/consumer-funnel';
import { GrowthRibbon } from './scene/growth-ribbon';
import { DriftingClouds } from './scene/drifting-clouds';
import { PlaceAnalytics } from './scene/place-analytics';
import { InsightsNetwork } from './scene/insights-network';
import { GlobalReachGlobe } from './scene/global-reach-globe';
import { ConsumerPulse } from './scene/consumer-pulse';
import { LampMotes } from './scene/lamp-motes';
import { RecapPanel } from './ui/recap/recap-panel';
import { ChapterOverlay } from './ui/chapter-overlay';
import { StartGate } from './ui/start-gate';
import { SceneLoader } from './ui/scene-loader';
import { ReducedMotionToggle } from './ui/reduced-motion-toggle';
import { MusicToggle } from './ui/music-toggle';
import { CreditHud } from './ui/credit-hud';
import { WebglFallbackBoundary } from './ui/webgl-fallback';
import { LiveAnnouncer } from './ui/live-announcer';

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
      <StreetLamps />
      <ViewAccentLights />
      <VendingHotspot />
      <RecapDispenser />
      <MetricsDisplay />
      <MartechPipeline />
      <ConsumerFunnel />
      <GrowthRibbon />
      <DriftingClouds />
      <PlaceAnalytics />
      <InsightsNetwork />
      <GlobalReachGlobe />
      <ConsumerPulse />
      <LampMotes />
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
          <main className="relative h-screen w-screen overflow-hidden bg-coke-black text-cream font-body">
            {/* ALL experience chrome lives inside the boundary: if the canvas
                (or anything else) fails to mount, the whole interactive shell
                unmounts with it — no invisible StartGate listeners arming the
                music over the fallback, no loader masking it. */}
            <WebglFallbackBoundary>
              {/* Document outline + SR narration for the interactive shell —
                  the visual title lives in the 3-D scene, which screen
                  readers can't see. (The fallback page has its own h1, so
                  these live inside the boundary.) */}
              <h1 className="sr-only">
                Coke-Recap — Tarang Jammalamadaka, Global Human Insights Intern
                at The Coca-Cola Company
              </h1>
              <LiveAnnouncer />

              <div className="fixed inset-0 z-0">
                <SceneRoot>
                  <SceneContent />
                </SceneRoot>
              </div>

              <ChapterOverlay />
              <RecapPanel />
              <StartGate />
              <ReducedMotionToggle />
              <MusicToggle />
              <CreditHud />
              <SceneLoader />
            </WebglFallbackBoundary>
          </main>
        </RecapProvider>
      </NavigationProvider>
    </ExperienceContext.Provider>
  );
}
