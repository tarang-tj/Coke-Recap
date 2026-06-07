/**
 * CocaColaVendingMachine — GLB-driven real Coca-Cola vending machine.
 *
 * Replaces the procedural VendingMachine component inside machine-hub.
 *
 * Normalization:
 *   The GLB's bounding box is measured once; the inner group is scaled so the
 *   machine's total height equals TARGET_HEIGHT (5.6 units), matching the
 *   procedural machine's coordinate convention. The base is offset to y=0.
 *
 * Interactivity:
 *   Four invisible hitbox planes overlay the bottle bay so users can click
 *   individual chapter slots (role / tools / agent / takeaways). Positions are
 *   tuned to the normalized machine frame — adjust the HITBOX_* constants if
 *   the GLB's bottle bay sits at a different location.
 *
 * Performance:
 *   - useGLTF.preload at module scope
 *   - scene.clone(true) per instance via useMemo
 *   - Per-instance disposal in useEffect cleanup
 */

import { useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { ViewId } from '../navigation-context';

const MACHINE_URL = '/assets/models/coca-cola-vending-machine.glb';

// Draco decoder path — the 31 MB GLB may be compressed.
useGLTF.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

// Preload at module load — asset starts fetching the instant this file is imported.
useGLTF.preload(MACHINE_URL);

/**
 * Target normalized height for the vending machine, in world units.
 * Matches the procedural machine's ~5.6-unit tall bounding box.
 */
const TARGET_HEIGHT = 5.6;

// ── Bottle-slot hitbox constants (all in the machine's LOCAL normalized frame) ──
// With the machine normalized to 5.6 units tall (base at y=0, top at y=5.6),
// the bottle bay is in the lower third of the machine body (~y=0.6 to y=2.2).
// z slightly forward of machine face (+0.6) so the hit area clears the GLB mesh.
// x positions evenly space 4 columns across the bay (~0.45 unit gap).
// Adjust these constants based on the console.log bbox output at runtime.
const HITBOX_Y = 1.4;           // vertical center of bottle display bay
const HITBOX_Z = 0.6;           // forward offset from machine origin (machine face ≈ 0.4)
const HITBOX_SIZE: [number, number, number] = [0.35, 1.0, 0.4]; // w × h × d per slot
const HITBOX_X_POSITIONS = [-0.7, -0.25, 0.25, 0.7] as const; // 4 evenly-spaced columns

type ChapterId = Exclude<ViewId, 'machine'>;
const CHAPTER_IDS: ChapterId[] = ['role', 'tools', 'agent', 'takeaways'];

export interface CocaColaVendingMachineProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onSelectChapter?: (chapter: ChapterId) => void;
}

export function CocaColaVendingMachine({
  position,
  rotation,
  scale = 1,
  onSelectChapter,
}: CocaColaVendingMachineProps) {
  const { scene } = useGLTF(MACHINE_URL);

  // Clone once per instance — each mounted machine gets its own scene graph.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box, derive normalization factor so machine height matches
  // TARGET_HEIGHT, and translate so the base sits at local y=0.
  const { normalizedScale, originOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Guard against a zero-height bbox (malformed GLB) — fall back to 1:1.
    const factor = size.y > 1e-4 ? TARGET_HEIGHT / size.y : 1;
    // Move base to y=0: offset = -box.min.y * factor
    const offsetY = -box.min.y * factor;

    // Runtime diagnostic — helps the orchestrator calibrate hitbox positions.
    console.log('[CocaColaVendingMachine] GLB bbox:', {
      size: size.toArray().map((v) => +v.toFixed(3)),
      center: center.toArray().map((v) => +v.toFixed(3)),
      normalizedScale: +factor.toFixed(4),
      normalizedHeight: TARGET_HEIGHT,
    });

    return {
      normalizedScale: factor,
      // Center on X/Z, base at y=0
      originOffset: new THREE.Vector3(-center.x * factor, offsetY, -center.z * factor),
    };
  }, [cloned]);

  // Dispose per-instance geometries/materials on unmount; the shared GLB scene
  // cache owned by useGLTF is left intact.
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
      {/* Normalized GLB — base at local y=0, height = TARGET_HEIGHT */}
      <group
        scale={normalizedScale}
        position={originOffset.toArray() as [number, number, number]}
      >
        <primitive object={cloned} />
      </group>

      {/* Invisible bottle-slot hitboxes — overlay the machine's bottle bay.
          Positioned in the OUTER group's space (after scale but before
          normalizedScale), so coords match the normalized machine frame.
          Each hitbox fires onSelectChapter for its assigned chapter. */}
      {CHAPTER_IDS.map((chapterId, i) => (
        <HitBox
          key={chapterId}
          chapter={chapterId}
          x={HITBOX_X_POSITIONS[i]}
          y={HITBOX_Y}
          z={HITBOX_Z}
          size={HITBOX_SIZE}
          onSelect={onSelectChapter}
        />
      ))}
    </group>
  );
}

// ── Sub-component: single invisible click hitbox ───────────────────────────────

interface HitBoxProps {
  chapter: ChapterId;
  x: number;
  y: number;
  z: number;
  size: [number, number, number];
  onSelect?: (chapter: ChapterId) => void;
}

function HitBox({ chapter, x, y, z, size, onSelect }: HitBoxProps) {
  const [hovered, setHovered] = useState(false);

  // Cursor feedback — pointer on hover, default on leave.
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  return (
    <mesh
      position={[x, y, z]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(chapter);
      }}
    >
      <boxGeometry args={size} />
      {/* Fully transparent — purely a click surface. */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
