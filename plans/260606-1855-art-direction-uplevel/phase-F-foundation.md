# Phase F — Scene atmosphere foundation

**Priority:** P0 (compound multiplier — every other motif benefits)
**Files owned:**
- `src/scene/scene-root.tsx`
- `src/scene/scene-backdrop.tsx`
- `src/scene/scene-lighting.tsx`
- `src/scene/postprocessing-stack.tsx`

## Why

The prior two visual passes failed because they iterated geometry on a broken foundation. Chrome looks plastic (no envMap), bottles float (no shadows), the world is a flat red void (no depth atmosphere), lighting is a multi-color salad (no anchor). This phase installs the foundation that makes any motif feel premium.

## Tasks

### 1. HDR environment

In `scene-root.tsx` (or whichever scene-level file holds the canvas children), add a drei `<Environment />` instance. Use `preset="warehouse"` for chrome-friendly studio reflections. Pass `background={false}` so it lights materials but doesn't fight the custom backdrop.

```tsx
import { Environment } from '@react-three/drei';
// ...inside the SceneTransitionProvider's children:
<Environment preset="warehouse" background={false} />
```

Verify chrome materials on the vending machine (and the new chrome motifs in phases A, R) pick it up. No material edits should be required — PBR materials auto-sample the env.

### 2. Contact shadows

Mount drei `<ContactShadows />` at a sensible y depth for each act centerpiece. Either one shared shadow plane in scene-root, or per-act shadows inside each act's group. Recommendation: **one shared `<ContactShadows />` in scene-root** at y ≈ -1.6, opacity 0.55, blur 2.6, far 4. Acts position above it. (If a specific act's centerpiece floats too far above the shadow, the act can include its own additional ContactShadows.)

### 3. Atmospheric backdrop

Rewrite `src/scene/scene-backdrop.tsx`. Current behavior: a CSS-radial-gradient via in-scene skydome (because EffectComposer paints over the transparent canvas). Keep the skydome approach, but:

- **Replace the radial gradient with a vertical gradient + radial vignette compositing**:
  - Top half: deep burgundy `#3A0006`
  - Horizon-ish: brand red `#A60010`
  - Bottom: very dark wine `#1A0004`
  - Multiply by a radial vignette that darkens corners
- Use a **CanvasTexture or a small shader material** on the skydome inverse-sphere. A simple shader is preferred for runtime tuning; a CanvasTexture is also acceptable.
- **Add a particle field**: ~80 small cream billboards (`spriteMaterial` or `meshBasicMaterial` with a soft circle texture / disc geometry) drifting slowly downward + slight sideways drift. Opacity 0.15–0.3. They should read as motes of dust catching light, not snow.
  - Use `InstancedMesh` for the particles.
  - Drift speed and direction seeded per particle from a deterministic random.
  - Position bounds: a box around the camera region (x ∈ [-8, 8], y ∈ [-5, 6], z ∈ [-4, 4]).
  - Recycle when a particle drifts out of bounds.

### 4. Lighting overhaul

Rewrite `src/scene/scene-lighting.tsx`. Replace current point lights with the **3-light hero setup**:

```tsx
<>
  {/* Hero key — warm cream from upper-left */}
  <directionalLight
    position={[-5, 8, 4]}
    intensity={1.4}
    color="#FFF6E0"
    castShadow
    shadow-mapSize={[1024, 1024]}
  />

  {/* Soft fill — hemisphere with sky-red / ground-burgundy */}
  <hemisphereLight args={['#FF8A8A', '#3A0006', 0.35]} />

  {/* Brand accent rim — Coca-Cola red from behind-right-below */}
  <pointLight
    position={[4, -2, -3]}
    intensity={1.8}
    color="#F40009"
    distance={9}
    decay={2}
  />

  {/* Subtle ambient lift */}
  <ambientLight intensity={0.12} color="#FFEFE0" />
</>
```

Per-act lights inside `act-role.tsx`, `act-tools.tsx`, `act-agent.tsx` are kept by their respective phase owners — this is the scene-wide baseline.

### 5. Postprocessing tune

In `src/scene/postprocessing-stack.tsx`:
- **Bloom**: lower intensity ~ 0.6 (currently higher), raise luminanceThreshold to ~ 0.85, lower luminanceSmoothing to ~ 0.025. Only the brightest pixels bloom.
- **Vignette**: bump strength to ~ 0.65, eskil=false, darkness ~ 0.85. Tighten corner darkening.
- **Add Noise effect** from `@react-three/postprocessing`: `<Noise premultiply={false} opacity={0.08} blendFunction={BlendFunction.OVERLAY} />`. Subtle film grain.
- Keep WebGL2 multisample 4 (perf rule from prior work).

## Acceptance criteria

- HDR env mounted, chrome surfaces visibly reflect.
- Contact shadows visible under acts (try Tools or Role — there should be a soft shadow on the imaginary ground plane).
- Backdrop has vertical-gradient depth cue and drifting dust motes.
- Lighting is one warm key + soft hemi fill + red accent rim — no more multi-color salad.
- Postprocessing is tighter: bloom only on brightest, stronger vignette, subtle grain.
- `npm run build` passes, runtime console clean.

## Out of scope

- DO NOT touch any act file (R/T/A phases own those).
- DO NOT touch the vending machine, the bottle component, or chapter overlay.
- DO NOT change navigation, scene-transition, or camera-rig.
- NO transmission materials (perf rule). The HDR env replaces what transmission would have given us.

## Reduced motion

- Particle field: under `useReducedMotion`, particles freeze at deterministic positions (no drift).
- Noise effect: should NOT pulse — `<Noise>` already static.

## Files NOT to touch

Listed for clarity:
- `src/scene/brand/*` (vending-machine, coke-bottle, logo-3d, etc.)
- `src/scene/acts/*` (any act file)
- `src/scene/camera-rig.tsx`
- `src/scene/navigation-context.tsx`
- `src/scene/scene-transition-context.tsx`
- `src/scene/machine-hub.tsx`
- `src/ui/*`

## Verification

```bash
npm run build
npm run dev   # open localhost:5173, Press Start, look at the machine — chrome should reflect environment
```
