/**
 * CocaColaDiorama — the single 3-D world.
 *
 * Loads the complete 1886 Five Points Atlanta diorama (Jacob's Pharmacy, the
 * full city block, the soda fountain, the Coca-Cola vending machine + crates,
 * the animated horse-drawn delivery wagon, the motorcar, chimney smoke,
 * pedestrians, birds, trees, and the skyline backdrop) from one GLB and plays
 * its 30 baked animation clips through an AnimationMixer.
 *
 * The GLB is authored at real-world-ish scale with its base at world y≈0 and
 * the pharmacy facade facing -Z (the street side), so it is mounted at the
 * origin with no normalization — camera-rig poses are written in these same
 * world coordinates.
 *
 * The 30 baked clips are intentionally NOT played: the authored wheel/axle
 * rotations are broken (wheels spin off-axis), so the diorama is presented as a
 * still tableau. Interactivity comes from the recap layer instead, not the bake.
 */

import { useGLTF } from '@react-three/drei';

const DIORAMA_URL = '/assets/models/coca-cola-diorama.glb';

// Begin fetching the moment this module is imported.
useGLTF.preload(DIORAMA_URL);

export function CocaColaDiorama() {
  const { scene } = useGLTF(DIORAMA_URL);
  return <primitive object={scene} />;
}
