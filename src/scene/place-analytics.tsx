import { useRef, useMemo, useEffect } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useExperience } from './experience-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic place-analytics markers for the HOME (machine) view.
// Small billboarded gold pins anchored above diorama landmarks — each has
// a pulsing dot, a thin hairline down toward the landmark, and a compact
// pill showing a year + one public stat. CONTENT POLICY: public,
// commonly-cited figures only. Renders ONLY when view === 'machine' AND
// experience started.

const GOLD = '#FFB953';
const CREAM = '#FFF6E9';
const BRASS = '#B08D57';

// Home camera: pos [-8,7,-34] looking [0,5.5,-2] — roughly 30-40 m away.
// distanceFactor 38 makes pills read small but legible at that distance.
const LABEL_DF = 38;

// Vertical hairline: a pair of points [top, landmark-surface]
// The dot sits at the top (pin head); the line goes down to the landmark.
// All coords tuned to the diorama block visible from the home camera.
const PINS = [
  {
    id: 'jacobs',
    // Jacobs' Pharmacy entrance, slightly elevated so the pin floats clearly
    // above the roofline from the home camera angle.
    pos: [0, 6, -2] as [number, number, number],
    // Hairline drops from pin head (pos) down to ~street level (~y=0.3)
    lineBottom: [0, 0.3, -2] as [number, number, number],
    year: "1886",
    stat: "9 drinks sold / day — year one",
    // Pill offset above the dot so it doesn't overlap the hairline
    pillDy: 1.6,
  },
  {
    id: 'wagon',
    // Horse-drawn delivery wagon on the street to the right
    pos: [32, 1.1, -13.5] as [number, number, number],
    lineBottom: [32, -0.4, -13.5] as [number, number, number],
    year: "1890s",
    stat: "Horse-drawn distribution era",
    pillDy: 1.4,
  },
  {
    id: 'button-sign',
    // Corner Coca-Cola button sign — integrator should fine-tune x to match
    // the actual sign position (somewhere around x = -12 on the street wall).
    pos: [-12, 4.2, -1.5] as [number, number, number],
    lineBottom: [-12, 2.0, -1.5] as [number, number, number],
    year: "1894",
    stat: "First painted wall-ad era",
    pillDy: 1.4,
  },
  {
    id: 'gaslamps',
    // Street gas lamps near the pharmacy block — historically 1880s Atlanta
    pos: [-3.5, 3.8, 0.2] as [number, number, number],
    lineBottom: [-3.5, 1.2, 0.2] as [number, number, number],
    year: "1886",
    stat: "Gas-lit Atlanta streetscape",
    pillDy: 1.4,
  },
] as const;

// ---- style ---------------------------------------------------------------

const pillStyle: React.CSSProperties = {
  whiteSpace: 'nowrap',
  textAlign: 'center',
  padding: '3px 9px',
  borderRadius: 9999,
  background: 'rgba(24,12,8,0.82)',
  border: `1px solid rgba(176,141,87,0.45)`,
  color: CREAM,
  fontSize: 7,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  userSelect: 'none',
  pointerEvents: 'none',
  lineHeight: 1.45,
};

const yearStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  display: 'block',
  color: GOLD,
};

// ---- single pin ----------------------------------------------------------

interface PinData {
  id: string;
  pos: [number, number, number];
  lineBottom: [number, number, number];
  year: string;
  stat: string;
  pillDy: number;
}

interface PinProps {
  data: PinData;
  reduced: boolean;
}

function Pin({ data, reduced }: PinProps) {
  const dotRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  // Phase offset per pin id so they don't all pulse in sync
  const phaseRef = useRef(
    data.id === 'jacobs' ? 0
    : data.id === 'wagon' ? 1.1
    : data.id === 'button-sign' ? 2.2
    : 3.0,
  );

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime + phaseRef.current;
    // Gentle scale pulse: ±8 % at ~1 Hz
    const s = 1 + 0.08 * Math.sin(t * 6.2);
    const dot = dotRef.current;
    if (dot) dot.scale.setScalar(s);
    // Halo fades in/out offset by π/2
    const halo = haloRef.current;
    if (halo) {
      const mat = halo.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + 0.18 * Math.sin(t * 6.2 + Math.PI / 2);
    }
  });

  // Hairline: built as a THREE.Line primitive — R3F's <line_> JSX alias is
  // unavailable without extend(); using primitive avoids that requirement.
  const hairline = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...data.pos),
      new THREE.Vector3(...data.lineBottom),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: BRASS,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      toneMapped: false,
    });
    const line = new THREE.Line(geo, mat);
    line.raycast = () => null;
    return line;
  }, [data.pos, data.lineBottom]);

  // Dispose hairline GPU resources on unmount — component unmounts on every
  // home↔chapter view switch, so without this each toggle leaks one buffer
  // + one material per pin (4 total).
  useEffect(() => {
    return () => {
      hairline.geometry.dispose();
      (hairline.material as THREE.Material).dispose();
    };
  }, [hairline]);

  return (
    <group>
      {/* Thin vertical hairline — non-blocking */}
      <primitive object={hairline} />

      {/* Billboarded pin head at landmark position */}
      <group position={data.pos}>
        <Billboard>
          {/* Gold dot */}
          <mesh ref={dotRef} raycast={() => null}>
            <circleGeometry args={[0.22, 18]} />
            <meshBasicMaterial color={GOLD} toneMapped={false} />
          </mesh>
          {/* Soft halo ring */}
          <mesh ref={haloRef} position={[0, 0, -0.01]} raycast={() => null}>
            <ringGeometry args={[0.24, 0.52, 22]} />
            <meshBasicMaterial
              color={GOLD}
              transparent
              opacity={0.28}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Billboard>

        {/* Pill label */}
        <Html
          position={[0, data.pillDy, 0]}
          center
          distanceFactor={LABEL_DF}
          occlude={false}
        >
          <div style={pillStyle}>
            <span style={yearStyle}>{data.year}</span>
            {data.stat}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ---- main export ---------------------------------------------------------

function Pins() {
  const reduced = useReducedMotion();
  return (
    <>
      {PINS.map((p) => (
        <Pin key={p.id} data={p} reduced={reduced} />
      ))}
    </>
  );
}

export function PlaceAnalytics() {
  const { view } = useNavigation();
  const { started } = useExperience();
  // Gate: only render in home view AND after Press Start
  if (view !== 'machine' || !started) return null;
  return <Pins />;
}
