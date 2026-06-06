import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VendingMachine, type MachineItem } from './brand/vending-machine';
import { useNavigation } from './navigation-context';

// The vending-machine hub — visible only in the 'machine' view. Selecting a
// bottle routes to that chapter. The white 3-D logo sits on the machine header.

const ITEMS: MachineItem[] = [
  { id: 'role', label: 'THE ROLE', color: '#F40009' },
  { id: 'tools', label: 'THE STACK', color: '#F40009' },
  { id: 'agent', label: 'THE AGENT', color: '#F40009' },
  { id: 'takeaways', label: 'TAKEAWAYS', color: '#F40009' },
];

export function MachineHub() {
  const { view, setView } = useNavigation();
  const groupRef = useRef<THREE.Group>(null);
  const envRef = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const target = viewRef.current === 'machine' ? 1 : 0;
    envRef.current += (target - envRef.current) * Math.min(1, dt * 4);
    const active = envRef.current > 0.002;
    g.visible = active;
    if (!active) return;
    // Subtle settle-in scale as the hub focuses.
    g.scale.setScalar(0.9 + 0.1 * envRef.current);
  });

  return (
    <group ref={groupRef} visible={false}>
      <VendingMachine items={ITEMS} onSelect={(id) => setView(id)} />
    </group>
  );
}
