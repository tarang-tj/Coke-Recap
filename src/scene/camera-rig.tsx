import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useExperience } from './experience-context';
import { useNavigation, type ViewId } from './navigation-context';

// Camera rig — ALL camera motion lives here. View-driven (no scroll): the camera
// flies between the vending-machine hub and each chapter "stage" as the nav view
// changes. Before PRESS START it holds a pulled-back exterior street pose, then
// animates through the door into the machine hub on entry.

type Pose = { pos: [number, number, number]; look: [number, number, number] };

const POSES: Record<Exclude<ViewId, 'exterior'>, Pose> = {
  // Machine hub: standing-eye-level view of the GLB vending machine.
  // Machine base at y=0, top at y=5.6 (normalized), center at y=2.8.
  // Camera at y=2.0 feels like looking at the machine at standing height.
  // z=4.5 gives enough distance to see the full machine width + some store floor.
  // Look target at y=2.5 — slightly above center so the coin slot + label rows
  // are all visible without the top of the machine being cut off.
  machine:   { pos: [0, 2.0, 4.5],  look: [0, 2.5,  0] },
  role:      { pos: [0, 0.1, 3.2],  look: [0, 0,    0] }, // bottle cap, face-on
  tools:     { pos: [0, 0.8, 5.2],  look: [0, 0,    0] }, // chip ring
  agent:     { pos: [0, 0.3, 4.4],  look: [0, 0,    0] }, // energy core
  takeaways: { pos: [0, 0.2, 5.5],  look: [0, -0.1, 0] }, // hero contour bottle
};

// Street-level pose looking at the brick-shop GLB corner block.
// Pulled back to z=7.5 and lowered to y=0.5 so the building isn't cut off.
const EXTERIOR_POSE: Pose = {
  pos:  [0, 0.5, 7.5],
  look: [0, 1.5, -4.0],
};

const ENTRY_DURATION = 1.6; // seconds — exterior → machine transition

const _targetPos  = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

// Mutable objects reused each frame (avoid allocations in useFrame).
const _extPos  = new THREE.Vector3(...EXTERIOR_POSE.pos);
const _extLook = new THREE.Vector3(...EXTERIOR_POSE.look);
// These must stay in sync with POSES.machine — they're reused each frame
// during the exterior→machine entry animation to avoid allocations in useFrame.
const _machPos  = new THREE.Vector3(...POSES.machine.pos);
const _machLook = new THREE.Vector3(...POSES.machine.look);

function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function CameraRig() {
  const { camera } = useThree();
  const reduced = useReducedMotion();
  const { started } = useExperience();
  const { view } = useNavigation();

  // Mirror reactive values into refs so useFrame never reads a stale closure.
  const startedRef = useRef(started);
  startedRef.current = started;
  const viewRef = useRef<ViewId>(view);
  const prevViewRef = useRef<ViewId>(view);

  // Transition state — exterior → machine entry animation.
  const transition = useRef({
    active: false,
    startTime: 0,
    duration: ENTRY_DURATION,
  });

  const smoothLook = useRef(new THREE.Vector3(
    EXTERIOR_POSE.look[0],
    EXTERIOR_POSE.look[1],
    EXTERIOR_POSE.look[2],
  ));

  // Detect view change and start entry animation when exterior → machine.
  if (view !== viewRef.current) {
    const from = viewRef.current;
    prevViewRef.current = from;
    viewRef.current = view;

    if (from === 'exterior' && view === 'machine') {
      if (reduced) {
        // Snap immediately — no animation.
        camera.position.set(...POSES.machine.pos);
        smoothLook.current.set(...POSES.machine.look);
        camera.lookAt(smoothLook.current);
        transition.current.active = false;
      } else {
        transition.current.active = true;
        transition.current.startTime = performance.now() / 1000;
      }
    }
  }

  useFrame(({ pointer, clock: _clock }, dt) => {
    const isStarted = startedRef.current;
    const currentView = viewRef.current;

    // ── Entry animation: exterior → machine ────────────────────────────
    if (transition.current.active) {
      const now = performance.now() / 1000;
      const elapsed = now - transition.current.startTime;
      const raw = Math.min(elapsed / transition.current.duration, 1);
      const t = cubicEaseInOut(raw);

      _targetPos.lerpVectors(_extPos, _machPos, t);
      _targetLook.lerpVectors(_extLook, _machLook, t);

      // During transition: set camera directly (no damp — we own the lerp).
      camera.position.copy(_targetPos);
      smoothLook.current.copy(_targetLook);
      camera.lookAt(smoothLook.current);

      if (raw >= 1) {
        transition.current.active = false;
        // Snap to exact machine pose to prevent float drift.
        camera.position.set(...POSES.machine.pos);
        smoothLook.current.set(...POSES.machine.look);
        camera.lookAt(smoothLook.current);
      }
      return;
    }

    // ── Normal pose selection ──────────────────────────────────────────
    let pose: Pose;
    if (!isStarted || currentView === 'exterior') {
      pose = EXTERIOR_POSE;
    } else {
      pose = POSES[currentView as Exclude<ViewId, 'exterior'>];
    }

    _targetPos.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    _targetLook.set(pose.look[0], pose.look[1], pose.look[2]);

    // Mouse parallax — only once started, not on exterior, not under reduced motion.
    if (isStarted && !reduced && currentView !== 'exterior') {
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
