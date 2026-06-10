# Code Review — polish-pass-6 vs main

Scope: src/* + index.html across 6 commits (recap story pager, lazy audio, SSAO normal pass, touch free-look, WebGL error boundary, responsive classes). `tsc --noEmit` clean. Verification suite (16 checks, desktop+mobile) reported passing by author.

## Verified non-issues (interplay checks done)

- Capture-phase `stopPropagation` on `window` DOES suppress NavigationProvider's bubble-phase window listener: window is visited separately in the capture and bubble legs and the stop-propagation flag is checked per visit. keydown targets the focused element/body, never window itself, so `stopImmediatePropagation` isn't needed.
- recap-panel.tsx:62 `setPage(Number(e.key))` maps 1-4 → PAGES[1..4] (role..takeaways) correctly; PAGES has 5 entries.
- Key effect deps `[phase, open, reset]` complete; arrow paging uses functional `setPage` — no stale closures. Cleanup passes matching `true` capture flag (line 65-66).
- music-toggle lazy init: unmount cleanup reads via ref; `play().catch` covers pause-before-buffered AbortError; behavior gated on `started && on` unchanged.
- Error boundary placement works with R3F v9: Canvas re-throws inner render errors into the DOM tree, and `WebGLRenderer` construction failures (layout effect) are caught by boundaries. Async `useFrame` errors aren't — acceptable.
- `enableNormalPass` is the correct SSAO fix for @react-three/postprocessing v3; low-end composer correctly omits it.
- section-registry typing sound (`CHAPTERS` is `Exclude<ViewId,'machine'>[]`); Tailwind responsive resets (`md:top-auto md:right-auto` etc.) correct; `hidden md:inline` number badge carries its `mr-1.5` only when shown.

## High

### H1 — Fallback page: hidden StartGate still arms on scroll/Space/Tab → music plays over the dead page
src/app.tsx:46-60, src/ui/webgl-fallback.tsx:28
When the boundary trips, all chrome siblings stay mounted beneath the z-[60] overlay. StartGate (z-50) keeps its global Enter/Space/wheel/touchmove listeners (start-gate.tsx:42-64). The fallback page is `overflow-y-auto`, so merely scrolling it fires wheel → `start()` → MusicToggle (default ON via localStorage) begins playing audio with no visible control to stop it (toggle is z-40, under the overlay). Tab also reaches invisible nav pills/toggles.
Also: SceneLoader is z-[100] — above the fallback. Cold WebGL failure: ~1.2 s black loader, fine. Mid-load GLB/texture failure: opaque loader masks the fallback until the 12 s failsafe.
**Fix (one move, solves all):** in app.tsx, move `<ChapterOverlay/> <RecapPanel/> <StartGate/> <ReducedMotionToggle/> <MusicToggle/> <CreditHud/> <SceneLoader/>` inside `<WebglFallbackBoundary>` — contexts live above the boundary so nothing else changes; failure unmounts the broken experience's chrome entirely (which is what the comment in webgl-fallback.tsx already promises). Trade-off: a render error in DOM chrome would also show the WebGL copy — rare and still better than a crash.

### H2 — camera-rig free-look: multi-touch corrupts the drag
src/scene/camera-rig.tsx:81-106
No `pointerId`/`isPrimary` filtering. A second finger's pointerdown rewrites `lastPt`; interleaved pointermove events from both fingers then compute deltas *across fingers* — the look target slams to the ±1 clamp on every pinch attempt (instinctive on mobile). This is new with the clientX/Y delta scheme (movementX/Y was per-event). Any pointerup (either finger) also ends the drag.
**Fix:** `if (!e.isPrimary) return;` at the top of `onDown`, `onMove`, and `onUp` (3 lines).

## Medium

### M1 — Recap scroll region unreachable for keyboard users
src/ui/recap/recap-panel.tsx:98 (with 48-57)
The page body is `max-h-[58vh] overflow-y-auto` but has no `tabIndex`, and ArrowUp/Down are swallowed at window capture with `preventDefault`. When content overflows (short/landscape viewports), keyboard-only users cannot scroll it at all.
**Fix:** add `tabIndex={0}` to the scroll div; in the key handler, when the event target is inside the scroll container and the key is ArrowUp/ArrowDown, call `e.stopPropagation()` only (no `preventDefault`, no paging) so native scroll works while NavigationProvider still can't steal the key.

## Low

- recap-panel.tsx:130-137 — `role="tablist"`/`role="tab"` without `aria-controls`/`role="tabpanel"` or roving tabindex is half-implemented ARIA. Simpler: plain buttons + `aria-current`. Or add `id` on the page div + `aria-controls`.
- webgl-fallback.tsx:65,70 — `target="_blank" rel="noreferrer"` on the `mailto:` link opens a blank tab in some browsers; drop target/rel for mailto (same pre-existing pattern in learnings-section.tsx).
- Observation: globals.css sets `canvas { touch-action: pan-y }` — browsers may claim vertical touch pans and fire `pointercancel`, truncating vertical free-look on mobile. The new pointercancel handler degrades gracefully; if vertical drag was confirmed working on devices, ignore. Otherwise `touch-action: none` on the canvas is the fix.

## Recommended actions
1. H1: wrap the chrome siblings inside the boundary (app.tsx).
2. H2: `isPrimary` guard in camera-rig pointer handlers.
3. M1: focusable scroll region + stopPropagation-only for Up/Down inside it.
4. Lows at discretion before PR.

## Unresolved questions
- Was vertical touch free-look explicitly verified on a real device (touch-action: pan-y concern)?
- Was the fallback path tested with keyboard/scroll interaction (H1), or only visually?
