import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneMixes } from '../scene-transition-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { tools } from '../../data/portfolio-content';
import { CokeBottle } from '../brand/coke-bottle';

// Act 2 — Tools: featured bottle carousel
//
// Layout: one large featured bottle at [1.6, 0, 0.2], five queued bottles in a
// shallow arc behind it. Featured cycles every 3.5s (auto). Hovering a queued
// bottle pulls it forward immediately. Featured bottle renders with animated
// liquid, bubbles, and condensation.
//
// meshStandardMaterial / clearcoat only — zero transmission passes.

const COKE_RED = '#F40009';
const CREAM = '#F1E9DA';

const FEATURED_POS: [number, number, number] = [1.6, 0, 0.2];
const FEATURED_SCALE = 1.4;
const QUEUE_SCALE = 0.55;

const CYCLE_INTERVAL = 3.5;  // seconds between auto-advances
const SWAP_DURATION = 0.35;  // seconds for swap animation
const HOVER_PAUSE = 5.0;     // seconds to pause auto-cycle after hover

const TOTAL = tools.length; // 6

// -------------------------------------------------------------------
// Arc positions for the 5 queued bottles
// Shallow arc behind the featured slot, spread ±75°
// -------------------------------------------------------------------
const ARC_ANGLES_DEG = [-75, -37.5, 0, 37.5, 75];

function buildArcPositions(): [number, number, number][] {
  const [fx, , fz] = FEATURED_POS;
  return ARC_ANGLES_DEG.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    // Arc sits behind (+Z) and fanned around the featured slot
    return [
      fx + Math.sin(rad) * 2.4,
      0,
      fz + 1.4 + Math.cos(rad) * 0.6,
    ] as [number, number, number];
  });
}

const ARC_POSITIONS = buildArcPositions();

// Returns the 5 tool indices occupying the queue when featuredIdx is the hero
function queueIndicesFor(featuredIdx: number): number[] {
  const result: number[] = [];
  for (let i = 1; i < TOTAL; i++) {
    result.push((featuredIdx + i) % TOTAL);
  }
  return result;
}

// -------------------------------------------------------------------
// QueueBottle — one of the 5 arc slots
// -------------------------------------------------------------------
interface QueueBottleProps {
  toolIndex: number;
  slotIndex: number;
  activeRef: React.RefObject<boolean>;
  envelopeRef: React.RefObject<number>;
  hoverSlotRef: React.RefObject<number>;
  onHover: (slot: number) => void;
  onHoverEnd: () => void;
  reduced: boolean;
}

function QueueBottle({
  toolIndex,
  slotIndex,
  activeRef,
  envelopeRef,
  hoverSlotRef,
  onHover,
  onHoverEnd,
  reduced,
}: QueueBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(QUEUE_SCALE);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group || !activeRef.current) return;

    const hovered = hoverSlotRef.current === slotIndex;
    const targetScale = hovered ? QUEUE_SCALE * 1.15 : QUEUE_SCALE;
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, dt * 7);
    group.scale.setScalar(scaleRef.current * envelopeRef.current);

    const targetY = hovered ? 0.14 : 0;
    group.position.y += (targetY - group.position.y) * Math.min(1, dt * 7);
  });

  const tool = tools[toolIndex];

  return (
    <group
      ref={groupRef}
      position={ARC_POSITIONS[slotIndex]}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(slotIndex);
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
        onHoverEnd();
      }}
    >
      <CokeBottle
        customLabel={tool.name}
        showLogo={false}
        highlight={0.15}
        reducedMotion={reduced}
      />
    </group>
  );
}

// -------------------------------------------------------------------
// FeaturedBottle — the hero slot at FEATURED_POS
// -------------------------------------------------------------------
interface FeaturedBottleProps {
  toolIndex: number;
  swapProgressRef: React.RefObject<number>;
  fromArcPos: [number, number, number] | null;
  activeRef: React.RefObject<boolean>;
  envelopeRef: React.RefObject<number>;
  reduced: boolean;
}

function FeaturedBottle({
  toolIndex,
  swapProgressRef,
  fromArcPos,
  activeRef,
  envelopeRef,
  reduced,
}: FeaturedBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  // Track the world-space start of a swap so position lerp works correctly
  const swapStartPos = useRef<THREE.Vector3>(
    fromArcPos ? new THREE.Vector3(...fromArcPos) : new THREE.Vector3(...FEATURED_POS),
  );
  const targetPos = useMemo(() => new THREE.Vector3(...FEATURED_POS), []);

  useFrame(({ clock }, dt) => {
    const group = groupRef.current;
    if (!group || !activeRef.current) return;

    const envelope = envelopeRef.current;
    const t = swapProgressRef.current;

    // Slide in from arc start position → featured position during swap
    if (fromArcPos && t < 1) {
      group.position.lerpVectors(swapStartPos.current, targetPos, t);
    } else {
      // Gentle float bob once settled
      const bob = reduced ? 0 : 0.05 * Math.sin(clock.elapsedTime * 0.9);
      group.position.set(FEATURED_POS[0], FEATURED_POS[1] + bob, FEATURED_POS[2]);
    }

    // Scale up from queue scale → featured scale during swap
    const sc = fromArcPos
      ? (QUEUE_SCALE + (FEATURED_SCALE - QUEUE_SCALE) * Math.min(t, 1)) * envelope
      : FEATURED_SCALE * envelope;
    group.scale.setScalar(sc);

    // Fade in during swap
    if (fromArcPos && t < 1) {
      const opacity = Math.min(1, t * 2.5);
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const mat = mesh.material as THREE.Material & { opacity?: number };
          if (mat.transparent && mat.opacity !== undefined) {
            mat.opacity = opacity * (mat.opacity > 0.5 ? 1 : 0.85);
          }
        }
      });
    }
  });

  const tool = tools[toolIndex];

  return (
    <group ref={groupRef} position={FEATURED_POS}>
      <CokeBottle
        customLabel={tool.name}
        showLogo={false}
        highlight={0.9}
        interior={{ fill: 0.7, bubbles: true, condensation: true }}
        reducedMotion={reduced}
      />
    </group>
  );
}

// -------------------------------------------------------------------
// ActTools — orchestrates carousel, cycle timer, swap state
// -------------------------------------------------------------------
export function ActTools() {
  const groupRef = useRef<THREE.Group>(null);
  const mixesRef = useSceneMixes();
  const reduced = useReducedMotion();

  // Refs for hot-loop state (no React re-renders in useFrame)
  const activeRef = useRef(false);
  const envelopeRef = useRef(0);
  const hoverSlotRef = useRef(-1);     // arc slot index currently hovered
  const cycleTimerRef = useRef(0);
  const hoverPauseRef = useRef(0);     // countdown: pause auto-cycle after hover
  const swapProgressRef = useRef(1);   // 0→1 during swap; starts at 1 (settled)

  // React state: featuredIdx drives re-render of child components
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [swapFromArcPos, setSwapFromArcPos] = useState<[number, number, number] | null>(null);

  // Stable ref mirrors for callbacks that need current values without stale closure
  const featuredIdxRef = useRef(featuredIdx);
  featuredIdxRef.current = featuredIdx;

  // Advance the featured bottle to a given arc slot's tool
  const advanceFeatured = useCallback((slotIndex: number) => {
    const currentFeatured = featuredIdxRef.current;
    const queueIndices = queueIndicesFor(currentFeatured);
    const newFeaturedIdx = queueIndices[slotIndex];
    const arcPos = ARC_POSITIONS[slotIndex];

    swapProgressRef.current = 0;
    setSwapFromArcPos([...arcPos] as [number, number, number]);
    setFeaturedIdx(newFeaturedIdx);
  }, []);

  const handleQueueHover = useCallback((slot: number) => {
    hoverSlotRef.current = slot;
    hoverPauseRef.current = HOVER_PAUSE;
    advanceFeatured(slot);
  }, [advanceFeatured]);

  const handleQueueHoverEnd = useCallback(() => {
    hoverSlotRef.current = -1;
  }, []);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;

    const envelope = mixesRef.current.tools;
    const active = envelope > 0.002;

    group.visible = active;
    activeRef.current = active;
    envelopeRef.current = envelope;

    if (!active) return;

    // Envelope-driven entrance animation
    group.position.z = THREE.MathUtils.lerp(1.5, 0, envelope);
    // Note: individual child groups handle their own scale via envelopeRef;
    // we do NOT set group.scale here to avoid double-scaling the children.

    // Advance swap progress
    if (swapProgressRef.current < 1) {
      swapProgressRef.current = Math.min(1, swapProgressRef.current + dt / SWAP_DURATION);
    }

    // Hover-pause countdown
    if (hoverPauseRef.current > 0) {
      hoverPauseRef.current -= dt;
    }

    // Auto-cycle (disabled under reduced motion or during hover pause)
    if (!reduced && hoverPauseRef.current <= 0) {
      cycleTimerRef.current += dt;
      if (cycleTimerRef.current >= CYCLE_INTERVAL) {
        cycleTimerRef.current = 0;
        // Always advance from slot 0 to keep the order cycling naturally
        advanceFeatured(0);
      }
    }
  });

  // 5 queue tool indices for current featured
  const queueToolIndices = useMemo(
    () => queueIndicesFor(featuredIdx),
    [featuredIdx],
  );

  return (
    <group ref={groupRef} visible={false}>
      {/* Lighting rig: cream fill top, caramel rim, coke-red back fill, spot on featured */}
      <pointLight position={[0, 3, 0]} intensity={2.2} color={CREAM} />
      <pointLight position={[0, -2, 0]} intensity={1.0} color="#A06A00" />
      <pointLight position={[0, 0, 3]} intensity={1.4} color={COKE_RED} />
      <spotLight
        position={[1.6, 4.5, 0.8]}
        intensity={4.0}
        angle={0.32}
        penumbra={0.55}
        color={CREAM}
        castShadow={false}
        target-position={FEATURED_POS}
      />

      {/* Featured hero bottle */}
      <FeaturedBottle
        key={`featured-${featuredIdx}`}
        toolIndex={featuredIdx}
        swapProgressRef={swapProgressRef}
        fromArcPos={swapFromArcPos}
        activeRef={activeRef}
        envelopeRef={envelopeRef}
        reduced={reduced}
      />

      {/* Queue arc bottles — 5 slots */}
      {queueToolIndices.map((toolIdx, slotIdx) => (
        <QueueBottle
          key={`queue-${slotIdx}-${toolIdx}`}
          toolIndex={toolIdx}
          slotIndex={slotIdx}
          activeRef={activeRef}
          envelopeRef={envelopeRef}
          hoverSlotRef={hoverSlotRef}
          onHover={handleQueueHover}
          onHoverEnd={handleQueueHoverEnd}
          reduced={reduced}
        />
      ))}
    </group>
  );
}
