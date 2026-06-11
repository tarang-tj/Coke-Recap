import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useNavigation, type ViewId } from './navigation-context';
import { useRecap } from './recap/recap-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// View-reactive accent lighting — the diorama answers the chapter you're
// reading. Each chapter's camera already looks at a real place in the scene;
// arriving warms that place up:
//   role      soda fountain storefront + both exhibit stands (MetricsDisplay +
//             ConsumerPulse at [1.1,0,-6.8] / [4.6,0,-7.6])
//   tools     vending machine + crates corner (existing) + martech bench area
//             ([5.23,0,-9.06]) + globe stand ([7.2,0,-9.8])
//   agent     far lamp down the street corridor (existing) + funnel at
//             [32,0,-20.2] + insights network at [14,3.4,-15]
//   takeaways growth ribbon floats over the rooftops — one warm uplight pool
//             near the ribbon mid-arc
// Intensities damp toward per-view targets so accents fade with the camera
// flight (reduced motion: snap). Lights are ALWAYS mounted — a constant
// light count avoids a mid-session shader recompile. Positions from the GLB
// anatomy dump (plans/reports/glb-anatomy-260609-2113.json) + exhibit POS
// constants.
//
// PERF: no per-frame allocations; light count is constant (7 total).
// No shadows on any accent light.

type AccentSpec = {
  pos: [number, number, number];
  color: string;
  on: ViewId;
  intensity: number;
  distance: number;
};

const ACCENTS: AccentSpec[] = [
  // ── ROLE ──────────────────────────────────────────────────────────────────
  // Street-side of the pharmacy storefront — at the fountain's own x but in
  // FRONT of the facade (the fountain mesh sits inside the building shell,
  // which swallows an interior light entirely from the street camera).
  { pos: [2.6, 1.8, -3.4],   color: '#FFD9A0', on: 'role',      intensity: 4,   distance: 9  },
  // Warm downlight over the two exhibit stands (MetricsDisplay [1.1,0,-6.8]
  // and ConsumerPulse [4.6,0,-7.6]) — positioned mid-span between them,
  // elevated to wash both tabletops with a single pool.
  { pos: [3.0, 3.2, -7.2],   color: '#FFCB7A', on: 'role',      intensity: 3.5, distance: 8  },

  // ── TOOLS ─────────────────────────────────────────────────────────────────
  // Vending machine + crates corner (original accent).
  { pos: [3.6, 1.4, -6.8],   color: '#FFCF8E', on: 'tools',     intensity: 4,   distance: 9  },
  // Warm pool centred between the MartechPipeline bench ([5.23,0,-9.06]) and
  // the GlobalReach globe ([7.2,0,-9.8]) — pulls both exhibits into a cohesive
  // lit zone and rims the globe stand from above.
  { pos: [6.2, 3.0, -9.5],   color: '#FFC87A', on: 'tools',     intensity: 3.8, distance: 10 },

  // ── AGENT ─────────────────────────────────────────────────────────────────
  // Far lamp down the street corridor (original accent).
  { pos: [24, 3.2, -15.5],   color: '#FFC97A', on: 'agent',     intensity: 4,   distance: 12 },
  // Uplight for the ConsumerFunnel exhibit at [32,0,-20.2] — from just in
  // front of the plinth so the warm cone reads on the funnel tiers as they
  // catch the light.
  { pos: [32, 2.8, -21.5],   color: '#FFBB60', on: 'agent',     intensity: 3.5, distance: 9  },

  // ── TAKEAWAYS ─────────────────────────────────────────────────────────────
  // The growth ribbon arc sweeps [4,9,-8] → [-26,20,-10] over the rooftops.
  // One warm pool near the arc mid-point (~[-7,12,-9]) and one at the
  // TODAY terminus (~[-26,18,-10]) so the ribbon glows as if the city is lit
  // from below for the celebration of 140 years.
  { pos: [-10, 13.5, -9.0],  color: '#FFD060', on: 'takeaways', intensity: 5,   distance: 14 },
];

const RECAP_OFF: ViewId = 'machine'; // sentinel: no view matches → all lights out

export function ViewAccentLights() {
  const { view } = useNavigation();
  const { phase } = useRecap();
  const reduced = useReducedMotion();
  const lights = useRef<(THREE.PointLight | null)[]>([]);

  // During the recap the camera is parked at the machine — accents off so
  // they don't fight the dispenser's own key/rim lights.
  const active: ViewId = phase === 'idle' ? view : RECAP_OFF;

  useFrame((_state, dt) => {
    const a = 1 - Math.exp(-2.2 * dt); // ~0.45 s fade
    lights.current.forEach((light, i) => {
      if (!light) return;
      const spec = ACCENTS[i];
      const targetIntensity = spec.on === active ? spec.intensity : 0;
      if (reduced) light.intensity = targetIntensity;
      else light.intensity += (targetIntensity - light.intensity) * a;
    });
  });

  return (
    <>
      {ACCENTS.map((accent, i) => (
        <pointLight
          key={`${accent.on}-${i}`}
          ref={(el) => {
            lights.current[i] = el;
          }}
          position={accent.pos}
          color={accent.color}
          intensity={0}
          distance={accent.distance}
          decay={2}
          castShadow={false}
        />
      ))}
    </>
  );
}
