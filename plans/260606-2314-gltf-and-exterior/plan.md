# GLTF integration + spatial entry sequence

**Branch:** polish-pass-4 (continuing the same branch — PR #2 stays open and updates with these commits)
**Triggered by:** User: *"this is horrendous look at bruno simons projects... lets do this machine in jacobs pharmacy like history... heres the coca cola bottle glb you can use... use deep research, copying, and critical thinking"*

User confirmed Option A (spatial sequence: title → exterior → enter → interior with machine) and provided real GLTF assets. This round is the foundation flip from "all procedural" to "GLTF-asset-driven where it matters."

**Methodology:** superpowers:subagent-driven-development + /threejs reference + bruno-simon-patterns research
**Start:** 2026-06-06 23:14 ET

## What we're keeping vs. replacing

| Asset | Strategy |
|---|---|
| Coca-Cola bottle | **REPLACE with GLB** — `cocacola_bottle.glb` (4.6MB) — copied to `public/assets/models/coca-cola-bottle.glb` |
| Vending machine | **KEEP procedural** — the Nuka Cola GLB is Fallout-branded, wrong identity. Our Coke-correct procedural machine stays. |
| Pharmacy interior (Round 5) | **KEEP** — Round 5's Jacobs' Pharmacy interior (floor, walls, shelves, counter, lamp, ad) is solid. |
| Pharmacy exterior | **NEW PROCEDURAL** — `.blend` files can't be processed without Blender; building Five Points Atlanta 1886 storefront procedurally. |
| Navigation flow | **EXTEND** — add `'exterior'` view at the start, animate transition into the interior on "Enter." |

## Bruno Simon adaptations (from researcher report)

We're picking five of the seven patterns:

1. **GLB asset loading via drei `useGLTF`** — drop-in for the bottle. (Bruno's manifest pattern.)
2. **Narrow FOV camera** — 20° → cinematic feel. (Bruno uses 20° throughout `my-room-in-3d`.)
3. **Custom shader for hero interactive element** — deferred to follow-up (we don't need it this round; the bottle GLB has baked-quality materials already).
4. **Spatial entry sequence with camera animation** — adapt Bruno's spherical-coord nav approach into a discrete view transition.
5. **Tone down postprocessing further** — Bruno doesn't even use a composer in `my-room-in-3d`. We have Bloom+Vignette+Noise; could simplify but defer to follow-up.

Things we CAN'T adopt and aren't trying to:
- Blender-baked light maps (no Blender access)
- Pre-rendered day/night textures
- Tweakpane debug UI (using React state if needed)

## Phases

| # | Title | Owns | Type |
|---|---|---|---|
| A | Bottle GLB pipeline + replace procedural everywhere | `scene/brand/bottle-gltf.tsx` (NEW), `scene/acts/act-bottle.tsx`, `scene/brand/vending-machine.tsx`, `scene/acts/act-tools.tsx` | asset integration |
| B | Pharmacy exterior + spatial entry sequence | `scene/jacobs-pharmacy-exterior.tsx` (NEW), `scene/navigation-context.tsx`, `scene/camera-rig.tsx`, `ui/start-gate.tsx`, `app.tsx` | architecture |

**File-disjointness verified.** A owns the bottle pipeline + 3 act/brand files that render bottles; B owns the new exterior + scene-level navigation + UI gate. No file overlap. Parallel-safe.

## Phase A overview

The procedural bottle (`coke-bottle.tsx`) we've iterated on through 7 rounds is going to be SUPERSEDED for actual rendering by a GLB-loaded variant. We keep `coke-bottle.tsx` in the tree (don't delete — its API is the contract; in fact a consumer might still want it during dev) but the three high-visibility consumers (takeaways, machine slots, crate) switch to `BottleGltf`.

The `BottleGltf` component **honors the existing `CokeBottleProps` interface** so consumers swap one line. Most props become no-ops with a GLB asset (the GLB's materials are fixed). What still applies:
- `scale`, `lift` → outer group transform
- `highlight` → find label/glass material, lerp emissive on hover
- `onPointerOver`, `onPointerOut`, `onClick` → wired to outer group
- `showLogo`, `customLabel`, `interior`, `reducedMotion` → accepted silently, no-op

GLB origin normalization: the bottle GLB's coordinate origin may not match our procedural bottle's. The loader component inspects the bounding box once and centers + scales the model so external `scale={X}` works identically across the two implementations.

See `phase-A-bottle-gltf.md`.

## Phase B overview

Three changes:

1. **Pharmacy storefront exterior** — a new procedural component rendering a Five Points Atlanta 1886 commercial-street view: 4-5 story brick building with pharmacy storefront at ground level. Awning, large display window with the interior dimly visible behind, painted gold-leaf signage reading *JACOBS' PHARMACY*, wooden door at center, sidewalk in front. Camera framing puts the building diagonally in the frame like a period photograph.

2. **`'exterior'` view added** to the navigation state machine. New initial view (was `'machine'`). The Press Start gate now leads from `exterior` → `machine` (entering the building).

3. **Camera entry animation** — when the view changes from `'exterior'` to `'machine'`, the camera animates over 1.6 seconds: starts at the street position, dollies forward through the doorway, ends at the existing machine-view pose. Uses a smooth easing curve (cubic ease-in-out). Other view transitions remain instantaneous as today.

See `phase-B-exterior-entry.md`.

## SDD review gate

Per phase: implementer → consolidated spec+quality review → fix loop → commit.

## Project hard rules

- NO transmission materials anywhere (perf rule).
- Each phase touches only owned files.
- Reduced motion respected wherever motion is added.
- Existing envelope-driven entrance pattern preserved for all four acts.
- GLB assets live in `public/assets/models/` with kebab-case names.
- Use drei's `useGLTF` for asset loading (preloaded via `useGLTF.preload(url)` at module level for instant render).

## Workflow note

This round commits to the **existing `polish-pass-4` branch** (PR #2 stays open). Rationale: PR #2 hasn't been merged yet, so commits to its branch land cleanly without the orphan-commits issue from the prior session. If user wants to merge polish-pass-4 mid-round, we'll honor that.

## Out of scope (deferred to follow-up rounds)

- Custom Perlin-noise shaders for hero interactive effects
- SSAO postprocessing for indirect lighting
- Audio (ambient pharmacy room tone, door bell on entry, ice clinking)
- Day/night cycle
- Mobile-specific tuning
- Light map approximation for the procedural interior
