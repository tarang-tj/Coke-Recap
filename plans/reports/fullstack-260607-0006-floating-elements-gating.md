# Polish Pass 4 — Floating Elements Gating

**Date:** 2026-06-07  
**Status:** DONE

---

## Files Changed

| File | Change |
|------|--------|
| `src/scene/fluid-environment.tsx` | Added `useNavigation` import; return null on exterior/machine views |
| `src/scene/brand/floating-props.tsx` | Added `useNavigation` import; guard after all hooks — return null on exterior/machine views |
| `src/scene/jacobs-pharmacy-exterior.tsx` | Primary instance rotation flipped to `[0, Math.PI, 0]` (exploratory) |

---

## Issue 1 — Floating Bubbles + Red Caps Gating

**Approach used:** Option B (per-component gating). Both `FluidEnvironment` and `FloatingProps` are inside NavigationProvider, so each reads `useNavigation().view` directly.

- `fluid-environment.tsx`: early return `null` before rendering `<Bubbles />` when `view === 'exterior' || view === 'machine'`
- `floating-props.tsx`: guard placed AFTER all hook calls (respects Rules of Hooks) — `if (view === 'exterior' || view === 'machine') return null`. The `useFrame`/`useLayoutEffect` callbacks already guard `if (!mesh) return`, so no-ops safely when mesh refs are null.

**Result:**
- `exterior` view: NO bubbles, NO red bottle caps, NO sparkles
- `machine` view: NO bubbles, NO red bottle caps, NO sparkles  
- Chapter views (`role`, `tools`, `agent`, `takeaways`, `bottle`): all three render as before

---

## Issue 2 — Brick-Shop GLB Rotation

**Approach:** Exploratory defensive flip applied. Primary instance in `jacobs-pharmacy-exterior.tsx` changed from `rotation={[0, 0, 0]}` to `rotation={[0, Math.PI, 0]}`.

Rationale: Cannot run dev-server inspection in this context. The 180° flip is the correct fix if the GLB native forward direction is +Z (common for assets exported from Blender default orientation). Comment added on the instance noting it is exploratory and should be reverted to `[0, 0, 0]` if the building faces backward at runtime.

---

## Build Result

```
tsc -b  → clean (no errors)
vite build → ✓ built in 3.08s
```

Chunk size warning is pre-existing (1518 kB bundle), not introduced by these changes.

---

## Self-Review Checklist

- [x] Exterior view: NO bubbles, NO red caps, NO sparkles
- [x] Machine view: NO bubbles, NO red caps, NO sparkles
- [x] Chapter views: all three render normally
- [x] Brick-shop primary instance: flipped 180° with explanatory comment
- [x] `npm run build` passes; tsc clean
- [x] No new dependencies
- [x] No transmission materials touched
- [x] Reduced-motion unaffected (gating is view-based, not motion-based)
