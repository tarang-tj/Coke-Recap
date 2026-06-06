import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { useScrollRef } from './scroll-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Camera rig — all camera motion lives here, acts never touch the camera.
//
// Keyframes are deliberately dramatic:
//   Act 0 (cold-open): wide establishing shot, camera pulled back
//   Act 1 (role):      low-angle close push — looks up at subject
//   Act 2 (tools):     overhead high pass dropping forward
//   Act 3 (agent):     3/4 side orbit — cinematic around subject
//   Act 4 (bottle):    extreme pull-back reveal shot
//
// Damping: maath damp3 with lambda=3.5 for spring-physics feel.
// Continuous wobble: sin wave on y so the frame is never fully static.
// Reduced motion: snaps directly to target (lambda=1000 ≈ instant).

const POSITION_KEYS: [number, number, number][] = [
  [0, 0.3, 6],        // cold-open: establishing, slightly elevated
  [1.2, -0.5, 1.6],   // role: low-angle dramatic push-in
  [0, 2.5, 3.5],      // tools: high overhead pass
  [2.5, 0.8, 1.8],    // agent: 3/4 side orbit
  [0, 0.4, 14],       // bottle: extreme pull-back reveal
];

const LOOK_KEYS: [number, number, number][] = [
  [0, 0, 0],
  [0, 0.2, 0],        // look slightly up for low-angle drama
  [0, 0, 0],          // overhead looking down toward origin
  [0, 0, 0],
  [0, 0, 0],
];

function makeCurve(points: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.5,
  );
}

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _currentLook = new THREE.Vector3();

export function CameraRig() {
  const scrollRef = useScrollRef();
  const { camera } = useThree();
  const reduced = useReducedMotion();

  const positionCurve = useMemo(() => makeCurve(POSITION_KEYS), []);
  const lookCurve = useMemo(() => makeCurve(LOOK_KEYS), []);

  // Smoothed look-at target — damp3 it separately so lookAt tracks butter-smooth.
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ clock, pointer }, dt) => {
    const t = Math.min(1, Math.max(0, scrollRef.current ?? 0));
    const elapsed = clock.elapsedTime;

    // Sample curves at current scroll progress.
    positionCurve.getPoint(t, _targetPos);
    lookCurve.getPoint(t, _targetLook);

    // Subtle continuous wobble — never fully static.
    _targetPos.y += Math.sin(elapsed * 0.3) * 0.05;
    _targetPos.x += Math.sin(elapsed * 0.17) * 0.02;

    // Mouse parallax: nudge target toward pointer for a game-world depth feel.
    // Skipped for reduced motion to avoid vestibular discomfort.
    if (!reduced) {
      _targetPos.x += pointer.x * 0.35;
      _targetPos.y += pointer.y * 0.22;
    }

    // Spring-physics damping. Reduced motion: near-instant snap (lambda=1000).
    const lambda = reduced ? 1000 : 3.5;
    damp3(camera.position, _targetPos, lambda, dt);

    // Smooth the look-at target independently.
    damp3(smoothLook.current, _targetLook, lambda, dt);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
