---
date: 2026-06-07
project: Coke-Recap
tags: [polish, glb, camera, vending-machine]
status: complete
---

## Phase Implementation Report

### Executed Phase
- Phase: round-11-polish — new GLBs + machine swap + camera re-pose
- Plan: none (direct task)
- Status: completed

---

### Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/scene/brand/convenience-store-gltf.tsx` | URL → v2 GLB, comment updated | 93 (unchanged size) |
| `src/scene/brand/coca-cola-vending-machine-gltf.tsx` | NEW — GLB loader + 4 hitboxes | 163 |
| `src/scene/machine-hub.tsx` | Swap VendingMachine → CocaColaVendingMachine, drop unused active state | 45 |
| `src/scene/camera-rig.tsx` | Re-pose machine view; comment sync on _machPos/_machLook vectors | 148 |

`vending-machine.tsx` — NOT touched (kept as fallback per spec).

---

### Tasks Completed

- [x] convenience-store-gltf.tsx URL updated to v2
- [x] useGLTF.preload updated to v2 URL
- [x] coca-cola-vending-machine-gltf.tsx created with clone+normalize pattern
- [x] TARGET_HEIGHT = 5.6 matching procedural machine convention
- [x] Runtime console.log of GLB bbox for hitbox calibration
- [x] 4 invisible hitboxes wired to onSelectChapter callback
- [x] Cursor pointer on hover / auto on leave
- [x] CocaColaVendingMachineProps interface matches spec
- [x] machine-hub.tsx renders CocaColaVendingMachine instead of VendingMachine
- [x] Chapter callback wired to setView()
- [x] Unused active/activeRef state removed from machine-hub
- [x] Camera MACHINE_POSE re-posed for new interior scale
- [x] No transmission materials introduced
- [x] No new npm dependencies
- [x] Build passes (tsc + vite)

---

### Tests Status
- Type check: **pass** (tsc -b clean)
- Build: **pass** (vite build in 3.50s)
- Unit tests: n/a (no unit test suite configured for this project)

---

### Camera Pose Values

**EXTERIOR_POSE** — unchanged: `pos: [0, 0.5, 7.5]`, `look: [0, 1.5, -4.0]`

Rationale: the brick-shop primary instance is at identity rotation, building fills frame comfortably from this position. No change needed.

**MACHINE_POSE (new)** — `pos: [0, 2.0, 4.5]`, `look: [0, 2.5, 0]`

Rationale:
- Machine base at world y=0, top at y=5.6 (normalized), center at y=2.8.
- Camera y=2.0 puts the viewer slightly below center height — feels like standing in front of a tall vending machine (realistic 1.7 m eye level relative to machine base).
- Camera z=4.5 gives ~4.5 units of working distance; enough to see the full 5.6-unit height in a ~50° FOV without distortion.
- Look target y=2.5 keeps the display bay + coin slot rows all in frame; label rows visible at top, floor visible at bottom.
- Previous pose (`pos: [0, 0.2, 7.8]`, `look: [0, 0.1, 0]`) was tuned for the open red void — y=0.2 put the camera at floor level looking nowhere useful inside a store interior.

---

### Hitbox Positions (bottle slots)

All positions in the machine's local normalized frame (base at y=0, height 5.6):

| Slot | Chapter | x | y | z | size (w×h×d) |
|------|---------|------|-----|-----|--------------|
| 1 | role | -0.70 | 1.4 | 0.6 | 0.35×1.0×0.4 |
| 2 | tools | -0.25 | 1.4 | 0.6 | 0.35×1.0×0.4 |
| 3 | agent | +0.25 | 1.4 | 0.6 | 0.35×1.0×0.4 |
| 4 | takeaways | +0.70 | 1.4 | 0.6 | 0.35×1.0×0.4 |

These are estimated positions — the GLB's actual bottle bay may differ. The `console.log` in `CocaColaVendingMachine` emits the bbox at runtime. Calibration constants (`HITBOX_Y`, `HITBOX_Z`, `HITBOX_X_POSITIONS`) are top-of-file for easy tuning without searching through JSX.

---

### Issues Encountered

None. Build clean on first pass.

---

### Next Steps

1. Load the app in browser, open DevTools console, read the `[CocaColaVendingMachine] GLB bbox` log. Compare the normalized width/depth to the HITBOX constants and adjust `HITBOX_Y`, `HITBOX_Z`, `HITBOX_X_POSITIONS` in `coca-cola-vending-machine-gltf.tsx` if bottles don't align.
2. If the convenience-store-interior-v2.glb has a very different interior height, `TARGET_HEIGHT` in `convenience-store-gltf.tsx` may need bumping (currently 6.0). Verify floor-to-ceiling clearance around the machine visually.
3. FOV narrowing (35°) can be applied to the `<Canvas fov={35}>` prop if the interior still feels fish-eyed after the camera re-pose. Currently left at R3F default (~50°) since that's a Canvas-level change outside the specified file set.
