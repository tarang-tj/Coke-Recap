import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CocaColaVendingMachine } from './brand/coca-cola-vending-machine-gltf';
import { useNavigation } from './navigation-context';
import { useSceneMixes } from './scene-transition-context';
import { JacobsPharmacy } from './jacobs-pharmacy';

export function MachineHub() {
  const { setView } = useNavigation();
  const mixesRef = useSceneMixes();
  const groupRef = useRef<THREE.Group>(null);

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
  });

  return (
    <group ref={groupRef} visible={false}>
      <JacobsPharmacy />
      {/* GLB-driven Coca-Cola vending machine — replaces the procedural VendingMachine.
          vending-machine.tsx is kept as a fallback but no longer mounted here. */}
      <CocaColaVendingMachine
        position={[0, 0, 0]}
        onSelectChapter={(chapter) => setView(chapter)}
      />
    </group>
  );
}
