import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic "CONSUMER JOURNEY" funnel for THE AGENT chapter: a freestanding
// brass-framed exhibit on a dark-wood plinth holding four stacked truncated
// cones — a classic marketing funnel rendered as a period soda-works fixture.
// CONTENT POLICY: percentages are ILLUSTRATIVE textbook funnel figures only —
// no internal/confidential data. The plinth plate says so.

const CREAM = '#FFF2DC';
const BUFF = '#E3BE8C';
const COKE_RED = '#bd0a0d';
const DEEP_RED = '#6E0507';
const WOOD = '#3A2618';
const WOOD_DARK = '#2B1B10';
const BRASS = '#B08D57';

// Top-to-bottom tiers — widest (AWARENESS) at the top, narrowing down.
const TIER_H = 0.18;
const TIER_GAP = 0.09;
const STACK_BASE = 0.61; // top surface of the plinth cap
const TIERS = [
  { label: 'Awareness', value: '100%', top: 0.44, bottom: 0.34, color: CREAM, emissive: 0 },
  { label: 'Consideration', value: '38%', top: 0.32, bottom: 0.23, color: BUFF, emissive: 0 },
  { label: 'Purchase', value: '12%', top: 0.21, bottom: 0.13, color: COKE_RED, emissive: 0 },
  { label: 'Loyalty', value: '5%', top: 0.115, bottom: 0.05, color: DEEP_RED, emissive: 0.45 },
];
// Centre Y of tier i (i = 0 is the TOP tier).
const tierY = (i: number) => STACK_BASE + (TIERS.length - 1 - i) * (TIER_H + TIER_GAP) + TIER_H / 2;

// The agent camera sits at [40,2.2,-16.5] sighting straight down the street
// centreline toward -X. The DOM caption owns the upper-left, so the funnel
// stands on the open pavement to camera-RIGHT of the sightline (z < -16.5),
// ~10 m ahead — prominent on the empty right frame edge without blocking
// the street or the vehicle corridor. ROT_Y turns the plinth front
// (+Z local) back toward the camera.
// (z also keeps ~1 m+ lateral clearance from the home->agent camera glide,
// whose straight damp3 chord passes [32, 3.0, -19.4].)
const POS: [number, number, number] = [32, 0, -20.2];
const ROT_Y = 1.14;
const SPIN_SPEED = 0.15; // rad/s — slow display-case turntable
const LABEL_DF = 8; // Html distanceFactor (camera is ~8.5 m out)

// Droplets — one InstancedMesh, 3 per inter-tier gap, phase-offset loop.
const DROP_COUNT = 9;
const DROP_FALL_S = 1.4; // seconds per drip cycle
const DROP_ANGLES = [0.4, 2.5, 4.6, 1.1, 3.2, 5.3, 1.8, 3.9, 6.0];
const dropDummy = new THREE.Object3D();

const NO_RAYCAST = () => null;

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

// Places droplet i for a normalized cycle time t (0..1) — falls from the
// bottom rim of its upper tier into the mouth of the tier below.
function placeDrop(i: number, t: number, mesh: THREE.InstancedMesh) {
  const gap = i % 3; // 0 = between tiers 0-1, 1 = 1-2, 2 = 2-3
  const p = (t + i / DROP_COUNT) % 1;
  const upper = TIERS[gap];
  const startY = tierY(gap) - TIER_H / 2; // bottom face of the upper tier
  const r = upper.bottom * 0.72;
  const a = DROP_ANGLES[i];
  dropDummy.position.set(r * Math.cos(a), startY - p * (TIER_GAP + 0.02), r * Math.sin(a));
  dropDummy.updateMatrix();
  mesh.setMatrixAt(i, dropDummy.matrix);
}

export function ConsumerFunnel() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();
  const inAgent = view === 'agent';

  const stackRef = useRef<THREE.Group>(null);
  const dropsRef = useRef<THREE.InstancedMesh>(null);
  const clock = useRef(0);

  // Lay the droplets out once on mount so the static (reduced-motion /
  // other-view) frame still shows beads mid-fall rather than a clump.
  useEffect(() => {
    const drops = dropsRef.current;
    if (!drops) return;
    for (let i = 0; i < DROP_COUNT; i++) placeDrop(i, 0, drops);
    drops.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    if (!inAgent || reduced) return;
    clock.current += delta;
    const stack = stackRef.current;
    if (stack) stack.rotation.y += delta * SPIN_SPEED;
    const drops = dropsRef.current;
    if (drops) {
      const t = (clock.current / DROP_FALL_S) % 1;
      for (let i = 0; i < DROP_COUNT; i++) placeDrop(i, t, drops);
      drops.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]} raycast={NO_RAYCAST}>
      {/* Plinth — dark wood base, pedestal, cap */}
      <mesh position={[0, 0.05, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.15, 0.1, 1.15]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.325, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.92, 0.45, 0.92]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.58, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.08, 0.06, 1.08]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>

      {/* Brass frame — corner posts + top square + centre finial */}
      {[
        [-0.46, -0.46],
        [-0.46, 0.46],
        [0.46, -0.46],
        [0.46, 0.46],
      ].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 1.13, z]} raycast={NO_RAYCAST}>
          <cylinderGeometry args={[0.016, 0.016, 1.04, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {[
        { pos: [0, 1.66, -0.46] as const, args: [0.95, 0.03, 0.03] as const },
        { pos: [0, 1.66, 0.46] as const, args: [0.95, 0.03, 0.03] as const },
        { pos: [-0.46, 1.66, 0] as const, args: [0.03, 0.03, 0.95] as const },
        { pos: [0.46, 1.66, 0] as const, args: [0.03, 0.03, 0.95] as const },
      ].map((bar, i) => (
        <mesh key={i} position={[bar.pos[0], bar.pos[1], bar.pos[2]]} raycast={NO_RAYCAST}>
          <boxGeometry args={[bar.args[0], bar.args[1], bar.args[2]]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* Centre axle the funnel "spins" on, with a finial ball */}
      <mesh position={[0, 1.12, 0]} raycast={NO_RAYCAST}>
        <cylinderGeometry args={[0.012, 0.012, 1.02, 8]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.655, 0]} raycast={NO_RAYCAST}>
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Caption plate (brass) on the plinth front */}
      <mesh position={[0, 0.36, 0.47]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.66, 0.11, 0.02]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Funnel stack — slow turntable spin (static under reduced motion) */}
      <group ref={stackRef}>
        {TIERS.map((tier, i) => (
          <mesh key={tier.label} position={[0, tierY(i), 0]} raycast={NO_RAYCAST}>
            <cylinderGeometry args={[tier.top, tier.bottom, TIER_H, 24]} />
            <meshStandardMaterial
              color={tier.color}
              roughness={0.45}
              metalness={0.05}
              emissive={tier.emissive > 0 ? tier.color : '#000000'}
              emissiveIntensity={tier.emissive}
            />
          </mesh>
        ))}
      </group>

      {/* Drip loop — tiny emissive droplets falling tier to tier */}
      <instancedMesh ref={dropsRef} args={[undefined, undefined, DROP_COUNT]} raycast={NO_RAYCAST}>
        <sphereGeometry args={[0.03, 6, 5]} />
        <meshStandardMaterial
          color={'#e8201a'}
          emissive={'#ff5040'}
          emissiveIntensity={2.8}
          roughness={0.25}
        />
      </instancedMesh>

      {/* Labels — AGENT view only (no pill clutter from other vantages) */}
      {inAgent && (
        <>
          {TIERS.map((tier, i) => (
            <Html
              key={tier.label}
              position={[i % 2 === 0 ? 0.92 : -0.92, tierY(i), 0]}
              center
              distanceFactor={LABEL_DF}
              occlude={false}
            >
              <div style={pillStyle(6)}>
                <span style={{ fontSize: 9.5, fontWeight: 700, display: 'block' }}>
                  {tier.value}
                </span>
                {tier.label}
              </div>
            </Html>
          ))}
          <Html position={[0, 1.84, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={{ ...pillStyle(8), fontWeight: 700, letterSpacing: '0.24em' }}>
              Consumer Journey
            </div>
          </Html>
          <Html position={[0, 0.36, 0.5]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(5)}>Consumer Journey &mdash; Illustrative</div>
          </Html>
        </>
      )}
    </group>
  );
}
