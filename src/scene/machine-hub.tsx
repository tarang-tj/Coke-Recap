import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VendingMachine, type MachineItem } from './brand/vending-machine';
import { useNavigation } from './navigation-context';
import { useSceneMixes } from './scene-transition-context';
import { JacobsPharmacy } from './jacobs-pharmacy';

const ITEMS: MachineItem[] = [
  { id: 'role', label: 'THE ROLE' },
  { id: 'tools', label: 'THE STACK' },
  { id: 'agent', label: 'THE AGENT' },
  { id: 'takeaways', label: 'TAKEAWAYS' },
];

export function MachineHub() {
  const { setView } = useNavigation();
  const mixesRef = useSceneMixes();
  const groupRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(true);
  const activeRef = useRef(true);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const mix = mixesRef.current.machine;
    const visible = mix > 0.002;
    g.visible = visible;

    if (visible) {
      const s = 0.85 + 0.15 * mix;
      g.scale.setScalar(s);
      g.position.z = THREE.MathUtils.lerp(-4.5, 0, mix);
      g.position.y = THREE.MathUtils.lerp(-0.8, 0, mix);
    }

    if (visible !== activeRef.current) {
      activeRef.current = visible;
      setActive(visible);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <JacobsPharmacy />
      <VendingMachine items={ITEMS} active={active} onSelect={(id) => setView(id)} />
    </group>
  );
}
