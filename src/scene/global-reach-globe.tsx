import { useMemo, useRef } from 'react';
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
const LABEL_DF = 5.5;

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

// Build a tube arc between two lat/lon points lifted above the sphere.
// Returns TubeGeometry built around a QuadraticBezierCurve3.
function buildArc(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): THREE.TubeGeometry {
  const p0 = latLonToV3(a.lat, a.lon, GLOBE_R);
  const p2 = latLonToV3(b.lat, b.lon, GLOBE_R);
  const mid = p0.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_R + ARC_LIFT);
  const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
  return new THREE.TubeGeometry(curve, ARC_SEGMENTS, 0.006, 5, false);
}

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

export function GlobalReachGlobe() {
  const { view } = useNavigation();
  const reduced = useReducedMotion();
  const inTools = view === 'tools';

  const globeRef = useRef<THREE.Group>(null);
  // One InstancedMesh per arc — 6 arcs × 3 pulses = 18 instances total, but
  // split across 6 meshes so each reuses its arc's curve without coupling.
  const pulseRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const tPulse = useRef(0);
  const placedPulse = useRef(false);

  const { arcGeoms, pulseCurves, dummy } = useMemo(() => {
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
      arcGeoms.push(new THREE.TubeGeometry(curve, ARC_SEGMENTS, 0.006, 5, false));
      pulseCurves.push(curve);
    }
    return { arcGeoms, pulseCurves, dummy: new THREE.Object3D() };
  }, []);

  // Wireframe shell geometry — a slightly larger sphere for continent suggestion.
  const wireGeom = useMemo(
    () => new THREE.SphereGeometry(GLOBE_R + 0.008, 24, 16),
    [],
  );

  useFrame((_, delta) => {
    // Globe rotation — zero allocations; skip when reduced.
    const g = globeRef.current;
    if (g && !reduced) {
      g.rotation.y += delta * 0.12;
    }

    // Pulse animation — only in tools view; write resting positions once otherwise.
    const animate = inTools && !reduced;
    if (!animate && placedPulse.current) return;
    tPulse.current = animate ? (tPulse.current + delta * PULSE_SPEED) % 1 : tPulse.current;
    for (let a = 0; a < DESTINATIONS.length; a++) {
      const mesh = pulseRefs.current[a];
      if (!mesh) continue;
      const curve = pulseCurves[a];
      for (let p = 0; p < PULSE_COUNT; p++) {
        const u = (tPulse.current + p / PULSE_COUNT) % 1;
        curve.getPoint(u, dummy.position);
        dummy.updateMatrix();
        mesh.setMatrixAt(p, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    placedPulse.current = true;
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
        {/* Ocean sphere — deep navy */}
        <mesh raycast={NO_RAYCAST}>
          <sphereGeometry args={[GLOBE_R, 32, 24]} />
          <meshStandardMaterial color={OCEAN} roughness={0.55} metalness={0.0} />
        </mesh>
        {/* Continent suggestion — faint additive wireframe shell */}
        <mesh geometry={wireGeom} raycast={NO_RAYCAST}>
          <meshBasicMaterial
            color={GOLD}
            wireframe
            transparent
            opacity={0.07}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Atlanta origin marker — small gold sphere */}
        <mesh position={atlantaPos} raycast={NO_RAYCAST}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial
            color={GOLD}
            emissive={GOLD}
            emissiveIntensity={2.2}
            roughness={0.3}
          />
        </mesh>

        {/* Glowing arcs — additive gold tubes */}
        {arcGeoms.map((geom, i) => (
          <mesh key={i} geometry={geom} raycast={NO_RAYCAST}>
            <meshBasicMaterial
              color={GOLD}
              transparent
              opacity={0.72}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        {/* Travelling pulses — one InstancedMesh per arc */}
        {DESTINATIONS.map((_, i) => (
          <instancedMesh
            key={i}
            ref={(m) => { pulseRefs.current[i] = m; }}
            args={[undefined, undefined, PULSE_COUNT]}
            frustumCulled={false}
            raycast={NO_RAYCAST}
          >
            <sphereGeometry args={[0.016, 6, 6]} />
            <meshStandardMaterial
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={3.5}
              roughness={0.35}
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </instancedMesh>
        ))}
      </group>

      {/* ── Html labels — TOOLS view only ── */}
      {inTools && (
        <>
          {/* Header pill — floats above the globe */}
          <Html position={[0, GLOBE_CY + GLOBE_R + 0.22, 0]} center distanceFactor={7} occlude={false}>
            <div style={{ ...pillStyle(10), fontWeight: 700, letterSpacing: '0.24em' }}>
              Global Reach
            </div>
          </Html>
          {/* Stat pill */}
          <Html position={[0, GLOBE_CY + GLOBE_R + 0.06, 0]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(6)}>
              <span style={{ fontSize: 9.5, fontWeight: 700, display: 'block' }}>200+ countries</span>
              ~1.9B servings / day
            </div>
          </Html>
          {/* Provenance pill on the caption plate */}
          <Html position={[0, 0.38, 0.26]} center distanceFactor={LABEL_DF} occlude={false}>
            <div style={pillStyle(5.5)}>Illustrative &mdash; public figures</div>
          </Html>
        </>
      )}
    </group>
  );
}
