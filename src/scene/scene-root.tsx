import { Suspense, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Environment } from '@react-three/drei';
import { CameraRig } from './camera-rig';
import { SceneLighting } from './scene-lighting';
import { SceneBackdrop } from './scene-backdrop';
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
      camera={{ position: [-8, 7, -34], fov: 55, near: 0.5, far: 400 }}
      dpr={[1, 1.5]}
      shadows="soft"
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      // ACES filmic + a touch under 1.0 exposure recovers the blown cream
      // facades and deepens the golden-hour grade (the scene was lit slightly
      // hot; this reins in the highlights without crushing shadows).
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.78;
      }}
    >
      <PerformanceMonitor
        onChange={({ factor }) => setPerfFactor(factor)}
      />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <Suspense fallback={null}>
        {/* HDR environment — self-hosted warehouse HDRI (was the drei
            `preset`, which fetches from raw.githack.com at runtime — a
            third-party CDN we don't control). background={false} so our
            custom SceneBackdrop sky wins visually. */}
        <Environment
          files="/assets/hdr/warehouse-1k.hdr"
          background={false}
          // The bright indoor HDRI was stacking on top of sun + hemisphere +
          // ambient and washing the near-white street out to pure white.
          // Keep it for the glass/chrome reflections, but at a fraction of
          // its diffuse contribution.
          environmentIntensity={0.45}
        />

        <CameraRig />
        <SceneBackdrop />
        <SceneLighting />
        {children}
        <PostprocessingStack performanceFactor={perfFactor} />
      </Suspense>
    </Canvas>
  );
}
