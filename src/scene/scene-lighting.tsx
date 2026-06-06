import { Environment } from '@react-three/drei';

// Scene lighting — provides free PBR reflections via Environment preset
// plus hand-placed lights for dramatic Coke-branded mood.
//
// Warm caramel key from above-left, cool blue-tinted rim from below-right,
// soft warm fill at origin. Ambient is very low to keep the dark bg dark.

export function SceneLighting() {
  return (
    <>
      {/* Free IBL reflections — lifts all PBR/transmission materials */}
      <Environment preset="night" />

      {/* Very low ambient so the dark background stays dark */}
      <ambientLight intensity={0.15} color="#F1E9DA" />

      {/* Warm caramel key light — above-left, Coke-amber tint */}
      <directionalLight
        position={[-4, 5, 3]}
        intensity={1.2}
        color="#C97B30"
      />

      {/* Cool blue-tinted rim — below-right for separation */}
      <directionalLight
        position={[4, -3, -2]}
        intensity={0.6}
        color="#1A2A4A"
      />

      {/* Warm white center fill — keeps transmission glass readable */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.8}
        color="#FFE8C8"
        distance={12}
        decay={2}
      />
    </>
  );
}
