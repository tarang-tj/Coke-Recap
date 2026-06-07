/**
 * BrickShopBuilding — GLB-driven low-poly Victorian brick shop exterior.
 *
 * Normalization:
 *   The GLB's bounding box is measured once; the inner group is scaled so the
 *   building's total height equals TARGET_HEIGHT (6.0 units). The base is
 *   offset to sit at local y=0.
 *
 * Performance:
 *   - useGLTF.preload at module scope
 *   - scene.clone(true) per instance so multiple corner buildings don't share
 *     mutable scene state
 *   - Geometry/material disposal on unmount via useEffect cleanup
 */

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BUILDING_URL = '/assets/models/brick-shop-building.glb';

// Preload at module load — asset starts fetching the instant this file is imported.
useGLTF.preload(BUILDING_URL);

/**
 * Target visible height for the building, in world units.
 * Roughly the height of a 3-4 story Victorian commercial building.
 */
const TARGET_HEIGHT = 6.0;

interface BrickShopBuildingProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Multiplier on top of the auto-normalized scale. */
  scale?: number;
}

export function BrickShopBuilding({ position, rotation, scale = 1 }: BrickShopBuildingProps) {
  const { scene } = useGLTF(BUILDING_URL);

  // Clone once per instance — multiple buildings on the block share the GLB
  // source but get independent scene graphs so per-instance transforms work.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box, derive a normalization factor so building height
  // matches TARGET_HEIGHT, and translate so the base sits at local y=0.
  const { normalizedScale, originOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Guard against a zero-height bbox (malformed GLB) — fall back to 1:1.
    const factor = size.y > 1e-4 ? TARGET_HEIGHT / size.y : 1;
    // Move base to y=0: offset = -box.min.y * factor
    const offsetY = -box.min.y * factor;
    return {
      normalizedScale: factor,
      // Center on X/Z, base at y=0
      originOffset: new THREE.Vector3(-center.x * factor, offsetY, -center.z * factor),
    };
  }, [cloned]);

  // Dispose per-instance geometries/materials on unmount; the shared scene from
  // useGLTF stays cached by drei.
  useEffect(
    () => () => {
      cloned.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
    },
    [cloned],
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group
        scale={normalizedScale}
        position={originOffset.toArray() as [number, number, number]}
      >
        <primitive object={cloned} />
      </group>
    </group>
  );
}
