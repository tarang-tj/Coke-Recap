# Phase T — Takeaways Bottle Reposition

**Status:** DONE
**Date:** 2026-06-06

## Files Changed

| File | Lines changed |
|------|---------------|
| `src/scene/acts/act-bottle.tsx` | +4 lines (inside `useFrame` envelope block) |

## Change Detail

Added `group.position.y = -0.7;` inside the `useFrame` callback, after the existing `group.position.z` lerp and `group.scale.setScalar` calls. The assignment runs every frame only when `mix > 0.002` (i.e., inside the active-visibility guard), so it is fully within the envelope pattern.

**Exact y delta applied: −0.7 units.**

Rationale: The `CokeBottle` component is ~1.55 u tall with its base at y=0. Without any offset the bottle center sits at y≈+0.775, putting the whole silhouette above viewport center. Shifting the group to y=−0.7 brings the center to y≈+0.075 — effectively at viewport center.

## Pedestal / Podium

No separate pedestal mesh exists in `act-bottle.tsx`. The `<CokeBottle>` is the sole child of `<PresentationControls>`, which is the sole child of the group. Moving the group moves everything together; no additional offsets needed.

## Entrance Envelope

Envelope behaviour unchanged:
- `group.visible = mix > 0.002` (gate)
- `group.scale.setScalar(lerp(0.001, 2.2, mix))` (scale dive)
- `group.position.z = lerp(2, 0, mix)` (z pull-in)
- `group.position.y = -0.7` (constant offset, applied after the guard)

## Build Result

`npm run build` — **PASS** (tsc -b clean, vite build ✓ 645 modules, 2.60 s).
Chunk-size advisory is pre-existing, not introduced by this change.
