import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow } from '../../hooks/use-act-window';

// Act 4 — Bottle (closing reveal)
// LatheGeometry bottle silhouette scales from near-zero to 6.0 units.
// meshPhysicalMaterial with transmission + iridescence for prismatic gleam.
// An internal point light makes the bottle glow as if filled with liquid light.

function buildBottlePoints(): THREE.Vector2[] {
  const raw: [number, number][] = [
    [0.40, 0.00],
    [0.43, 0.05],
    [0.45, 0.12],
    [0.44, 0.20],
    [0.43, 0.32],
    [0.41, 0.46],
    [0.39, 0.60],
    [0.38, 0.74],
    [0.38, 0.90],
    [0.39, 1.05],
    [0.41, 1.18],
    [0.44, 1.30],
    [0.45, 1.42],
    [0.45, 1.50],
    [0.44, 1.60],
    [0.42, 1.72],
    [0.38, 1.88],
    [0.32, 2.00],
    [0.26, 2.12],
    [0.22, 2.22],
    [0.19, 2.30],
    [0.18, 2.40],
    [0.16, 2.50],
    [0.16, 2.58],
    [0.16, 2.65],
    [0.16, 2.70],
    [0.17, 2.78],
    [0.19, 2.85],
    [0.19, 2.88],
    [0.18, 2.90],
  ];
  return raw.map(([r, y]) => new THREE.Vector2(r, y));
}

export function ActBottle() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  const geometry = useMemo(() => {
    const points = buildBottlePoints();
    const geo = new THREE.LatheGeometry(points, 48);
    // Center vertically: total height ~2.90, offset -1.45
    geo.translate(0, -1.45, 0);
    return geo;
  }, []);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;

    const globalT = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('bottle', globalT);

    group.visible = active;
    if (!active) return;

    // Scale lerp 0.001 → 6.0 across localT
    const scale = THREE.MathUtils.lerp(0.001, 6.0, localT);
    group.scale.setScalar(scale);

    if (!reduced) {
      group.rotation.y += dt * 0.18;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Internal glow — liquid light effect */}
      <pointLight color="#F40009" intensity={1.8} distance={4} />

      <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
        <meshPhysicalMaterial
          color="#F40009"
          transmission={0.95}
          roughness={0.06}
          ior={1.5}
          thickness={0.6}
          attenuationColor="#3A0204"
          attenuationDistance={3.0}
          iridescence={0.3}
          iridescenceIOR={1.3}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
