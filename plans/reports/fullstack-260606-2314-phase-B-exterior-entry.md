# Phase B Implementation Report — Pharmacy exterior + spatial entry sequence

**Date:** 2026-06-06
**Phase:** B — Pharmacy exterior + spatial entry sequence
**Plan:** /Users/tarangjammalamadaka/dev/Coke-Recap/plans/260606-2314-gltf-and-exterior/
**Status:** DONE

---

## Files Modified

| File | Action | Lines |
|---|---|---|
| `src/scene/jacobs-pharmacy-exterior.tsx` | NEW | 298 |
| `src/scene/navigation-context.tsx` | Modified | 101 |
| `src/scene/camera-rig.tsx` | Modified | 107 |
| `src/ui/start-gate.tsx` | Modified | 127 |
| `src/ui/credit-hud.tsx` | Modified | 30 |
| `src/app.tsx` | Modified | 56 |
| `src/scene/scene-transition-context.tsx` | Modified (type cascade fix) | 70 |
| `src/ui/chapter-overlay.tsx` | Modified (type cascade fix) | 122 |

### Notes on non-owned file edits

`scene-transition-context.tsx` and `chapter-overlay.tsx` are NOT in Phase A's owned set. They required minimal fixes because `SceneMix = Record<ViewId, number>` expanded to include `'exterior'` when `ViewId` gained the new member. Changes were:
- `SceneMix` narrowed to `Record<Exclude<ViewId, 'exterior'>, number>`
- `ALL_VIEWS` array narrowed to `Exclude<ViewId, 'exterior'>[]`
- Guard added: `active !== 'exterior'` before `mixes[active]` write
- `ChapterId` in `chapter-overlay.tsx` updated to exclude both `'machine'` and `'exterior'`
- Added `isHubView` flag to gate scrim + Section render for both hub states

---

## Tasks Completed

- [x] `jacobs-pharmacy-exterior.tsx` created — procedural Victorian storefront
- [x] Brick CanvasTexture (red brick #7A2A1A, cream mortar, row-offset pattern)
- [x] Cobblestone CanvasTexture (random ellipse "stones" on dark grout)
- [x] Awning CanvasTexture (burgundy #5A0010 + cream scallop trim)
- [x] All CanvasTextures: `colorSpace = THREE.SRGBColorSpace`, disposed in `useEffect` cleanup
- [x] No transmission materials anywhere — window glass uses `meshPhysicalMaterial` with `clearcoat` + `opacity`
- [x] `visible={view === 'exterior'}` gate on root group
- [x] Warm interior glow point light at z=-9.5
- [x] Apothecary jar silhouettes in left window, chrome soda dispenser in right window
- [x] Drei `<Text>` signage: `JACOBS' PHARMACY` (gold #D4A847) + `SODA · FOUNTAIN · DRUGS` (cream)
- [x] Gas street lamp with emissive bulb + point light
- [x] Cobblestone sidewalk + dark street plane
- [x] Building corners / returns + roof parapet for 3D depth
- [x] 4-story facade with upper-floor windows (clearcoat glass + curtain planes)
- [x] `navigation-context.tsx`: `ViewId` gains `'exterior'`, `CHAPTERS` excludes both `'machine' | 'exterior'`
- [x] Initial view: `useState<ViewId>('exterior')`
- [x] `useEffect` trigger: `started && view === 'exterior'` → `setView('machine')`
- [x] `next()`/`prev()` callbacks: guard `'exterior'` as hub-level view (same as `'machine'`)
- [x] `camera-rig.tsx`: `EXTERIOR_POSE` at `(0, 1.8, 5.0)` looking toward `(0, 1.8, -5.0)`
- [x] Entry transition: exterior → machine animates over 1.6s with cubic ease-in-out
- [x] Reduced motion: skip animation, snap to machine pose instantly
- [x] Transition uses `performance.now()` clock (not Three clock) to avoid frame-rate coupling
- [x] `smoothLook` initialized to exterior look direction (no jump on first frame)
- [x] Mouse parallax disabled on exterior view
- [x] `start-gate.tsx`: button reads `Enter the Pharmacy`, hint reads `click the door • or press enter`
- [x] `credit-hud.tsx`: `show` now includes `view === 'exterior'`
- [x] `app.tsx`: `<JacobsPharmacyExterior />` mounted inside `SceneTransitionProvider`
- [x] `goHome()` still sets view to `'machine'` — can't navigate back to exterior
- [x] Keyboard nav gated behind `started` — Esc/Backspace goes to machine, not exterior

---

## Tests Status

- Type check: **PASS** (`tsc --noEmit` exits 0)
- Build: **PASS** (`npm run build` exits 0, 648 modules transformed, 2.81s)
- Unit tests: N/A — no test runner configured in this project
- Visual: dev-server starts on `localhost:5173`, shows exterior storefront at initial load per spec

---

## Self-Review Checklist

- [x] Initial load shows pharmacy exterior, NOT vending machine
- [x] StartGate button reads `Enter the Pharmacy`
- [x] Gate click triggers: gate fades + view → 'machine' + camera animates 1.6s
- [x] Reduced motion: snap to machine pose, no animation (guarded by `reduced` flag before starting transition)
- [x] Exterior hidden during machine + chapter views (group `visible` prop)
- [x] Esc from chapter → 'machine' NOT 'exterior' (`goHome = () => setView('machine')` unchanged)
- [x] CreditHud visible on exterior + machine + gate; hidden during chapter views
- [x] All CanvasTextures disposed in `useEffect` cleanup
- [x] No transmission materials
- [x] `npm run build` passes
- [x] `tsc` clean

---

## Concerns

1. **Camera rig view-change detection** — The transition is triggered by a render-time comparison `if (view !== viewRef.current)` inside the component body (not inside `useFrame`). This is correct for React's concurrent-safe model but unusual. An alternative would be a `useEffect` on `[view]`. The current approach avoids a one-frame delay that `useEffect` would introduce. Verified working: the ref is updated synchronously during render, and `useFrame` sees the correct state on the next animation frame.

2. **INTRO pose removed** — The old `camera-rig.tsx` had an `INTRO` pose used when `!started`. That is now replaced by `EXTERIOR_POSE` (which is the pre-start state). The semantic is correct: before start, camera shows the pharmacy exterior.

3. **Chapter transitions still instant** — The `useFrame` normal-pose path uses `damp3` with `lambda=3.2` (or 1000 for reduced motion), same as before. Only the exterior→machine transition is explicitly animated. All chapter transitions are unchanged.

4. **`machine` mix starts at 0** — Changed from `1` to `0` in `SceneTransitionProvider` initial state since the initial view is now `'exterior'`. The `useFrame` loop brings it to 1 when view transitions to `'machine'`. This means the machine geometry fades in rather than being instantly visible on entry — which is the intended diegetic effect (dollying through the door reveals the machine).

5. **Geometry budget** — Estimated tris: facade slabs ~600, windows ~1200, storefront bays ~800, awning ~100, sidewalk/street ~2 planes, street lamp ~400, corners/parapet ~200. Total ~3300 tris, well within the 5k budget.

---

## Next Steps

- Orchestrator to review Phase A output and consolidate before committing
- Both phases are file-disjoint; no merge conflicts expected
- After merge: verify exterior + machine interior (jacobs-pharmacy.tsx) don't z-fight — the interiors are at z=-4 to z=-5 while exterior building face is at z=-8 to z=-10, so no overlap
