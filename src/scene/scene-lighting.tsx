import { Environment } from '@react-three/drei';

// Scene lighting — tuned for the red Coca-Cola world.
// Bright cream/white key so white ribbon and bottle cap pop against red bg.
// Cool rim for depth separation; modest ambient to avoid washing out red.

export function SceneLighting() {
  return (
    <>
      {/* Free IBL reflections — lifts all PBR/transmission materials */}
      <Environment preset="night" />

      {/* Modest ambient — enough to read shapes without flattening the red */}
      <ambientLight intensity={0.25} color="#FFF8F0" />

      {/* Bright cream/white key — above-left, makes white ribbon/cap pop */}
      <directionalLight
        position={[-4, 5, 3]}
        intensity={2.2}
        color="#FFFAF2"
      />

      {/* Cool cyan rim — below-right, separation against warm red bg */}
      <directionalLight
        position={[4, -3, -2]}
        intensity={0.7}
        color="#A8C8E8"
      />

      {/* Soft warm fill — keeps glass/transmission readable */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.6}
        color="#FFE8C8"
        distance={12}
        decay={2}
      />
    </>
  );
}
