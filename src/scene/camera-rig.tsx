import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useExperience } from './experience-context';
import { useNavigation, type ViewId } from './navigation-context';

// Camera rig — ALL camera motion lives here. View-driven (no scroll): the camera
// flies between the home scene (machine view) and each chapter "stage" as the
// nav view changes. Before PRESS START it holds the home pose; clicking the gate
// simply removes it (no entry dolly animation needed).

type Pose = { pos: [number, number, number]; look: [number, number, number] };

const POSES: Record<ViewId, Pose> = {
  // Home scene: across-the-street view of the Atlanta corner block. The
  // Blender-generated block has buildings reaching y≈14, street at y=0,
  // sidewalk at y=0.2. Camera at y=4.5 (looking up at the storefront from
  // adult eye level) backed off to z=11 to frame the full 4-story pharmacy
  // facade + the corner building + the gas lamps. Look target at the
  // pharmacy mid-height (y≈4) on the building face (z≈-2) so the awning,
  // signage, and ground-floor storefront sit centrally in the frame.
  machine:   { pos: [0, 4.5, 11],  look: [0, 4.0, -2.0] },
  role:      { pos: [0, 0.1, 3.2], look: [0, 0,    0]   },
  tools:     { pos: [0, 0.8, 5.2], look: [0, 0,    0]   },
  agent:     { pos: [0, 0.3, 4.4], look: [0, 0,    0]   },
  takeaways: { pos: [0, 0.2, 5.5], look: [0, -0.1, 0]   },
};

const _targetPos  = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const reduced = useReducedMotion();
  const { started } = useExperience();
  const { view } = useNavigation();

  // Mirror reactive values into refs so useFrame never reads a stale closure.
  const startedRef = useRef(started);
  startedRef.current = started;
  const viewRef = useRef<ViewId>(view);
  viewRef.current = view;

  const smoothLook = useRef(new THREE.Vector3(
    POSES.machine.look[0],
    POSES.machine.look[1],
    POSES.machine.look[2],
  ));

  useFrame(({ pointer }, dt) => {
    const currentView = viewRef.current;
    const isStarted = startedRef.current;

    const pose = POSES[currentView];

    _targetPos.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    _targetLook.set(pose.look[0], pose.look[1], pose.look[2]);

    // Mouse parallax — only once started and not on the home/machine view,
    // and not under reduced motion.
    if (isStarted && !reduced && currentView !== 'machine') {
      _targetPos.x += pointer.x * 0.3;
      _targetPos.y += pointer.y * 0.2;
    }

    const lambda = reduced ? 1000 : 3.2;
    damp3(camera.position, _targetPos, lambda, dt);
    damp3(smoothLook.current, _targetLook, lambda, dt);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
