import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from '../scroll-context';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { DynamicRibbon } from '../brand/dynamic-ribbon';

// Act 0 — Cold Open
// Two Coca-Cola Dynamic Ribbons sweep across the centre of the frame.
// Opacity is driven imperatively by traversing the ribbon group so the act
// envelope controls fade-in/out without breaking DynamicRibbon's own animation.

export function ActColdOpen() {
  const groupRef = useRef<THREE.Group>(null);
  const ribbonGroupRef = useRef<THREE.Group>(null);
  const scrollRef = useScrollRef();

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const t = scrollRef.current ?? 0;
    const { active, localT } = getActWindow('cold-open', t);

    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const envelope = actEnvelope(localT);

    // Drive ribbon opacity + emissive to sync with act envelope
    ribbonGroupRef.current?.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mat = obj.material;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.opacity = envelope * 0.95;
        mat.emissiveIntensity = 0.55 * envelope;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Warm fill for ribbon sheen; keep it cheap — two lights only */}
      <pointLight position={[2, 2, 3]} intensity={1.5} color="#FFFEF6" />
      <pointLight position={[-2, -1, 1]} intensity={0.8} color="#F40009" />

      <group ref={ribbonGroupRef}>
        {/* Primary ribbon — large, centred sweep */}
        <DynamicRibbon scale={1.4} opacity={0.95} />

        {/* Secondary ribbon — slightly smaller, offset in z for depth */}
        <DynamicRibbon
          scale={1.0}
          opacity={0.65}
          speed={0.6}
          position={[0, -0.5, -0.4]}
          rotation={[0.15, 0, Math.PI * 0.05]}
        />
      </group>
    </group>
  );
}
