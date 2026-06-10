import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { DIORAMA_URL } from './coca-cola-diorama';

// Living gas lamps. The diorama's four street lamps are dead geometry — an
// emissive 'Lamp' material on the Globe_* bulbs and nothing else. This adds:
//   - three warm point lights at the camera-visible globes (the fourth, at
//     x=-15, sits outside the visible block — not worth a 4th light's cost)
//   - a soft gas-flame waver on both the lights and the shared bulb material
// Positions come from the GLB anatomy dump
// (plans/reports/glb-anatomy-260609-2113.json). Reduced motion gets steady
// (non-flickering) lamplight — warmth without the movement.

const GLOBES: [number, number, number][] = [
  [-3.5, 4.75, -5.7],
  [6.8, 4.75, -5.7],
  [14, 4.75, -5.7],
];

const LIGHT_BASE = 2.4; // intensity around which the flicker wavers
const EMISSIVE_BASE = 2.2; // the GLB's authored bulb emissiveIntensity

// Two incommensurate sines — a soft gas waver, not an electrical strobe.
function waver(t: number, phaseOffset: number): number {
  return (
    0.86 +
    0.1 * Math.sin(t * 6.1 + phaseOffset) +
    0.06 * Math.sin(t * 11.7 + phaseOffset * 2.3)
  );
}

export function StreetLamps() {
  const reduced = useReducedMotion();
  const { scene } = useGLTF(DIORAMA_URL); // same cached instance as the diorama
  const lights = useRef<(THREE.PointLight | null)[]>([]);

  // The four Globe_* bulbs share one 'Lamp' material — one handle flickers
  // them all.
  const bulbMaterial = useMemo<THREE.MeshStandardMaterial | null>(() => {
    let found: THREE.MeshStandardMaterial | null = null;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || found) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const hit = mats.find((m) => m?.name === 'Lamp');
      if (hit) found = hit as THREE.MeshStandardMaterial;
    });
    return found;
  }, [scene]);

  useFrame(({ clock }) => {
    if (reduced) {
      // Hold the steady BASE level — a bare return would strand the shared
      // material/lights at whatever mid-flicker sample was last written if
      // the OS preference flips on mid-session.
      lights.current.forEach((light) => {
        if (light) light.intensity = LIGHT_BASE;
      });
      if (bulbMaterial) bulbMaterial.emissiveIntensity = EMISSIVE_BASE;
      return;
    }
    const t = clock.elapsedTime;
    lights.current.forEach((light, i) => {
      if (light) light.intensity = LIGHT_BASE * waver(t, i * 2.1);
    });
    if (bulbMaterial) {
      bulbMaterial.emissiveIntensity = EMISSIVE_BASE * waver(t, 0.7);
    }
  });

  return (
    <>
      {GLOBES.map((pos, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lights.current[i] = el;
          }}
          position={pos}
          color="#ffc97a"
          intensity={LIGHT_BASE}
          distance={7.5}
          decay={2}
        />
      ))}
    </>
  );
}
