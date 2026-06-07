/**
 * JacobsPharmacy — Convenience store interior wrapping the vending machine.
 *
 * Mounted inside machine-hub, which gates visibility on the machine envelope
 * mix > 0.002. No explicit visibility prop needed here.
 *
 * The convenience-store GLB surrounds the vending machine. ContactShadows
 * anchor the machine to the store floor.
 */
import { ContactShadows } from '@react-three/drei';
import { ConvenienceStore } from './brand/convenience-store-gltf';

export function JacobsPharmacy() {
  return (
    <group name="jacobs-pharmacy-interior">
      {/* Convenience store interior GLB — wraps around the vending machine.
          Positioned so the floor sits at y=-3 and the camera looks toward
          the machine which sits inside this space. */}
      <ConvenienceStore
        position={[0, -3.0, -2.0]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />

      {/* Contact shadows anchor the vending machine to the store floor. */}
      <ContactShadows
        position={[0, -2.95, -1.0]}
        opacity={0.5}
        blur={2.4}
        far={3.5}
        resolution={512}
      />
    </group>
  );
}
