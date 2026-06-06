import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { useScrollRef } from './scroll-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useExperience } from './experience-context';

// Camera rig — all camera motion lives here, acts never touch the camera.
//
// Keyframes are deliberately dramatic:
//   Act 0 (cold-open): wide establishing shot, camera pulled back
//   Act 1 (role):      low-angle close push — looks up at subject
//   Act 2 (tools):     overhead high pass dropping forward
//   Act 3 (agent):     3/4 side orbit — cinematic around subject
//   Act 4 (bottle):    extreme pull-back reveal shot
//
// Intro pose: pulled further back than cold-open, slightly elevated —
//   reveals the 3-D world from afar before diving into the cold-open frame.
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

// Intro pose: dramatic pull-back so the first dive-in is cinematic.
const INTRO_POS = new THREE.Vector3(0, 0.8, 9.5);
const INTRO_LOOK = new THREE.Vector3(0, 0, 0);

function makeCurve(points: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.5,
  );
}

// Module-level temporaries — never allocated inside useFrame.
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export function CameraRig() {
  const scrollRef = useScrollRef();
  const { camera } = useThree();
  const reduced = useReducedMotion();
  const { started } = useExperience();

  const positionCurve = useMemo(() => makeCurve(POSITION_KEYS), []);
  const lookCurve = useMemo(() => makeCurve(LOOK_KEYS), []);

  // Smoothed look-at target — damp3 it separately so lookAt tracks butter-smooth.
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));

  // Intro blend: 1 = fully intro pose, 0 = fully scroll-driven.
  // Eased down over ~1.4s once the user presses start.
  const introMixRef = useRef(1);

  // Mirror started into a ref so useFrame always reads the latest value
  // without a stale closure (React re-render updates this before next frame).
  const startedRef = useRef(started);
  startedRef.current = started;

  useFrame(({ clock, pointer }, dt) => {
    const t = Math.min(1, Math.max(0, scrollRef.current ?? 0));
    const elapsed = clock.elapsedTime;

    // Advance or hold intro mix.
    if (!startedRef.current) {
      introMixRef.current = 1;
    } else if (introMixRef.current > 0) {
      introMixRef.current = reduced
        ? 0 // instant snap for reduced motion
        : Math.max(0, introMixRef.current - dt / 1.4);
    }

    const mix = introMixRef.current;
    // Smoothstep for a natural ease-in / ease-out on the blend.
    const easedMix = mix * mix * (3 - 2 * mix);
    // Wobble + parallax fade in as intro exits (scale by scroll contribution).
    const activeScale = 1 - easedMix;

    // Sample scroll curves into temporaries.
    positionCurve.getPoint(t, _targetPos);
    lookCurve.getPoint(t, _targetLook);

    // Subtle continuous wobble — only at full strength once scroll is active.
    _targetPos.y += Math.sin(elapsed * 0.3) * 0.05 * activeScale;
    _targetPos.x += Math.sin(elapsed * 0.17) * 0.02 * activeScale;

    // Mouse parallax scaled by activeScale so it appears gradually after dive.
    if (!reduced) {
      _targetPos.x += pointer.x * 0.35 * activeScale;
      _targetPos.y += pointer.y * 0.22 * activeScale;
    }

    // Blend scroll pose ↔ intro pose (intro = 1, scroll = 0).
    _targetPos.lerp(INTRO_POS, easedMix);
    _targetLook.lerp(INTRO_LOOK, easedMix);

    // Spring-physics damping. Reduced motion: near-instant snap (lambda=1000).
    const lambda = reduced ? 1000 : 3.5;
    damp3(camera.position, _targetPos, lambda, dt);

    // Smooth the look-at target independently.
    damp3(smoothLook.current, _targetLook, lambda, dt);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
