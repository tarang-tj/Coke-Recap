import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';

// Postprocessing stack — trimmed for the red Coca-Cola world.
// ChromaticAberration and Noise removed (were visually muddy on red bg).
// SMAA replaces canvas antialias (antialias:false on Canvas to save MSAA cost).
// When performanceFactor < 0.5, Bloom is skipped but SMAA + Vignette remain.

type Props = {
  performanceFactor?: number;
};

export function PostprocessingStack({ performanceFactor = 1 }: Props) {
  const bloomEnabled = performanceFactor >= 0.5;

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      {bloomEnabled && (
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.65}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
      )}
      <Vignette eskil={false} offset={0.25} darkness={0.65} />
      <SMAA />
    </EffectComposer>
  );
}
