# GLB pharmacy + atmosphere + bottle-lift fix

**Branch:** polish-pass-4 (PR #2)
**Triggered by:** User: *"jacobs pharmacey is cut off plus the whole vibe should be atlanta 19th century downtown... when hovering over the coke bottles why is it on the floating platform that elevates each time... the inside and outside of a store shouldnt have that red and floating circles vibe... the inside of the store is horrendous"* + provided two new GLBs.
**Methodology:** superpowers:subagent-driven-development + react-three-fiber skill patterns (`<Bounds>`, `<Center>`, visibility prop, `useGLTF`)
**Start:** 2026-06-06 23:41 ET

## Diagnosis (six issues)

1. **Exterior is cut off** — camera framing wrong for procedural storefront, building doesn't fit.
2. **Atlanta 19th century vibe missing** — single procedural storefront doesn't read as a downtown block.
3. **Floating-platform bottle hover** — vending-machine `BottleSlot` lifts bottles by 0.14 units on hover. User finds it weird.
4. **Red world + dust motes inside and outside the store** — the atmospheric red gradient skydome was designed for the abstract chapter views, but now bleeds through the diegetic pharmacy scenes. Stores don't sit in a red void.
5. **Procedural interior is horrendous** — Round 5's Jacobs' Pharmacy procedural interior (floor + walls + shelves + counter + lamp + ad) gets thrown out.
6. **Procedural exterior is horrendous** — same story for Round 7's procedural storefront.

User provided two new GLBs:
- `/Users/tarangjammalamadaka/Downloads/brick_shop_building__lowpoly.glb` (2.5 MB) → copied to `public/assets/models/brick-shop-building.glb` for the exterior
- `/Users/tarangjammalamadaka/Downloads/the_convenience_store.glb` (12 MB) → copied to `public/assets/models/convenience-store-interior.glb` for the interior

## Phases

| # | Title | Owns | Type |
|---|---|---|---|
| A | Replace procedural exterior + interior with GLBs | `scene/brand/brick-shop-building-gltf.tsx` (NEW), `scene/brand/convenience-store-gltf.tsx` (NEW), `scene/jacobs-pharmacy-exterior.tsx` (gut + reuse as wrapper), `scene/jacobs-pharmacy.tsx` (gut + reuse as wrapper), `scene/camera-rig.tsx` (refit exterior framing) | architectural |
| B | View-aware backdrop + remove bottle hover-lift | `scene/scene-backdrop.tsx`, `scene/brand/vending-machine.tsx` | tone + UX |

File-disjoint. Parallel-safe.

## Phase A overview

Both procedural environment components (`jacobs-pharmacy-exterior.tsx` exterior + `jacobs-pharmacy.tsx` interior) get gutted. Their internal procedural geometry — walls, shelves, counter, lamp, ad frame, brick facade, awning, doors, signage — all goes away. The files stay (their export names and mount points don't change) but they become thin wrappers that load and position the GLBs.

**Exterior:**
- Load `brick-shop-building.glb` via `useGLTF`
- Use drei `<Center>` to normalize the GLB's origin to world center
- Use drei `<Bounds fit clip observe margin={1.4}>` ONCE on initial mount to auto-frame the camera so the building isn't cut off
- Read the GLB's bounding box to derive a sensible scale — building height ~6 world units
- Place the building at world position so the corner is visible at camera framing

**"Corner block" feel** (without sourcing additional building GLBs): tile the brick-shop GLB twice — once as the primary corner building (the pharmacy) and once at a 90° rotation as the neighboring street. This is a pragmatic hack that gives the Atlanta-downtown-block feel without us needing more assets. Implementer may also clone the GLB scene and place a third instance further down the street at smaller scale for distance.

**Interior:**
- Load `convenience-store-interior.glb` via `useGLTF`
- Normalize via `<Center>` and scale to roughly fit the vending-machine height (~5.6 world units of vertical interior height)
- The vending machine is rendered separately by `machine-hub.tsx` — Phase A positions the store GLB AROUND the machine. May need a small adjustment to the machine's world transform so it sits against one of the store's walls instead of in the middle of the floor.

Camera framing:
- Exterior pose may need adjustment depending on the brick-shop GLB's actual size. Use the auto-fit from `<Bounds>` on the exterior group OR derive a manual pose from the GLB bbox.

See `phase-A-glb-replacement.md`.

## Phase B overview

Two small but high-impact fixes:

### 1. View-aware atmospheric backdrop

Current `scene-backdrop.tsx`:
- Vertical gradient skydome (burgundy → brand red → dark wine)
- 80 drifting cream dust particles
- Visible in ALL views

After Phase B:
- **`'exterior'` view**: Dark dusk sky — vertical gradient from dark slate `#1A1612` at the top to warm amber-burgundy `#3A2010` at the horizon. NO dust motes. Atmospheric perspective consistent with an Atlanta evening.
- **`'machine'` view**: Warm interior tone — dimmer gradient, dark walnut `#1A0F08` → faint cream `#3A2A1C`. NO dust motes (interior air shouldn't have visible motes).
- **Chapter views (role / tools / agent / takeaways)**: KEEP the existing red atmospheric gradient + dust motes. These are abstract "memory" chapters — the red world is right for them.

Implement by gating the backdrop's drawing based on `useNavigation().view`. The skydome material's uniforms (or the shader fragment) read the current view and select the gradient colors. Dust motes' `visible` prop on the InstancedMesh gates on `view-is-chapter`.

### 2. Remove bottle hover-lift in `BottleSlot`

In `src/scene/brand/vending-machine.tsx`, `BottleSlot` currently:
```ts
const targetLift = pressRef.current ? -0.35 : hovRef.current ? LIFT_HOVER : 0;
liftRef.current += (targetLift - liftRef.current) * t;
g.position.y = BOTTLE_Y + liftRef.current;
```

Where `LIFT_HOVER = 0.14`. Drop the hover lift entirely (keep the press scrunch since that's tied to the dispense animation). Y position is constant at `BOTTLE_Y`. The press transition (`-0.35` on press) stays.

Replace the missing hover feedback with: a slight `scale` bump (1.0 → 1.06) + the existing `highlight` prop on the bottle which already drives an emissive lerp. No translation in Y.

```ts
const targetLift = pressRef.current ? -0.35 : 0;   // hover lift removed
liftRef.current += (targetLift - liftRef.current) * t;
g.position.y = BOTTLE_Y + liftRef.current;
const s = hovRef.current ? 1.06 : 1;
g.scale.setScalar(s);
```

See `phase-B-backdrop-and-lift.md`.

## SDD review gate

Per phase: implementer → consolidated spec+quality review → fix loop → commit.

## Project hard rules

- NO transmission materials anywhere (perf rule).
- Each phase touches only owned files.
- Reduced motion respected wherever motion is added.
- GLB assets live in `public/assets/models/` with kebab-case names.
- Use `useGLTF.preload(url)` at module scope for instant load.
- All Suspense boundaries already handled by `scene-root.tsx`'s top-level fallback.

## Out of scope (deferred)

- Custom Perlin shaders for hero accents
- GSAP timeline replacement of `cubicEaseInOut`
- Audio
- Mobile-specific tuning
- Baked-lightmap UV channel support
- Pavement texture upgrades
