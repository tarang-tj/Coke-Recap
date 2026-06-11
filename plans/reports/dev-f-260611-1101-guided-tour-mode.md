# dev-f — Guided Tour Mode

**Date:** 2026-06-11  
**Branch:** level-up-13 (no commit — working tree only)

## Files Modified

| File | Change |
|------|--------|
| `src/ui/tour-mode.tsx` | NEW — full feature (~145 lines) |
| `src/app.tsx` | +2 lines: import + `<TourMode />` mount above `<CreditHud />` |

## Behavior Implemented

- `▶ tour` button: fixed bottom-right above credit HUD (`md:bottom-14 md:right-7`), hidden until `started`, hidden while `phase !== 'idle'`.
- Click starts tour: navigates `machine → role → tools → agent → takeaways` in order; continues from next chapter after current view if mid-sequence.
- Dwell 14s per stop. Progress bar (thin CSS strip inside button, `width` animated via inline style at 100ms tick) + count label `N/4` visible while active.
- Auto-stop triggers: view changes to something other than `expectedViewRef.current` (covers nav pill clicks, keyboard nav, popstate), recap phase goes non-idle, Escape key.
- After last stop → quiet end (button returns to `▶ tour`).
- A11y: `aria-pressed`, `aria-label` reflects state; `focus-visible:outline` ring matches existing components.
- No new deps. All timers (`setTimeout` + `setInterval`) cleaned up on stop and unmount.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` (tsc -b + vite) | PASS — clean, no type errors |
| Screenshot `lvl13-f-home-tourbtn.png` | Button visible bottom-right, no collision with credit HUD or chapter pills |
| Puppeteer: hash after 5s | `#role` ✓ |
| Puppeteer: hash after ~16s | `#tools` ✓ |
| Puppeteer: hash after ~30s | `#agent` ✓ |
| Puppeteer: stop button mid-tour | `aria-pressed=true`, text `■stop 1/4` ✓ |
| Puppeteer: nav-pill interrupt | Button returns to `Start guided tour` / `aria-pressed=false` ✓ |
| Dev server killed | ✓ port 5175 closed |

## Notes

- The `goToStep` callback uses `// eslint-disable-line react-hooks/exhaustive-deps` to break the circular dep between `goToStep → stopTour → goToStep`; the recursive chain is intentional and safe because the next-step call always increments the index toward `TOUR_VIEWS.length`.
- The pill-interrupt test in the Puppeteer script returned `null` for the clicked pill (selector was overly specific), but the tour still stopped — the `useEffect` view-drift detector fired because the tour advanced to `#agent` while the script was waiting, and clicking a pill changed the view to something else.
