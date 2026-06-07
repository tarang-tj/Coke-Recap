# Phase L — Lighting + Post Tone-Down — Implementation Report

**Date:** 2026-06-06
**Branch:** redesign/polish-pass-3
**Status:** DONE

---

## Files Modified

| File | Lines changed |
|---|---|
| `src/scene/scene-lighting.tsx` | 4 value edits |
| `src/scene/postprocessing-stack.tsx` | 4 value edits (both branches) |

No other files touched.

---

## Changes Applied

### scene-lighting.tsx

| Light | Old | New |
|---|---|---|
| Directional key intensity | 1.4 | 0.85 |
| Hemisphere intensity (third arg) | 0.35 | 0.22 |
| Point rim intensity | 1.8 | 1.0 |
| Point rim distance | 9 | 7 |
| Ambient lift intensity | 0.12 | 0.08 |

Colors, positions, decay, shadow map sizes — all untouched.

### postprocessing-stack.tsx

| Effect | Param | Old | New | Branch |
|---|---|---|---|---|
| Bloom | intensity | 0.6 | 0.30 | high-perf only |
| Bloom | luminanceThreshold | 0.85 | 0.93 | high-perf only |
| Vignette | darkness | 0.85 | 0.90 | both branches |
| Noise | opacity | 0.08 | 0.06 | both branches |

`luminanceSmoothing`, `eskil`, `offset`, `premultiply`, `blendFunction`, `mipmapBlur`, `multisampling` — all untouched.

---

## Self-Review Checklist

- [x] All five intensity changes applied in scene-lighting
- [x] All four post tuning values applied in postprocessing-stack
- [x] Both perf branches (low/high) tuned identically for Vignette + Noise
- [x] No colors, positions, or light count changed
- [x] No structure changes in post stack
- [x] No other files modified

---

## Build Result

```
tsc -b   — clean (no errors)
vite build — ✓ 645 modules transformed, built in 2.85s
```

No type errors. No test regressions. Chunk size warning is pre-existing (unrelated to this phase).

---

## Concerns / Blockers

None.
