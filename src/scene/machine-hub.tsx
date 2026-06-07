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
      {/* Machine position — base at world y=-3.0 (the store floor).
          X=2.0, Z=-4.5 places the machine against the right-rear wall.
          Slight inward rotation (-Math.PI/8) angles it toward the camera.
          Tune X/Z here once the store layout is confirmed visually. */}
      <CocaColaVendingMachine
        position={[2.0, -3.0, -4.5]}
        rotation={[0, -Math.PI / 8, 0]}
        onSelectChapter={(chapter) => setView(chapter)}
      />
    </group>
  );
}
