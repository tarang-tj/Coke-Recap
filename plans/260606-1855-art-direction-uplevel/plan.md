# Art Direction Uplevel — Coke-Recap

**Branch:** `redesign/polish-pass-3` (continuing — same PR)
**Triggered by:** User: *"still horrendous, the bottle is not good, nothings good, ultrathink level up all of this project /subagent-driven-development"*
**Methodology:** superpowers:subagent-driven-development (implementer → spec review → quality review per phase)
**Start:** 2026-06-06 18:55 ET

## Diagnosis (why the prior passes kept failing)

Each prior round adjusted geometry on top of a broken foundation. The chrome looks like flat gray plastic because there's no environment map for it to reflect. The bottles float in a flat-red void because the skydome is a solid color with no depth. Lighting is multiple competing colored point lights with no anchor light. There are no shadow planes, so every object floats. The motifs are literal-symbolic (lens=insight, globe=global) and read as Office stock illustration in 3D.

The project doesn't need better silhouettes. It needs **art direction**.

## Four phases

| # | Title | Owns | Type |
|---|---|---|---|
| F | Scene atmosphere foundation | `scene/scene-root.tsx`, `scene/scene-backdrop.tsx`, `scene/scene-lighting.tsx`, `scene/postprocessing-stack.tsx` | foundational |
| R | Role motif redirection — ad poster in shadow-box | `scene/acts/act-role.tsx` | motif redirect |
| T | Tools motif redirection — wooden crate with bottles | `scene/acts/act-tools.tsx` | motif redirect |
| A | Agent motif redirection — chrome soda-fountain dispenser | `scene/acts/act-agent.tsx` | motif redirect |

**File-disjointness verified.** All four phases can dispatch in parallel safely. SDD's "no parallel implementers" rule exists to prevent file conflicts; with disjoint ownership the rule's reason doesn't apply, so parallel dispatch is appropriate while preserving the two-stage review gate after.

## Foundation phase (F) — detail

1. **HDR environment** via drei `<Environment preset="warehouse" />` (or `"studio"`) mounted in the scene. Chrome metals and glass will pick this up automatically through their PBR materials — no per-material rework needed.
2. **Contact shadows** via drei `<ContactShadows />` under each act centerpiece. Soft, fade-with-distance. Single ground plane at y ≈ -1.5 per act group (or one global shadow with per-act vertical offsets).
3. **Atmospheric backdrop** — replace `scene-backdrop.tsx`'s flat radial gradient skydome with:
   - Vertical gradient (deeper burgundy at top, brighter Coca-Cola red at horizon)
   - Radial vignette darkening the corners
   - **Drifting cream dust particles** (~80 instanced billboards, slow downward drift, slight horizontal drift, opacity 0.15–0.3) for volumetric depth cue
4. **Lighting overhaul** in `scene-lighting.tsx`: kill the multi-color point-light salad. Replace with a consistent 3-light setup:
   - **Hero key**: warm cream `<directionalLight>` from upper-left, intensity 1.4
   - **Soft fill**: opposite-side ambient cream fill, low intensity (~0.35) — or `<hemisphereLight skyColor="#FF8A8A" groundColor="#3A0006" />`
   - **Brand accent rim**: a `<spotLight>` or `<pointLight>` from behind/below in Coca-Cola red, distance-limited, to backlight hero objects with brand glow
5. **Postprocessing tune** in `postprocessing-stack.tsx`:
   - Bloom: drop intensity, raise threshold so only the brightest moments bloom (no constant glow)
   - Vignette: noticeably stronger (eyeAdaptation effect)
   - Add a **mild film grain** via Noise effect (premultiply: false, opacity 0.08)
   - Keep multisample anti-aliasing

## Motif phases (R, T, A) — detail per phase doc

See `phase-R-role-ad-poster.md`, `phase-T-tools-crate.md`, `phase-A-agent-fountain.md`.

## SDD review gates

Per phase:
1. **Implementer** ships, runs `npm run build`, self-reviews, reports.
2. **Spec reviewer** confirms code matches phase doc. Iterates until ✅.
3. **Code quality reviewer** approves. Iterates until ✅.
4. Orchestrator commits the phase.

After all four:
5. **Final code reviewer** against the entire branch diff.
6. Push + PR comment.

## Done criteria

- All four phases shipped, both reviews approved per phase.
- `npm run build` clean.
- User confirms the project finally feels premium on the dev server.

## Out of scope (this round)

- Camera-rig cinematic moves (deferred — see next round)
- Start-gate redesign (deferred)
- Audio (deferred)
- Vercel deploy

## Background

- Brand context lives at `~/Documents/Obsidian Vault/Brain/Projects/Coke-Recap/Coke-Recap.md`
- Existing perf rules: **NO transmission materials** (the #1 perf killer in this project). Foundation must respect this; the HDR env will give "transmission look" via reflection alone.
