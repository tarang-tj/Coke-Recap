import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { useExperience } from './experience-context';
import { useNavigation, type ViewId } from './navigation-context';
import { useRecap } from './recap/recap-context';

// Camera rig — ALL camera motion lives here. View-driven (no scroll): the camera
// flies between the home scene (machine view) and each chapter "stage" as the
// nav view changes. Before PRESS START it holds the home pose; clicking the gate
// simply removes it (no entry dolly animation needed).
//
// Two overrides layer on top of the nav poses:
//   - recap focus: while the vending-machine recap is running, the camera holds
//     a close pose on the machine so the coin/bottle dispense is centre-frame.
//   - free-look: dragging on the home view pans the look target a little, so
//     the visitor can glance around the diorama.

type Pose = { pos: [number, number, number]; look: [number, number, number] };

// All vantage points live in the diorama's native world coordinates. The
// building block runs along X with every facade facing -Z (the street side),
// so the camera always sits on the -Z side looking back toward +Z.
//   Pharmacy center ≈ (0, 6, -2)   soda fountain ≈ (2.6, 1.0, -1.5)
//   vending machine ≈ (3.6, 0.8, -5.9)   delivery wagon ≈ (32, 1.1, -13.5)
const POSES: Record<ViewId, Pose> = {
  // Home: wide establishing hero of the pharmacy facade with the street and
  // traffic (wagon at z≈-14) reading as foreground depth. The recap machine is
  // a small part of the wider scene — the pulsing beacon (see VendingHotspot)
  // is what draws the eye to it, not the camera framing.
  machine:   { pos: [-8, 7, -34],    look: [0, 5.5, -2]    },
  // Role: intimate storefront — look toward the glowing soda fountain where
  // Coca-Cola was first served.
  role:      { pos: [2.6, 2.4, -12], look: [2.6, 1.6, -2]  },
  // Stack: the Coca-Cola vending machine + delivery crates on the sidewalk.
  tools:     { pos: [7, 2.4, -12.5], look: [3.7, 1.0, -5.9] },
  // Agent: a low axial view straight down the street past the lamp-lined facades.
  agent:     { pos: [40, 2.2, -16.5], look: [-25, 1.3, -15.5] },
  // Takeaways: grand pull-back over the whole block at golden hour.
  takeaways: { pos: [0, 17, -50],    look: [0, 6, -4]      },
};

// Close focus on the vending machine — frames the coin slot + the bottle's hero
// pose (≈ 4.35, 0.74, -7.8) on the right so the recap panel reads on the left.
const RECAP_POSE: Pose = { pos: [3.4, 1.6, -11.6], look: [3.95, 1.55, -8.4] };

// How far a full drag pans the look target (world units).
const FREE_LOOK_X = 2.6;
const FREE_LOOK_Y = 1.3;

const _targetPos  = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const reduced = useReducedMotion();
  const { started } = useExperience();
  const { view } = useNavigation();
  const { phase } = useRecap();

  // Mirror reactive values into refs so useFrame never reads a stale closure.
  const startedRef = useRef(started);
  startedRef.current = started;
  const viewRef = useRef<ViewId>(view);
  viewRef.current = view;
  const recapActiveRef = useRef(phase !== 'idle');
  recapActiveRef.current = phase !== 'idle';

  // Accumulated, clamped free-look offset in [-1, 1] per axis.
  const drag = useRef({ x: 0, y: 0 });

  // Pointer-drag free-look: only meaningful when exploring (recap idle). A plain
  // click (the hotspot) moves the pointer ~0px, so it won't perturb the view.
  // Deltas come from clientX/Y, NOT movementX/Y — Safari reports movement as 0
  // for touch pointers, which left mobile visitors with a dead drag.
  useEffect(() => {
    let down = false;
    const lastPt = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      // Primary pointer only — a second finger would rewrite lastPt and the
      // interleaved moves would compute deltas ACROSS fingers (look target
      // slams to the clamp on any pinch attempt).
      if (!e.isPrimary) return;
      if (!startedRef.current || recapActiveRef.current) return;
      down = true;
      lastPt.x = e.clientX;
      lastPt.y = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      down = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (!down || reduced) return;
      const dx = e.clientX - lastPt.x;
      const dy = e.clientY - lastPt.y;
      lastPt.x = e.clientX;
      lastPt.y = e.clientY;
      drag.current.x = THREE.MathUtils.clamp(
        drag.current.x + dx / window.innerWidth,
        -1,
        1,
      );
      drag.current.y = THREE.MathUtils.clamp(
        drag.current.y + dy / window.innerHeight,
        -1,
        1,
      );
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reduced]);

  const smoothLook = useRef(new THREE.Vector3(
    POSES.machine.look[0],
    POSES.machine.look[1],
    POSES.machine.look[2],
  ));

  useFrame(({ pointer }, dt) => {
    const currentView = viewRef.current;
    const isStarted = startedRef.current;
    const recapActive = recapActiveRef.current;

    const pose = recapActive ? RECAP_POSE : POSES[currentView];

    _targetPos.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    _targetLook.set(pose.look[0], pose.look[1], pose.look[2]);

    if (isStarted && !reduced && !recapActive) {
      // Mouse parallax — chapter views only (home stays locked for the CTA).
      if (currentView !== 'machine') {
        _targetPos.x += pointer.x * 1.4;
        _targetPos.y += pointer.y * 0.9;
      }
      // Free-look pan — drag to glance around the diorama.
      _targetLook.x += drag.current.x * FREE_LOOK_X;
      _targetLook.y -= drag.current.y * FREE_LOOK_Y;
    }

    if (reduced) {
      // Reduced motion: snap straight to the target pose, no easing. (The
      // old `damp3(..., 1000, dt)` misread maath's third arg as a rate — it's
      // smoothTime, the seconds-to-settle, so 1000 effectively froze the
      // camera and stranded reduced-motion visitors at the home pose whenever
      // they navigated to a chapter.)
      camera.position.copy(_targetPos);
      smoothLook.current.copy(_targetLook);
    } else {
      // ~3.2s smoothTime — slow cinematic glide between poses.
      damp3(camera.position, _targetPos, 3.2, dt);
      damp3(smoothLook.current, _targetLook, 3.2, dt);
    }
    camera.lookAt(smoothLook.current);
  });

  return null;
}
