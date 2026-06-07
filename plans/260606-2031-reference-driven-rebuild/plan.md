# Reference-driven rebuild

**Branch:** redesign/polish-pass-3 (same PR)
**Reference:** User-provided `/Users/tarangjammalamadaka/Downloads/classic-soda-bottle-illustration/3c78e603-2ea2-4066-b76f-d2d269f9c8ed.jpg` — classic soda-bottle illustration showing clear glass + visible brown caramel liquid + red crimped crown cap, NO label band.
**Triggered by:** User: *"the bottles are still wrong, also the light is too bright, also in takeaways the bottles too high up. i like little tid bits with how u did the ice cold coke was 10 cents... maybe do other things like that to highlight the history of coke"*
**Methodology:** superpowers:subagent-driven-development
**Start:** 2026-06-06 20:31 ET

## Diagnosis

Three rounds of bottle iteration have failed because I kept treating the bottle as a brand-RED or brand-GREEN object. **The reference shows it's neither — it's clear glass with brown liquid inside.** Plus the silhouette is still too chunky (current H:D ratio ~2.2:1 vs. reference ~3.5:1 — the bottle is actually too fat, not too slim).

Also surfaced: lighting/post is overcooked; the takeaways hero bottle floats too high in frame; the user has positive signal on small historical tidbits and wants more.

## Phases

| # | Title | Owns | Type |
|---|---|---|---|
| B | Reference-true bottle — clear glass, brown liquid, slimmer | `scene/brand/coke-bottle.tsx`, `scene/brand/coke-bottle-geometry.ts` | rewrite |
| L | Lighting + post tone-down | `scene/scene-lighting.tsx`, `scene/postprocessing-stack.tsx` | tone |
| T | Takeaways bottle position | `scene/acts/act-bottle.tsx` | reposition |
| H | Historical tidbits (brass plaques + DOM captions) | `ui/start-gate.tsx`, `ui/chapter-overlay.tsx`, `scene/acts/act-tools.tsx`, `scene/acts/act-agent.tsx`, `scene/acts/act-role.tsx` | additive |

**File-disjointness:** verified. Phase B and Phase H both modify the brand silhouette and act files respectively but don't overlap. Phase T touches only act-bottle.tsx (different from H's act files). Phase L touches only scene-level lighting/post.

Parallel dispatch safe.

## Per-phase detail

### Phase B detail

The bottle is rebuilt to match the reference image. **Material redirection: from green glass to clear glass with internal caramel liquid.**

1. **Slim the silhouette.** Bring max belly radius from 0.355 → ~0.24 so height-to-max-diameter goes from ~2.2:1 → ~3.2:1 (closer to the reference). Profile points kept around 70+. Lathe segments stay at 96.
2. **Glass material:** `meshPhysicalMaterial` color `#DCE0DC` (very slight gray tint), `opacity=0.18`, `clearcoat=1`, `clearcoatRoughness=0.04`, NO emissive (was green emissive). Catches HDR env reflections strongly — that's the "gloss" look from the reference.
3. **Drop the red label band entirely.** Remove the `cylinderGeometry` label band + the wordmark plane on it. The trademark wordmark instead lives only on the crown cap top.
4. **Add a prominent brown liquid mesh** inside the glass:
   - A lathe-revolved liquid shape that follows the bottle's inner profile from y=0.06 to y≈1.05 (~75% of belly + lower neck region). Use the bottle profile shrunk by 0.012 units (so it sits inside the glass with a small gap).
   - Material: `meshStandardMaterial color="#3D1E0F"` (deep caramel cola brown), `roughness=0.45`, `metalness=0`, `emissive="#3D1E0F"` `emissiveIntensity=0.18` for warm inner glow.
   - **Meniscus disc** at the top of the liquid: a thin cylinder at the liquid surface — bright cream highlight where light catches the surface tension.
5. **Crown cap (keep):** existing crimped red crown cap with embossed wordmark on top remains.
6. **Optional embossed wordmark on upper neck** (subtle glass-color text raised geometry, like real Coke bottles have at the shoulder). Use drei `<Text>` with `outlineWidth=0.004`, color slightly off-white, very subtle.
7. **Preserve `CokeBottleProps` API.** `showLogo` still controls the crown-cap stamp visibility. `customLabel` becomes the upper-neck embossed text override (replaces the optional "COCA-COLA" wordmark with the customLabel string). `interior` prop becomes redundant since liquid is always rendered now — keep prop for API compat but no-op it.

### Phase L detail

Tune the foundation lighting + post down to museum-warm, not stage-bright.

In `scene-lighting.tsx`:
- Directional key light intensity 1.4 → **0.85**
- Hemisphere light intensity 0.35 → **0.22**
- Coca-Cola red point light intensity 1.8 → **1.0**, distance 9 → **7**
- Ambient lift 0.12 → **0.08**

In `postprocessing-stack.tsx`:
- Bloom intensity 0.6 → **0.30**
- Bloom luminanceThreshold 0.85 → **0.93**
- Vignette darkness 0.85 → **0.90**
- Vignette eskil=false (unchanged)
- Noise opacity 0.08 → **0.06**

Goal: scene reads as a quiet museum, not a showroom. Bright spots only on actual highlights (crown cap glints, brass plate engravings).

### Phase T detail

In `src/scene/acts/act-bottle.tsx`:

The hero contour bottle currently sits too high in frame. Find the bottle's `<group>` y position and **lower it** so the bottle's vertical CENTER aligns with viewport center, not its base. Concrete suggestion: drop the bottle group y by ~0.7 units (verify by reading the file).

If the act adds a pedestal underneath, lower the whole act-group, or raise the pedestal so the bottle sits ON it not floating above.

### Phase H detail — historical tidbits

**Goal:** Sprinkle ~5 brief Coca-Cola history facts across the chapters to reward attention and show brand knowledge. Format consistently: tiny uppercase tracking-wide period type, brass-plate engraving in 3D, museum-caption in DOM.

**Per-chapter tidbits:**

1. **Title screen (DOM caption, under "Press Start" button area).**
   In `src/ui/start-gate.tsx`, add a tiny line below the existing "click · enter · scroll" hint:
   ```
   1886 · ATLANTA · INVENTED BY JOHN S. PEMBERTON
   ```
   Style: `font-body text-[0.42rem] uppercase tracking-[0.45em] text-off-white/25 select-none`, `mt-4`.

2. **Role (brass plate on the shadow-box frame).**
   In `src/scene/acts/act-role.tsx`, add a SECOND brass plate (the existing one says GLOBAL HUMAN INSIGHTS — leave it). Place this new plate on the OPPOSITE side of the frame (top-rim or upper-corner) reading:
   ```
   CONTOUR BOTTLE · PATENTED 1915 · ROOT GLASS CO.
   ```
   Match the existing brass plate's material + Text styling, smaller font size (0.028 vs 0.042).

3. **Tools (brass plate on the wooden crate).**
   In `src/scene/acts/act-tools.tsx`, add a small brass plate to the FRONT LONG WALL of the crate (below the "Drink Coca-Cola" stencil). Plate material: aged brass (`color="#8E7547"` `roughness=0.5` `metalness=0.6`). Drei `<Text>` engraved:
   ```
   FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS
   ```

4. **Agent (brass plate on the dispenser column).**
   In `src/scene/acts/act-agent.tsx`, add a small brass plate on the dispenser's PLINTH BASE (below the column). Text engraved:
   ```
   FIRST SERVED · JACOBS' PHARMACY · MAY 8, 1886
   ```

5. **Takeaways (DOM caption added to chapter-overlay).**
   In `src/ui/chapter-overlay.tsx`, when `view === 'takeaways'`, render a small caption below the chapter copy column:
   ```
   SOLD FOR 5¢ FROM 1886 – 1959 · 73 YEARS AT THE SAME PRICE
   ```
   Style: same tiny uppercase tracking-wide as the existing chapter selector pills, even quieter (`text-off-white/30`).

## SDD review gate

Per phase: implementer → spec reviewer → code-quality reviewer → commit.

For token efficiency given the volume, this round uses ONE consolidated reviewer covering both spec + quality across all four phases (proven pattern from prior rounds).

## Project hard rules

- NO transmission materials anywhere (perf rule).
- Each phase touches only owned files.
- Reduced-motion respected wherever motion is added.
- Envelope-driven entrance pattern preserved in all acts.

## Out of scope

- Camera-rig cinematic moves (still deferred)
- Audio (deferred)
- Vercel deploy (deferred)
