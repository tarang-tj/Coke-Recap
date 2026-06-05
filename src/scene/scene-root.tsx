import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraRig } from './camera-rig';

// Persistent <Canvas>. Mounted once at the top of the tree and never
// unmounted. All 3D content lives inside <Suspense> for async asset loads.

type Props = {
  children?: React.ReactNode;
};

export function SceneRoot({ children }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 55, near: 0.05, far: 80 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0A0203']} />
      <Suspense fallback={null}>
        <CameraRig />
        {children}
      </Suspense>
    </Canvas>
  );
}
