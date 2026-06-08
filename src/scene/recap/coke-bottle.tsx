import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { ThreeElements } from '@react-three/fiber';

// Hero Coca-Cola bottle the vending machine dispenses — a real contour-bottle
// GLB (user-supplied). Normalised so the foot sits at y=0 and the bottle is
// ~1.55 tall, centred on x/z, so the dispenser can scale/position it like the
// procedural lathe it replaced.

const URL = '/assets/models/cocacola-bottle.glb';
useGLTF.preload(URL);

const TARGET_HEIGHT = 1.55;

type Props = ThreeElements['group'];

export function CokeBottle(props: Props) {
  const { scene } = useGLTF(URL);

  const { object, scale } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Recenter x/z and drop the foot to y=0 (in model units).
    clone.position.set(-center.x, -box.min.y, -center.z);
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });

    return { object: clone, scale: TARGET_HEIGHT / size.y };
  }, [scene]);

  return (
    <group {...props}>
      <group scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}
