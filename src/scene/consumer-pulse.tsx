import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic "CONSUMER PULSE" stand for THE ROLE chapter.
// Two mini-charts share a single wood-and-brass display stand:
//   1. "A DAY OF DRINKS" — occasion bars (MORNING / WITH MEALS / ON THE GO / EVENING)
//   2. "VOLUME × VALUE"  — paired category bars (SPARKLING / WATER / JUICE / TEA & COFFEE)
// CONTENT POLICY: all bar heights are made-up illustrative indices.
// A provenance pill ("Illustrative — indexed, not actual data") is always shown.
//
// PLACEMENT ASSUMPTION
//   Role camera pos [2.6, 2.4, -12] looks toward +Z; camera-right = world -X.
//   The sibling MARKET INSIGHTS stand sits at [1.1, 0.05, -6.8] rotY 2.62 (screen-right / -X side).
//   This stand is placed on the OPPOSITE side (screen-left / +X side):
//     POS = [4.6, 0.05, -7.6], rotY = -2.65 (front of stand aimed toward camera, -Z dir).
//   Avoid vending machine at (3.6, 0.8, -5.9) and bottle hero at (4.35, 0.74, -7.8).
//   If too tight on the hero bottle, integrator should slide to x ≈ 5.2, z ≈ -8.4.

const RED = '#C8102E';
const CREAM = '#FFF2DC';
const WOOD = '#3A2618';
const WOOD_DARK = '#2B1B10';
const BRASS = '#B08D57';
const GOLD = '#FFB953';

// ---------------------------------------------------------------------------
// Chart data — illustrative indices only, no real figures.
// ---------------------------------------------------------------------------

const OCCASIONS = [
  { label: 'MORNING',    h: 0.38, color: RED  },
  { label: 'WITH MEALS', h: 0.55, color: CREAM },
  { label: 'ON THE GO',  h: 0.46, color: RED  },
  { label: 'EVENING',    h: 0.30, color: CREAM },
];

const CATEGORIES = [
  { label: 'SPARKLING',    vol: 0.50, val: 0.58 },
  { label: 'WATER',        vol: 0.38, val: 0.30 },
  { label: 'JUICE',        vol: 0.28, val: 0.36 },
  { label: 'TEA & COFFEE', vol: 0.22, val: 0.28 },
];

// ---------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------

const POS: [number, number, number] = [4.6, 0.05, -7.6];
const ROT_Y = -2.65;

const TOP_Y    = 0.6;   // tabletop surface
const BAR_W    = 0.11;
const CAP_H    = 0.03;
const STAGGER  = 0.13;  // seconds between bar starts
const LABEL_DF = 5.5;   // Html distanceFactor (~5 m from role camera)

// Chart A — occasion bars, centred left half of tabletop
const OCC_PITCH  = 0.28;
const OCC_X0     = -0.80; // leftmost bar x in local space

// Chart B — paired category bars, centred right half
const CAT_PITCH  = 0.32;  // row pitch along x
const CAT_X0     =  0.10; // leftmost category x
const PAIR_DELTA =  0.09; // vol bar offset from row centre; val bar is +PAIR_DELTA

// ---------------------------------------------------------------------------
// Pill style — identical to MetricsDisplay
// ---------------------------------------------------------------------------

const pillStyle = (size: number): React.CSSProperties => ({
  whiteSpace: 'nowrap',
  textAlign: 'center',
  padding: '3px 9px',
  borderRadius: 9999,
  background: 'rgba(24,12,8,0.8)',
  border: '1px solid rgba(176,141,87,0.45)',
  color: '#FFF6E9',
  fontSize: size,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  userSelect: 'none',
  pointerEvents: 'none',
  lineHeight: 1.45,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConsumerPulse() {
  const { view } = useNavigation();
  const reduced   = useReducedMotion();
  const inRole    = view === 'role';

  // Total animated bars: 4 occasion + (4 × 2) paired = 12
  const N_OCC = OCCASIONS.length;
  const N_CAT = CATEGORIES.length;
  const N_BARS = N_OCC + N_CAT * 2;

  const barRefs = useRef<(THREE.Mesh | null)[]>([]);
  const capRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Full-height targets for each slot
  const FULL_HEIGHTS: number[] = [
    ...OCCASIONS.map((o) => o.h),
    ...CATEGORIES.flatMap((c) => [c.vol, c.val]),
  ];

  const anim = useRef({
    t: 10,
    heights: FULL_HEIGHTS.slice(),
  });
  const wasInRole = useRef(false);

  useEffect(() => {
    if (inRole && !wasInRole.current && !reduced) {
      anim.current.t = 0;
      for (let i = 0; i < N_BARS; i++) anim.current.heights[i] = 0;
    }
    wasInRole.current = inRole;
  }, [inRole, reduced, N_BARS]);

  useFrame((_, delta) => {
    const a = anim.current;
    a.t += delta;
    for (let i = 0; i < N_BARS; i++) {
      const full = FULL_HEIGHTS[i];
      let h: number;
      if (reduced) {
        h = full;
      } else {
        const target = a.t >= i * STAGGER ? full : a.heights[i];
        h = THREE.MathUtils.damp(a.heights[i], target, 6, delta);
      }
      a.heights[i] = h;
      const bar = barRefs.current[i];
      if (bar) {
        bar.scale.y = Math.max(h, 0.001);
        bar.position.y = TOP_Y + h / 2;
      }
      const cap = capRefs.current[i];
      if (cap) cap.position.y = TOP_Y + h + CAP_H / 2;
    }
  });

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]}>
      {/* ---- Stand structure (same proportions as MetricsDisplay) ---- */}

      {/* Plinth */}
      <mesh raycast={() => null} position={[0, 0.05, 0]}>
        <boxGeometry args={[2.1, 0.1, 0.8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      {/* Pedestal */}
      <mesh raycast={() => null} position={[0, 0.32, 0]}>
        <boxGeometry args={[1.85, 0.44, 0.6]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {/* Tabletop */}
      <mesh raycast={() => null} position={[0, 0.57, 0]}>
        <boxGeometry args={[2.1, 0.06, 0.8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>
      {/* Brass front trim */}
      <mesh raycast={() => null} position={[0, 0.605, 0.39]}>
        <boxGeometry args={[2.1, 0.02, 0.03]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Divider groove between the two charts */}
      <mesh raycast={() => null} position={[-0.03, 0.605, 0]}>
        <boxGeometry args={[0.015, 0.025, 0.76]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Brass posts */}
      {[-0.95, 0.95].map((x) => (
        <mesh raycast={() => null} key={x} position={[x, 1.0, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 10]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* Header board */}
      <mesh raycast={() => null} position={[0, 1.5, -0.3]}>
        <boxGeometry args={[2.1, 0.24, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh raycast={() => null} position={[0, 1.63, -0.3]}>
        <boxGeometry args={[2.14, 0.025, 0.07]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Caption / provenance plate */}
      <mesh raycast={() => null} position={[0, 0.38, 0.305]}>
        <boxGeometry args={[0.82, 0.1, 0.02]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* ---- Chart A: "A DAY OF DRINKS" — occasion bars ---- */}
      {OCCASIONS.map((occ, i) => {
        const x = OCC_X0 + i * OCC_PITCH;
        const labelY = TOP_Y + occ.h + (i % 2 === 0 ? 0.28 : 0.12);
        const animIdx = i;
        return (
          <group key={`occ-${i}`}>
            <mesh
              raycast={() => null}
              ref={(m) => { barRefs.current[animIdx] = m; }}
              position={[x, TOP_Y + occ.h / 2, 0]}
            >
              <boxGeometry args={[BAR_W, 1, BAR_W]} />
              <meshStandardMaterial color={occ.color} roughness={0.45} metalness={0.05} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[animIdx] = m; }}
              position={[x, TOP_Y + occ.h + CAP_H / 2, 0]}
            >
              <boxGeometry args={[BAR_W + 0.04, CAP_H, BAR_W + 0.04]} />
              <meshStandardMaterial
                color={BRASS} metalness={0.85} roughness={0.3}
                emissive={BRASS} emissiveIntensity={0.18}
              />
            </mesh>
            {inRole && (
              <Html
                position={[x, labelY, 0]}
                center distanceFactor={LABEL_DF} occlude={false}
              >
                <div style={pillStyle(5)}>{occ.label}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* ---- Chart B: "VOLUME × VALUE" — paired bars ---- */}
      {CATEGORIES.map((cat, i) => {
        const x    = CAT_X0 + i * CAT_PITCH;
        const xVol = x - PAIR_DELTA;
        const xVal = x + PAIR_DELTA;
        const iVol = N_OCC + i * 2;
        const iVal = N_OCC + i * 2 + 1;
        const labelY = TOP_Y + Math.max(cat.vol, cat.val) + 0.14;
        return (
          <group key={`cat-${i}`}>
            {/* Volume bar — red */}
            <mesh
              raycast={() => null}
              ref={(m) => { barRefs.current[iVol] = m; }}
              position={[xVol, TOP_Y + cat.vol / 2, 0]}
            >
              <boxGeometry args={[BAR_W * 0.75, 1, BAR_W * 0.75]} />
              <meshStandardMaterial color={RED} roughness={0.45} metalness={0.05} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[iVol] = m; }}
              position={[xVol, TOP_Y + cat.vol + CAP_H / 2, 0]}
            >
              <boxGeometry args={[BAR_W * 0.75 + 0.03, CAP_H, BAR_W * 0.75 + 0.03]} />
              <meshStandardMaterial
                color={BRASS} metalness={0.85} roughness={0.3}
                emissive={BRASS} emissiveIntensity={0.18}
              />
            </mesh>
            {/* Value bar — gold */}
            <mesh
              raycast={() => null}
              ref={(m) => { barRefs.current[iVal] = m; }}
              position={[xVal, TOP_Y + cat.val / 2, 0]}
            >
              <boxGeometry args={[BAR_W * 0.75, 1, BAR_W * 0.75]} />
              <meshStandardMaterial color={GOLD} roughness={0.4} metalness={0.15} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[iVal] = m; }}
              position={[xVal, TOP_Y + cat.val + CAP_H / 2, 0]}
            >
              <boxGeometry args={[BAR_W * 0.75 + 0.03, CAP_H, BAR_W * 0.75 + 0.03]} />
              <meshStandardMaterial
                color={BRASS} metalness={0.85} roughness={0.3}
                emissive={BRASS} emissiveIntensity={0.18}
              />
            </mesh>
            {inRole && (
              <Html
                position={[x, labelY, 0]}
                center distanceFactor={LABEL_DF} occlude={false}
              >
                <div style={pillStyle(4.5)}>{cat.label}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* ---- Role-only labels / pills ---- */}
      {inRole && (
        <>
          {/* Header */}
          <Html position={[0, 1.74, -0.3]} center distanceFactor={7} occlude={false}>
            <div style={{ ...pillStyle(10), fontWeight: 700, letterSpacing: '0.24em' }}>
              Consumer Pulse
            </div>
          </Html>

          {/* Chart A sub-label */}
          <Html position={[OCC_X0 + 1.5 * OCC_PITCH, TOP_Y + 0.76, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(6), borderColor: 'rgba(200,16,46,0.5)' }}>
              A Day of Drinks
            </div>
          </Html>

          {/* Chart B sub-label */}
          <Html position={[CAT_X0 + 1.5 * CAT_PITCH, TOP_Y + 0.72, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(6), borderColor: 'rgba(255,185,83,0.55)' }}>
              Volume&nbsp;&times;&nbsp;Value
            </div>
          </Html>

          {/* Legend: red = vol, gold = val */}
          <Html position={[CAT_X0 + 1.5 * CAT_PITCH, TOP_Y + 0.62, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ display: 'flex', gap: 6, pointerEvents: 'none' }}>
              <span style={{ ...pillStyle(4.5), borderColor: 'rgba(200,16,46,0.5)' }}>
                <span style={{ color: RED }}>&#9646;</span> Vol
              </span>
              <span style={{ ...pillStyle(4.5), borderColor: 'rgba(255,185,83,0.55)' }}>
                <span style={{ color: GOLD }}>&#9646;</span> Val
              </span>
            </div>
          </Html>

          {/* Provenance plate */}
          <Html position={[0, 0.38, 0.33]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(5)}>Illustrative &mdash; indexed, not actual data</div>
          </Html>
        </>
      )}
    </group>
  );
}
