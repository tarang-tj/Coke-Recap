/**
 * AtlantaCornerBlock — Five Points 1886 corner block, Blender-generated.
 *
 * Single GLB built procedurally in scripts/build-atlanta-corner-block.py
 * (run with Blender 5.1+ headless). Contains the pharmacy + corner building
 * + distant filler + cobblestone street + plank sidewalk + two gas lamps with
 * baked emissive glass globes.
 *
 * Coordinate convention (matches Blender output):
 *   - Y is up
 *   - Pharmacy storefront at x=0, z=-1 (facade toward -Z)
 *   - Sidewalk top at y=0.2, street at y=0
 *   - Pharmacy roofline ~y=14
 */
import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BLOCK_URL = '/assets/models/atlanta-corner-block.glb';
useGLTF.preload(BLOCK_URL);

interface AtlantaCornerBlockProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function AtlantaCornerBlock({ position, rotation, scale = 1 }: AtlantaCornerBlockProps) {
  const { scene } = useGLTF(BLOCK_URL);

  // Clone so multiple instances (if ever) can coexist without sharing mutable state.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Dispose per-instance geometries/materials on unmount.
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
      <primitive object={cloned} />
    </group>
  );
}
