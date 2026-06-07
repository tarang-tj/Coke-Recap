/**
 * JacobsPharmacyExterior — Atlanta downtown corner block, 1886.
 *
 * Replaces the procedural storefront with 3 instances of the brick-shop
 * GLB arranged as an L-shape corner block. Visible ONLY when
 * view === 'exterior' or during the entry dolly (entering === true).
 */
import { Text } from '@react-three/drei';
import { BrickShopBuilding } from './brand/brick-shop-building-gltf';
import { useNavigation } from './navigation-context';

export function JacobsPharmacyExterior() {
  const { view, entering } = useNavigation();

  return (
    <group name="jacobs-pharmacy-exterior" visible={view === 'exterior' || entering}>
      {/* Primary corner building — the pharmacy itself, fronting the camera.
          Reverted to identity rotation: user confirmed the prior 180° flip
          showed the back of the building. */}
      <BrickShopBuilding
        position={[0, -3.0, -4.0]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />

      {/* Neighboring building rotated 90° — establishes the corner block */}
      <BrickShopBuilding
        position={[5.5, -3.0, -4.5]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={1.0}
      />

      {/* Distant building down the street — smaller scale, atmospheric perspective */}
      <BrickShopBuilding
        position={[-7.0, -3.0, -6.5]}
        rotation={[0, Math.PI / 8, 0]}
        scale={0.85}
      />

      {/* JACOBS' PHARMACY gold-leaf signage — positioned above the primary
          building entrance. The primary building sits at position [0,-3,-4].
          Sign y=1.4 world, z=-2.4 (slightly forward of the building face).
          Tune y/z once the GLB entrance height is confirmed visually. */}
      <Text
        position={[0, 1.4, -2.4]}
        fontSize={0.55}
        color="#D4A847"
        outlineWidth={0.025}
        outlineColor="#5A3A12"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
      >
        JACOBS&apos; PHARMACY
      </Text>

      {/* Subtitle — cream on dark, tight tracking for an 1886 apothecary look */}
      <Text
        position={[0, 0.85, -2.4]}
        fontSize={0.18}
        color="#F1E9DA"
        outlineWidth={0.008}
        outlineColor="#2A1A08"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.18}
      >
        SODA · FOUNTAIN · DRUGS · 1886
      </Text>

      {/* Warm street-lamp glow at the storefront door */}
      <pointLight
        color="#FFE4A0"
        intensity={1.4}
        position={[0, 0.5, -2.5]}
        distance={4}
        decay={1.5}
      />
    </group>
  );
}
