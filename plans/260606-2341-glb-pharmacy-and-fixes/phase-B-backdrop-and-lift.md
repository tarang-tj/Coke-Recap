# Phase B — View-aware atmospheric backdrop + remove bottle hover-lift

**Files owned:**
- `src/scene/scene-backdrop.tsx`
- `src/scene/brand/vending-machine.tsx`

## Why

User: *"the inside and outside of a store shouldnt have that red and floating circles vibe"* + *"when hovering over the coke bottles why is it on the floating platform that elevates each time."*

Two unrelated but small fixes:

1. The red atmospheric skydome + 80 dust particles bleed through ALL views. They're right for the chapter views (Role/Tools/Agent/Takeaways are abstract "memory" scenes), but wrong for the diegetic pharmacy scenes.
2. The vending-machine `BottleSlot` lifts each bottle by 0.14 world units on hover. User finds this awkward / floating-platform-y.

## Task 1 — view-aware backdrop in `scene-backdrop.tsx`

Read the current state of `src/scene/scene-backdrop.tsx`. It currently:
- Renders a skydome inverse-sphere with a vertical gradient shader (burgundy → brand red → dark wine) + radial vignette
- Renders 80 instanced cream dust particles drifting downward with horizontal drift

Rewire both so they're view-aware:

### Backdrop gradient — three palettes

Use `useNavigation()` to read the current view. Pick a gradient palette per view group:

| View | Top color | Horizon color | Bottom color |
|---|---|---|---|
| `exterior` | `#1A1612` (dark slate evening sky) | `#3A2010` (warm amber-burgundy horizon) | `#0A0805` (deep ground shadow) |
| `machine` | `#1A0F08` (dark walnut interior) | `#3A2A1C` (faint warm interior fill) | `#0F0905` (interior floor shadow) |
| `role` / `tools` / `agent` / `takeaways` | Keep current red atmospheric (`#3A0006` / `#A60010` / `#1A0004`) |

Easiest implementation: pass the 3 gradient colors as uniforms into the existing skydome shader. Read the navigation view in the component, select the palette, set the uniforms.

If the existing skydome uses a non-shader approach (CanvasTexture baked once), refactor to a shader-based approach so the gradient can swap without rebuilding the texture. A minimal vertex+fragment shader with three uColor uniforms + a vertical y-mix is sufficient. Use `meshBasicMaterial` with `side=THREE.BackSide` on a sphere — that's the established "skydome" pattern.

Lerp the gradient colors over 200ms on view change so the swap isn't a hard cut.

### Dust motes — gate on chapter view only

The 80 dust mote InstancedMesh should be visible ONLY when `view` is one of the four chapter ids. Hide it on `exterior` and `machine`.

```tsx
const isChapterView = view !== 'exterior' && view !== 'machine';

// in the InstancedMesh JSX:
<instancedMesh ref={dustRef} visible={isChapterView} ...>
```

The motes already pause animation on reduced motion; the visibility gate is independent.

### Acceptance — Task 1

- `'exterior'` view: dark dusk sky with warm amber-burgundy horizon. No dust motes.
- `'machine'` view: warm dim walnut tone. No dust motes.
- Chapter views: red atmospheric + dust motes (current behavior preserved).
- Smooth 200ms color lerp on view change.

## Task 2 — remove bottle hover-lift in `vending-machine.tsx`

In `src/scene/brand/vending-machine.tsx`, the `BottleSlot` component computes:

```ts
const targetLift = pressRef.current ? -0.35 : hovRef.current ? LIFT_HOVER : 0;
liftRef.current += (targetLift - liftRef.current) * t;
g.position.y = BOTTLE_Y + liftRef.current;
const s = hovRef.current ? 1.06 : 1;
g.scale.setScalar(s);
```

Where `LIFT_HOVER = 0.14`. **Remove the hover lift entirely.** Keep the press scrunch (it's tied to the dispense animation and reads correctly as "the bottle drops into the chute"). Y stays at `BOTTLE_Y` constant when not pressed.

Replace with:

```ts
const targetLift = pressRef.current ? -0.35 : 0;
liftRef.current += (targetLift - liftRef.current) * t;
g.position.y = BOTTLE_Y + liftRef.current;
const s = hovRef.current ? 1.06 : 1;
g.scale.setScalar(s);
```

The existing scale bump (1.0 → 1.06) on hover stays — that's the residual hover feedback. The `highlight` prop on `<BottleGltf>` already lerps the emissive on hover, so visual feedback isn't lost — just the awkward Y translation.

You can delete the `LIFT_HOVER` constant since it's no longer used.

### Acceptance — Task 2

- Hovering a bottle in the vending machine: no Y translation. Scale bumps slightly (1.06) and emissive brightens (via highlight). Cursor changes to pointer.
- Clicking a bottle: press scrunch (-0.35 Y) before navigation, as before.
- Reduced motion: behaves the same (the scale snap was already instant with reduced motion via the `t = redRef.current ? 1 : ...` pattern).

## Acceptance criteria (overall)

- `npm run build` passes
- tsc clean
- No transmission materials
- Both tasks above honored

## Out of scope

- Don't touch the bottle GLB or `bottle-gltf.tsx`.
- Don't touch the pharmacy GLBs or wrappers (Phase A owns those).
- Don't touch the postprocessing stack, scene-lighting, or per-act materials.
- Don't touch the `SelectButton` mini-bottle on the machine front (it's a different element).

## Verification

```bash
npm run dev
# Exterior view: dark evening sky, no dust motes
# Click Enter: warm interior tone, no dust motes
# Hover a machine slot bottle: no Y lift, slight scale bump
# Press 1-4: red atmospheric + dust motes return
```
