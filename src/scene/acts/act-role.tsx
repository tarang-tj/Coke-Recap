import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useNavigation } from '../navigation-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Act 1 — Role: iconic Coca-Cola crimped bottle cap. clearcoat only — no render pass overhead.

const COKE_RED = '#F40009';
const COKE_RED_DARK = '#B00712';
const CREAM = '#F1E9DA';

const CAP_RADIUS = 1.1;
const CAP_HEIGHT = 0.32;
const FLUTE_COUNT = 21;
// Flute ring sits at the very outer edge of the cap disc
const FLUTE_RING_R = CAP_RADIUS * 0.97;

export function ActRole() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const capMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const fluteRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<boolean>(false);

  // View-state envelope: damped 0→1 when 'role' is active, 1→0 otherwise
  const viewRef = useRef(view); viewRef.current = view;
  const envRef = useRef(0);

  // Per-flute instance matrices — 21 boxes arranged tangentially around the cap rim
  const fluteMatrices = useMemo(() => {
    const helper = new THREE.Object3D();
    return Array.from({ length: FLUTE_COUNT }, (_, i) => {
      const angle = (i / FLUTE_COUNT) * Math.PI * 2;
      helper.position.set(
        Math.cos(angle) * FLUTE_RING_R,
        Math.sin(angle) * FLUTE_RING_R,
        0,
      );
      // Tangent to ring (Z rotation) + slight forward lean simulating the crimp fold
      helper.rotation.set(0.18, 0, angle + Math.PI / 2);
      helper.updateMatrix();
      return helper.matrix.clone();
    });
  }, []);

  useLayoutEffect(() => {
    const mesh = fluteRef.current;
    if (!mesh) return;
    fluteMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [fluteMatrices]);

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    // Critically damped fade in/out (~0.4 s time constant)
    const target = viewRef.current === 'role' ? 1 : 0;
    envRef.current += (target - envRef.current) * Math.min(1, dt * 4);
    const active = envRef.current > 0.002;

    g.visible = active;
    if (!active) {
      // Clear latched hover cursor if we navigated away mid-hover.
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }

    const envelope = envRef.current;

    // Spin only the cap/flutes (spinRef) so the upright wordmark stays legible.
    // Hover accelerates the spin for a tactile response.
    const spin = spinRef.current;
    if (spin && !reduced) {
      const spinSpeed = hoveredRef.current ? 0.9 : 0.35;
      spin.rotation.z += dt * spinSpeed;
      spin.rotation.x = 0.08 * Math.sin(clock.elapsedTime * 0.7);
      spin.rotation.y = 0.06 * Math.sin(clock.elapsedTime * 0.5 + 1.2);
    }

    const s = 0.5 + 0.5 * envelope;
    g.scale.setScalar(s);

    const mat = capMatRef.current;
    if (mat) {
      // Hover brightens emissive; lerp avoids a hard jump
      const targetEmissive = hoveredRef.current ? 0.65 * envelope : 0.3 * envelope;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Key lights for metallic sheen */}
      <pointLight position={[2, 3, 2]} intensity={3.5} color={CREAM} />
      <pointLight position={[-2, -1, 2]} intensity={1.5} color={COKE_RED} />

      {/* Spinning cap assembly — only this group rotates so the label stays upright */}
      <group
        ref={spinRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          hoveredRef.current = true;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hoveredRef.current = false;
          document.body.style.cursor = '';
        }}
      >
        {/* Cap body — cylinder rotated so its circular face points toward camera (+Z) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[CAP_RADIUS, CAP_RADIUS, CAP_HEIGHT, 48]} />
          <meshPhysicalMaterial
            ref={capMatRef}
            color={COKE_RED}
            emissive={COKE_RED}
            emissiveIntensity={0.3}
            roughness={0.35}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Crimped rim — 21 flutes as instanced metallic boxes. frustumCulled off
            because instance matrices place boxes far from the mesh's local bounds. */}
        <instancedMesh ref={fluteRef} args={[undefined, undefined, FLUTE_COUNT]} frustumCulled={false}>
          <boxGeometry args={[0.20, 0.13, 0.10]} />
          <meshStandardMaterial color={COKE_RED_DARK} metalness={0.6} roughness={0.3} />
        </instancedMesh>
      </group>

      {/* Coca-Cola wordmark on the cap face — white, dark outline for legibility */}
      <Text
        position={[0, 0, CAP_HEIGHT / 2 + 0.01]}
        fontSize={0.26}
        color={CREAM}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.014}
        outlineColor="#0A0203"
      >
        Coca-Cola
      </Text>
    </group>
  );
}
