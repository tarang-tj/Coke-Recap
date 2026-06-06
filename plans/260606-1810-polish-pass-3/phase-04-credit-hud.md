# Phase 04 — Credit HUD

**Priority:** P2 (independent, can run in parallel with any phase)
**Status:** pending
**Files (owned):** `src/ui/credit-hud.tsx` (new), `src/app.tsx`

## Why this matters

User wants a `by TJ Jammalamadaka` credit visible on the **title screen** and **machine-hub view**, but **hidden inside chapters** (so it doesn't compete with chapter overlay copy).

## Spec

- New component `src/ui/credit-hud.tsx`. Pure DOM (not 3-D). Bottom-right corner. Tiny, understated. Coca-Cola red accent acceptable.
- **Exact text:** `by TJ Jammalamadaka` — plain, no year, no `©`, no separator. Lowercase `by`.
- Suggested styling: `font-body text-[0.55rem] uppercase tracking-[0.4em] text-off-white/45`. Sit at `fixed bottom-6 right-7 z-30`. Match the visual weight of the existing top-of-screen meta text.
- **Visibility rule:** show when `view === 'machine'` (from `useNavigation`) OR when the StartGate is still up (i.e. `experience.started === false`). Hide otherwise.
- Use `useExperience()` for the started flag and `useNavigation()` for the view. Both contexts already exist (`scene/experience-context.tsx`, `scene/navigation-context.tsx`).
- Fade transition (200ms opacity) when toggling visibility — don't unmount, just toggle opacity.

## Tasks

1. Create `src/ui/credit-hud.tsx` exporting `<CreditHud />`.
2. Mount it in `src/app.tsx` alongside the other UI overlays (`<ChapterOverlay />`, `<StartGate />`, `<ReducedMotionToggle />`). Place it after `<ReducedMotionToggle />` so its z-order is well-defined.
3. Verify it doesn't overlap the bottom-center chapter selector nav (currently `fixed inset-x-0 bottom-6 z-40`). The credit lives at `bottom-6 right-7`, the chapter selector is centered — they should clear each other. If they collide on narrow viewports, the credit should hide on chapter views anyway, but **double-check at 1280×720, 1920×1080, and 375×667 widths**.
4. Add `pointer-events-none` to the credit so it never blocks anything.

## Acceptance criteria

- Visible on Press-Start gate.
- Visible on machine-hub view (after start).
- **Not visible** on Role / Tools / Agent / Takeaways chapter views.
- Smooth 200ms fade when toggling.
- Never blocks pointer events.
- `npm run build` passes.

## Out of scope

- Don't add the credit to a 3-D scene (must be DOM)
- Don't put it in `chapter-overlay.tsx` — it's a separate component with separate visibility rules
- Don't modify `start-gate.tsx`

## How to verify

```bash
npm run dev
# Open http://localhost:5173
# Before Press Start → credit visible bottom-right.
# Click Press Start → credit still visible (machine-hub).
# Click a bottle → credit fades out.
# Press Esc → credit fades back in.
```
