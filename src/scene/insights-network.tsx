import { useRef, useMemo } from 'react';
import { Billboard, Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Line2, LineSegments2 } from 'three-stdlib';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { ExhibitHotspot } from './exhibit-hotspot';

// Floating "INSIGHTS NETWORK" constellation — THE AGENT chapter.
// 4 input signal nodes → central AGENT core → 3 insight/action nodes.
// Additive glow spheres, dashed-Line pulse runners (growth-ribbon pattern),
// slow rotation. CONTENT POLICY: generic category labels only, no real data.

const GOLD = '#FFB953';
const GOLD_BRIGHT = '#FFEFC2';
const CREAM = '#FFF6E9';
const COKE_RED = '#C8102E';
const BRASS = '#B08D57';

// World position: ~26 m ahead of agent camera [40,2.2,-16.5], hovering above
// street (y≈3.4), clear of consumer-funnel at [32,0,-20.2].
const NET_POS: [number, number, number] = [14, 3.4, -15.0];

// Node layout in local group space — inputs left, outputs right.
const INPUTS = [
  { id: 'social',   label: 'Social',    pos: [-2.5,  1.2, 0] as [number,number,number] },
  { id: 'surveys',  label: 'Surveys',   pos: [-2.5,  0.4, 0] as [number,number,number] },
  { id: 'retail',   label: 'Retail',    pos: [-2.5, -0.4, 0] as [number,number,number] },
  { id: 'search',   label: 'Search',    pos: [-2.5, -1.2, 0] as [number,number,number] },
];
const OUTPUTS = [
  { id: 'trends',    label: 'Trends',    pos: [2.5,  0.8, 0] as [number,number,number] },
  { id: 'segments',  label: 'Segments',  pos: [2.5,  0.0, 0] as [number,number,number] },
  { id: 'campaigns', label: 'Campaigns', pos: [2.5, -0.8, 0] as [number,number,number] },
];
const CORE_POS: [number, number, number] = [0, 0, 0];
const ORIGIN = new THREE.Vector3(...CORE_POS);

const PULSE_SPEED = 3.5;
const SPIN_SPEED  = 0.12;
const NODE_R      = 0.20; // larger nodes for visibility
const CORE_R      = 0.30; // larger core sphere
const LABEL_DF    = 18;   // smaller distanceFactor → bigger pill text on screen
const NO_RAYCAST  = () => null;

// --- Shared GlowNode resources (hoisted to module scope) -----------------
// All 7 regular nodes share NODE_R → one geometry each, two materials per type.
// Geometries are lazy-evaluated at first use; NODE_R is const so no hot-swap needed.
const _nodeCircleGeo  = new THREE.CircleGeometry(NODE_R * 2.8, 20); // wider halo
const _nodeSphereGeo  = new THREE.SphereGeometry(NODE_R, 14, 10);
// Additive halo materials differ only by color — one per distinct color.
const _haloMat: Record<string, THREE.MeshBasicMaterial> = {
  [GOLD]:  new THREE.MeshBasicMaterial({ color: GOLD,  transparent: true, opacity: 0.32, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
  [CREAM]: new THREE.MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0.32, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
};
const _sphereMat: Record<string, THREE.MeshBasicMaterial> = {
  [GOLD]:  new THREE.MeshBasicMaterial({ color: GOLD,  toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
  [CREAM]: new THREE.MeshBasicMaterial({ color: CREAM, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
};
// -------------------------------------------------------------------------

const pillStyle = (size: number): React.CSSProperties => ({
  whiteSpace: 'nowrap', textAlign: 'center',
  padding: '4px 11px', borderRadius: 9999,
  background: 'rgba(12,6,4,0.92)',
  border: '1.5px solid rgba(255,185,83,0.70)',
  color: '#FFFAF0', fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.16em', textTransform: 'uppercase',
  userSelect: 'none', pointerEvents: 'none', lineHeight: 1.45,
});

// Shared glow-node (Billboard halo + sphere + pill label).
// Uses module-level shared geometry + per-color materials (no new allocations per node).
function GlowNode({
  pos, color, label, labelDx,
}: {
  pos: [number,number,number]; color: string;
  label: string; labelDx: number;
}) {
  return (
    <group position={pos}>
      <Billboard>
        <mesh geometry={_nodeCircleGeo} material={_haloMat[color]} raycast={NO_RAYCAST} />
      </Billboard>
      <mesh geometry={_nodeSphereGeo} material={_sphereMat[color]} raycast={NO_RAYCAST} />
      <Html position={[labelDx, 0, 0]} center distanceFactor={LABEL_DF} occlude={false}>
        <div style={pillStyle(7.5)}>{label}</div>
      </Html>
    </group>
  );
}

// Inner component — mounts geometry only when agent view is active.
function Network() {
  const reduced = useReducedMotion();
  const groupRef = useRef<THREE.Group>(null);
  // drei <Line> instantiates Line2 or LineSegments2 — both carry a
  // LineMaterial, whose dashOffset drives the travelling pulse.
  const inRunners  = useRef<(Line2 | LineSegments2 | null)[]>([null, null, null, null]);
  const outRunners = useRef<(Line2 | LineSegments2 | null)[]>([null, null, null]);

  // Edge point pairs — stable, never reallocated in useFrame.
  const inputEdges  = useMemo(() => INPUTS.map(n  => [new THREE.Vector3(...n.pos),  ORIGIN.clone()]), []);
  const outputEdges = useMemo(() => OUTPUTS.map(n => [ORIGIN.clone(), new THREE.Vector3(...n.pos)]), []);

  // All 7 base hairlines as flat [start, end, start, end, …] pair list for
  // a single <Line segments> draw call (14 draws → 1).
  const allEdgePairs = useMemo(
    () => [...inputEdges, ...outputEdges].flatMap(([a, b]) => [a, b]),
    [inputEdges, outputEdges],
  );

  useFrame((_, delta) => {
    if (reduced) return;
    if (groupRef.current) groupRef.current.rotation.y += delta * SPIN_SPEED;
    const step = delta * PULSE_SPEED;
    for (const r of inRunners.current)  if (r?.material) r.material.dashOffset -= step;
    for (const r of outRunners.current) if (r?.material) r.material.dashOffset -= step;
  });

  return (
    <group ref={groupRef}>
      {/* Base edges — all 7 in ONE draw call via segments, thicker for visibility */}
      <Line segments points={allEdgePairs} color={GOLD} lineWidth={2.2}
        transparent opacity={0.55} toneMapped={false} depthWrite={false} />

      {/* Travelling pulse runners — skipped under reduced-motion */}
      {!reduced && inputEdges.map((pts, i) => (
        <Line key={`ip${i}`} ref={el => { inRunners.current[i] = el; }}
          points={pts} color={GOLD_BRIGHT} lineWidth={3.5}
          dashed dashSize={1.2} gapSize={3.8}
          transparent opacity={1.0} toneMapped={false} depthWrite={false} />
      ))}
      {!reduced && outputEdges.map((pts, i) => (
        <Line key={`op${i}`} ref={el => { outRunners.current[i] = el; }}
          points={pts} color={CREAM} lineWidth={2.8}
          dashed dashSize={1.0} gapSize={3.5}
          transparent opacity={0.90} toneMapped={false} depthWrite={false} />
      ))}

      {/* Input nodes — gold */}
      {INPUTS.map(n => <GlowNode key={n.id} pos={n.pos} color={GOLD} label={n.label} labelDx={-0.38} />)}

      {/* Output nodes — cream */}
      {OUTPUTS.map(n => <GlowNode key={n.id} pos={n.pos} color={CREAM} label={n.label} labelDx={0.38} />)}

      {/* Central AGENT core — Coke red, double corona */}
      <group position={CORE_POS}>
        <Billboard>
          <mesh raycast={NO_RAYCAST}>
            <circleGeometry args={[CORE_R * 3.5, 24]} />
            <meshBasicMaterial color={COKE_RED} transparent opacity={0.18}
              toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </Billboard>
        <Billboard>
          <mesh raycast={NO_RAYCAST}>
            <circleGeometry args={[CORE_R * 2.0, 24]} />
            <meshBasicMaterial color={COKE_RED} transparent opacity={0.45}
              toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </Billboard>
        <mesh raycast={NO_RAYCAST}>
          <sphereGeometry args={[CORE_R, 18, 14]} />
          <meshBasicMaterial color={COKE_RED} toneMapped={false}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <Html position={[0, CORE_R + 0.52, 0]} center distanceFactor={LABEL_DF} occlude={false}>
          <div style={{ ...pillStyle(9), fontWeight: 700, letterSpacing: '0.22em', borderColor: 'rgba(200,16,46,0.70)', background: 'rgba(12,6,4,0.95)' }}>
            Agent
          </div>
        </Html>
      </group>

      {/* Brass mast — grounds the constellation to street level */}
      <mesh position={[0, -1.7, 0]} raycast={NO_RAYCAST}>
        <cylinderGeometry args={[0.018, 0.018, 3.4, 8]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Title pill above the whole group */}
      <Html position={[0, CORE_R + 1.65, 0]} center distanceFactor={15} occlude={false}>
        <div style={{ ...pillStyle(10), fontWeight: 700, letterSpacing: '0.28em', background: 'rgba(12,6,4,0.95)', border: '1.5px solid rgba(255,185,83,0.85)' }}>
          Insights Network
        </div>
      </Html>
    </group>
  );
}

export function InsightsNetwork() {
  const { view } = useNavigation();
  if (view !== 'agent') return null;
  // Proxy box encloses the full constellation: inputs span ±2.5 x ±1.2,
  // outputs to +2.5, height from mast base (-1.7) to title pill (+2.0) ≈ 3.7.
  // Centre y = 0.15 in local group space (mast base=-1.7, top≈2.0 → midpoint 0.15).
  return (
    <group position={NET_POS}>
      <ExhibitHotspot
        size={[5.2, 3.7, 1.0]}
        position={[0, 0.15, 0]}
        label="Insights Network exhibit — click to focus"
      />
      <Network />
    </group>
  );
}
