# Coke-Recap — Interactive Edition (immersive + game-like level-up)

**Branch:** `redesign/coca-cola-interactive` (from `55b2a64`)
**Local:** `~/dev/Coke-Recap` (off iCloud — builds fast)

## Goal
Make the experience more 3D, immersive, and interactive — game-like — without breaking the
working scroll-driven scrollytelling architecture. Add interactivity + depth + cinematic polish
as ADDITIVE layers.

## Architecture invariants (do NOT break)
- Single persistent `<Canvas>` (`scene-root.tsx`); acts never unmount.
- One scroll truth: `useScrollRef()` (RefObject<number>) read in `useFrame`; no React state for scroll.
- Camera motion lives ONLY in `camera-rig.tsx` (mouse-parallax already there). New camera behavior
  (intro dive) goes in camera-rig too.
- Acts gate via `getActWindow`/`actEnvelope`; honor `useReducedMotion()` everywhere.
- NO `transmission` materials (perf). World backdrop is the in-scene skydome (`scene-backdrop.tsx`).
- 3D brand logo = unlit white basic + bloom.
- R3F v9/React 19 ref gotcha: `useRef<T>(null)` → `RefObject<T|null>`.
- Verify VISUALLY via dev-server screenshots (localhost), not just build/types.

## Tasks

### T1 — Floating brand-prop field + fizz sparkles (immersion/depth)
New `src/scene/brand/floating-props.tsx`. Instanced drifting **bottle caps** (short cylinders +
crimped rim look) and **ice cubes** (rounded boxes) scattered through the red world at varied
depths; slow drift + rotation; parallax with camera. Add drei `<Sparkles>` for fine carbonation
glints. Cheap (instanced); subtle so it doesn't fight acts. Mount in `scene-root` (always on).
Honor reduced motion (freeze drift).

### T2 — Cursor-reactive carbonation (interactivity)
`src/scene/bubbles.tsx`: add a pointer uniform; bubbles get a gentle repulsion/swirl away from the
cursor (compute pointer influence in the vertex shader using camera-projected pointer or a world
proxy). Keep additive + reduced-motion. Pointer via R3F `state.pointer` in `useFrame`.

### T3 — "PRESS START" gate + intro camera dive (game entry)
- New `src/scene/experience-context.ts` (or hook): `{ started: boolean; start(): void }` via context,
  provided in `app.tsx`.
- New `src/ui/start-gate.tsx`: full-screen DOM overlay (logo visible behind), a big pulsing
  **"PRESS START"** / "ENTER THE RECAP" button. Click (or Enter/Space, or first scroll) → `start()`,
  overlay fades out. Before start: lock page scroll (body overflow hidden); after: enable.
- `camera-rig.tsx`: read `started`; while not started hold an intro pose (pulled back / rotated);
  on start, ease an `introMix` 1→0 over ~1.4s blending intro pose → scroll pose (a "dive in").
- Keep accessible: reduced-motion → no dive, instant.

### T4 — Interactive hero objects (direct interactivity)
- **Drag-to-orbit** the cold-open 3D logo and the finale bottle: pointer drag rotates the object
  group with inertia (manual pointer handlers on a wrapping group, or drei `<PresentationControls>`
  scoped to that object). Must not move the camera. Idle spin resumes after release.
- **Hover/click reactions**: tools chips lift+glow on hover (R3F onPointerOver/Out), cursor pointer;
  bottle cap (role) spins faster / brightens on hover. Use envelope-gated so only active act reacts.

### T5 — Cinematic product polish (perf-gated)
- `src/scene/scene-floor.tsx`: a subtle **reflective studio floor** low under the scene
  (drei `<MeshReflectorMaterial>` at LOW resolution ~128–256, high blur, low mixStrength) +
  drei `<ContactShadows>`. Mount in scene-root; gate reflector off when `performanceFactor < 0.7`
  (reuse the PerformanceMonitor signal already wired to PostprocessingStack — extend it).
- Optional subtle **DepthOfField** in `postprocessing-stack.tsx`, perf-gated (off on low-end).
- Tune lighting for the AAA render look.

### T6 — Integrate, perf pass, build, screenshots, final review
- Confirm everything composes; PerformanceMonitor disables heavy effects on low-end.
- `npm run build` clean; screenshot title + each act; dispatch final code review.

## Done criteria
- Start gate works (click → dive in); drag-orbit + hover interactions feel good.
- Floating props + cursor bubbles + sparkles add depth without tanking FPS.
- Reflective floor + (optional) DoF look premium and are perf-gated.
- Build green; visually verified via screenshots; no transmission; reduced-motion respected.
