import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
import { useRecap } from './recap-context';
import { CokeBottle } from './coke-bottle';

// In-canvas choreography for the recap entry sequence. Driven entirely by the
// shared recap phase: a coin drops, then a Coca-Cola bottle rises from the tray
// and floats to a hero pose where the DOM recap panel meets it.
//
// Positions are in diorama world coords (vending machine front face ≈ z=-6.11).

const COIN_START = new THREE.Vector3(3.55, 1.78, -6.42);
const COIN_SLOT = new THREE.Vector3(3.55, 1.06, -6.3);
const BOTTLE_SLOT = new THREE.Vector3(3.6, 0.32, -6.35);
const BOTTLE_LIFT = new THREE.Vector3(3.6, 0.78, -6.75);
const BOTTLE_HERO = new THREE.Vector3(3.95, 1.0, -8.7);

// Exponential smoothing — explicit decay rate k (higher = snappier). Avoids the
// maath smoothTime/lambda ambiguity so the feel is predictable.
function dampVec(v: THREE.Vector3, t: THREE.Vector3, k: number, dt: number) {
  const a = 1 - Math.exp(-k * dt);
  v.x += (t.x - v.x) * a;
  v.y += (t.y - v.y) * a;
  v.z += (t.z - v.z) * a;
}

export function RecapDispenser() {
  const reduced = useReducedMotion();
  const { phase, setPhase } = useRecap();
  const bottleRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Group>(null);
  const scaleRef = useRef({ bottle: 0, coin: 1 });
  const spin = useRef(0);

  // The user only triggers idle -> coin; the rest auto-advances on timers.
  useEffect(() => {
    if (phase === 'idle' || phase === 'reveal') return;
    const ms = reduced ? 150 : phase === 'coin' ? 950 : 1500;
    const next = phase === 'coin' ? 'dispense' : 'reveal';
    const t = setTimeout(() => setPhase(next), ms);
    return () => clearTimeout(t);
  }, [phase, reduced, setPhase]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = reduced ? 60 : 5.5;
    const coin = coinRef.current;
    const bottle = bottleRef.current;
    const s = scaleRef.current;

    if (coin) {
      dampVec(coin.position, phase === 'coin' ? COIN_SLOT : COIN_START, k, dt);
      s.coin += ((phase === 'coin' ? 1 : 0) - s.coin) * (1 - Math.exp(-k * dt));
      coin.scale.setScalar(s.coin);
    }

    if (bottle) {
      let target = BOTTLE_SLOT;
      let targetScale = 0;
      if (phase === 'dispense') {
        target = BOTTLE_LIFT;
        targetScale = 0.62;
      } else if (phase === 'reveal') {
        target = BOTTLE_HERO;
        targetScale = 0.85;
      }
      dampVec(bottle.position, target, k, dt);
      s.bottle += (targetScale - s.bottle) * (1 - Math.exp(-k * dt));
      bottle.scale.setScalar(s.bottle);

      // Slow hero spin + bob once revealed; otherwise face forward.
      if (phase === 'reveal' && !reduced) {
        spin.current += dt * 0.5;
        bottle.rotation.y = spin.current;
        bottle.position.y += Math.sin(spin.current * 1.6) * 0.025;
      } else {
        bottle.rotation.y += (0 - bottle.rotation.y) * (1 - Math.exp(-k * dt));
      }
    }
  });

  if (phase === 'idle') return null;

  return (
    <group>
      {/* 5¢ coin — gold disc held edge-on so it reads as slotting in */}
      <group ref={coinRef} position={COIN_START.toArray()} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.085, 0.085, 0.012, 24]} />
          <meshStandardMaterial color="#E8C66A" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>

      {/* Dispensed contour bottle — wrapper carries position/scale animation */}
      <group ref={bottleRef} position={BOTTLE_SLOT.toArray()} scale={0}>
        <CokeBottle />
      </group>

      {/* Warm key + cool rim so the hero bottle pops off the dark recap scrim */}
      <pointLight position={[BOTTLE_HERO.x - 0.8, BOTTLE_HERO.y + 1.1, BOTTLE_HERO.z + 0.9]} intensity={6} distance={5} color="#FFE3B0" />
      <pointLight position={[BOTTLE_HERO.x + 0.9, BOTTLE_HERO.y + 0.6, BOTTLE_HERO.z - 0.6]} intensity={3} distance={4} color="#FF5A4D" />
    </group>
  );
}
