import { useRef, useMemo } from 'react';
import { Billboard, Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Glowing 140-year growth ribbon for the TAKEAWAYS pull-back: a warm-gold
// luminous arc sweeping left -> right over the rooftops (1886 -> today), with
// five public-history milestone markers. CONTENT POLICY: public milestones
// only — an ILLUSTRATIVE plate sits by the start. The whole group renders
// ONLY in the takeaways view so it never photobombs home (same block!).

const GOLD = '#FFB953';
const GOLD_BRIGHT = '#FFEFC2';
const CREAM = '#FFF6E9';

// Ascending data-story arc (world metres) — two gentle dips between the
// 1886 start and the TODAY high point, not a straight line. NOTE: the
// takeaways camera ([0,17,-50] looking +Z) puts world -X on SCREEN-RIGHT,
// so the curve runs +X -> -X to read left -> right (1886 -> today) on screen.
const CURVE_POINTS: [number, number, number][] = [
  [4, 9, -8],
  [-2, 12.2, -8.5],
  [-7, 10.8, -9],
  [-14, 16.2, -9.5],
  [-19.5, 14.6, -9.8],
  [-26, 20, -10],
];

// t along the arc is year-proportional across 1886 -> today (~140 years).
// pillDy: explicit above/below offsets (three rows on the crowded early
// stretch) so no two pills collide and none leaves the frame.
const MILESTONES = [
  { t: 0, year: '1886', label: "9 drinks/day — Jacobs' Pharmacy", pillDy: 1.9 },
  { t: 0.093, year: '1899', label: 'First bottling plant', pillDy: -2.4 },
  { t: 0.207, year: '1915', label: 'Contour bottle patented', pillDy: 3.2 },
  { t: 0.607, year: '1971', label: 'Hilltop — "I’d like to buy the world a Coke"', pillDy: 1.9 },
  { t: 1, year: 'Today', label: '~1.9B servings daily', pillDy: 1.9 },
];

const TUBE_RADIUS = 0.18;
const BASE_OPACITY = 0.85;
const PULSE_SPEED = 7; // world units/s the bright dashes travel (1886 -> today)
const LABEL_DF = 45; // Html distanceFactor — takeaways cam sits ~45-55 m away

const pillStyle = (size: number): React.CSSProperties => ({
  whiteSpace: 'nowrap',
  textAlign: 'center',
  padding: '3px 9px',
  borderRadius: 9999,
  background: 'rgba(24,12,8,0.8)',
  border: '1px solid rgba(176,141,87,0.45)',
  color: CREAM,
  fontSize: size,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  userSelect: 'none',
  pointerEvents: 'none',
  lineHeight: 1.45,
});

// Inner component so curve/geometry/labels mount only in takeaways (geometry
// is cheap to rebuild; declarative geometries are auto-disposed on unmount).
function Ribbon() {
  const reduced = useReducedMotion();
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const runner = useRef<Line2>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  const { curve, linePoints, markers } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      CURVE_POINTS.map((p) => new THREE.Vector3(...p)),
    );
    return {
      curve,
      linePoints: curve.getPoints(140),
      markers: MILESTONES.map((m) => ({ ...m, pos: curve.getPointAt(m.t) })),
    };
  }, []);

  // Soft pulse travelling along the tube: the dashed overlay's dashOffset
  // decreases, so its bright runs march toward increasing arc length
  // (left -> right, 1886 -> today). The base tube breathes faintly.
  // The end-cap ring slowly pulses in scale (additive, toneMapped=false).
  // Reduced motion: static glow (the dashed runner isn't even mounted;
  // end-cap ring held at rest scale).
  useFrame((state, delta) => {
    if (reduced) return;
    const mat = runner.current?.material;
    if (mat) mat.dashOffset -= delta * PULSE_SPEED;
    const glow = glowMat.current;
    if (glow) glow.opacity = BASE_OPACITY - 0.07 + 0.07 * Math.sin(state.clock.elapsedTime * 1.7);
    const ring = pulseRingRef.current;
    if (ring) {
      // Slow breathe: scale 1.0 → 1.55 at ~0.6 Hz, in sync with a warm halo fade
      const s = 1.0 + 0.55 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3.8));
      ring.scale.setScalar(s);
      const ringMat = ring.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.55 - 0.45 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3.8));
    }
  });

  return (
    <group>
      {/* Luminous gold tube — emissive look: unlit basic material, additive */}
      <mesh frustumCulled={false}>
        <tubeGeometry args={[curve, 128, TUBE_RADIUS, 8, false]} />
        <meshBasicMaterial
          ref={glowMat}
          color={GOLD}
          transparent
          opacity={BASE_OPACITY}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Travelling brightness: dashed fat-line along the same curve */}
      {!reduced && (
        <Line
          ref={runner}
          points={linePoints}
          color={GOLD_BRIGHT}
          lineWidth={3.5}
          dashed
          dashSize={3}
          gapSize={10}
          transparent
          opacity={0.9}
          toneMapped={false}
          depthWrite={false}
        />
      )}

      {/* Milestone markers: billboard dot + halo, pill alternating above/below */}
      {markers.map((m) => (
        <group key={m.year} position={m.pos}>
          <Billboard>
            <mesh>
              <circleGeometry args={[0.28, 20]} />
              <meshBasicMaterial color={CREAM} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <circleGeometry args={[0.55, 20]} />
              <meshBasicMaterial
                color={GOLD}
                transparent
                opacity={0.4}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </Billboard>
          <Html
            position={[0, m.pillDy, 0]}
            center
            distanceFactor={LABEL_DF}
            occlude={false}
          >
            <div style={pillStyle(7)}>
              <span style={{ fontSize: 10.5, fontWeight: 700, display: 'block' }}>{m.year}</span>
              {m.label}
            </div>
          </Html>
        </group>
      ))}

      {/* "Today" terminus end-cap: brighter halo + slow-pulsing outer ring.
          Reduced motion: rings are static (no scale animation in useFrame). */}
      <group position={markers[markers.length - 1].pos}>
        <Billboard>
          {/* Bright inner halo — larger + more opaque than the standard marker halo */}
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[0.85, 24]} />
            <meshBasicMaterial
              color={GOLD_BRIGHT}
              transparent
              opacity={0.5}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Pulsing outer ring (scale + opacity animated in useFrame when !reduced) */}
          <mesh ref={pulseRingRef} position={[0, 0, -0.03]}>
            <ringGeometry args={[0.9, 1.3, 32]} />
            <meshBasicMaterial
              color={GOLD}
              transparent
              opacity={0.35}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      </group>

      {/* Caption plate near the 1886 start — content provenance */}
      <Html
        position={[CURVE_POINTS[0][0], CURVE_POINTS[0][1] - 3.4, CURVE_POINTS[0][2]]}
        center
        distanceFactor={LABEL_DF}
        occlude={false}
      >
        <div style={pillStyle(6)}>Illustrative &mdash; public milestones</div>
      </Html>
    </group>
  );
}

export function GrowthRibbon() {
  const { view } = useNavigation();
  // Hard gate: home looks at this same block — mount in takeaways only.
  if (view !== 'takeaways') return null;
  return <Ribbon />;
}
