import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei';
import { CameraRig } from './camera-rig';
import { SceneLighting } from './scene-lighting';
import { SceneBackdrop } from './scene-backdrop';
import { FloatingProps } from './brand/floating-props';
import { PostprocessingStack } from './postprocessing-stack';

// Persistent <Canvas> — mounted once, never unmounted.
// DPR capped at 1.5 to cut fill-rate on retina screens.
// AdaptiveDpr drops DPR further if FPS sags.
// PerformanceMonitor signals PostprocessingStack to disable Bloom on low-end GPUs.
// alpha:true lets the CSS radial-gradient background show through the canvas.

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
        <CameraRig />
        <SceneBackdrop />
        <FloatingProps />
        <SceneLighting />
        {children}
        <PostprocessingStack performanceFactor={perfFactor} />
      </Suspense>
    </Canvas>
  );
}
