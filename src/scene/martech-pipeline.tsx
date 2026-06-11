import { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic "MARTECH PIPELINE" exhibit for THE STACK chapter: a low dark-wood
// apothecary bench holding three brass-and-glass apparatus stations (DATA IN
// -> INSIGHT -> ACTIVATION) joined by a copper tube. A dozen emissive
// amber-red droplets flow along the tube (one instancedMesh, reused matrices,
// zero per-frame allocations). CONTENT POLICY: purely illustrative — the
// caption plate says so. Styling mirrors metrics-display.tsx.

const WOOD = '#3A2618';
const WOOD_DARK = '#2B1B10';
const BRASS = '#B08D57';
const COPPER = '#B87333';
const GLASS = '#A9C4B8';
const DROPLET = '#FF5A1F';

// Tools camera: pos [7,2.4,-12.5] look [3.7,1.0,-5.9]. The bench sits low and
// screen-left of the vending machine, yawed so its front (+Z local) faces the
// camera. Hotspot proxy is at [3.6,0.77,-5.9] — bench centre stays >3m clear.
const POS: [number, number, number] = [5.23, 0, -9.06];
const ROT_Y = 2.67;
const TOP_Y = 0.51; // bench top surface height (local)
const LABEL_DF = 5.5; // Html distanceFactor, matching metrics-display pills
const SPEED = 0.06; // droplet loops per second — steady, calm flow
const COUNT = 12; // droplet instances

// labelY is staggered (centre pill rides high) so the three pills never
// collide on screen at the tools-view camera distance.
const STATIONS = [
  { x: -0.42, vesselY: 0.66, labelY: 0.84, label: 'Data In', sub: 'Sources' },
  { x: 0, vesselY: 0.72, labelY: 1.06, label: 'Insight', sub: 'Modeling' },
  { x: 0.42, vesselY: 0.66, labelY: 0.84, label: 'Activation', sub: 'Campaigns' },
];

// Closed loop through the three vessels; the return run ducks low behind the
// bench so the visible flow reads left -> right through the stations.
const PATH: [number, number, number][] = [
  [-0.62, 0.48, -0.06],
  [-0.42, 0.66, 0],
  [-0.21, 0.58, 0.05],
  [0, 0.72, 0],
  [0.21, 0.58, 0.05],
  [0.42, 0.66, 0],
  [0.62, 0.48, -0.06],
  [0.4, 0.39, -0.16],
  [0, 0.37, -0.18],
  [-0.4, 0.39, -0.16],
];

// Children keep their own raycast; null it everywhere so the exhibit can
// never intercept clicks meant for the vending-machine hotspot.
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

export function MartechPipeline() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();
  const inTools = view === 'tools';

  const dropletsRef = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const placed = useRef(false);

  const { curve, dummy } = useMemo(() => {
    const pts = PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    return {
      curve: new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5),
      dummy: new THREE.Object3D(),
    };
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 96, 0.012, 6, true), [curve]);

  useFrame((_, delta) => {
    const mesh = dropletsRef.current;
    if (!mesh) return;
    const animate = inTools && !reduced;
    // Frozen (reduced motion / other views): write the distributed resting
    // positions once, then bail — no per-frame work while idle.
    if (!animate && placed.current) return;
    if (animate) t.current = (t.current + delta * SPEED) % 1;
    for (let i = 0; i < COUNT; i++) {
      curve.getPointAt((t.current + i / COUNT) % 1, dummy.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    placed.current = true;
  });

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]} raycast={NO_RAYCAST}>
      {/* Bench — plinth, body, top, brass front trim (dark apothecary wood) */}
      <mesh position={[0, 0.04, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.3, 0.08, 0.55]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.29, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.15, 0.34, 0.45]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.485, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.3, 0.05, 0.55]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.515, 0.265]} raycast={NO_RAYCAST}>
        <boxGeometry args={[1.3, 0.018, 0.025]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Caption plate (brass) on the bench front */}
      <mesh position={[0, 0.3, 0.235]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.62, 0.09, 0.02]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Copper tube tracing the whole droplet loop */}
      <mesh geometry={tube} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={COPPER} metalness={0.85} roughness={0.35} />
      </mesh>

      {/* Three apparatus stations: brass base + glass vessel + brass finial */}
      {STATIONS.map((s) => (
        <group key={s.label}>
          <mesh position={[s.x, TOP_Y + 0.03, 0]} raycast={NO_RAYCAST}>
            <cylinderGeometry args={[0.075, 0.095, 0.06, 12]} />
            <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[s.x, (TOP_Y + 0.06 + s.vesselY) / 2, 0]} raycast={NO_RAYCAST}>
            <cylinderGeometry args={[0.022, 0.022, s.vesselY - TOP_Y - 0.06, 8]} />
            <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Glass flask — plain transparent standard material (no transmission) */}
          <mesh position={[s.x, s.vesselY, 0]} raycast={NO_RAYCAST}>
            <sphereGeometry args={[0.085, 16, 12]} />
            <meshStandardMaterial
              color={GLASS}
              roughness={0.12}
              metalness={0.05}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[s.x, s.vesselY + 0.1, 0]} raycast={NO_RAYCAST}>
            <cylinderGeometry args={[0.018, 0.026, 0.05, 10]} />
            <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
          </mesh>
          {inTools && (
            <Html
              position={[s.x, s.labelY, 0]}
              center
              distanceFactor={LABEL_DF}
              occlude={false}
            >
              <div style={pillStyle(6)}>
                <span style={{ fontSize: 10.5, fontWeight: 700, display: 'block' }}>{s.label}</span>
                {s.sub}
              </div>
            </Html>
          )}
        </group>
      ))}

      {/* Flowing payload — ONE instancedMesh, matrices reused in useFrame */}
      <instancedMesh
        ref={dropletsRef}
        args={[undefined, undefined, COUNT]}
        frustumCulled={false}
        raycast={NO_RAYCAST}
      >
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial
          color={DROPLET}
          emissive={'#FF7A40'}
          emissiveIntensity={3.2}
          roughness={0.3}
        />
      </instancedMesh>

      {/* Caption pill — TOOLS view only, like the metrics-display labels */}
      {inTools && (
        <Html position={[0, 0.3, 0.26]} center distanceFactor={LABEL_DF} occlude={false}>
          <div style={pillStyle(5.5)}>Martech Pipeline &mdash; Illustrative</div>
        </Html>
      )}
    </group>
  );
}
