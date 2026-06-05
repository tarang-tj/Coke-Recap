import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// Coca-Cola-inspired bottle silhouette via LatheGeometry.
// Geometry is original art — pure contour approximation, no marks or logos.
// The bottle scales up as the camera pulls back in Act 4, revealing
// that the whole scene was always inside a glass bottle.

function buildBottlePoints(): THREE.Vector2[] {
  // Each entry: [radius, y]. Contour traced top-down then reversed for
  // LatheGeometry which expects points from bottom to top.
  const raw: [number, number][] = [
    // base
    [0.40, 0.00],
    [0.43, 0.05],
    [0.45, 0.12],
    [0.44, 0.20],
    // taper toward waist
    [0.43, 0.32],
    [0.41, 0.46],
    [0.39, 0.60],
    [0.38, 0.74],
    [0.38, 0.90], // waist
    // curve back to mid-bulge
    [0.39, 1.05],
    [0.41, 1.18],
    [0.44, 1.30],
    [0.45, 1.42],
    [0.45, 1.50], // mid-bulge peak (subtle)
    [0.44, 1.60],
    [0.42, 1.72],
    // taper toward neck base
    [0.38, 1.88],
    [0.32, 2.00],
    [0.26, 2.12],
    [0.22, 2.22],
    [0.19, 2.30],
    [0.18, 2.40], // neck base
    // straight neck
    [0.16, 2.50],
    [0.16, 2.58],
    [0.16, 2.65],
    [0.16, 2.70],
    // slight lip flare
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

  // Build geometry once — 30 radial segments is plenty for a silhouette.
  const geometry = useMemo(() => {
    const points = buildBottlePoints();
    const geo = new THREE.LatheGeometry(points, 48);
    // Center vertically: total height ~2.90, so translate -1.45 on Y.
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

    // Scale: starts near-zero, grows to 4.5 (camera is far back at act end).
    const env = actEnvelope(localT);
    const scale = THREE.MathUtils.lerp(0.001, 4.5, env);
    group.scale.setScalar(scale);

    // Slow idle rotation — skip if user prefers reduced motion.
    if (!reduced) {
      group.rotation.y += dt * 0.15;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
        <meshPhysicalMaterial
          color="#F40009"
          transmission={0.9}
          thickness={0.5}
          roughness={0.08}
          ior={1.5}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
