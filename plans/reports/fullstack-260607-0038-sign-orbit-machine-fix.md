# Polish Pass 4 — Sign, Orbit, Machine Fix

**Date:** 2026-06-07  
**Branch:** polish-pass-4  
**Status:** DONE

---

## 1. Status

All 5 tasks complete. Build passes. tsc clean.

---

## 2. Files Changed

| File | Lines (before → after) | Change |
|------|------------------------|--------|
| `src/scene/machine-hub.tsx` | 41 → 46 | Position + rotation added to CocaColaVendingMachine |
| `src/scene/camera-rig.tsx` | 153 → 161 | MACHINE_POSE updated; OrbitControls gate added in useFrame |
| `src/scene/scene-root.tsx` | 62 → 94 | InteriorOrbitControls component + mount inside Canvas |
| `src/scene/jacobs-pharmacy-exterior.tsx` | 49 → 80 | JACOBS' PHARMACY + subtitle Text elements added |

---

## 3. Build Result

```
tsc -b  →  clean (0 errors)
vite build  →  ✓ built in 3.51s
```

Chunk-size warning is pre-existing (1.5 MB bundle), unrelated to this pass.

---

## 4. Key Values

### Machine world position
```
position={[2.0, -3.0, -4.5]}   // base at floor y=-3.0; right-rear wall
rotation={[0, -Math.PI / 8, 0]} // slight inward angle toward camera
```
Machine center: `[2.0, −0.2, −4.5]` (base −3.0 + half of 5.6 height).

### MACHINE_POSE (camera-rig.tsx)
```
pos:  [2.0, -0.8, 4.5]   // eye-height above store floor (floor=-3 + ~2.2m eye)
look: [2.0,  0.0, -4.5]  // machine world center
```
Camera is ~9 units from machine face at z=~−4.5 → full machine visible with INSERT COIN graphic.

### OrbitControls target
```
target={[2.0, 0, -4.5]}  // machine world center
```

### Sign positions (jacobs-pharmacy-exterior.tsx)
```
Main sign:  position=[0, 1.4, -2.4]  fontSize=0.55  color=#D4A847 (gold)
Subtitle:   position=[0, 0.85, -2.4] fontSize=0.18  color=#F1E9DA (cream)
```
Primary building sits at `[0, -3.0, -4.0]`; sign y=1.4 is above the entrance lintel. Tune y/z once GLB entrance height confirmed visually.

---

## 5. Architecture Notes

### Why the machine was floating
The group in `machine-hub.tsx` has a `useFrame` that lerps `g.position.y` from −0.8→0 and `g.position.z` from −4.5→0 (the intro slide-in animation). The machine's LOCAL position within this group is now `[2.0, −3.0, −4.5]`, so once the group settles at origin, world position = `[2.0, −3.0, −4.5]` exactly — base on the store floor. During the transition the group y offset only shifts the machine by ≤0.8 units vertically which is acceptable (slides in from slightly below).

### Camera-rig / OrbitControls co-ownership
- Entry transition (1.6 s): camera-rig owns the camera; lerps from EXTERIOR_POSE → MACHINE_POSE.
- After transition: `view === 'machine' && !transition.current.active` → early-return from useFrame; OrbitControls owns the camera freely.
- Chapter view selected (role/tools/agent/takeaways): `view !== 'machine'` → InteriorOrbitControls unmounts; camera-rig resumes normal damp loop.
- No frame-level conflict between rig and controls at any point.

### Hitbox correctness
Hitboxes are positioned in the CocaColaVendingMachine's LOCAL normalized frame (not world space). They automatically travel with the machine when world position changes — no hitbox adjustments needed.

---

## 6. Tuning Notes for User

All positions are best-guess estimates pending visual inspection:

- **Machine X/Z**: Adjust `position={[2.0, -3.0, -4.5]}` in `machine-hub.tsx`. Keep y=-3.0 fixed (floor). Try X=1.5 if too far right or X=2.5 if more wall-flush is needed.
- **Sign Y**: If the GLB entrance is taller/shorter, adjust `position={[0, 1.4, -2.4]}` (main) and `{[0, 0.85, -2.4]}` (subtitle) in `jacobs-pharmacy-exterior.tsx`.
- **OrbitControls constraints**: `minAzimuthAngle/maxAzimuthAngle` are ±0.4π (±72°). Widen if user wants more look-around.
- **Camera distance**: `minDistance=3 maxDistance=8` — adjust if user wants to zoom closer to bottle labels.
