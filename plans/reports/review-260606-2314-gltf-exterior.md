# Consolidated SDD Review — GLTF + Exterior round (`polish-pass-4`)

Date: 2026-06-06
Build: PASS (`npx vite build` clean, 648 modules)
Typecheck: PASS (`npx tsc --noEmit` clean)
Branch: polish-pass-4

---

## Phase A — Bottle GLB pipeline

**SPEC: ✅ MATCHES**

Verified items:
- `useGLTF.preload(BOTTLE_URL)` at module scope — bottle-gltf.tsx:37
- `scene.clone(true)` via `useMemo` per instance — bottle-gltf.tsx:62
- Bounding-box normalization: `factor = TARGET_HEIGHT / size.y`, originOffset y = `-box.min.y * factor` — bottle-gltf.tsx:66-78
- `CokeBottleProps` interface honored; `showLogo`/`customLabel`/`interior`/`reducedMotion` accepted silently — bottle-gltf.tsx:50-53
- `highlight` traverses MeshStandardMaterials, lerps emissiveIntensity — bottle-gltf.tsx:84-116
- Pointer/click handlers wired to outer group — bottle-gltf.tsx:122-125
- All 3 spec'd consumers swapped to `<BottleGltf>`:
  - takeaways hero — act-bottle.tsx:47
  - vending-machine BottleSlot — vending-machine.tsx:103-106
  - wooden crate BottleInCrate — act-tools.tsx:497
- Procedural `coke-bottle.tsx` NOT modified — still exports `CokeBottleProps`

### QUALITY

**Must-fix:** none.

**Should-fix:**

1. **Emissive-lerp mutes baked GLB emissives** — bottle-gltf.tsx:109-116
   The frame loop runs `m.emissiveIntensity += (target - m.emissiveIntensity) * ...` on every collected MeshStandardMaterial. For bottles with `highlight=0` (the default, and what 4/6 of the crate bottles + non-hovered machine slots use), `target = 0`, so any GLB material that ships with non-zero `emissiveIntensity` (e.g. baked label glow, cap stamp) gets driven to 0. Fix: cache each material's original `emissiveIntensity` in the same useEffect, then lerp to `original + hRef.current * 0.35`.

2. **Zero-height bbox unhandled** — bottle-gltf.tsx:70
   If `size.y === 0` (malformed/empty model), `factor = Infinity` and the bottle vanishes/diverges. Defensive `if (size.y < 1e-6) return { normalizedScale: 1, originOffset: new THREE.Vector3() };` before the divide.

3. **Cloned scene resources never disposed on unmount** — bottle-gltf.tsx:62
   `scene.clone(true)` shares geometries/textures with the cached source via SkeletonUtils-style cloning that drei's `useGLTF` uses, but Object3D references in `cloned` are kept alive until the component unmounts. There is no `useEffect` cleanup. For ~11 stable instances this is negligible, but if `ActBottle` / `ActTools` ever remount during dev (StrictMode does this), each remount leaks the cloned root tree. Add a `useEffect(() => () => { cloned.traverse(...dispose materials/geometries unique to this clone); }, [cloned])`.

**Nit:**

4. **`groupRef` declared but never read after assignment** — bottle-gltf.tsx:58, 120. Can drop the ref unless reserved for future use.

5. **SelectButton mini-bottle still uses procedural CokeBottle** — vending-machine.tsx:183. Spec only required swapping BottleSlot bottles; the button-head mini-bottle is technically out of scope. Flag as deliberate-or-deferred: confirm intent.

---

## Phase B — Pharmacy exterior + spatial entry

**SPEC: ⚠️ MATCHES WITH ISSUES** (2 acceptance-criteria issues + visual quality issues during transition)

Verified items:
- `'exterior'` added to `ViewId` — navigation-context.tsx:16
- Initial view = `'exterior'` — navigation-context.tsx:40
- `useEffect` exterior → machine on `started` — navigation-context.tsx:65-69
- StartGate label = `Enter the Pharmacy` — start-gate.tsx:111
- Hint updated to `click the door • or press enter` — start-gate.tsx:116
- Camera entry: 1.6s, cubic ease-in-out, EXTERIOR_POSE → POSES.machine — camera-rig.tsx:25-30, 95-117
- Reduced motion → snap to machine pose — camera-rig.tsx:77-82
- Pharmacy visibility gated on `view === 'exterior'` — jacobs-pharmacy-exterior.tsx:166
- Esc/Backspace go to `'machine'` (one-way) — navigation-context.tsx:42, 56, 78-79
- CreditHud includes exterior — credit-hud.tsx:15
- All CanvasTextures use `SRGBColorSpace` + disposal — jacobs-pharmacy-exterior.tsx:63, 109, 140, 157-163
- No transmission materials on storefront glass — uses meshPhysicalMaterial with clearcoat + opacity only

### QUALITY

**Must-fix:**

1. **Pharmacy exterior pops out of view the instant `view` flips to `'machine'`** — jacobs-pharmacy-exterior.tsx:166
   Visibility toggle is binary (`visible={view === 'exterior'}`). When the user clicks Enter:
   - `started → true` → `setView('machine')` (NavigationProvider effect)
   - Next render: exterior group `visible=false`, camera STILL at exterior pose
   - Camera animates 1.6s through empty space (the storefront is gone) toward the machine
   Spec says "camera dollies through the door" — but the door no longer exists once view changes. Fix: keep the exterior visible during the 1.6s transition. Options: (a) gate visibility on a transition-aware flag from CameraRig; (b) keep `visible=true` while view==='machine' AND a transition-in-progress flag is set; (c) simplest — add the exterior group's visibility to `useSceneMixes` with its own envelope and fade out over the transition window.

2. **Chapter selector nav + Logo button leak through gate scrim during exterior** — chapter-overlay.tsx:51-57, 96-117
   `ChapterOverlay` renders the top-left Logo button (goHome) and the bottom-center 4-chapter `<nav>` at all times. During exterior view + gate-up:
   - Gate scrim opacity at edges is ~0.45 (radial gradient) — UI elements are dimly visible but unclickable
   - Visual clutter undercuts the cinematic "you're outside the pharmacy" moment
   Spec said "DO NOT need to modify chapter-overlay" + verify. The existing logic does NOT account for exterior. Fix: skip rendering the chapter nav and Logo button when `view === 'exterior'` (or wrap them in `view !== 'exterior' &&`).

**Should-fix:**

3. **Camera-rig mutates state during render** — camera-rig.tsx:71-88
   The `if (view !== viewRef.current)` block runs in the component body (during render) and mutates refs + camera position + calls `camera.lookAt()`. In React 18 StrictMode (dev double-render), this block runs twice per change — idempotent because the second run sees viewRef already updated, so the `from === 'exterior'` check fails. Safe in practice, but render-time side effects are a code smell. Prefer a `useEffect(() => { ... }, [view, reduced])` that handles the transition start. The implementer flagged this as deliberate; keep but document the StrictMode reasoning inline.

4. **`prevViewRef` set but never read** — camera-rig.tsx:55, 73. Dead state. Drop it.

5. **Subtitle text z-position is behind the awning** — jacobs-pharmacy-exterior.tsx:413
   `SODA · FOUNTAIN · DRUGS` at `position={[0, 0.72, -7.85]}`. Awning group is at z=-7.75 with depth=1.0 → spans z=[-8.25, -7.25]. The subtitle at z=-7.85 sits INSIDE the awning box and could be occluded by the awning rear face or the brick wall behind. Move forward to z=-7.6 or higher (in front of the wall at -7.95).

6. **`fillOpacity` used on Drei `<Text>`** is fine but `transparent` without `depthWrite={false}` is missing on a few props — minor render-order risk on the interior silhouettes (jars/soda fountain) — jacobs-pharmacy-exterior.tsx:285, 290, 374, 378. Acceptable for a backdrop but flag.

7. **Random brick/cobble/scratch placement is non-deterministic** — jacobs-pharmacy-exterior.tsx:46, 50, 87-103, 124. Each session looks slightly different. Acceptable but a seeded RNG (`seededRng` pattern from act-tools.tsx:62) would make the storefront stable for screenshot/regression testing.

8. **Awning top-surface rotation `[0.18, 0, 0]` tilts forward** — jacobs-pharmacy-exterior.tsx:385. With the box at world-y 1.2 and rotated 0.18 rad on X, the back edge lifts and the front drops. Combined with the front valance at y=1.1 z=+0.52 relative offset, geometry intersects. Visible jankiness possible at certain camera angles. Should verify in browser.

**Nit:**

9. Comment typo "Burgund awning" — jacobs-pharmacy-exterior.tsx:382.

10. Magic number `0.35` in highlight target (bottle-gltf.tsx:112) and `0.5`/`0.15` in dispense glow (vending-machine.tsx:256) — extract as named constants for tunability.

11. The fade-in machine envelope (rate=5.5, ~0.2s to reach 1) finishes much earlier than the 1.6s camera dolly. User sees machine hub appear in foreground while camera is still mid-flight. Could feel correct ("the machine reveals itself as you enter") or jarring. Subjective — visual review needed.

---

### Type-cascade edits (implementer flagged as outside ownership)

- **scene-transition-context.tsx:17,19** — `Exclude<ViewId, 'exterior'>` narrowing. ✅ Safe. Crossfade behavior on machine ↔ chapter views unchanged (loop now iterates 5 ids instead of 6; exterior was never an "act" anyway).
- **chapter-overlay.tsx:13,32-35** — `isHubView` flag added; correctly suppresses chapter content for both `machine` and `exterior`. ✅ But the persistent chapter nav + Logo button are NOT gated → see Must-fix #2.

---

## OVERALL: ⚠️ APPROVED-WITH-FIXES

**Must-fix count: 3** (one Phase-A behavior, two Phase-B transition/UX issues)

### Top 3 recommendations

1. **Fix the exterior pop-out during entry transition** (Phase B Must-fix #1). The cinematic dolly is the centerpiece of this round; the storefront vanishing on click defeats the effect. Keep exterior visible until the 1.6s animation completes, or fade it during the transition.

2. **Gate the ChapterOverlay nav + Logo on exterior view** (Phase B Must-fix #2). Add a `view !== 'exterior' &&` guard around the `<nav>` at chapter-overlay.tsx:96 and the Logo button at line 51-57. Removes visual clutter that breaks the entry moment.

3. **Preserve baked GLB emissives in BottleGltf highlight lerp** (Phase A Should-fix #1). Cache per-material original `emissiveIntensity` and lerp around it. As-is, all non-hovered GLB bottles slowly lose any baked emissive (label glow, cap stamp) as the frame loop drives intensity to 0. Visible in the crate (4 bottles with highlight=0.1) and machine slots when no hover is active.

---

## Unresolved questions

1. The 0.2s machine fade-in vs 1.6s camera dolly mismatch (Nit #11) — intended or accidental? If accidental, slow the machine envelope rate when transitioning from exterior.
2. SelectButton mini-bottle still using procedural `<CokeBottle>` (Phase A Nit #5) — deferred to a future pass or oversight?
3. Visual reference verification: did anyone open the build and confirm the awning tilt + subtitle z-occlusion actually look OK in the browser? Spec verification step says "open localhost:5173" — recommend a 30-second visual sanity check before merge.
