import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { useScrollRef } from '../scroll-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { getActWindow, actEnvelope } from '../../hooks/use-act-window';

// Floating glass droplet at world origin. Wobbles gently on a sine wave
// and fades out as localT → 1 (the camera "dives through" it into Act 1).

export function ActColdOpen() {
  const groupRef = useRef<THREE.Group>(null);
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

    // Wobble: gentle sine-based scale pulse, dampened by reduced motion.
    const wobbleAmp = reduced ? 0 : 0.04;
    const wobble = 1 + wobbleAmp * Math.sin(clock.elapsedTime * 1.6);
    group.scale.setScalar(wobble);

    // Fade-out as we approach the end of the act (dive-through effect).
    const opacity = actEnvelope(localT);
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.Material;
        if (mat && 'opacity' in mat) {
          mat.opacity = opacity;
          mat.transparent = true;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Subtle ambient contribution so the glass reads against the dark env */}
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 4, 3]} intensity={1.5} color="#F1E9DA" />

      <mesh castShadow={false}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <MeshTransmissionMaterial
          transmission={1}
          thickness={0.6}
          roughness={0.05}
          ior={1.4}
          chromaticAberration={0.04}
          distortion={0.2}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#FFFFFF"
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  );
}
