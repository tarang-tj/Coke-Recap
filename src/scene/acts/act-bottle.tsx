import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow } from '../../hooks/use-act-window';

// Act 4 — Bottle (closing reveal)
// LatheGeometry traces the classic Coca-Cola contour / hobble-skirt silhouette.
// clearcoat glass look without any transmission render pass; internal point light for liquid glow.

function buildBottlePoints(): THREE.Vector2[] {
  // Hobble-skirt profile: fluted base → wide belly → pinched waist → shoulder → neck → crown.
  // Total height 2.90; caller translates by -1.45 to center vertically.
  const raw: [number, number][] = [
    [0.50, 0.00], // base disc
    [0.52, 0.04], // base rim flare
    [0.49, 0.12], // base wall
    [0.47, 0.22], // lower body
    [0.50, 0.38], // body swell start
    [0.55, 0.55], // body widening
    [0.60, 0.78], // belly peak — widest point
    [0.58, 0.95], // upper belly
    [0.52, 1.12], // upper body taper
    [0.46, 1.28], // waist approach
    [0.38, 1.45], // waist pinch — tightest
    [0.40, 1.56], // above waist
    [0.46, 1.68], // shoulder flare above waist
    [0.44, 1.80], // shoulder peak
    [0.36, 1.95], // neck base
    [0.26, 2.10], // neck lower
    [0.22, 2.25], // neck
    [0.21, 2.42], // neck mid
    [0.20, 2.58], // neck upper
    [0.20, 2.66], // neck near-top
    [0.21, 2.72], // collar start
    [0.24, 2.78], // crown flare
    [0.23, 2.85], // crown
    [0.20, 2.90], // top edge
  ];
  return raw.map(([r, y]) => new THREE.Vector2(r, y));
}

export function ActBottle() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  const geometry = useMemo(() => {
    const points = buildBottlePoints();
    // 64 segments for smooth round silhouette
    const geo = new THREE.LatheGeometry(points, 64);
    // Center vertically: total height 2.90, offset -1.45
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

    // Scale lerp 0.001 → 6.0 across localT — dramatic reveal
    const scale = THREE.MathUtils.lerp(0.001, 6.0, localT);
    group.scale.setScalar(scale);

    if (!reduced) {
      group.rotation.y += dt * 0.18;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Liquid-light glow from inside the bottle */}
      <pointLight color="#F40009" intensity={1.8} distance={4} />

      <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
        {/* Deep Coke-red glass look via clearcoat — no transmission render pass */}
        <meshPhysicalMaterial
          color="#C8000A"
          clearcoat={1}
          clearcoatRoughness={0.15}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.9}
          emissive="#5A0000"
          emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
