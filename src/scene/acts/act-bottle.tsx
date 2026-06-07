import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PresentationControls } from '@react-three/drei';
import { useSceneMixes } from '../scene-transition-context';
import { BottleGltf } from '../brand/bottle-gltf';

// Act 4 — Takeaways: hero contour bottle with drag-to-orbit.

export function ActBottle() {
  const groupRef = useRef<THREE.Group>(null);
  const mixesRef = useSceneMixes();

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const mix = mixesRef.current.takeaways;
    const visible = mix > 0.002;
    group.visible = visible;
    if (!visible) return;

    const scale = THREE.MathUtils.lerp(0.001, 2.2, mix);
    group.scale.setScalar(scale);
    group.position.z = THREE.MathUtils.lerp(2, 0, mix);
    // Lower the bottle so its vertical center aligns with viewport center
    // instead of floating above it. At peak scale=2.2 the bottle's local
    // center (~0.775u) projects to world-y ~1.7; an offset of -1.8 lands the
    // center near world-y -0.1 (slightly below center, accounting for the
    // camera's modest downward tilt).
    group.position.y = -1.8;
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight color="#F40009" intensity={2.2} distance={6} />
      <pointLight color="#FFD8A0" intensity={1.0} distance={4} position={[2, 2, 2]} />

      <PresentationControls
        global={false}
        cursor
        snap
        speed={1.4}
        polar={[-0.35, 0.35]}
        azimuth={[-0.5, 0.5]}
      >
        <BottleGltf scale={1} highlight={0.6} />
      </PresentationControls>
    </group>
  );
}
