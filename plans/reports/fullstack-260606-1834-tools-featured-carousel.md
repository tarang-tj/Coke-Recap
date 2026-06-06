# Tools Motif Rebuild — Featured Carousel Report

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Plan:** plans/260606-1834-motif-rebuild/

---

## Status: DONE

---

## Files Changed

| File | Change | Lines |
|---|---|---|
| `src/scene/brand/coke-bottle.tsx` | Extended with `interior` prop + 3 sub-components | ~290 |
| `src/scene/acts/act-tools.tsx` | Complete rewrite — carousel layout | ~340 |

---

## Build Result

```
npx vite build  →  ✓ built in 2.38s   (zero errors, zero new warnings)
npx tsc --noEmit  →  (no output = zero type errors)
```

---

## What Shipped

**CokeBottle extension (`interior` prop):**
- `LiquidMesh` — `cylinderGeometry` (top r=0.30, bottom r=0.34, height=1 scaled in useFrame), color `#5A0006`, emissive `#3A0004` at 0.25. `scale.y` driven by `fill + 0.04*sin(elapsed*0.6)` each frame (swish). No transmission.
- `Bubbles` — 10 small spheres (`sphereGeometry r=0.018`, `meshBasicMaterial`). Each rises at independent speed (0.045–0.09 u/s), recycled at liquid surface y. Opacity fades near surface. Phase offsets via seeded RNG. Freeze at phase=0 under reduced motion.
- `CondensationMounted` — `InstancedMesh` of 18 droplets (`sphereGeometry r=0.012`). Placed at deterministic (seeded) y/angle on body surface + 0.005. Gentle emissive twinkle `0.04 + 0.03*sin(t*1.3)`. Matrices initialized on first useFrame (avoids useMemo ref timing issue). Freeze under reduced motion.
- All three gated behind `interior` prop — zero cost when absent. Existing `customLabel` / `showLogo` / `highlight` behaviour unchanged.

**ActTools rewrite:**
- **Featured slot** at `[1.6, 0, 0.2]`, scale 1.4, full `interior` (fill=0.7, bubbles, condensation), `highlight=0.9`, `customLabel=tool.name`.
- **Queue arc** — 5 positions built from ±75° arc at radius 2.4, offset 1.4 + 0.6 behind featured in Z. Each queued bottle scale 0.55, `highlight=0.15`, no interior.
- **Cycle pattern** — `featuredIdx` (React state) advances every 3.5s by calling `advanceFeatured(0)` (always pulls slot 0 of the current queue, rotating all 6 tools round-robin). Timer lives in a ref; no React state in useFrame.
- **Swap animation** — `swapProgressRef` (0→1 over 350ms) drives FeaturedBottle's position lerp from arc slot world pos → featured pos, scale lerp QUEUE_SCALE→FEATURED_SCALE, and opacity fade-in during transit. `FeaturedBottle` is keyed by `featured-${featuredIdx}` so React remounts it on each swap, starting from the correct arc position.
- **Hover** — hovering a queue slot calls `advanceFeatured(slot)` immediately + sets `hoverPauseRef=5s`. Auto-cycle resumes after 5s. Cursor→pointer on queue hover.
- **Reduced motion** — `reduced=true` freezes auto-cycle, freezes bubble rise (phase=0 positions), freezes condensation twinkle, freezes liquid swish.
- **Envelope** — `group.position.z = lerp(1.5, 0, envelope)`, `group.visible = envelope > 0.002`. Child groups scale themselves by `envelopeRef.current` (parent group scale NOT set, to avoid double-scaling).
- **Lights** — 3 existing point lights kept; added `<spotLight>` at `[1.6, 4.5, 0.8]` angled at featured slot for product-shot feel.

---

## Label Strategy

Both featured and queued bottles use `customLabel={tool.name}` (e.g. "NIQ", "PowerBI") and `showLogo={false}`. The featured bottle is distinguished by size (1.4 vs 0.55), full interior animation, and `highlight=0.9` emissive glow — not by showing the wordmark. This was a deliberate choice: the wordmark on a label band at 1.4 scale reads more like a "product bottle" than a "tools chip", which is the right register for the featured slot.

---

## Concerns

1. **Opacity traversal during swap** — `FeaturedBottle.useFrame` traverses all child meshes to set opacity during the 350ms swap window. At most ~25 meshes (liquid + bubbles + condensation + glass parts) — acceptable, but it does call `group.traverse` every frame for 350ms per swap. Not a hot-loop concern at this mesh count.
2. **Layout overlap with chapter copy** — The featured bottle is at x=1.6 with the parent group at x=0. The chapter copy column sits at x<0 in screen-space. At the default camera FOV and distance the featured bottle should clear, but at narrow viewports (< ~500px wide) there could be overlap. No responsive breakpoint logic has been added — same as the prior ring layout.
3. **`target-position` on `<spotLight>`** — R3F exposes spotlight target via `target-position` prop. This sets the target object's world position correctly at init but does not animate. Acceptable here since the featured slot is stationary.
4. **Bubble confinement radius** — Bubbles are placed within ±0.23 of center (x/z). At scale 1.4 the belly radius is ~0.50 world units, so bubbles are comfortably inside. At queue scale 0.55 interior is not rendered, so no risk there.

---

## Mesh Count (featured bottle interior)

| Part | Meshes |
|---|---|
| Liquid cylinder | 1 |
| Bubbles | 10 |
| Condensation (InstancedMesh = 1 draw call) | 1 draw call / 18 instances |
| Total new meshes | 12 meshes + 18 instances |

Well within the 30-mesh budget.
