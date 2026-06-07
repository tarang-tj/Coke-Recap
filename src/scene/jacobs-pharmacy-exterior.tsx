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
import { BottleGltf } from './brand/bottle-gltf';
import { useNavigation } from './navigation-context';
import type { ViewId } from './navigation-context';
import { useSceneMixes } from './scene-transition-context';

// ── Hero bottle on the pedestal — the main visual anchor ─────────────────────
// The contour bottle is the most iconic Coca-Cola artifact ever designed and
// belongs as the literal centerpiece of an internship-recap site. Floats on a
// marble pedestal in the foreground center of the sidewalk, dramatically uplit
// by the bottle-pedestal spot, with the pharmacy + corner block behind it.
const HERO_BOTTLE_POSITION: [number, number, number] = [0, 1.4, 6.8];
const HERO_BOTTLE_SCALE = 4.0; // ~6.2 units tall, taller than ground floor

// Pedestal — cream marble cylinder + dome cap
const PEDESTAL_POSITION: [number, number, number] = [0, 0.2, 6.8];
const PEDESTAL_HEIGHT = 1.2;
const PEDESTAL_RADIUS = 1.3;

// ── Vending machine — supporting role, off to the side ──────────────────────
// Pushed further right so it doesn't compete with the hero bottle. Still
// interactive (click bottles → chapters), still on the sidewalk.
const MACHINE_POSITION: [number, number, number] = [5.0, 0.2, 5.4];
const MACHINE_ROTATION: [number, number, number] = [0, -Math.PI / 10, 0];

// JACOBS' PHARMACY signage sits just in front of the brick facade above
// the awning. Default drei <Text> faces +Z which is where the camera is —
// no rotation needed.
const SIGN_Y = 4.2;
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
        fontSize={0.85}
        color="#D4A847"
        outlineWidth={0.04}
        outlineColor="#5A3A12"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        JACOBS&apos; PHARMACY
      </Text>

      {/* SODA · FOUNTAIN · DRUGS · 1886 — small subtitle below the main sign */}
      <Text
        position={[0, SIGN_Y - 0.65, SIGN_Z]}
        fontSize={0.28}
        color="#F1E9DA"
        outlineWidth={0.015}
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

      {/* ── HERO PEDESTAL — cream marble base for the giant bottle ───────── */}
      <group position={PEDESTAL_POSITION}>
        {/* Marble column */}
        <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[PEDESTAL_RADIUS * 0.85, PEDESTAL_RADIUS, PEDESTAL_HEIGHT, 24]} />
          <meshStandardMaterial color="#F1E9DA" roughness={0.45} metalness={0.05} />
        </mesh>
        {/* Carved top cap */}
        <mesh position={[0, PEDESTAL_HEIGHT + 0.06, 0]} castShadow>
          <cylinderGeometry args={[PEDESTAL_RADIUS * 1.05, PEDESTAL_RADIUS * 0.85, 0.12, 24]} />
          <meshStandardMaterial color="#E8DEC0" roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Carved base ring */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[PEDESTAL_RADIUS * 1.05, PEDESTAL_RADIUS * 1.05, 0.12, 24]} />
          <meshStandardMaterial color="#E8DEC0" roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Brass placard on the front of the pedestal — period-correct museum touch */}
        <mesh position={[0, PEDESTAL_HEIGHT * 0.5, PEDESTAL_RADIUS + 0.01]} castShadow>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
        </mesh>
        <Text
          position={[0, PEDESTAL_HEIGHT * 0.5, PEDESTAL_RADIUS + 0.025]}
          fontSize={0.07}
          color="#2A1A08"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
          maxWidth={0.82}
        >
          {`COCA-COLA · INVENTED MAY 8, 1886\nJACOBS' PHARMACY · ATLANTA, GA`}
        </Text>
      </group>

      {/* ── HERO BOTTLE — giant contour bottle floating on the pedestal ──── */}
      <group position={HERO_BOTTLE_POSITION}>
        <BottleGltf scale={HERO_BOTTLE_SCALE} highlight={0.25} />
        {/* Dramatic up-spot on the hero bottle — museum-vitrine pop */}
        <pointLight
          color="#FFE6B0"
          intensity={1.4}
          position={[0, 5, 0.5]}
          distance={7}
          decay={1.8}
        />
        {/* Warm rim light from behind-right for silhouette + glow */}
        <pointLight
          color="#E8835A"
          intensity={0.9}
          position={[1.5, 3, -1.5]}
          distance={5}
          decay={1.8}
        />
      </group>

      {/* Vending machine — supporting detail, pushed to the side */}
      <CocaColaVendingMachine
        position={MACHINE_POSITION}
        rotation={MACHINE_ROTATION}
        onSelectChapter={onSelectChapter}
      />
    </group>
  );
}
