// Scene-wide 3-light hero setup for the Coca-Cola world.
//
// Key:  warm cream directional from upper-left — anchors shading, casts shadows
// Fill: hemisphere light (sky-red / ground-burgundy) — envelops without flatness
// Rim:  Coca-Cola red point from behind-right-below — brand-consistent glow accent
// Lift: subtle ambient so deep shadows don't go pitch-black
//
// The per-act supplemental lights live inside each act file; this is the baseline.

export function SceneLighting() {
  return (
    <>
      {/* Hero key — warm cream from upper-left */}
      <directionalLight
        position={[-5, 8, 4]}
        intensity={0.85}
        color="#FFF6E0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Soft fill — hemisphere wraps the world in brand palette */}
      <hemisphereLight args={['#FF8A8A', '#3A0006', 0.22]} />

      {/* Brand accent rim — Coca-Cola red from behind-right-below */}
      <pointLight
        position={[4, -2, -3]}
        intensity={1.0}
        color="#F40009"
        distance={7}
        decay={2}
      />

      {/* Subtle ambient lift — prevents pitch-black shadow areas */}
      <ambientLight intensity={0.08} color="#FFEFE0" />
    </>
  );
}
