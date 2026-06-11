# Exhibit Hotspots — Implementation Report

## Files Modified

| File | Change |
|------|--------|
| `src/scene/exhibit-hotspot.tsx` | NEW — shared proxy component |
| `src/scene/metrics-display.tsx` | +import, +hotspot gated on `inRole` |
| `src/scene/consumer-pulse.tsx` | +import, +hotspot gated on `inRole` |
| `src/scene/martech-pipeline.tsx` | +import, +hotspot gated on `inTools` |
| `src/scene/global-reach-globe.tsx` | +import, +hotspot gated on `inTools` |
| `src/scene/insights-network.tsx` | +import, +hotspot in outer `InsightsNetwork` gated by `view !== 'agent'` guard |
| `src/scene/consumer-funnel.tsx` | +import, +hotspot gated on `inAgent` |

`growth-ribbon.tsx` — skipped per spec (no natural single-object bbox; the ribbon spans a 30m arc).

## Design

`ExhibitHotspot` (exhibit-hotspot.tsx):
- Invisible `<boxGeometry>` proxy mesh; `meshBasicMaterial opacity={0}` — raycasts, never drawn
- `onPointerOver/Out` → local `hovered` state + `useCursor(hovered)` (drei) for pointer cursor
- `onClick` → `usePanelCollapsed()[1]` (toggle) — routes into the external store; camera rig reacts
- Hover cue: conditional `<Edges color="#FFD86B" lineWidth={2}>` — zero cost when not hovered, no material mutation on GLB meshes
- No `useFrame`, no new lights, no per-frame allocations
- Each call site mounts the hotspot only in the active-view guard (`inRole`, `inTools`, `inAgent`) — zero off-view raycast cost

## Verification Results

Script: `scripts/verify-exhibit-hotspots.mjs` (port 5175)

```
panel collapsed for sweep
Hover confirmed at screen [180, 510]           ← ConsumerPulse, role view
hover screenshot saved
aria-expanded before click: false
aria-expanded after click: true
Panel toggle worked: true (false → true)
role rest screenshot saved
agent rest screenshot saved
Agent hover confirmed at screen [660, 440]     ← InsightsNetwork / ConsumerFunnel, agent view

=== RESULTS ===
Role hover detected: true
Panel toggle on click: true
DONE
```

## Screenshots

- `lvl13-i-role-hover.png` — gold Edges outline on Market Insights stand visible (screen-right)
- `lvl13-i-role-collapsed.png` — panel collapsed after exhibit click, camera leaned in
- `lvl13-i-role-rest.png` — role view at rest, no regressions
- `lvl13-i-agent-hover.png` — agent view hover confirmed, no regressions
- `lvl13-i-agent-rest.png` — agent view at rest

## Build Gate

```
npm run build  →  ✓ 659 modules transformed  ✓ built in 34.21s  (0 errors, 0 warnings)
```

## Unresolved Questions

None.
