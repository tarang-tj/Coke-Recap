import { useMemo } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Cinematic postprocessing stack.
// When performanceFactor < 0.5 (detected by PerformanceMonitor in scene-root),
// Bloom is disabled to recover GPU headroom on low-end devices.

type Props = {
  performanceFactor?: number;
};

export function PostprocessingStack({ performanceFactor = 1 }: Props) {
  const bloomEnabled = performanceFactor >= 0.5;
  // ChromaticAberration expects a THREE.Vector2 for offset.
  const caOffset = useMemo(() => new THREE.Vector2(0.0008, 0.0014), []);

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      {bloomEnabled ? (
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      ) : (
        // Placeholder — EffectComposer requires at least one child when
        // conditionally rendering. Use zero-opacity Noise as a no-op.
        <Noise opacity={0} blendFunction={BlendFunction.SKIP} />
      )}
      <ChromaticAberration offset={caOffset} />
      <Vignette eskil={false} offset={0.2} darkness={0.7} />
      <Noise opacity={0.025} premultiply />
    </EffectComposer>
  );
}
