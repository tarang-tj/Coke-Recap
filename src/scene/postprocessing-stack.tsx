import { EffectComposer, Bloom, Vignette, Noise, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// Postprocessing stack — tuned for the Bruno-aesthetic uplevel.
//
// SSAO:    Screen-space ambient occlusion — the cheap runtime substitute for
//          Blender Cycles bake. Darkens corners + crevices + window recesses
//          so the buildings stop looking like flat-shaded toys. Single biggest
//          dimensionality win without baking.
// Bloom:   tighter — only the brightest highlights bloom (threshold 0.93).
//          Lower intensity avoids the constant-glow problem.
// Vignette: stronger corner darkening (darkness 0.90) for cinematic depth.
// Noise:   mild film grain via OVERLAY blend — adds texture without muddying.
//          premultiply=false keeps grain stable (non-pulsing).
// MSAA:    WebGL2 multisampled render target (multisampling=4) — cheaper than
//          SMAA and avoids its large lookup-texture bundle payload.
// Low-end: When performanceFactor < 0.5, both SSAO and Bloom are dropped.
//          Noise + Vignette are kept (cheap, no additional render passes).

type Props = {
  performanceFactor?: number;
};

export function PostprocessingStack({ performanceFactor = 1 }: Props) {
  const heavyEffectsEnabled = performanceFactor >= 0.5;

  if (!heavyEffectsEnabled) {
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
      {/* SSAO — darkens corners, crevices, and recesses for dimensionality.
          Carefully tuned for the low-poly cartoony aesthetic — too aggressive
          and it makes everything look dirty; too subtle and it adds nothing. */}
      <SSAO
        samples={20}
        radius={0.18}
        intensity={32}
        luminanceInfluence={0.4}
        worldDistanceThreshold={2}
        worldDistanceFalloff={1}
        worldProximityThreshold={2}
        worldProximityFalloff={1}
        blendFunction={BlendFunction.MULTIPLY}
      />
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
