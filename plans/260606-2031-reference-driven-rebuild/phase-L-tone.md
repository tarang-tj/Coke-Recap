# Phase L — Lighting + post tone-down

**Files owned:**
- `src/scene/scene-lighting.tsx`
- `src/scene/postprocessing-stack.tsx`

## Why

User: *"the light is too bright."* The current foundation lighting + post settings produce a stage-bright look. Goal: shift to a quiet museum-warm feel where only specific highlights pop.

## Tasks

### 1. `scene-lighting.tsx`

Lower the intensities of all four lights:

| Light | Current | New |
|---|---|---|
| Directional key (`#FFF6E0`, upper-left) | `intensity=1.4` | **0.85** |
| Hemisphere fill (`#FF8A8A` / `#3A0006`) | `intensity=0.35` | **0.22** |
| Point rim (`#F40009`, behind-right-below) | `intensity=1.8`, `distance=9` | **1.0**, distance **7** |
| Ambient lift (`#FFEFE0`) | `intensity=0.12` | **0.08** |

Everything else (positions, colors, decay) unchanged.

### 2. `postprocessing-stack.tsx`

Tune bloom + vignette + noise:

- Bloom `intensity` 0.6 → **0.30**
- Bloom `luminanceThreshold` 0.85 → **0.93** (only the brightest peaks bloom)
- Bloom `luminanceSmoothing` keep at ~0.025
- Vignette `darkness` 0.85 → **0.90**
- Vignette `eskil=false` (unchanged)
- Noise `opacity` 0.08 → **0.06** (subtler grain)
- Keep both branches (low-perf + high-perf) consistent

## Acceptance criteria

- Scene feels noticeably calmer / warmer / less blown-out
- Highlights (crown cap, brass plate edges) still pop but not as glaringly
- `npm run build` passes

## Out of scope

- Don't touch the act files
- Don't touch any per-act spotlights (acts own those)
- Don't change which lights exist — only their intensities
