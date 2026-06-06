import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { agent } from '../../data/portfolio-content';

// Module-level scratch Color — reused inside frame loops to avoid per-frame allocation
const _tmpColor = new THREE.Color();

// Act 3 — Agent
// Chrome 1950s soda-fountain dispenser on a tiled diner counter.
// Three pull-handles labeled with agent.pillars (Ingest / Analyze / Surface).
// No transmission materials. PBR chrome via meshStandardMaterial.

const CHROME_COLOR = '#D6D2CA';
const BAKELITE_COLOR = '#1A1816';
const BRASS_COLOR = '#B89668';
const BRASS_ENGRAVED = '#3A2406';
const BRASS_ACTIVE = '#FFF6E0';
const COKE_RED = '#F40009';
const COKE_RED_DARK = '#A60010';

const PILLAR_NAMES = agent.pillars.map((p) => p.name); // ['Ingest','Analyze','Surface']

// ─── Procedural tile counter texture (baked once) ─────────────────────────────

function buildTileTexture(): THREE.CanvasTexture {
  const SIZE = 512;
  const TILE_PX = 64; // 512/8 tiles per row
  const GROUT_PX = 4;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < SIZE / TILE_PX; row++) {
    for (let col = 0; col < SIZE / TILE_PX; col++) {
      const isRed = (row + col) % 2 === 0;
      ctx.fillStyle = isRed ? '#A60010' : '#F1E9DA';
      ctx.fillRect(col * TILE_PX, row * TILE_PX, TILE_PX, TILE_PX);
    }
  }

  // Grout lines
  ctx.fillStyle = '#5A1212';
  for (let i = 0; i <= SIZE / TILE_PX; i++) {
    // Horizontal
    ctx.fillRect(0, i * TILE_PX - GROUT_PX / 2, SIZE, GROUT_PX);
    // Vertical
    ctx.fillRect(i * TILE_PX - GROUT_PX / 2, 0, GROUT_PX, SIZE);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

// ─── Drip component ───────────────────────────────────────────────────────────

interface DripProps {
  // Position in the parent group's local space (the handle group's local space)
  // x/z are in the group-rotated frame, y is group-local
  localX: number;
  localY: number;
  localZ: number;
  isActive: boolean;
}

function Drip({ localX, localY, localZ, isActive }: DripProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  // phase: 'wait' | 'falling'
  const stateRef = useRef<{ phase: 'wait' | 'falling'; timer: number; y: number }>({
    phase: 'wait',
    timer: 1.5 + Math.random(),
    y: localY,
  });

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!isActive) {
      mesh.visible = false;
      return;
    }

    const s = stateRef.current;
    s.timer -= dt;

    if (s.phase === 'wait') {
      mesh.visible = false;
      if (s.timer <= 0) {
        s.phase = 'falling';
        s.y = localY;
        s.timer = 0.7;
      }
    } else {
      // falling — move in local Y (group is already rotated, so Y is world-Y equivalent)
      mesh.visible = true;
      s.y -= dt * 1.8;
      mesh.position.set(localX, s.y, localZ);
      // Fade out near counter surface. Counter is at group y ≈ -0.85 in parent,
      // but we're inside the handle group which is not y-offset, so counter is ~-0.85 relative.
      const matAny = mesh.material as THREE.MeshStandardMaterial;
      matAny.opacity = Math.max(0, Math.min(1, (s.y + 0.85) / 0.5));
      if (s.timer <= 0 || s.y < -0.82) {
        s.phase = 'wait';
        s.timer = 1.5 + Math.random() * 1.0;
        mesh.visible = false;
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false} position={[localX, localY, localZ]}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshStandardMaterial
        color={COKE_RED_DARK}
        emissive={COKE_RED_DARK}
        emissiveIntensity={0.7}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── HandleAssembly ───────────────────────────────────────────────────────────

interface HandleAssemblyProps {
  angle: number;          // radians around Y axis
  pillarName: string;
  isActive: boolean;
  reduced: boolean;
}

function HandleAssembly({ angle, pillarName, isActive, reduced }: HandleAssemblyProps) {
  const plateMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const plateLightRef = useRef<THREE.PointLight>(null);

  // Drip starts at spout tip in THIS group's local space.
  // The group is rotated by `angle` around Y, so X is the outward radial axis.
  // Spout is at x=0.6+0.16=0.76 (column edge + half spout length), y=0.32 (tip after tilt).
  const dripLocalX = 0.76;
  const dripLocalY = 0.32;
  const dripLocalZ = 0.0;

  useFrame((_, dt) => {
    const mat = plateMatRef.current;
    const light = plateLightRef.current;
    if (!mat) return;

    const targetEmissive = isActive ? 1.2 : 0.0;
    const targetColor = isActive ? BRASS_ACTIVE : BRASS_COLOR;
    // Lerp emissive intensity
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * Math.min(1, dt * 4);

    // Lerp emissive color — reuse module scratch to avoid per-frame allocation
    _tmpColor.set(targetColor);
    mat.emissive.lerp(_tmpColor, Math.min(1, dt * 4));

    if (light) {
      const targetLightI = isActive ? 0.6 : 0.0;
      light.intensity += (targetLightI - light.intensity) * Math.min(1, dt * 4);
    }
  });

  // Handle group rotated around Y to place it at the correct angle around the column
  // Spout points outward from column: rotates +x outward, slight downward tilt
  return (
    <group rotation={[0, angle, 0]}>
      {/* Spout: cylinder pointing outward at y=0.4 on column */}
      {/* Positioned at edge of column (r≈0.6), angled slightly down */}
      <group position={[0.6, 0.4, 0]} rotation={[0, 0, -Math.PI * 0.15]}>
        {/* Spout shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.32, 12]} />
          <meshStandardMaterial color={CHROME_COLOR} roughness={0.12} metalness={0.92} />
        </mesh>
        {/* Bakelite knob at spout tip */}
        <mesh position={[0.18, 0, 0]}>
          <sphereGeometry args={[0.08, 12, 8]} />
          <meshStandardMaterial color={BAKELITE_COLOR} roughness={0.6} metalness={0.1} />
        </mesh>
      </group>

      {/* Brass nameplate just above spout on column surface */}
      <group position={[0.615, 0.58, 0]}>
        <mesh>
          <boxGeometry args={[0.015, 0.09, 0.32]} />
          <meshStandardMaterial
            ref={plateMatRef}
            color={BRASS_COLOR}
            emissive={BRASS_COLOR}
            emissiveIntensity={0.0}
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
        {/* Engraved text */}
        <Text
          position={[0.012, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.04}
          color={BRASS_ENGRAVED}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {pillarName.toUpperCase()}
        </Text>
        {/* Small warm point light for active glow */}
        <pointLight
          ref={plateLightRef}
          color={BRASS_ACTIVE}
          intensity={0.0}
          distance={1.0}
          decay={2}
        />
      </group>

      {/* Drip: only rendered when not reduced-motion; active gating done inside Drip */}
      {!reduced && (
        <Drip
          localX={dripLocalX}
          localY={dripLocalY}
          localZ={dripLocalZ}
          isActive={isActive}
        />
      )}
    </group>
  );
}

// ─── Rivet ring (period detail) ───────────────────────────────────────────────

function RivetRing({ y, count = 8 }: { y: number; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.56, y, Math.sin(a) * 0.56]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={CHROME_COLOR} roughness={0.1} metalness={0.95} />
          </mesh>
        );
      })}
    </>
  );
}

// ─── ActAgent ─────────────────────────────────────────────────────────────────

export function ActAgent() {
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const domeLightMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const elapsedRef = useRef<number>(0);
  const envelopeRef = useRef<number>(0);

  // Active handle index (cycles every 3s, 1.5s on hover)
  const activeIdxRef = useRef<number>(0);
  const cycleTimerRef = useRef<number>(3.0);
  const [activeIdx, setActiveIdx] = useState(0);
  const hoveredRef = useRef(false);

  // Tile texture — baked once
  const tileTexture = useMemo(() => buildTileTexture(), []);

  // Dispose canvas-allocated texture on unmount
  useEffect(() => () => tileTexture.dispose(), [tileTexture]);

  // Handle angles: 0°, 120°, 240°
  const handleAngles = useMemo(
    () => [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3],
    [],
  );

  const handlePointerEnter = useCallback(() => {
    hoveredRef.current = true;
    document.body.style.cursor = 'pointer';
  }, []);
  const handlePointerLeave = useCallback(() => {
    hoveredRef.current = false;
    document.body.style.cursor = '';
  }, []);

  useFrame(({ clock }, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const envelope = mixesRef.current.agent;
    envelopeRef.current = envelope;

    const active = envelope > 0.002;
    g.visible = active;
    if (!active) {
      // Reset cursor if we navigate away
      if (hoveredRef.current) {
        hoveredRef.current = false;
        document.body.style.cursor = '';
      }
      return;
    }

    elapsedRef.current = clock.elapsedTime;

    // Envelope-driven entrance
    g.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    g.scale.setScalar(0.6 + 0.4 * envelope);

    // Slow Y rotation
    if (!reduced) {
      g.rotation.y += dt * 0.04;
    }

    // Y bob
    if (!reduced) {
      g.position.y = 0.015 * Math.sin(clock.elapsedTime * 0.55);
    } else {
      g.position.y = 0;
    }

    // Dome light pulse
    const domeMat = domeLightMatRef.current;
    if (domeMat && !reduced) {
      const pulseI = 2.0 + 0.6 * Math.sin(clock.elapsedTime * 1.4);
      // Lerp toward hover-boosted or base intensity
      const targetI = hoveredRef.current ? 3.0 : pulseI;
      domeMat.emissiveIntensity += (targetI - domeMat.emissiveIntensity) * Math.min(1, dt * 5);
    } else if (domeMat && reduced) {
      domeMat.emissiveIntensity = 2.2;
    }

    // Active handle cycling
    if (!reduced) {
      const interval = hoveredRef.current ? 1.5 : 3.0;
      cycleTimerRef.current -= dt;
      if (cycleTimerRef.current <= 0) {
        const next = (activeIdxRef.current + 1) % 3;
        activeIdxRef.current = next;
        setActiveIdx(next);
        cycleTimerRef.current = interval;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0.7, 0, 0]}
      visible={false}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── Accent lighting ── */}
      {/* Chrome key spot */}
      <spotLight
        position={[2, 3, 2]}
        angle={0.6}
        penumbra={0.7}
        intensity={2.0}
        color="#FFE4B5"
        distance={6}
        castShadow={false}
      />
      {/* Red underlight for dome glow */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={0.9}
        color={COKE_RED}
        distance={3}
      />

      {/* ── Tiled diner counter ── */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.06, 2.4]} />
        <meshStandardMaterial map={tileTexture} roughness={0.3} metalness={0.0} />
      </mesh>

      {/* ── Dispenser base plinth ── */}
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 0.12, 32]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.1} metalness={0.92} />
      </mesh>

      {/* ── Main column ── */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.55, 0.6, 1.8, 32]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.12} metalness={0.92} />
      </mesh>

      {/* ── Tapered top dome cap ── */}
      <mesh position={[0, 0.98, 0]}>
        {/* Half-sphere sitting on top of column */}
        <sphereGeometry args={[0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CHROME_COLOR} roughness={0.1} metalness={0.95} />
      </mesh>

      {/* ── Rivets top ring ── */}
      <RivetRing y={0.82} count={8} />
      {/* ── Rivets bottom ring ── */}
      <RivetRing y={-0.72} count={8} />

      {/* ── Red dome beacon light on top ── */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          ref={domeLightMatRef}
          color={COKE_RED}
          emissive={COKE_RED}
          emissiveIntensity={2.2}
          roughness={0.35}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* ── Three pull-handles ── */}
      {handleAngles.map((angle, i) => (
        <HandleAssembly
          key={i}
          angle={angle}
          pillarName={PILLAR_NAMES[i] ?? ''}
          isActive={i === activeIdx}
          reduced={reduced}
        />
      ))}
    </group>
  );
}
