import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNavigation } from './navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Diegetic "GLOBAL REACH" exhibit for THE TOOLS/STACK chapter: a Victorian
// brass-stand globe showing Coca-Cola's reach from Atlanta to world markets.
// Period prop + data story. CONTENT POLICY: illustrative public figures only —
// the provenance pill says so.  Styling mirrors metrics-display.tsx palette.

const WOOD = '#3A2618';
const WOOD_DARK = '#2B1B10';
const BRASS = '#B08D57';
const GOLD = '#FFB953';
const OCEAN = '#1a2436';
const NO_RAYCAST = () => null;

// Tools camera: pos [7,2.4,-12.5] looking at [3.7,1.0,-5.9].
// MartechPipeline bench is at [5.23,0,-9.06]. Place globe stand off to the
// right of the bench (higher X), clear of the vending machine (~[4.35,0.74,-7.8]).
// ROT_Y ≈ -0.5 yaws the front face toward the camera.
const POS: [number, number, number] = [7.2, 0, -9.8];
const ROT_Y = -0.5;
const GLOBE_R = 0.45;
const GLOBE_CY = 1.32; // globe centre height (local)
const LABEL_DF = 4.0;

// Total pulse instances across all arcs (6 arcs × 3 pulses).
const TOTAL_PULSES = 18;

// Convert lat/lon (degrees) to a unit Vector3 on the sphere surface.
function latLonToV3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// Atlanta origin + 6 destination cities (illustrative public figures).
const ATLANTA = { lat: 33.7, lon: -84.4 };
const DESTINATIONS = [
  { name: 'London', lat: 51.5, lon: -0.1 },
  { name: 'São Paulo', lat: -23.5, lon: -46.6 },
  { name: 'Tokyo', lat: 35.7, lon: 139.7 },
  { name: 'Sydney', lat: -33.9, lon: 151.2 },
  { name: 'Mumbai', lat: 19.1, lon: 72.9 },
  { name: 'Lagos', lat: 6.5, lon: 3.4 },
];
const ARC_LIFT = 0.28; // how far above the surface the arc midpoint rises
const ARC_SEGMENTS = 32;
const PULSE_COUNT = 3; // travelling pulses per arc
const PULSE_SPEED = 0.18; // arc-fraction per second

const pillStyle = (size: number): React.CSSProperties => ({
  whiteSpace: 'nowrap',
  textAlign: 'center',
  padding: '4px 12px',
  borderRadius: 9999,
  background: 'rgba(18,8,4,0.92)',
  border: '1.5px solid rgba(255,185,83,0.7)',
  color: '#FFF6E9',
  fontSize: size,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  userSelect: 'none',
  pointerEvents: 'none',
  lineHeight: 1.5,
});

// ── Animated inner: arcs + pulses — mounted ONLY in tools view ──────────────
// Keeps the draw cost of 6 arc tubes + 1 pulse InstancedMesh off-screen when
// the globe is a distant/invisible prop in other views.
function GlobeArcs({
  arcGeoms,
  pulseCurves,
  reduced,
}: {
  arcGeoms: THREE.TubeGeometry[];
  pulseCurves: THREE.QuadraticBezierCurve3[];
  reduced: boolean;
}) {
  const pulseRef = useRef<THREE.InstancedMesh>(null);
  const tPulse = useRef(0);
  const placedPulse = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set a fixed bounding sphere on mount so Three.js frustum-culls correctly.
  // Pulses stay within GLOBE_R + ARC_LIFT of the globe centre (local origin).
  // Centre = world-space globe group origin; here we set it in local coords.
  useEffect(() => {
    const mesh = pulseRef.current;
    if (!mesh) return;
    mesh.geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      GLOBE_R + ARC_LIFT + 0.08,
    );
  }, []);

  useFrame((_, delta) => {
    const animate = !reduced;
    if (!animate && placedPulse.current) return;
    tPulse.current = animate ? (tPulse.current + delta * PULSE_SPEED) % 1 : tPulse.current;
    const mesh = pulseRef.current;
    if (!mesh) return;
    for (let a = 0; a < DESTINATIONS.length; a++) {
      const curve = pulseCurves[a];
      for (let p = 0; p < PULSE_COUNT; p++) {
        const u = (tPulse.current + p / PULSE_COUNT) % 1;
        curve.getPoint(u, dummy.position);
        dummy.updateMatrix();
        mesh.setMatrixAt(a * PULSE_COUNT + p, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    placedPulse.current = true;
  });

  return (
    <>
      {/* Glowing arcs — additive gold tubes */}
      {arcGeoms.map((geom, i) => (
        <mesh key={i} geometry={geom} raycast={NO_RAYCAST}>
          <meshBasicMaterial
            color={GOLD}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Travelling pulses — single InstancedMesh of 18 instances (6 arcs × 3) */}
      <instancedMesh
        ref={pulseRef}
        args={[undefined, undefined, TOTAL_PULSES]}
        raycast={NO_RAYCAST}
      >
        <sphereGeometry args={[0.016, 6, 6]} />
        {/* meshBasicMaterial: additive glow dots need no PBR lighting */}
        <meshBasicMaterial
          color={GOLD}
          toneMapped={false}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </>
  );
}

export function GlobalReachGlobe() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();
  const inTools = view === 'tools';

  const globeRef = useRef<THREE.Group>(null);

  const { arcGeoms, pulseCurves } = useMemo(() => {
    const arcGeoms: THREE.TubeGeometry[] = [];
    const pulseCurves: THREE.QuadraticBezierCurve3[] = [];
    for (const dest of DESTINATIONS) {
      const p0 = latLonToV3(ATLANTA.lat, ATLANTA.lon, GLOBE_R);
      const p2 = latLonToV3(dest.lat, dest.lon, GLOBE_R);
      const mid = p0
        .clone()
        .add(p2)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(GLOBE_R + ARC_LIFT);
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
      arcGeoms.push(new THREE.TubeGeometry(curve, ARC_SEGMENTS, 0.010, 5, false));
      pulseCurves.push(curve);
    }
    return { arcGeoms, pulseCurves };
  }, []);

  // Wireframe shell geometry — a slightly larger sphere for continent suggestion.
  const wireGeom = useMemo(
    () => new THREE.SphereGeometry(GLOBE_R + 0.008, 24, 16),
    [],
  );

  useFrame((_, delta) => {
    // Globe rotation — gate to tools view; frozen rotation is invisible off-view.
    const g = globeRef.current;
    if (g && !reduced && inTools) {
      g.rotation.y += delta * 0.12;
    }
  });

  // Atlanta marker position on the globe surface (local to globe group).
  const atlantaPos = useMemo(() => latLonToV3(ATLANTA.lat, ATLANTA.lon, GLOBE_R + 0.01), []);

  return (
    <group position={POS} rotation={[0, ROT_Y, 0]} raycast={NO_RAYCAST}>
      {/* ── Pedestal: plinth, body, column, tabletop (dark Victorian wood) ── */}
      <mesh position={[0, 0.05, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.56, 0.1, 0.56]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.36, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.46, 0.52, 0.46]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.64, 0]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.56, 0.06, 0.56]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.75} />
      </mesh>
      {/* Brass trim on pedestal top */}
      <mesh position={[0, 0.675, 0.27]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.56, 0.018, 0.025]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Caption plate (brass) on pedestal front */}
      <mesh position={[0, 0.38, 0.235]} raycast={NO_RAYCAST}>
        <boxGeometry args={[0.38, 0.08, 0.02]} />
        <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.35} />
      </mesh>
      {/* Central support column: brass rod */}
      <mesh position={[0, 0.99, 0]} raycast={NO_RAYCAST}>
        <cylinderGeometry args={[0.022, 0.022, 0.7, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* ── Equatorial meridian ring (brass torus) ── */}
      <mesh position={[0, GLOBE_CY, 0]} raycast={NO_RAYCAST}>
        <torusGeometry args={[GLOBE_R + 0.03, 0.018, 10, 64]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.28} />
      </mesh>

      {/* ── Globe group (rotates independently) ── */}
      <group ref={globeRef} position={[0, GLOBE_CY, 0]}>
        {/* Ocean sphere — slightly lighter navy for better contrast with gold arcs */}
        <mesh raycast={NO_RAYCAST}>
          <sphereGeometry args={[GLOBE_R, 32, 24]} />
          <meshStandardMaterial color={'#1f2d47'} roughness={0.45} metalness={0.05} />
        </mesh>
        {/* Continent suggestion — faint additive wireframe shell */}
        <mesh geometry={wireGeom} raycast={NO_RAYCAST}>
          <meshBasicMaterial
            color={GOLD}
            wireframe
            transparent
            opacity={0.14}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Atlanta origin marker — gold sphere; basic mat, no PBR needed */}
        <mesh position={atlantaPos} raycast={NO_RAYCAST}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial
            color={GOLD}
            toneMapped={false}
          />
        </mesh>

        {/* Arcs + pulses — mounted only in tools view (MED: off-view draw savings) */}
        {inTools && (
          <GlobeArcs
            arcGeoms={arcGeoms}
            pulseCurves={pulseCurves}
            reduced={reduced}
          />
        )}
      </group>

      {/* ── Html labels — TOOLS view only ── */}
      {inTools && (
        <>
          {/* Header pill — floats above the globe */}
          <Html position={[0, GLOBE_CY + GLOBE_R + 0.28, 0]} center distanceFactor={5} occlude={false}>
            <div style={{ ...pillStyle(12), fontWeight: 700, letterSpacing: '0.24em' }}>
              Global Reach
            </div>
          </Html>
          {/* Stat pill */}
          <Html position={[0, GLOBE_CY + GLOBE_R + 0.06, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(8)}>
              <span style={{ fontSize: 12, fontWeight: 700, display: 'block' }}>200+ countries</span>
              ~1.9B servings / day
            </div>
          </Html>
          {/* Provenance pill on the caption plate */}
          <Html position={[0, 0.38, 0.26]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(7)}>Illustrative &mdash; public figures</div>
          </Html>
        </>
      )}
    </group>
  );
}
