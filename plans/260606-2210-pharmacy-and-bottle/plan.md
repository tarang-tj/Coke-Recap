# Pharmacy environment + bottle proportion fix

**Branch:** polish-pass-4 (new — opening a fresh PR per the orphan-commits lesson
from the prior session)
**Triggered by:** User: *"have you taken a look at the bottles youre making, it
feels elongated above the half of the bottle also the shape and everythign still
doesnt look good. the liquid for coke also shouldnt be gray it should blackish.
also the overall environment around the coca cola machine feels like it could be
better maybe lets do this machine in jacobs pharamcy like history"*
**Methodology:** superpowers:subagent-driven-development + /threejs reference
**Start:** 2026-06-06 22:10 ET

## Diagnosis

### Bottle proportions

Current profile has the belly peak at `y=0.44` of total height `1.55` → that's
**28% from base**, meaning **72% of the bottle silhouette is above the belly**.
The reference image (classic soda-bottle illustration the user provided last
round) has the belly peak at roughly **40% from base**, so ~60% above. The
upper section reads "elongated" because it actually IS, by 12 percentage points.

Fix: move the belly peak from y=0.44 → y≈0.62 (40% of total), shortening the
above-belly section.

### Liquid color

Currently `LIQUID_COLOR = #3D1E0F` — medium caramel brown. Real Coca-Cola in a
glass bottle reads as nearly black with a hint of dark amber where light passes
through. User's "blackish" is correct.

Fix: `#3D1E0F → #0A0503` family (very dark, almost black). Drop the emissive
intensity since the liquid is opaque-looking — no inner glow.

### Glass tint

Currently `GLASS_COLOR = #DCE0DC` (very light gray) at `opacity=0.18`. The
transparency washes the dark liquid into a gray-brown mush. Real Coke bottle
glass has a faint green-blue tint.

Fix: slight green tint `#D0DDD2`, opacity 0.18 → 0.22 (slightly more glass
presence).

### Environment around the machine

The vending machine currently floats in the atmospheric red void with dust motes
and contact shadows under it. No diegetic context. User: *"maybe lets do this
machine in jacobs pharmacy like history"* — Jacobs' Pharmacy in Atlanta, where
Coca-Cola was first served on May 8, 1886 (this matches the history footnote
already on the agent's plinth).

Fix: build a period-correct apothecary-interior diegetic context around the
machine. Floor, back wall with apothecary shelves, soda-fountain counter, brass
pendant lamp, framed period advertisement.

## Phases

| # | Title | Owns | Type |
|---|---|---|---|
| B | Bottle profile + dark liquid + glass tint | `scene/brand/coke-bottle.tsx`, `scene/brand/coke-bottle-geometry.ts` | rebuild |
| J | Jacobs' Pharmacy interior around machine | `scene/jacobs-pharmacy.tsx` (NEW), `scene/machine-hub.tsx` | additive |

File-disjoint. Parallel-safe.

## Phase B detail (bottle)

### Profile rewrite

Target landmarks (from reference image inspection):

| Landmark | Current | New | Why |
|---|---|---|---|
| Belly peak y | 0.44 | **0.62** | 40% from base — matches reference |
| Belly peak r | 0.24 | **0.27** | slightly bigger so H:D ≈ 2.87 (was 3.23) |
| Belly sustained | 0.40 → 0.50 | **0.55 → 0.72** | wider sustained belly |
| Waist pinch y | 0.62 | **0.80** | moved up with belly |
| Waist r | 0.21 | **0.215** | unchanged |
| Shoulder bulge y | 0.80 | **0.91** | moved up |
| Shoulder r | 0.22 | **0.225** | unchanged |
| Neck taper | 0.85 → 1.30 | **0.95 → 1.40** | compressed |
| Neck cylinder r | 0.13 | **0.13** | unchanged |
| Bottle top rim | 1.55 | **1.55** | total height preserved |

Use ~70 profile points, lathe 96 segments.

### Decoration position adjustments

- `LABEL_Y` and label band — no longer exists (removed in Round 5)
- `MENISCUS_Y` (liquid surface highlight disc): 1.06 → **0.96** (matches new liquid top)
- Upper-neck embossed wordmark position: was at y=0.95 (was a shoulder position) → **y=1.20** (mid-neck cylinder, between shoulder and collar)
- Crown cap y=1.50 — unchanged (top rim is still at 1.55)
- Neck ring torus position — adjust to new collar position
- Base punt ring — verify radius matches new foot ring radius

### Materials

```diff
- GLASS_COLOR = '#DCE0DC'        // very light gray
+ GLASS_COLOR = '#D0DDD2'        // faint green-blue (real Coke glass tint)
+ opacity 0.18 → 0.22

- LIQUID_COLOR = '#3D1E0F'       // medium caramel brown
+ LIQUID_COLOR = '#0A0503'       // very dark, near-black (real Coke reads black)

- LIQUID_EMISSIVE = '#3D1E0F'
- LIQUID_EMISSIVE_BASE = 0.18
- LIQUID_EMISSIVE_HIGHLIGHT = 0.45
+ LIQUID_EMISSIVE = '#1A0D05'    // very subtle warm interior glow
+ LIQUID_EMISSIVE_BASE = 0.05
+ LIQUID_EMISSIVE_HIGHLIGHT = 0.18
```

Meniscus disc material: the meniscus is where the liquid surface catches light
— it can stay relatively brighter (cream-amber emissive) since it represents
the liquid-air interface highlight.

### Liquid geometry yEnd

In `buildLiquidGeometry()`: change `yEnd` from `1.05` to **`0.96`** (just below
the new neck taper). The bottle now has a more realistic air gap above the
liquid in the neck.

### Acceptance

- Bottle silhouette shows the belly peak at ~40% from base — less elongated above
- Liquid reads as near-black with a subtle warm interior hint at the meniscus
- Glass has a faint green-blue tint, slightly more presence
- `npm run build` passes
- All consumers (vending machine slots, tools-act crate, takeaways) still render

## Phase J detail (Jacobs' Pharmacy)

### Period reference

Jacobs' Pharmacy, Atlanta, 1886 — late Victorian American apothecary with a
soda fountain. Typical elements:
- Hexagonal mosaic tile floor OR wide dark wood planks
- Dark wood paneling (vertical, narrow planks) on lower-half walls
- Brass chair-rail molding
- Pressed-tin ceiling
- Apothecary shelves with glass jars in muted period colors (amber, cobalt,
  cream-opal, dark green)
- Marble soda-fountain counter with brass trim
- Chrome dispensary fixtures
- Brass gas-lamp pendant lights (transitioning to electric in 1886)
- Framed lithograph advertisements on walls

### New component: `src/scene/jacobs-pharmacy.tsx`

Exports `<JacobsPharmacy />`. Renders all the pharmacy environment as a single
group. No animation needed (it's a still environment). Mounted INSIDE the
machine-hub group so it fades with the machine envelope (only visible on
machine-hub view).

### Elements

1. **Wood plank floor** at y = -3.0, extending 10×8 units. Procedural CanvasTexture
   with 6 horizontal plank stripes in varying browns + thin dark grout lines.
   `meshStandardMaterial roughness=0.9 metalness=0`. The HDR env (foundation
   phase) gives subtle reflection.

2. **Back wall** at z = -5.0, width 12, height 7. Vertical wood paneling
   procedural CanvasTexture — 10 vertical narrow planks in dark walnut
   `#3D2A1A` with faint vertical seam lines. Top half of the wall texture
   transitions to a darker brown for the upper "painted" portion. Brass
   horizontal molding (chair rail) at y=+0.5 — a `boxGeometry` strip
   `args=[12, 0.06, 0.08]` color `#9C7A3C` roughness 0.4 metalness 0.7.

3. **Two apothecary shelves** at z = -4.8, widths 5 each, at y = +1.4 and
   y = +2.6. Dark wood shelves `boxGeometry args=[5, 0.05, 0.4]`. On each
   shelf, **6 instanced apothecary jars** distributed along the length:
   - Cylinders `args=[0.16, 0.18, 0.42, 16]` for the body
   - Small cylinder cap on top `args=[0.18, 0.18, 0.06, 16]`
   - Per-jar colors: cycle through amber `#B8804A`, cobalt `#1A2D5C`,
     opal cream `#E5D5B0`, dark green `#2E4F3A`
   - All low-poly, low-detail — they're background atmosphere, not hero
   - Use `InstancedMesh` for jar bodies and another for caps

4. **Marble soda-fountain counter** to the right of the machine at x = +3.5,
   z = -1.5. Width 2.2, height 1.4, depth 1.1. Top surface is a flat plane at
   the height with a procedural marble-veining texture (cream `#F1E9DA` base
   with `#8E7547` veining). Side panels are dark wood matching the back wall.
   On the counter top: one chrome-and-glass apothecary jar with cream straws
   sticking out (`cylinderGeometry` for jar body in chrome, small tall
   cylinders for straws in cream).

5. **Brass pendant lamp** above the machine at y = +4.5 with cord descending
   from y = +6 (off-screen ceiling). Lamp body is a half-sphere or shallow
   dome `sphereGeometry args=[0.35, 16, 8, 0, Math.PI*2, 0, Math.PI/2]` in
   brass `#9C7A3C` roughness 0.4 metalness 0.7. A bright inner emissive
   half-sphere underneath provides the visible warm bulb glow `color="#FFE4A0"
   emissive="#FFE4A0" emissiveIntensity=2.5`. Optional: a `<pointLight />`
   inside the lamp at intensity 0.8, distance 4.5 — diegetic justification
   for the existing hero key light.

6. **Framed period advertisement** on the back wall at center, at y = +3.5.
   Brass frame box `args=[1.6, 1.0, 0.06]` color `#9C7A3C`. Inside the frame,
   a procedural CanvasTexture plane showing:

   ```
   ────────────────────────
        DELICIOUS
       COCA-COLA           (script Pacifico-ish)
        REFRESHING
   ────────────────────────
     5¢ AT ALL FOUNTAINS
   ```

   Cream background `#F1E9DA`, red border + Coca-Cola red script `#F40009`,
   dark slogan text. The CanvasTexture is baked once in `useMemo`. Plane is
   recessed slightly into the frame for shadow.

### Mount in `machine-hub.tsx`

The pharmacy renders BEHIND/AROUND the machine. The machine sits at the origin
inside the `machine-hub` envelope group. Add the `<JacobsPharmacy />` as a
child of the machine-hub's main group BEFORE the `<VendingMachine />` JSX so
it's rendered behind. The pharmacy should respect the same `envelope.machine`
opacity so it fades in/out with the machine view.

The pharmacy should NOT render during chapter views (Role/Tools/Agent/Takeaways).
The machine-hub envelope semantics already handle this.

### Reduced motion

No animations in the pharmacy environment, so reduced motion is a no-op.

### Acceptance

- Wood plank floor visible under the machine
- Back wall with paneling, brass molding, two shelves of apothecary jars
- Marble soda-fountain counter to the right of the machine with chrome jar +
  straws
- Brass pendant lamp above the machine with warm bulb glow
- Framed *DELICIOUS COCA-COLA REFRESHING 5¢ AT ALL FOUNTAINS* advertisement on
  the back wall
- All elements fade in/out with the machine envelope (don't show in chapter views)
- `npm run build` passes; runtime console clean
- Performance: extra geometry stays under ~5k tris, no transmission materials,
  uses `InstancedMesh` for the apothecary jars

## SDD review gate

Per phase: implementer → spec review → quality review → commit.

For token efficiency: consolidated reviewer at the end covering both phases'
spec compliance and quality.

## Project hard rules

- NO transmission materials anywhere (perf rule).
- Each phase touches only owned files.
- Reduced motion respected wherever motion is added.
- Envelope-driven entrance pattern preserved.
- Use kebab-case for new TS files (`jacobs-pharmacy.tsx`).

## Workflow note (from prior session's lesson)

This round uses a fresh branch (`polish-pass-4`) and a new PR. Lesson learned:
don't continue to push rounds of work to a long-running PR branch — if the PR
gets merged in the middle of a round, subsequent commits become orphaned on
the deleted branch. One round = one PR.
