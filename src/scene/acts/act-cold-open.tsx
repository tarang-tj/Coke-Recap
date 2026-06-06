import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';
import { DynamicRibbon } from '../brand/dynamic-ribbon';
import { Logo3D } from '../brand/logo-3d';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Act 0 — Cold Open
// 3-D Coca-Cola logo as the title-screen hero.
// One atmospheric ribbon remains behind it for brand warmth.
// ContactShadows grounds the logo softly beneath it (renders once, frames=1).

export function ActColdOpen() {
  const groupRef = useRef<THREE.Group>(null);
  const logoGroupRef = useRef<THREE.Group>(null);
  const ribbonGroupRef = useRef<THREE.Group>(null);
  // Shared material ref so we can drive opacity + emissive from the act envelope
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const scrollRef = useScrollRef();
  const reduced = useReducedMotion();

  useFrame(({ clock }) => {
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
    const elapsed = clock.elapsedTime;

    // Fade logo in/out with the act envelope
    const mat = matRef.current;
    if (mat) {
      mat.opacity = envelope;
      mat.emissiveIntensity = 0.15 * envelope;
    }

    // Gentle idle float + Y-rotation — gives the title-screen a living feel
    const logoGroup = logoGroupRef.current;
    if (logoGroup && !reduced) {
      logoGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.08;
      logoGroup.position.y = Math.sin(elapsed * 0.6) * 0.06;
    }

    // Atmospheric ribbon fades with envelope at reduced opacity
    ribbonGroupRef.current?.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const ribbonMat = obj.material;
      if (ribbonMat instanceof THREE.MeshStandardMaterial) {
        ribbonMat.opacity = envelope * 0.4;
        ribbonMat.emissiveIntensity = 0.25 * envelope;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Warm fill — two point lights for logo sheen */}
      <pointLight position={[2, 2, 3]} intensity={1.5} color="#FFFEF6" />
      <pointLight position={[-2, -1, 1]} intensity={0.8} color="#F40009" />

      {/* 3-D logo hero — parent group handles idle float/rotation */}
      <group ref={logoGroupRef}>
        <Logo3D
          color="#FFFEF6"
          scale={1}
          position={[0, 0.1, 0]}
          materialRef={matRef}
        />
      </group>

      {/* Ground shadow — rendered once (frames=1) for zero ongoing cost */}
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        blur={2.5}
        scale={10}
        far={4}
        frames={1}
      />

      {/* One atmospheric ribbon behind the logo for brand warmth */}
      <group ref={ribbonGroupRef}>
        <DynamicRibbon
          scale={1.0}
          opacity={0.4}
          speed={0.55}
          position={[0, -0.3, -0.7]}
          rotation={[0.1, 0, Math.PI * 0.04]}
        />
      </group>
    </group>
  );
}
