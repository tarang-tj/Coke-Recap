import { useState, useEffect, useRef } from 'react';
import { Edges, Html, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRecap } from './recap-context';
import { useExperience } from '../experience-context';
import { useReducedMotion } from '../../hooks/use-reduced-motion';

// Invisible click proxy wrapping the diorama's vending machine. Raycasting one
// box is far cheaper than the 1300-mesh diorama primitive, and it gives us a
// clean place to hang hover affordance + the click that starts the recap.
//
// Vending machine world bbox: min(3.2,0.08,-6.11) max(4.0,1.45,-5.70).
const CENTER: [number, number, number] = [3.6, 0.77, -5.9];
const SIZE: [number, number, number] = [0.92, 1.46, 0.52];

// Always-on "look here" beacon hovering above the machine so the core
// interaction is discoverable from the wide establishing shot. A double pulse
// ring (billboarded to always face the camera) expands + fades on a loop; a
// steady inner disc keeps a hotspot visible at the trough of the pulse.
function MachineBeacon() {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const matA = useRef<THREE.MeshBasicMaterial>(null);
  const matB = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Two pulses 0.5 cycle out of phase for a continuous "sonar" feel.
    const pulse = (phase: number) => {
      const p = (t * 0.6 + phase) % 1; // 0..1 ramp
      return { scale: 0.5 + p * 1.4, opacity: 0.7 * (1 - p) };
    };
    const a = pulse(0);
    const b = pulse(0.5);
    if (ringA.current) ringA.current.scale.setScalar(a.scale);
    if (ringB.current) ringB.current.scale.setScalar(b.scale);
    if (matA.current) matA.current.opacity = a.opacity;
    if (matB.current) matB.current.opacity = b.opacity;
  });

  return (
    <Billboard position={[CENTER[0], CENTER[1] + 1.55, CENTER[2]]}>
      {[ringA, ringB].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[0.22, 0.3, 48]} />
          <meshBasicMaterial
            ref={i === 0 ? matA : matB}
            color="#C8102E"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Steady core disc — always visible, never fully gone. */}
      <mesh>
        <circleGeometry args={[0.13, 32]} />
        <meshBasicMaterial
          color="#C8102E"
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Persistent downward chevron — unambiguous "look here / click below". */}
      <mesh position={[0, -0.28, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.12, 0.18, 3]} />
        <meshBasicMaterial
          color="#C8102E"
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </Billboard>
  );
}

export function VendingHotspot() {
  const { phase, activate } = useRecap();
  const { started } = useExperience();
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  // Restore the cursor on unmount / when the hotspot disappears.
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Only interactive once the experience has begun (the gate blocks pointer
  // events today, but the pose ternary pins the camera at INTRO_POSE while
  // !started — a pre-start recap would play to a parked wide shot) and
  // before the sequence begins.
  if (!started || phase !== 'idle') return null;

  return (
    <>
      {/* Discoverability beacon — animated unless reduced motion is on, in which
          case the steady core disc still marks the spot. */}
      {!reduced && <MachineBeacon />}

      <mesh
        position={CENTER}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        activate();
      }}
    >
      <boxGeometry args={SIZE} />
      {/* Invisible fill — still raycasts (opacity 0), never drawn over the GLB */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />

      {/* Crisp golden outline on hover */}
      {hovered && <Edges color="#FFD86B" lineWidth={2} threshold={1} />}

      {/* Floating call-to-action above the machine */}
      {hovered && (
        <Html position={[0, 0.95, 0]} center distanceFactor={9} occlude={false}>
          <div
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: 9999,
              background: 'rgba(200,16,46,0.92)',
              color: '#FFF6E9',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              boxShadow: '0 0 18px rgba(244,0,9,0.55)',
              userSelect: 'none',
            }}
          >
            Insert 5¢ &nbsp;▸
          </div>
        </Html>
      )}
      </mesh>
    </>
  );
}
