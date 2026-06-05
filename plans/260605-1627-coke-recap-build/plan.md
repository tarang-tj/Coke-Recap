# Coke-Recap — Build Plan

**Spec:** `docs/specs/2026-06-05-coke-recap-design.md`
**Started:** 2026-06-05
**Strategy:** Subagent-driven, parallelism after foundation lands.

## Phases

| # | Phase | Mode | Status |
|---|-------|------|--------|
| 1 | Scaffold (Vite + React + TS + Tailwind + R3F) | sequential | pending |
| 2 | Scroll architecture (hooks, act-windows, camera rig) | sequential | pending |
| 3 | Fluid environment + brand tokens | sequential | pending |
| 4 | Acts (5) + Section overlays (5) | **parallel** | pending |
| 5 | Polish (Loader, reduced-motion, mobile, perf pass) | sequential | pending |
| 6 | Deploy (Vercel config, README, push) | sequential | pending |

## Sequencing rationale

Phases 1–3 establish the contracts (scroll hook, act-window hook, camera rig API, fluid environment) that acts depend on. Once those are committed, Phase 4 splits into ten file-disjoint subagent tasks (one per act + one per section).

## File ownership map (Phase 4)

| Owner | Files |
|-------|-------|
| Agent A | `src/scene/acts/act-cold-open.tsx`, `src/ui/sections/cold-open-section.tsx` |
| Agent B | `src/scene/acts/act-role.tsx`, `src/ui/sections/role-section.tsx` |
| Agent C | `src/scene/acts/act-tools.tsx`, `src/ui/sections/tools-section.tsx`, `src/shaders/glass-cube.frag.glsl` |
| Agent D | `src/scene/acts/act-agent.tsx`, `src/ui/sections/agent-section.tsx`, `src/shaders/nebula.frag.glsl` |
| Agent E | `src/scene/acts/act-bottle.tsx`, `src/ui/sections/learnings-section.tsx` |

Each agent reads the same interface contracts (`use-act-window`, `ACT_WINDOWS`, brand tokens), edits only its own files, commits independently.

## Phase files

- [phase-01-scaffold.md](phase-01-scaffold.md)
- [phase-02-scroll-architecture.md](phase-02-scroll-architecture.md)
- [phase-03-fluid-environment.md](phase-03-fluid-environment.md)
- [phase-04-acts-and-sections.md](phase-04-acts-and-sections.md)
- [phase-05-polish.md](phase-05-polish.md)
- [phase-06-deploy.md](phase-06-deploy.md)
