# Exhibit Focus Mode — Collapse-triggered Camera Push-in

**Date:** 2026-06-11  
**Branch:** level-up-13 (no commit; changes left in working tree)

## Files Modified

| File | Change |
|------|--------|
| `src/scene/experience-context.ts` | Added `panelCollapsedStore` external store + `usePanelCollapsed()` hook |
| `src/ui/chapter-overlay.tsx` | Replaced module-level `_panelCollapsed` + `useState` mirror with `usePanelCollapsed()` |
| `src/scene/camera-rig.tsx` | Added `_pushDir` scratch vector, `collapsedRef`, store subscription, 30% push-in offset |

## Implementation Summary

### experience-context.ts
- Added a `useSyncExternalStore`-based external store (`panelCollapsedStore`) with `subscribe`, `getSnapshot`, and `toggle` methods
- Single module-level boolean `_panelCollapsed`, notifies all listeners on toggle
- Exported `usePanelCollapsed(): [boolean, () => void]` hook — used by both UI and camera without requiring a provider change in `app.tsx`

### chapter-overlay.tsx
- Removed `let _panelCollapsed = false` module-level flag and `useState` mirror
- Replaced with single `const [collapsed, toggle] = usePanelCollapsed()`
- Behavior preserved: default expanded, persists across chapter switches (store is module-level)

### camera-rig.tsx
- Added `_pushDir` module-level `THREE.Vector3` (no per-frame allocation)
- Added `collapsedRef` + `useEffect` subscription to `panelCollapsedStore` (zero React re-renders in the render loop)
- In `useFrame`: when `isChapterView && collapsedRef.current`, compute direction from pose `pos` → `look`, apply 30% fraction to `_targetPos` x/z, clamp `y >= 1.2` to prevent street-sinking
- Offset applied BEFORE `damp3` → single spring, no competing easing
- Machine view, recap, pre-start: completely unaffected
- Mouse parallax and idle drift: applied after push-in, preserved
- Reduced motion: snaps directly to pushed-in `_targetPos`, no damp

## Verification

Build gate: `npm run build` (tsc -b + vite build) — PASS, zero type errors.

Headless Chrome screenshots at 1440×900, 3.8s settle time per transition:

| View | State | Result |
|------|-------|--------|
| role | expanded | Story panel left, exhibits partially visible right |
| role | collapsed | Full-frame exhibit close-up: Consumer Pulse + Market Insights fills viewport |
| role | re-expanded | Original framing restored |
| takeaways | collapsed | Growth ribbon arc panorama fills frame, no y-sink |

Screenshots saved: `plans/reports/focus-{role,takeaways}-{expanded,collapsed,reexpanded}.png`

Aria round-trip: `aria-expanded` correctly reads `false` → click → `true` on re-expand for both views.

## Constraints Met

- No per-frame allocations: `_pushDir` reused
- No new lights
- TypeScript strict-clean
- RECAP_POSE and arrival-breath/idle-drift unchanged
- Mouse parallax preserved in focus mode
- Reduced-motion snaps (no `damp3` with large smoothTime)
- Only owned files modified; `app.tsx` and `tour-mode.tsx` untouched
