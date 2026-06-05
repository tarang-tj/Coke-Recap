import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollRef } from './scroll-context';

// Camera rig owns ALL camera motion. Acts never touch the camera.
// The camera follows a Catmull-Rom curve through 5 keyframes — one per act.
//
// Keyframe choices:
//   Act 0 (cold-open): pulled back, droplet centered, slight upward look.
//   Act 1 (role):      pushed inside the droplet, central glass sphere ahead.
//   Act 2 (tools):     drifting through cube constellation along an S-curve.
//   Act 3 (agent):     close approach to the nebula core.
//   Act 4 (bottle):    pulled very far back; we see the whole bottle.
//
// Tune these later. Right now they're rough but produce a coherent dolly.

const POSITION_KEYS: [number, number, number][] = [
  [0, 0, 4],     // cold-open
  [0, 0, 1.4],   // role (closer in)
  [-2.5, 0.3, 0.8], // tools entry
  [0, 0, 2.0],   // agent
  [0, 0, 9.5],   // bottle (way back)
];

const LOOK_KEYS: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 0],
  [2.5, -0.3, 0],
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

export function CameraRig() {
  const scrollRef = useScrollRef();
  const { camera } = useThree();

  const positionCurve = useMemo(() => makeCurve(POSITION_KEYS), []);
  const lookCurve = useMemo(() => makeCurve(LOOK_KEYS), []);

  const tmpPos = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const t = scrollRef.current;
    positionCurve.getPoint(t, tmpPos.current);
    lookCurve.getPoint(t, tmpLook.current);
    camera.position.lerp(tmpPos.current, 0.12);
    camera.lookAt(tmpLook.current);
  });

  return null;
}
