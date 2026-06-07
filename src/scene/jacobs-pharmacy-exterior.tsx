/**
 * JacobsPharmacyExterior — the ONE home scene.
 *
 * Five Points Atlanta 1886. The Blender-generated atlanta-corner-block.glb
 * contains the pharmacy + corner building + distant filler + cobblestone
 * street + plank sidewalk + two gas lamps (emissive glass globes). On top
 * of that we layer:
 *   - JACOBS' PHARMACY gold-leaf signage above the storefront awning
 *   - The Coca-Cola vending machine on the sidewalk right of the door
 *   - A warm fill light to lift the storefront in the dusk backdrop
 *
 * Visible when view === 'machine'. Hidden during chapter views via the
 * scene-transition mixer so the chapter motifs aren't competing.
 *
 * Block coordinate convention (matches the Blender source):
 *   Y up. Pharmacy storefront at x=0, facade faces -Z. Street at y=0.
 *   Sidewalk top at y=0.2. Pharmacy roofline at y≈14.
 */
import { useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AtlantaCornerBlock } from './brand/atlanta-corner-block-gltf';
import { CocaColaVendingMachine } from './brand/coca-cola-vending-machine-gltf';
import { useNavigation } from './navigation-context';
import type { ViewId } from './navigation-context';
import { useSceneMixes } from './scene-transition-context';

// ── Vending-machine placement on the sidewalk ────────────────────────────────
// In the GLB (after Blender yup conversion), the pharmacy facade sits at
// world z≈+3.55 facing toward +Z (toward the camera). The sidewalk lives
// just in front of the facade at z ∈ [3.7, 6.3]. Sidewalk top is at y=0.2.
// Place the machine to the right of the pharmacy door (door at x≈0.6),
// base flat on the sidewalk, angled slightly toward the camera.
const MACHINE_POSITION: [number, number, number] = [2.4, 0.2, 5.0];
const MACHINE_ROTATION: [number, number, number] = [0, Math.PI / 8, 0];

// JACOBS' PHARMACY signage sits just in front of the brick facade at z≈3.6,
// above the second-floor windows so it reads as a hanging hand-painted sign.
const SIGN_Y = 8.0;
const SIGN_Z = 3.7;

type ChapterId = Exclude<ViewId, 'machine'>;

interface Props {
  onSelectChapter?: (chapter: ChapterId) => void;
}

export function JacobsPharmacyExterior({ onSelectChapter }: Props) {
  const { view } = useNavigation();
  const mixesRef = useSceneMixes();
  const groupRef = useRef<THREE.Group>(null);

  // Fade in/out with the machine mix so the exterior scene transitions
  // smoothly alongside the chapter views.
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const mix = mixesRef.current.machine;
    g.visible = mix > 0.002;
  });

  return (
    <group ref={groupRef} name="jacobs-pharmacy-exterior" visible={view === 'machine'}>
      {/* The Blender-generated 1886 corner block — buildings, street, sidewalk, gas lamps */}
      <AtlantaCornerBlock position={[0, 0, 0]} />

      {/* JACOBS' PHARMACY gold-leaf signage hanging on the brick facade,
          above the awning, below the second-floor windows */}
      <Text
        position={[0, SIGN_Y, SIGN_Z]}
        rotation={[0, Math.PI, 0]}
        fontSize={1.4}
        color="#D4A847"
        outlineWidth={0.06}
        outlineColor="#5A3A12"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        JACOBS&apos; PHARMACY
      </Text>

      {/* SODA · FOUNTAIN · DRUGS · 1886 — small subtitle below the main sign */}
      <Text
        position={[0, SIGN_Y - 1.0, SIGN_Z]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.42}
        color="#F1E9DA"
        outlineWidth={0.02}
        outlineColor="#2A1A08"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.18}
      >
        SODA · FOUNTAIN · DRUGS · 1886
      </Text>

      {/* Warm fill light from the gas-lamp direction (sidewalk in front of
          the pharmacy door) — complements the two emissive globes baked
          into the GLB and lifts the storefront in the dusk backdrop. */}
      <pointLight
        color="#FFE4A0"
        intensity={1.5}
        position={[0, 4.5, 5.5]}
        distance={9}
        decay={1.6}
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
