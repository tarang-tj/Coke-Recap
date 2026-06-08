import { useState, useEffect } from 'react';
import { Edges, Html } from '@react-three/drei';
import { useRecap } from './recap-context';

// Invisible click proxy wrapping the diorama's vending machine. Raycasting one
// box is far cheaper than the 1300-mesh diorama primitive, and it gives us a
// clean place to hang hover affordance + the click that starts the recap.
//
// Vending machine world bbox: min(3.2,0.08,-6.11) max(4.0,1.45,-5.70).
const CENTER: [number, number, number] = [3.6, 0.77, -5.9];
const SIZE: [number, number, number] = [0.92, 1.46, 0.52];

export function VendingHotspot() {
  const { phase, activate } = useRecap();
  const [hovered, setHovered] = useState(false);

  // Restore the cursor on unmount / when the hotspot disappears.
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Only interactive before the sequence begins.
  if (phase !== 'idle') return null;

  return (
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
  );
}
