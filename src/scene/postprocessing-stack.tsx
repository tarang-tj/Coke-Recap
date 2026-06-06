import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

// Postprocessing stack — trimmed for the red Coca-Cola world.
// ChromaticAberration and Noise removed (were visually muddy on red bg).
// Edge antialiasing via the composer's WebGL2 multisampled render target
// (multisampling={4}) instead of the SMAA effect — cheaper and avoids SMAA's
// large embedded lookup-texture payload in the bundle.
// When performanceFactor < 0.5, Bloom's pass is dropped on low-end GPUs.

type Props = {
  performanceFactor?: number;
};

export function PostprocessingStack({ performanceFactor = 1 }: Props) {
  const bloomEnabled = performanceFactor >= 0.5;

  // Two explicit trees so EffectComposer always receives valid Element
  // children (a `false` child fails its strict typing).
  if (!bloomEnabled) {
    return (
      <EffectComposer multisampling={4}>
        <Vignette eskil={false} offset={0.25} darkness={0.65} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.65}
        luminanceSmoothing={0.5}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.25} darkness={0.65} />
    </EffectComposer>
  );
}
