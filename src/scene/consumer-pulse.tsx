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

// Shared material instances — avoids one material object per bar/cap mesh.
// These are module-level singletons; R3F disposes them on unmount of the last
// user, so no manual cleanup needed while the component is always-mounted.
const matRed   = new THREE.MeshStandardMaterial({ color: '#C8102E', roughness: 0.40, metalness: 0.08, emissive: '#C8102E', emissiveIntensity: 0.55 });
const matCream = new THREE.MeshStandardMaterial({ color: '#FFF2DC', roughness: 0.40, metalness: 0.08, emissive: '#FFF2DC', emissiveIntensity: 0.28 });
const matGold  = new THREE.MeshStandardMaterial({ color: '#FFB953', roughness: 0.35, metalness: 0.18, emissive: '#FFB953', emissiveIntensity: 0.50 });
const matCap   = new THREE.MeshStandardMaterial({ color: '#FFB953', metalness: 0.85, roughness: 0.25, emissive: '#FFB953', emissiveIntensity: 0.65 });

const OCCASIONS = [
  { label: 'MORNING',    h: 0.46, color: RED  },
  { label: 'WITH MEALS', h: 0.64, color: CREAM },
  { label: 'ON THE GO',  h: 0.54, color: RED  },
  { label: 'EVENING',    h: 0.36, color: CREAM },
];

const CATEGORIES = [
  { label: 'SPARKLING',    vol: 0.58, val: 0.68 },
  { label: 'WATER',        vol: 0.44, val: 0.36 },
  { label: 'JUICE',        vol: 0.34, val: 0.42 },
  { label: 'TEA & COFFEE', vol: 0.26, val: 0.34 },
];

// ---------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------

const POS: [number, number, number] = [4.6, 0.05, -7.6];
const ROT_Y = -2.65;

const TOP_Y    = 0.6;   // tabletop surface
const BAR_W    = 0.15; // wider for visibility
const CAP_H    = 0.04; // taller caps
const STAGGER  = 0.13;  // seconds between bar starts
const LABEL_DF = 4.8;   // slightly closer distanceFactor → bigger pills on screen

// Hoisted here so it isn't rebuilt on every render.
const FULL_HEIGHTS: number[] = [
  ...OCCASIONS.map((o) => o.h),
  ...CATEGORIES.flatMap((c) => [c.vol, c.val]),
];

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
  padding: '4px 11px',
  borderRadius: 9999,
  background: 'rgba(12,6,4,0.92)',
  border: '1.5px solid rgba(255,185,83,0.70)',
  color: '#FFFAF0',
  fontSize: size,
  fontWeight: 600,
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

  const anim = useRef({
    t: 10,
    heights: FULL_HEIGHTS.slice(),
  });
  const wasInRole = useRef(false);
  // settled=true once the entrance animation is done; reset when re-entering role.
  const settled = useRef(true);

  useEffect(() => {
    if (inRole && !wasInRole.current && !reduced) {
      anim.current.t = 0;
      for (let i = 0; i < N_BARS; i++) anim.current.heights[i] = 0;
      settled.current = false;
    }
    wasInRole.current = inRole;
  }, [inRole, reduced, N_BARS]);

  useFrame((_, delta) => {
    // Early-out: nothing to animate when bars are at rest.
    if (settled.current) return;

    const a = anim.current;
    a.t += delta;

    // Early-out for reduced motion — snap to full and mark settled.
    if (reduced) {
      for (let i = 0; i < N_BARS; i++) {
        a.heights[i] = FULL_HEIGHTS[i];
        const bar = barRefs.current[i];
        if (bar) { bar.scale.y = FULL_HEIGHTS[i]; bar.position.y = TOP_Y + FULL_HEIGHTS[i] / 2; }
        const cap = capRefs.current[i];
        if (cap) cap.position.y = TOP_Y + FULL_HEIGHTS[i] + CAP_H / 2;
      }
      settled.current = true;
      return;
    }

    for (let i = 0; i < N_BARS; i++) {
      const full = FULL_HEIGHTS[i];
      const target = a.t >= i * STAGGER ? full : a.heights[i];
      const h = THREE.MathUtils.damp(a.heights[i], target, 6, delta);
      a.heights[i] = h;
      const bar = barRefs.current[i];
      if (bar) {
        bar.scale.y = Math.max(h, 0.001);
        bar.position.y = TOP_Y + h / 2;
      }
      const cap = capRefs.current[i];
      if (cap) cap.position.y = TOP_Y + h + CAP_H / 2;
    }

    // Mark settled once all stagger slots are open + 1.5 s of damping have elapsed.
    if (a.t > N_BARS * STAGGER + 1.5) settled.current = true;
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
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.5} />
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
              material={occ.color === RED ? matRed : matCream}
            >
              <boxGeometry args={[BAR_W, 1, BAR_W]} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[animIdx] = m; }}
              position={[x, TOP_Y + occ.h + CAP_H / 2, 0]}
              material={matCap}
            >
              <boxGeometry args={[BAR_W + 0.04, CAP_H, BAR_W + 0.04]} />
            </mesh>
            {inRole && (
              <Html
                position={[x, labelY, 0]}
                center distanceFactor={LABEL_DF} occlude={false}
              >
                <div style={pillStyle(6.5)}>{occ.label}</div>
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
              material={matRed}
            >
              <boxGeometry args={[BAR_W * 0.75, 1, BAR_W * 0.75]} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[iVol] = m; }}
              position={[xVol, TOP_Y + cat.vol + CAP_H / 2, 0]}
              material={matCap}
            >
              <boxGeometry args={[BAR_W * 0.75 + 0.03, CAP_H, BAR_W * 0.75 + 0.03]} />
            </mesh>
            {/* Value bar — gold */}
            <mesh
              raycast={() => null}
              ref={(m) => { barRefs.current[iVal] = m; }}
              position={[xVal, TOP_Y + cat.val / 2, 0]}
              material={matGold}
            >
              <boxGeometry args={[BAR_W * 0.75, 1, BAR_W * 0.75]} />
            </mesh>
            <mesh
              raycast={() => null}
              ref={(m) => { capRefs.current[iVal] = m; }}
              position={[xVal, TOP_Y + cat.val + CAP_H / 2, 0]}
              material={matCap}
            >
              <boxGeometry args={[BAR_W * 0.75 + 0.03, CAP_H, BAR_W * 0.75 + 0.03]} />
            </mesh>
            {inRole && (
              <Html
                position={[x, labelY, 0]}
                center distanceFactor={LABEL_DF} occlude={false}
              >
                <div style={pillStyle(6)}>{cat.label}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* ---- Role-only labels / pills ---- */}
      {inRole && (
        <>
          {/* Header */}
          <Html position={[0, 1.74, -0.3]} center distanceFactor={6} occlude={false}>
            <div style={{ ...pillStyle(12), fontWeight: 700, letterSpacing: '0.24em', background: 'rgba(12,6,4,0.95)', border: '1.5px solid rgba(255,185,83,0.85)' }}>
              Consumer Pulse
            </div>
          </Html>

          {/* Chart A sub-label */}
          <Html position={[OCC_X0 + 1.5 * OCC_PITCH, TOP_Y + 0.82, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(7), borderColor: 'rgba(200,16,46,0.65)' }}>
              A Day of Drinks
            </div>
          </Html>

          {/* Chart B sub-label + legend — merged into one Html to halve DOM roots */}
          <Html position={[CAT_X0 + 1.5 * CAT_PITCH, TOP_Y + 0.82, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
              <div style={{ ...pillStyle(7), borderColor: 'rgba(255,185,83,0.70)' }}>
                Volume&nbsp;&times;&nbsp;Value
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ ...pillStyle(5.5), borderColor: 'rgba(200,16,46,0.65)' }}>
                  <span style={{ color: RED }}>&#9646;</span> Vol
                </span>
                <span style={{ ...pillStyle(5.5), borderColor: 'rgba(255,185,83,0.70)' }}>
                  <span style={{ color: GOLD }}>&#9646;</span> Val
                </span>
              </div>
            </div>
          </Html>

          {/* Provenance plate */}
          <Html position={[0, 0.38, 0.33]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(6), color: 'rgba(255,245,220,0.75)' }}>Illustrative &mdash; indexed, not actual data</div>
          </Html>
        </>
      )}
    </group>
  );
}
