# Collapse Button — Chapter Overlay

## Files modified
- `src/ui/chapter-overlay.tsx` — only file touched

## What was done

Added collapse/expand toggle to the chapter content panel.

### State management
Module-level `_panelCollapsed = false` mirrored into React `useState`. Persists across chapter switches because it lives outside the `key={view}` subtree. The `key={view}` was moved down to the inner content `<div>` so the fade animation still fires on chapter switch but the collapsed state is not reset.

### Collapse behavior
CSS transition on `opacity` + `translateX(-2rem)` (0.3s ease) applied to three elements simultaneously via a shared `collapseStyle` object:
- the readability scrim div
- the home/logo button
- the content column wrapper

`pointerEvents: 'none'` is set inline when collapsed so hidden elements don't intercept clicks.

### Re-expand affordance
Slim vertical tab at left edge (`position: fixed, top: 50%, left: 0`). When collapsed: `left-0 rounded-r-md` (hugs left edge). When expanded: `left-1 rounded-md` (floats slightly in). Contains:
- chevron SVG that rotates 180° between states (own `transform` transition)
- vertical text "story" (collapsed) / "hide" (expanded) via `writingMode: vertical-rl`
- `border-off-white/25 bg-coke-black/60 backdrop-blur-sm` — matches chapter pill aesthetic

### A11y
- `aria-expanded={!collapsed}` + `aria-label` on toggle button
- `focus-visible:outline` focus ring (consistent with machine-view button pattern)
- `pointer-events-auto` on button (parent is `pointer-events-none`)
- `motion-reduce:transition-none` class on toggle button; collapse transition uses cheap CSS only (no keyframes)
- Tab stays anchored in DOM when collapsing; focus is not programmatically moved (content column transitions out, toggle button remains focused naturally)

### Not touched
- Bottom chapter nav pills — untouched
- Machine-view prompt — untouched
- Home logo is hidden with the panel (intentional per spec: scrim + content + logo all hide together)
- `src/styles/globals.css` — no changes needed; no new keyframes required

## Verification

Screenshots taken at `plans/reports/`:
- `lvl13-a-role-expanded.png` — expanded: full text column, scrim, logo visible ✓
- `lvl13-a-role-collapsed.png` — collapsed: clean 3D scene, slim "story" tab at left edge ✓

`npm run build` (tsc -b + vite build): PASS ✓

## Unresolved questions
None.
