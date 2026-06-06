import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows, PresentationControls } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { getActWindow, smoothstep } from '../../hooks/use-act-window';
import { Logo3D } from '../brand/logo-3d';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Act 0 — Cold Open
// 3-D Coca-Cola logo as the title-screen hero.
// One atmospheric ribbon remains behind it for brand warmth.
// ContactShadows grounds the logo softly beneath it (renders once, frames=1).

export function ActColdOpen() {
  const groupRef = useRef<THREE.Group>(null);
  const logoGroupRef = useRef<THREE.Group>(null);
  // Shared material ref so we can drive opacity from the act envelope
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
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

    // Intro envelope: fully visible at the very top (localT=0) since this is the
    // first act, then fades out as the cold-open exits (no fade-in from black).
    const envelope = 1 - smoothstep((localT - 0.6) / 0.4);
    const elapsed = clock.elapsedTime;

    // Fade logo in/out with the act envelope
    const mat = matRef.current;
    if (mat) {
      // Unlit white logo; fade opacity with the act envelope.
      mat.opacity = envelope;
    }

    // Gentle idle float + Y-rotation — gives the title-screen a living feel
    const logoGroup = logoGroupRef.current;
    if (logoGroup && !reduced) {
      logoGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.08;
      logoGroup.position.y = Math.sin(elapsed * 0.6) * 0.06;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Warm fill — two point lights for logo sheen */}
      <pointLight position={[2, 2, 3]} intensity={1.5} color="#FFFEF6" />
      <pointLight position={[-2, -1, 1]} intensity={0.8} color="#F40009" />

      {/* Drag-to-orbit via PresentationControls; idle float/rotation lives on the inner
          logoGroupRef and composes additively with the drag spring rotation above it */}
      <PresentationControls
        global={false}
        cursor
        snap
        speed={1.4}
        polar={[-0.4, 0.4]}
        azimuth={[-0.8, 0.8]}
      >
        <group ref={logoGroupRef}>
          <Logo3D
            color="#FFFEF6"
            scale={1}
            position={[0, 0.1, 0]}
            materialRef={matRef}
          />
        </group>
      </PresentationControls>

      {/* Ground shadow — rendered once (frames=1); outside PresentationControls so it stays grounded */}
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        blur={2.5}
        scale={10}
        far={4}
        frames={1}
      />
    </group>
  );
}
