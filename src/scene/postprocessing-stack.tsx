import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// Postprocessing stack — tuned for art-direction uplevel.
//
// Bloom:   tighter — only the brightest highlights bloom (threshold 0.85).
//          Lower intensity avoids the constant-glow problem.
// Vignette: stronger corner darkening (darkness 0.85) for cinematic depth.
// Noise:   mild film grain via OVERLAY blend — adds texture without muddying.
//          premultiply=false keeps grain stable (non-pulsing).
// MSAA:    WebGL2 multisampled render target (multisampling=4) — cheaper than
//          SMAA and avoids its large lookup-texture bundle payload.
// Low-end: When performanceFactor < 0.5, Bloom is dropped. Noise + Vignette
//          are kept (cheap, no additional render passes).

type Props = {
  performanceFactor?: number;
};

export function PostprocessingStack({ performanceFactor = 1 }: Props) {
  const bloomEnabled = performanceFactor >= 0.5;

  if (!bloomEnabled) {
    return (
      <EffectComposer multisampling={4}>
        <Vignette eskil={false} offset={0.3} darkness={0.90} />
        <Noise
          premultiply={false}
          opacity={0.06}
          blendFunction={BlendFunction.OVERLAY}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.30}
        luminanceThreshold={0.93}
        luminanceSmoothing={0.025}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.3} darkness={0.90} />
      <Noise
        premultiply={false}
        opacity={0.06}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
