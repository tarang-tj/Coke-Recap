# Collapse Tab Polish — dev-j-260611-1134

Branch: `level-up-13` (perf-pass-12 worktree). No commit made; changes in working tree.

## Files Modified

- `src/ui/chapter-overlay.tsx` — all tab improvements
- `src/styles/globals.css` — `tab-pulse-once` keyframe + reduced-motion suppression

## Changes

### 1. Touch target ≥44×44 px
- Increased padding: `px-3 py-3` (was `px-1.5 py-3`)
- Added `min-w-[2.75rem] min-h-[2.75rem]` (44px = 2.75rem)
- Visual slimness preserved via inner content sizing; extra padding is pure hit area

### 2. One-time attention pulse
- Module-level `shouldPulse()` reads/sets `sessionStorage` key `coke-recap-tab-pulsed`
- Also gates on `matchMedia('(prefers-reduced-motion: reduce)')` — skips and flags if motion disabled
- CSS `@keyframes tab-pulse` in globals.css: 2s, 2–3 gentle box-shadow/border glows, ease-in-out
- `@media (prefers-reduced-motion: reduce)` block suppresses the class entirely in CSS too (belt + suspenders)
- Fires 700ms after first chapter entry via `setTimeout` + `useRef` guard (`pulseScheduled`)
- Class removed after `animationend` — no frozen mid-state

### 3. Mobile safe-area + no text collision
- `left` style when collapsed: `max(0px, env(safe-area-inset-left))` — honours notched landscape
- When expanded: `left-1` class (unchanged), `left` style property is `undefined`
- Text column `w-[min(92vw,34rem)] px-8` unchanged — tab sits outside this column as verified in screenshots

### 4. Micro-copy update
- Collapsed label: `"story"` (unchanged — signals panel contents)
- Expanded label: `"hide"` → `"scene"` (clearer intent: clicking reveals the 3-D scene)

## Verification

| Check | Result |
|---|---|
| `npm run build` | PASS — 659 modules, 0 errors |
| Desktop screenshot | Tab visible, no overlap, proper size |
| Mobile portrait 390×844 | Tab visible at left edge, no text collision |
| Mobile landscape 844×390 | Tab visible, text column capped at 34rem, no collision |
| Pulse mid-state frozen | Not visible in any shot (700ms delay + animationend cleanup) |
| Dev server killed | Yes |

Screenshots saved to `plans/reports/lvl13-j-role-{desktop,mobile-portrait,mobile-landscape}.png`.
