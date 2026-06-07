/**
 * JacobsPharmacyExterior — the ONE home scene.
 *
 * Atlanta downtown corner block, 1886. The Coca-Cola vending machine sits on
 * the sidewalk just to the right of the pharmacy door. This component owns:
 *   - Three brick-shop building instances (L-shape corner block)
 *   - JACOBS' PHARMACY signage
 *   - The vending machine on the sidewalk (with chapter-select callbacks)
 *   - Warm gas-lamp glow at the door
 *
 * Visible when view === 'machine'. Hidden during chapter views so their 3-D
 * motifs aren't competing with the street scene.
 *
 * Machine sidewalk position constants (tune at top of file):
 *   MACHINE_POSITION — right of the pharmacy door, base on sidewalk at y=-3
 *   MACHINE_ROTATION — slight inward angle toward camera
 */
import { Text } from '@react-three/drei';
import { CocaColaVendingMachine } from './brand/coca-cola-vending-machine-gltf';
import { BrickShopBuilding } from './brand/brick-shop-building-gltf';
import { useNavigation } from './navigation-context';
import type { ViewId } from './navigation-context';
import { useSceneMixes } from './scene-transition-context';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Machine placement constants ───────────────────────────────────────────────
// Primary brick-shop is at world [0, -3, -4]. The pharmacy door faces the
// camera roughly at x=0. Place the machine to the right of the door, base
// on the sidewalk at y=-3.
const MACHINE_POSITION: [number, number, number] = [1.5, -3.0, -2.0];
const MACHINE_ROTATION: [number, number, number] = [0, -Math.PI / 12, 0];

type ChapterId = Exclude<ViewId, 'machine'>;

interface Props {
  onSelectChapter?: (chapter: ChapterId) => void;
}

export function JacobsPharmacyExterior({ onSelectChapter }: Props) {
  const { view } = useNavigation();
  const mixesRef = useSceneMixes();
  const groupRef = useRef<THREE.Group>(null);

  // Fade in/out with the machine mix so the exterior scene transitions
  // smoothly alongside the vending machine group.
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const mix = mixesRef.current.machine;
    g.visible = mix > 0.002;
  });

  return (
    <group ref={groupRef} name="jacobs-pharmacy-exterior" visible={view === 'machine'}>
      {/* Primary corner building — the pharmacy itself, fronting the camera */}
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

      {/* Distant building down the street — smaller scale, atmospheric depth */}
      <BrickShopBuilding
        position={[-7.0, -3.0, -6.5]}
        rotation={[0, Math.PI / 8, 0]}
        scale={0.85}
      />

      {/* JACOBS' PHARMACY gold-leaf signage — above the primary building entrance */}
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

      {/* Subtitle — cream on dark, 1886 apothecary style */}
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

      {/* Warm gas-lamp glow at the storefront door */}
      <pointLight
        color="#FFE4A0"
        intensity={1.4}
        position={[0, 0.5, -2.5]}
        distance={4}
        decay={1.5}
      />

      {/* Vending machine on the sidewalk, right of the pharmacy door */}
      <CocaColaVendingMachine
        position={MACHINE_POSITION}
        rotation={MACHINE_ROTATION}
        onSelectChapter={onSelectChapter}
      />
    </group>
  );
}
