/**
 * ConvenienceStore — GLB-driven convenience store interior environment.
 *
 * Wraps around the vending machine inside the pharmacy scene. The v2 GLB is
 * 75 MB with higher detail — decoder path is set at module scope.
 *
 * Normalization:
 *   The GLB's bounding box is measured once; the inner group is scaled so the
 *   room's total height equals TARGET_HEIGHT (6.0 units). The base is offset
 *   to sit at local y=0.
 *
 * Performance:
 *   - useGLTF.preload at module scope
 *   - scene.clone(true) per instance via useMemo
 *   - Geometry/material disposal on unmount via useEffect cleanup
 */

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const STORE_URL = '/assets/models/convenience-store-interior-v2.glb';

// Set Draco decoder path before preload — the 75 MB v2 GLB may be compressed.
useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

// Preload at module load — asset starts fetching the instant this file is imported.
useGLTF.preload(STORE_URL);

/**
 * Target visible height for the interior room, in world units.
 * Scaled to encompass the vending machine (~5.6 units tall).
 */
const TARGET_HEIGHT = 6.0;

interface ConvenienceStoreProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Multiplier on top of the auto-normalized scale. */
  scale?: number;
}

export function ConvenienceStore({ position, rotation, scale = 1 }: ConvenienceStoreProps) {
  const { scene } = useGLTF(STORE_URL);

  // Clone once per instance — each mounted store gets its own scene graph.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box, derive normalization factor so room height matches
  // TARGET_HEIGHT, and translate so the floor sits at local y=0.
  const { normalizedScale, originOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Guard against a zero-height bbox (malformed GLB) — fall back to 1:1.
    const factor = size.y > 1e-4 ? TARGET_HEIGHT / size.y : 1;
    // Move floor to y=0: offset = -box.min.y * factor
    const offsetY = -box.min.y * factor;
    return {
      normalizedScale: factor,
      // Center on X/Z, floor at y=0
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
