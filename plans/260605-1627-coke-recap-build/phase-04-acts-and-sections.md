# Phase 4 — Acts and Sections (Parallel)

**Mode:** parallel (5 subagents)
**Status:** pending
**Depends on:** Phase 3

## Goal
Implement all five acts and all five UI section overlays in parallel. Each subagent owns a disjoint file set.

## Universal rules for all subagents
- Read `docs/specs/2026-06-05-coke-recap-design.md` for concept context.
- Read `src/hooks/use-act-window.ts` and `src/data/act-windows.ts` for the scroll contract.
- **Never move the camera.** Camera is owned by `camera-rig.tsx` only.
- Use `useActWindow('<your-act>').active` to early-return from `useFrame` work when inactive.
- Use `localT` for in-act timing (0..1 within the act's scroll window).
- Style with Tailwind. Brand colors via CSS vars from `tokens.css`.
- Edit ONLY the files in your ownership list. No exceptions.

## Subagent A — Cold Open
**Files:**
- `src/scene/acts/act-cold-open.tsx`
- `src/ui/sections/cold-open-section.tsx`

**Scene:** Large Coke-red liquid droplet centered. Bubbles rising inside. Fade out by `localT = 0.85`.
**UI:** Hero name + role + "scroll" hint. Section is `100vh`, top-aligned.

## Subagent B — Role
**Files:**
- `src/scene/acts/act-role.tsx`
- `src/ui/sections/role-section.tsx`

**Scene:** Refracting glass sphere centered. Glowing data streams (TubeGeometry + emissive material) wrap around it. Streams pulse with `localT`.
**UI:** Two-column: left = "Role" label + 2–3 sentence blurb; right = small list of focus areas.

## Subagent C — Tools
**Files:**
- `src/scene/acts/act-tools.tsx`
- `src/ui/sections/tools-section.tsx`
- `src/shaders/glass-cube.frag.glsl`

**Scene:** 6 frosted-glass cubes arranged along a gentle S-curve. Camera slaloms past as `localT` advances. Each cube has an etched label (use drei `<Text>` or canvas texture). Cubes refract the liquid.
**UI:** Sticky right-rail card that swaps content based on which cube is closest to the camera. Stub all tool descriptions from `portfolio-content.ts`.

## Subagent D — Agent
**Files:**
- `src/scene/acts/act-agent.tsx`
- `src/ui/sections/agent-section.tsx`
- `src/shaders/nebula.frag.glsl`

**Scene:** Luminous nebula core at scene center (custom shader, ray-marched or screen-space noise glow). Three labeled orbital rings: Ingest / Analyze / Surface. Rings sync to `localT`.
**UI:** Centered manifesto-style copy. The "what the agent is" paragraph from `portfolio-content.ts`.

## Subagent E — Bottle
**Files:**
- `src/scene/acts/act-bottle.tsx`
- `src/ui/sections/learnings-section.tsx`

**Scene:** Camera pulls way back over `localT`. Reveals a slowly rotating glass Coke bottle (procedural lathe geometry — no proprietary logo). Liquid swirls inside.
**UI:** 3 learning bullets + contact links (GitHub, LinkedIn, email).

## Coordination
- Each subagent commits to its own branch or to main with a focused commit.
- Lead (main thread) runs `npm run build` after each agent reports DONE.
- No agent edits `app.tsx` to register itself — lead does that once all 5 are done.

## Acceptance
- All 5 acts mount inside `<SceneRoot>`.
- All 5 sections render in correct scroll order.
- Cross-act transitions are smooth (no pops; fades overlap by ~5% scroll on each side).
- Build passes; no TS errors.
