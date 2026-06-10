import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useNavigation, type ViewId } from './navigation-context';
import { useRecap } from './recap/recap-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// View-reactive accent lighting — the diorama answers the chapter you're
// reading. Each chapter's camera already looks at a real place in the scene;
// arriving warms that place up:
//   role    the soda fountain (where the story starts) glows brighter
//   tools   the vending machine + crates corner gets a warm rim
//   agent   a far lamp down the street corridor pulls the eye along the
//           axial shot
// Intensities damp toward per-view targets so accents fade with the camera
// flight (reduced motion: snap). Lights are ALWAYS mounted — a constant
// light count avoids a mid-session shader recompile. Positions from the GLB
// anatomy dump (plans/reports/glb-anatomy-260609-2113.json).

const ACCENTS: { pos: [number, number, number]; color: string; on: ViewId }[] = [
  // Street-side of the pharmacy storefront — at the fountain's own x but in
  // FRONT of the facade (the fountain mesh sits inside the building shell,
  // which swallows an interior light entirely from the street camera).
  { pos: [2.6, 1.8, -3.4], color: '#FFD9A0', on: 'role' },
  { pos: [3.6, 1.4, -6.8], color: '#FFCF8E', on: 'tools' }, // vending corner
  { pos: [24, 3.2, -15.5], color: '#FFC97A', on: 'agent' }, // down the corridor
];
const ACCENT_INTENSITY = 4;

export function ViewAccentLights() {
  const { view } = useNavigation();
  const { phase } = useRecap();
  const reduced = useReducedMotion();
  const lights = useRef<(THREE.PointLight | null)[]>([]);

  // During the recap the camera is parked at the machine — accents off so
  // they don't fight the dispenser's own key/rim lights.
  const active: ViewId = phase === 'idle' ? view : 'machine';

  useFrame((_state, dt) => {
    const a = 1 - Math.exp(-2.2 * dt); // ~0.45 s fade
    lights.current.forEach((light, i) => {
      if (!light) return;
      const targetIntensity = ACCENTS[i].on === active ? ACCENT_INTENSITY : 0;
      if (reduced) light.intensity = targetIntensity;
      else light.intensity += (targetIntensity - light.intensity) * a;
    });
  });

  return (
    <>
      {ACCENTS.map((accent, i) => (
        <pointLight
          key={accent.on}
          ref={(el) => {
            lights.current[i] = el;
          }}
          position={accent.pos}
          color={accent.color}
          intensity={0}
          distance={9}
          decay={2}
        />
      ))}
    </>
  );
}
