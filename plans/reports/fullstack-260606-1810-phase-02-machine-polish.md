# Phase 02 — Classic Machine Polish: Implementation Report

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Status:** DONE

---

## Files Changed

| File | Lines (before → after) | Notes |
|---|---|---|
| `src/scene/brand/vending-machine.tsx` | 458 → ~410 | Full polish pass; header/logo/ICE COLD/trim bands untouched |

---

## Build Result

```
npx vite build  →  ✓ built in 2.31s (648 modules)
```

No TypeScript errors. No new warnings introduced. The pre-existing chunk-size warning (`index.js > 500 kB`) is unrelated to this phase.

---

## Tasks — What Was Done

1. **Rounded chrome top hood** — Added a `RoundedBox` (args `[2.85, 0.38, 1.18]`, radius `0.12`) at y=3.06 in chrome material, plus a forward-angled front visor piece at y=2.88 z=0.62 and a top cap strip. Sits cleanly above the y=2.78 trim band without touching it.

2. **Embossed "Drink Coca-Cola" slogan** — Recessed plate (`boxGeometry [1.6, 0.22, 0.005]`) at y=-2.30 z=0.57 in slightly-darker cream, with `<Text>` at z=0.585 (+0.015 proud), chrome color, low-contrast outline. Sits below the dispense chute as specified.

3. **Bottle-shaped buttons (option 3a)** — Replaced the cylinder pill with a `<CokeBottle scale={0.12} showLogo={false} />` rotated `[Math.PI/2, 0, 0]` (top-down view = bottle cap silhouette). Chrome bezel kept. Glow disc behind bottle replaces old lit pill. All interactions preserved: hover lit state, press scale `0.88`, number `<Text>` index floating in front.

4. **Coin slot enriched** — Added layered chrome rim (outer `[0.32, 0.08]` → inner cutout → slit) around the slot opening. Added a rounded `$0.10` chrome badge (`RoundedBox [0.22, 0.10]`) with dark `<Text>` label below "INSERT COIN". Vintage realism achieved.

5. **Footed base** — Extended base plate to `[2.7, 0.18, 1.05]` (was `[2.6, 0.12, 1.0]`). Added full-width chrome front kickplate `[2.7, 0.14, 0.025]`. Added chrome corner kickplates at ±1.3 x. Rubber feet moved from ±1.0 to ±1.15 so they're visible from front.

6. **Side embossing** — Added subtle `<Text>` "Coca-Cola" on both side panels (`fillOpacity={0.35}`, muted chrome-tan color, low-contrast outline). Rotated ±90° to face outward from each side. Non-competing — very low visibility from front camera.

---

## Header / Logo Preservation Verified

Lines confirmed untouched:
- `RoundedBox` at position `[0, 2.35, 0.58]` (header sign + `headerGlowRef`)
- `<mesh position={[0, 2.42, 0.63]}>` (logo plane with `logoTex`)
- `<Text position={[0, 2.05, 0.63]}` (ICE COLD)
- Chrome trim bands at y=1.88 and y=2.78

---

## Concerns

None. All 6 tasks complete. No transmission materials used. No TODOs left.

---

## Next Steps

Phase orchestrator can proceed to review + commit. Phase 03 (inner-act motifs) is unblocked and can run in parallel.
