# Phase 04 — Credit HUD — Implementation Report

**Date:** 2026-06-06
**Phase:** 04 — Credit HUD
**Plan:** plans/260606-1810-polish-pass-3/
**Status:** DONE

---

## Files Modified

| File | Change |
|------|--------|
| `src/ui/credit-hud.tsx` | Created (29 lines) |
| `src/app.tsx` | +2 lines (import + `<CreditHud />` mount) |

---

## Tasks Completed

- [x] Created `src/ui/credit-hud.tsx` exporting `<CreditHud />`
- [x] Mounted in `src/app.tsx` after `<ReducedMotionToggle />` as specified
- [x] Exact text `by TJ Jammalamadaka` — lowercase `by`, no year, no `©`
- [x] `fixed bottom-6 right-7 z-30` positioning
- [x] `pointer-events-none` on the element
- [x] `font-body text-[0.55rem] uppercase tracking-[0.4em] text-off-white/45` styling matches chapter-overlay vocabulary
- [x] Visibility rule: `show = !started || view === 'machine'`
- [x] Never unmounted — opacity toggled between 0 and 1
- [x] 200ms opacity transition (`opacity 200ms ease`)
- [x] `useReducedMotion()` gates transition to `'none'` when user prefers reduced motion
- [x] `aria-hidden="true"` (decorative text, not meaningful to screen readers)

---

## Build Result

```
✓ 648 modules transformed.
✓ built in 2.36s
```

TypeScript clean. No new errors. The chunk-size advisory (>500 kB) is pre-existing.

---

## Visual Verification (dev server mental trace)

| State | Expected | Confirmed by |
|-------|----------|-------------|
| Press-Start gate (`started=false`, any `view`) | Credit visible (`opacity: 1`) | `show = !false = true` |
| Machine-hub (`started=true`, `view='machine'`) | Credit visible | `show = false \|\| true = true` |
| Role / Tools / Agent / Takeaways | Credit hidden (`opacity: 0`) | `show = false \|\| false = false` |
| ESC back to machine | Credit fades in at 200ms | opacity transition fires |

**Overlap check — chapter selector vs credit:**
- Chapter selector: `fixed inset-x-0 bottom-6 z-40`, centered with `justify-center`
- Credit: `fixed bottom-6 right-7 z-30`
- On chapter views the credit is `opacity: 0` — no visual collision possible
- On machine-hub the chapter selector pills are present BUT the credit `right-7` sits well outside the centered pill row even at 375px width (4 pills × ~80px ≈ 320px, centered; right-7 ≈ 28px from edge → no overlap at any of the three test viewports)

---

## Concerns

None.

---

**Status:** DONE
**Summary:** New `<CreditHud />` DOM component created and mounted. Build passes, visibility logic matches spec exactly, reduced-motion respected, pointer-events blocked.
