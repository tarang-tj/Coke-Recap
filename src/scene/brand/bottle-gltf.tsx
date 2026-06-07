/**
 * BottleGltf — GLB-asset-driven Coca-Cola contour bottle.
 *
 * Drop-in replacement for <CokeBottle /> in all three high-visibility consumers
 * (takeaways hero, vending-machine slots, wooden crate).
 *
 * Honors the full CokeBottleProps interface:
 *   scale, lift    → outer group transform
 *   highlight      → emissive lerp across all MeshStandardMaterial/MeshPhysicalMaterial
 *   showLogo       → no-op (GLB materials are baked)
 *   customLabel    → no-op
 *   interior       → no-op
 *   reducedMotion  → no-op
 *   onPointerOver, onPointerOut, onClick → wired to outer group
 *
 * Normalization:
 *   The GLB's bounding box is measured once; the inner group is scaled so the
 *   bottle's total height equals TARGET_HEIGHT (1.55 units), matching the
 *   procedural bottle's coordinate convention. The base is offset to sit at
 *   local y=0.
 *
 * Performance:
 *   - useGLTF.preload at module scope → asset starts fetching on import
 *   - scene.clone(true) per instance via useMemo → no shared mutable scene state
 *   - Material refs collected once in useEffect, reused every frame
 */

import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CokeBottleProps } from './coke-bottle';

const BOTTLE_URL = '/assets/models/coca-cola-bottle.glb';

// Preload at module load — the asset starts fetching the instant this file is imported.
useGLTF.preload(BOTTLE_URL);

/**
 * Target normalized height for the bottle, matching the procedural bottle's
 * y=1.55 total height. Consumer code uses scale={X} relative to this baseline.
 */
const TARGET_HEIGHT = 1.55;

export function BottleGltf({
  scale = 1,
  lift = 0,
  highlight = 0,
  // showLogo, customLabel, interior, reducedMotion — accepted silently (GLB materials are fixed)
  showLogo: _showLogo,
  customLabel: _customLabel,
  interior: _interior,
  reducedMotion: _reducedMotion,
  onPointerOver,
  onPointerOut,
  onClick,
}: CokeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(BOTTLE_URL);

  // Clone once per instance so multiple bottles don't share mutable scene state.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box once to derive normalization factor.
  // Scale inner group so total height = TARGET_HEIGHT; offset so base sits at y=0.
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

  // Collect all MeshStandard/MeshPhysical materials AND each material's baked
  // emissiveIntensity so the highlight prop adds ON TOP rather than overriding
  // (e.g. a GLB with a baked wordmark glow stays glowing when highlight=0).
  // Saved in a ref so useFrame doesn't traverse the scene graph every tick.
  const highlightMaterialsRef = useRef<
    { mat: THREE.MeshStandardMaterial; baseEmissive: number }[]
  >([]);

  useEffect(() => {
    const collected: { mat: THREE.MeshStandardMaterial; baseEmissive: number }[] = [];
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          const std = m as THREE.MeshStandardMaterial;
          if (std.isMeshStandardMaterial) collected.push({ mat: std, baseEmissive: std.emissiveIntensity });
        }
      } else {
        const std = mat as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial) collected.push({ mat: std, baseEmissive: std.emissiveIntensity });
      }
    });
    highlightMaterialsRef.current = collected;
  }, [cloned]);

  // Dispose the cloned scene's geometries/materials on unmount.
  // The shared scene from useGLTF stays cached by drei — only the per-instance
  // clone needs cleanup.
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

  // Keep a ref to the current highlight value so useFrame can read it without
  // triggering re-renders.
  const hRef = useRef(highlight);
  hRef.current = highlight;

  useFrame((_, dt) => {
    const mats = highlightMaterialsRef.current;
    if (!mats.length) return;
    for (const { mat, baseEmissive } of mats) {
      const target = baseEmissive + hRef.current * 0.35;
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * Math.min(1, dt * 8);
    }
  });

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, lift, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <group
        scale={normalizedScale}
        position={originOffset.toArray() as [number, number, number]}
      >
        <primitive object={cloned} />
      </group>
    </group>
  );
}
