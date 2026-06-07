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
  // Home scene: street-level view of the corner block + vending machine on the
  // sidewalk. Camera backed off to z=6.5 at eye level (y=0) to frame the full
  // building facade. Look target slightly above street level toward the building.
  machine:   { pos: [0, 0, 6.5],   look: [0, 0.5, -3.0] },
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
