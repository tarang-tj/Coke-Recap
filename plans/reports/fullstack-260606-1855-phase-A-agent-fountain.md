# Phase A Report — Agent Motif: Chrome Soda-Fountain Dispenser

**Date:** 2026-06-06
**Phase:** A — agent motif redirection
**Branch:** redesign/polish-pass-3
**Status:** DONE

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/scene/acts/act-agent.tsx` | Full rewrite | 436 lines |

No other files touched.

## Tasks Completed

- [x] Removed glowing icosahedron, 3 orbital rings, 8 data dots, all related constants and sub-components
- [x] Chrome 1950s soda-fountain dispenser: tall cylinder `[0.55, 0.6, 1.8, 32]` + tapered dome cap (half-sphere) + wide plinth base
- [x] Procedural CanvasTexture tile counter (cream + brand-red checkerboard, grout lines) baked in `useMemo`
- [x] Three `HandleAssembly` components at 0°, 120°, 240° — each with chrome spout shaft, black bakelite knob, brass nameplate + `<Text>` engrave
- [x] Pillar names sourced from `agent.pillars.map(p => p.name)` — no hardcoding
- [x] Brass nameplate emissive lerps to `#FFF6E0` when active, matte brass when inactive
- [x] Red dome beacon light on top with `emissiveIntensity` pulsing 2.0→2.6 via `Math.sin`
- [x] Active-handle cycle every 3s (1.5s on hover) via `useRef` timer + `useState` for React re-render
- [x] Drip effect: tiny red sphere falls from active spout ~700ms, fades near counter, 1.5s wait between drips; skipped under reduced motion
- [x] Reduced motion: no rotation, no bob, no drip, no pulse, no cycle (active stays at 0)
- [x] Hover: cursor pointer, dome brightens to emissiveIntensity 3.0, cycle accelerates to 1.5s
- [x] Cursor cleared on pointer-leave and when envelope drops below threshold
- [x] Envelope pattern preserved: `g.visible = envelope > 0.002`, `g.position.z = lerp(1.5, 0, envelope)`, `g.scale.setScalar(0.6 + 0.4 * envelope)`
- [x] Group root at `position={[0.7, 0, 0]}`
- [x] Local accent lighting: warm cream spotLight from [2,3,2] + red pointLight from [0,-0.5,0]
- [x] No transmission materials anywhere — all `meshStandardMaterial`
- [x] 8 chrome rivets top ring + 8 bottom ring for period detail

## Build Result

`npm run build` — PASS. `tsc -b` clean. No type errors. 645 modules transformed. Only pre-existing chunk-size warning (unrelated to this phase).

## One-Line Summary

Replaced abstract icosahedron+rings with a fully-spec'd chrome 1950s soda-fountain dispenser on a procedural tiled counter; build clean, no transmission materials, all acceptance criteria met.

## Concerns

- `HandleAssembly` allocates a `new THREE.Color()` inside `useFrame` each tick for emissive lerp. Minor GC pressure per handle (3 allocations/frame). Could be hoisted to a module-level temp color. Not correctness-blocking — can be micro-optimized by the code-quality reviewer if desired.
- Tile texture's `buildTileTexture` calls `document.createElement('canvas')` at module scope evaluation time via `useMemo` (fine for browser; would fail in SSR — not a concern for this Vite SPA).
- HDR environment (Phase F) is needed for chrome to show real reflections. Without it, chrome reads as light gray. That is expected — Phase F is the dependency.
