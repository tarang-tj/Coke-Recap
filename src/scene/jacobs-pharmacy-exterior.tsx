/**
 * JacobsPharmacyExterior — Atlanta downtown corner block, 1886.
 *
 * Replaces the procedural storefront with 3 instances of the brick-shop
 * GLB arranged as an L-shape corner block. Visible ONLY when
 * view === 'exterior' or during the entry dolly (entering === true).
 */
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
