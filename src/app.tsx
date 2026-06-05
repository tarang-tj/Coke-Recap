import { ScrollContext } from './scene/scroll-context';
import { useScrollProgressRef } from './hooks/use-scroll-progress';
import { SceneRoot } from './scene/scene-root';
import { FluidEnvironment } from './scene/fluid-environment';
import { ActColdOpen } from './scene/acts/act-cold-open';
import { ActRole } from './scene/acts/act-role';
import { ActTools } from './scene/acts/act-tools';
import { ActAgent } from './scene/acts/act-agent';
import { ActBottle } from './scene/acts/act-bottle';
import { SectionOverlay, Section } from './ui/section-overlay';
import { ColdOpenSection } from './ui/sections/cold-open-section';
import { RoleSection } from './ui/sections/role-section';
import { ToolsSection } from './ui/sections/tools-section';
import { AgentSection } from './ui/sections/agent-section';
import { LearningsSection } from './ui/sections/learnings-section';
import { ScrollDebug } from './ui/scroll-debug';
import { SceneLoader } from './ui/scene-loader';
import { SkipIntroButton } from './ui/skip-intro-button';
import { ReducedMotionToggle } from './ui/reduced-motion-toggle';

// Root app shell. Layout:
//   - <Canvas> fixed full-viewport behind everything (z-0)
//   - <main> document-flow column of full-height sections (z-10)
//   - debug overlay above all (z-50)
//
// The scroll ref is created once here and shared via context — every act
// reads from the same RefObject inside useFrame, no React re-renders.

export function App() {
  const scrollRef = useScrollProgressRef();

  return (
    <ScrollContext.Provider value={scrollRef}>
      <div className="relative w-full bg-coke-black text-cream font-body">
        <div className="fixed inset-0 z-0">
          <SceneRoot>
            <FluidEnvironment />
            <ActColdOpen />
            <ActRole />
            <ActTools />
            <ActAgent />
            <ActBottle />
          </SceneRoot>
        </div>

        <main className="relative z-10">
          <SectionOverlay>
            <Section actId="cold-open">
              <ColdOpenSection />
            </Section>
            <Section actId="role">
              <RoleSection />
            </Section>
            <Section actId="tools">
              <ToolsSection />
            </Section>
            <Section actId="agent">
              <AgentSection />
            </Section>
            <Section actId="bottle">
              <LearningsSection />
            </Section>
          </SectionOverlay>
        </main>

        <ReducedMotionToggle />
        <SkipIntroButton />
        <SceneLoader />
        {import.meta.env.DEV && <ScrollDebug />}
      </div>
    </ScrollContext.Provider>
  );
}
