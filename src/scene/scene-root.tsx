import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { CameraRig } from './camera-rig';
import { SceneLighting } from './scene-lighting';
import { SceneBackdrop } from './scene-backdrop';
import { FloatingProps } from './brand/floating-props';
import { PostprocessingStack } from './postprocessing-stack';
import { useNavigation } from './navigation-context';

// Persistent <Canvas> — mounted once, never unmounted.
// DPR capped at 1.5 to cut fill-rate on retina screens.
// AdaptiveDpr drops DPR further if FPS sags.
// PerformanceMonitor signals PostprocessingStack to disable Bloom on low-end GPUs.
// alpha:true lets the CSS radial-gradient background show through the canvas.

// ── Interior orbit controls — active ONLY in the machine view ────────────────
// Mounted inside the Canvas so it has access to the R3F camera context.
// makeDefault=false so it doesn't override the camera-rig's initial setup or
// chapter-view transitions (which unmount this component by leaving 'machine').
// The camera-rig early-returns from its frame loop when view==='machine' and
// no transition is active, so there is NO fight between rig and controls.
function InteriorOrbitControls() {
  const { view } = useNavigation();
  if (view !== 'machine') return null;
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      minDistance={3}
      maxDistance={8}
      minPolarAngle={Math.PI * 0.25}    // can't look straight up
      maxPolarAngle={Math.PI * 0.65}    // can't look straight down
      minAzimuthAngle={-Math.PI * 0.4}  // limit horizontal sweep
      maxAzimuthAngle={Math.PI * 0.4}
      target={[2.0, 0, -4.5]}           // matches machine world center
      makeDefault={false}
    />
  );
}

type Props = {
  children?: React.ReactNode;
};

export function SceneRoot({ children }: Props) {
  const [perfFactor, setPerfFactor] = useState(1);

  return (
    <Canvas
      camera={{ position: [0, 0.3, 6], fov: 55, near: 0.05, far: 80 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor
        onChange={({ factor }) => setPerfFactor(factor)}
      />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Suspense fallback={null}>
        {/* HDR environment — warehouse preset for chrome/glass reflections.
            background={false} so our custom SceneBackdrop wins visually. */}
        <Environment preset="warehouse" background={false} />

        {/* Ground shadow plane — soft contact shadows for the Role frame
            (which has no built-in floor). Tools and Agent have their own
            procedural ground planes (planks + tile) at higher y, so the
            shadow here lives below the visible frame for all three acts. */}
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.5}
          blur={2.8}
          far={4}
          resolution={512}
        />

        <CameraRig />
        <InteriorOrbitControls />
        <SceneBackdrop />
        <FloatingProps />
        <SceneLighting />
        {children}
        <PostprocessingStack performanceFactor={perfFactor} />
      </Suspense>
    </Canvas>
  );
}
