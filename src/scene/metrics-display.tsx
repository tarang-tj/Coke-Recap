import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic "MARKET INSIGHTS" stand for THE ROLE chapter: a period wood-and-
// brass display holding a stylized 3-D bar chart of consumer-marketing
// metrics. CONTENT POLICY: public, commonly-cited illustrative figures only —
// no internal/confidential data. Bar heights are normalized per-bar (the
// label carries the real number); a caption plate says so.

const RED = '#C8102E';
const CREAM = '#FFF2DC';
const WOOD = '#3A2618';
const WOOD_DARK = '#2B1B10';
const BRASS = '#B08D57';
const GOLD = '#FFB953';

// Stylized heights (world metres above the tabletop) — NOT to a shared scale.
const BARS = [
  { value: '~1.9B', label: 'Daily servings', h: 0.74, color: RED },
  { value: '200+', label: 'Countries', h: 0.56, color: CREAM },
  { value: '~94%', label: 'Logo recognition', h: 0.70, color: RED },
  { value: '~$4B', label: 'Annual ad spend', h: 0.48, color: CREAM },
  { value: '5¢', label: 'Price 1886–1959', h: 0.38, color: RED },
];

// Role camera sits at [2.6,2.4,-12] looking +Z — camera-right is world -X, so
// the stand lives at x < 2.6 (screen right, clear of the left DOM caption and
// the centre-frame soda fountain). Front of the stand (+Z local) is yawed
// back toward the camera on the -Z side.
const POS: [number, number, number] = [1.1, 0.05, -6.8];
const ROT_Y = 2.62;
const BAR_GAP = 0.375; // bar pitch along the tabletop
const LABEL_DF = 4.8; // Html distanceFactor for bar pills — slightly closer = bigger pills
const TOP_Y = 0.6; // tabletop surface height
const BAR_W = 0.20; // wider bars for better visibility
const CAP_H = 0.045; // taller caps to catch more bloom
const STAGGER = 0.14; // s between bar starts

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

export function MetricsDisplay() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();
  const inRole = view === 'role';

  const barRefs = useRef<(THREE.Mesh | null)[]>([]);
  const capRefs = useRef<(THREE.Mesh | null)[]>([]);
  // Heights start full so the stand reads complete in the wide home shot;
  // entering ROLE resets to 0 and the bars rise (staggered ease-out).
  const anim = useRef({ t: 10, heights: BARS.map((b) => b.h) });
  const wasInRole = useRef(false);
  // settled=true once the entrance animation is done; reset when re-entering role.
  const settled = useRef(true);

  useEffect(() => {
    if (inRole && !wasInRole.current && !reduced) {
      anim.current.t = 0;
      for (let i = 0; i < BARS.length; i++) anim.current.heights[i] = 0;
      settled.current = false;
    }
    wasInRole.current = inRole;
  }, [inRole, reduced]);

  useFrame((_, delta) => {
    // Early-out: nothing to animate when bars are at rest.
    if (settled.current) return;

    const a = anim.current;
    a.t += delta;

    // Early-out for reduced motion — snap to full and mark settled.
    if (reduced) {
      for (let i = 0; i < BARS.length; i++) {
        a.heights[i] = BARS[i].h;
        const bar = barRefs.current[i];
        if (bar) { bar.scale.y = BARS[i].h; bar.position.y = TOP_Y + BARS[i].h / 2; }
        const cap = capRefs.current[i];
        if (cap) cap.position.y = TOP_Y + BARS[i].h + CAP_H / 2;
      }
      settled.current = true;
      return;
    }

    for (let i = 0; i < BARS.length; i++) {
      const full = BARS[i].h;
      // Hold at current height until this bar's stagger slot opens, then
      // exponential-damp toward full — ease-out, zero per-frame allocations.
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
    if (a.t > BARS.length * STAGGER + 1.5) settled.current = true;
  });

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]}>
      {/* Plinth + pedestal + tabletop — dark wood */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.95, 0.1, 0.8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[1.7, 0.44, 0.6]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.57, 0]}>
        <boxGeometry args={[1.95, 0.06, 0.8]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>
      {/* Brass trim on the tabletop front edge */}
      <mesh position={[0, 0.605, 0.39]}>
        <boxGeometry args={[1.95, 0.02, 0.03]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Brass posts + header board */}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 1.0, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 10]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, -0.3]}>
        <boxGeometry args={[1.95, 0.24, 0.05]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.63, -0.3]}>
        <boxGeometry args={[1.99, 0.025, 0.07]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.25} emissive={GOLD} emissiveIntensity={0.5} />
      </mesh>
      {/* Caption plate (brass) on the pedestal front */}
      <mesh position={[0, 0.38, 0.305]}>
        <boxGeometry args={[0.62, 0.1, 0.02]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Bars — unit-height boxes scaled in useFrame, brass caps ride the top */}
      {BARS.map((b, i) => {
        const x = -0.75 + i * BAR_GAP;
        // Stagger pill rows so neighbouring labels never collide on screen
        // (bar heights roughly descend, so the EVEN bars get the high row).
        const labelY = TOP_Y + b.h + (i % 2 === 0 ? 0.26 : 0.1);
        return (
          <group key={b.label}>
            <mesh
              ref={(m) => {
                barRefs.current[i] = m;
              }}
              position={[x, TOP_Y + b.h / 2, 0]}
            >
              <boxGeometry args={[BAR_W, 1, BAR_W]} />
              <meshStandardMaterial
                color={b.color}
                roughness={0.40}
                metalness={0.08}
                emissive={b.color}
                emissiveIntensity={b.color === RED ? 0.55 : 0.30}
              />
            </mesh>
            <mesh
              ref={(m) => {
                capRefs.current[i] = m;
              }}
              position={[x, TOP_Y + b.h + CAP_H / 2, 0]}
            >
              <boxGeometry args={[BAR_W + 0.05, CAP_H, BAR_W + 0.05]} />
              <meshStandardMaterial
                color={GOLD}
                metalness={0.85}
                roughness={0.25}
                emissive={GOLD}
                emissiveIntensity={0.65}
              />
            </mesh>
            {inRole && (
              <Html position={[x, labelY, 0]} center distanceFactor={LABEL_DF} occlude={false}>
                <div style={pillStyle(7)}>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{b.value}</span>
                  {b.label}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Header + caption labels — ROLE view only (no label clutter elsewhere) */}
      {inRole && (
        <>
          <Html position={[0, 1.74, -0.3]} center distanceFactor={6} occlude={false}>
            <div style={{ ...pillStyle(12), fontWeight: 700, letterSpacing: '0.24em', background: 'rgba(12,6,4,0.95)', border: '1.5px solid rgba(255,185,83,0.85)' }}>
              Market Insights
            </div>
          </Html>
          <Html position={[0, 0.38, 0.33]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(6), color: 'rgba(255,245,220,0.75)' }}>Illustrative &mdash; public figures</div>
          </Html>
        </>
      )}
    </group>
  );
}
