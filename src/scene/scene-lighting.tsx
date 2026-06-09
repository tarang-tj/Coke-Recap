// Golden-hour Atlanta street lighting — 1886 dusk on Five Points.
//
// Sun:  warm golden directional from upper-right at low angle, casts long shadows
// Sky:  hemisphere light (warm peach sky / cool blue ground) — natural fill
// Lift: subtle ambient so deep shadows don't go pitch-black
//
// No brand-red accent — the buildings' real color should read against natural
// sunset light, not be tinted by a Coca-Cola spotlight.

export function SceneLighting() {
  return (
    <>
      {/* Golden-hour sun — warm amber from upper-right, low angle for long
          shadows. The shadow camera must cover the whole block (x ≈ -30..42,
          z ≈ -22..6 in diorama world space), so its orthographic frustum is
          widened from the tiny ±5 default and the light is pushed out along
          its direction to keep the entire town inside the near/far range. */}
      <directionalLight
        position={[28, 32, 18]}
        intensity={1.25}
        color="#FFC58A"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* Sky fill — warm peach above, cool blue below, soft envelope */}
      <hemisphereLight args={['#F2B58A', '#3A4A6A', 0.5]} />

      {/* Subtle ambient lift — keeps deep shadow detail readable */}
      <ambientLight intensity={0.15} color="#FFEFE0" />
    </>
  );
}
