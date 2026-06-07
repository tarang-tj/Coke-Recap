# Simplification Report: Drop Interior Architecture → One Outdoor Home Scene

**Branch:** polish-pass-4
**Date:** 2026-06-07
**Status:** DONE

---

## 1. Status

Complete. `tsc -b` clean, `vite build` passes (644 modules, 0 errors).

---

## 2. Files Changed

| File | Delta | Change |
|------|-------|--------|
| `src/scene/navigation-context.tsx` | −34 lines | Removed `'exterior'` from ViewId, removed `entering` flag + ENTRY_TRANSITION_MS constant + exterior→machine useEffect |
| `src/scene/scene-transition-context.tsx` | −7 lines | Removed `Exclude<ViewId,'exterior'>` — SceneMix now `Record<ViewId, number>` |
| `src/scene/jacobs-pharmacy-exterior.tsx` | +45 lines net | Repurposed as the ONE home scene: owns buildings + signage + gas-lamp + vending machine on sidewalk; visibility driven by sceneMix.machine |
| `src/scene/camera-rig.tsx` | −62 lines | Deleted EXTERIOR_POSE, entry-transition state, cubicEaseInOut, prevViewRef, _extPos/_extLook, OrbitControls early-return guard; POSES.machine updated to street-level corner-block framing |
| `src/scene/scene-root.tsx` | −23 lines | Removed InteriorOrbitControls component + OrbitControls import; updated initial camera position to match new machine pose |
| `src/scene/scene-backdrop.tsx` | −10 lines | Collapsed 3-palette to 2-palette (machine = dusk Atlanta, chapters = red); removed exterior condition |
| `src/ui/chapter-overlay.tsx` | −12 lines | Removed `entering` from destructure, removed `isExteriorOrEntering` gate, simplified to `isMachine` binary; ChapterId type updated |
| `src/ui/credit-hud.tsx` | −1 line | Removed `\|\| view === 'exterior'` from show condition |
| `src/app.tsx` | −10 lines | Removed MachineHub + JacobsPharmacy (interior) mounts; added SceneContent inner component to thread setView into JacobsPharmacyExterior |
| `src/scene/fluid-environment.tsx` | −1 line | Removed `view !== 'exterior' &&` condition |
| `src/scene/brand/floating-props.tsx` | −1 line | Removed `view === 'exterior' \|\|` from gate condition |
| `src/scene/brand/coca-cola-vending-machine-gltf.tsx` | −1 line | ChapterId type: `Exclude<ViewId, 'machine'>` (was `'machine' \| 'exterior'`) |

**Net: ~−162 lines of dead architecture removed.**

---

## 3. Build Result

```
tsc -b       → 0 errors
vite build   → ✓ 644 modules transformed, built in 3.83s
```

Chunk-size warning (~1.5 MB JS) is pre-existing Three.js/R3F bundle, not a regression.

---

## 4. Chapter Views Still Work

- Bottle hitbox clicks → `onSelectChapter` → `setView(chapterId)` path: JacobsPharmacyExterior receives `onSelectChapter` from App's SceneContent, passes it to CocaColaVendingMachine, which fires it from HitBox onClick.
- Keys 1–4 / arrows / Esc/Backspace: keyboard listener in NavigationProvider unchanged.
- All four chapter acts (ActRole, ActTools, ActAgent, ActBottle) still mounted and transition-gated via SceneTransitionProvider.

---

## 5. Home Camera Pose

```ts
machine: { pos: [0, 0, 6.5], look: [0, 0.5, -3.0] }
```

Street eye-level (y=0 in world, ~3 units above the y=−3 floor), backed off z=6.5 to frame the full corner-block facade. Look target slightly above horizon toward the building center. Canvas initial camera position updated to match: `[0, 0, 6.5]`.

---

## 6. Architecture After This Pass

- **Home scene** (`view === 'machine'`): `JacobsPharmacyExterior` — corner block buildings + signage + gas-lamp + vending machine on sidewalk
- **Chapter scenes**: ActRole / ActTools / ActAgent / ActBottle — unchanged, transition-mixed via SceneTransitionProvider
- **Dead code left on disk (not mounted)**: `machine-hub.tsx`, `jacobs-pharmacy.tsx`, `convenience-store-gltf.tsx`, GLB assets in `public/assets/models/` — all safe to delete in a future cleanup pass

---

## Unresolved Questions

None. Build is clean, architecture is simplified.
