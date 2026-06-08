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
      {/* Golden-hour sun — warm amber from upper-right, low angle for long shadows */}
      <directionalLight
        position={[8, 6, 4]}
        intensity={1.4}
        color="#FFC58A"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Sky fill — warm peach above, cool blue below, soft envelope */}
      <hemisphereLight args={['#F2B58A', '#3A4A6A', 0.55]} />

      {/* Subtle ambient lift — keeps deep shadow detail readable */}
      <ambientLight intensity={0.18} color="#FFEFE0" />
    </>
  );
}
