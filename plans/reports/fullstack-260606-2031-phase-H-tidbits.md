# Phase H Report — Historical Tidbits (Brass Plaques + DOM Captions)

**Status:** DONE
**Branch:** redesign/polish-pass-3
**Build:** PASS (tsc clean + vite build 2.34s, zero errors)

---

## Files Modified

| File | Change |
|---|---|
| `src/ui/start-gate.tsx` | +7 lines — DOM caption below hint line |
| `src/ui/chapter-overlay.tsx` | +7 lines — conditional Takeaways DOM caption |
| `src/scene/acts/act-role.tsx` | +15 lines — historical brass plate (upper-right corner of frame) |
| `src/scene/acts/act-tools.tsx` | +17 lines — `Text` import + brass plate inside `crateGroupRef` |
| `src/scene/acts/act-agent.tsx` | +15 lines — brass plate + Text on plinth, inside `groupRef` |

---

## Tidbits Placed (all 5 confirmed)

1. **Title (start-gate.tsx DOM)** — `1886 · ATLANTA · INVENTED BY JOHN S. PEMBERTON`
   - Rendered as `<p>` below the "click · or press enter · or scroll" hint
   - `text-[0.42rem] uppercase tracking-[0.45em] text-off-white/25 select-none mt-4`
   - Fades and unmounts with the gate (same opacity transition)

2. **Role (act-role.tsx brass plate)** — `CONTOUR BOTTLE · PATENTED 1915 · ROOT GLASS CO.`
   - `<mesh position={[0.7, 1.30, 0.10]}>` + `<boxGeometry args={[0.65, 0.085, 0.015]}>`
   - Material: `color="#8E7547" roughness={0.5} metalness={0.6}` (aged brass, distinct from personal nameplate `#B89668`)
   - drei `<Text>` at `position={[0.7, 1.30, 0.112]}` `fontSize=0.028` `color="#2A1A08"` `letterSpacing=0.08`
   - +0.002 z-offset proud of plate face — no z-fighting

3. **Tools (act-tools.tsx brass plate)** — `FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS`
   - Added `Text` import from `@react-three/drei` (was not previously imported)
   - Plate at `position={[0, -CRATE_H * 0.15, CRATE_D / 2 + 0.012]}` — front long wall (+Z face), inside `crateGroupRef`
   - Text at `z = CRATE_D / 2 + 0.020` (+0.008 z-offset from plate surface)
   - Rotates with the crate: confirmed placement inside `<group ref={crateGroupRef}>`

4. **Agent (act-agent.tsx brass plate)** — `FIRST SERVED · JACOBS' PHARMACY · MAY 8, 1886`
   - Plate at `position={[0, -0.78, 0.78]}` on plinth top-front face (plinth center at y=-0.82, radius ~0.825)
   - Text at `position={[0, -0.78, 0.788]}` (+0.008 z-offset)
   - Placed inside outer `<group ref={groupRef}>` — rotates with the full dispenser's slow Y rotation

5. **Takeaways (chapter-overlay.tsx DOM)** — `SOLD FOR 5¢ FROM 1886 – 1959 · 73 YEARS AT THE SAME PRICE`
   - `{view === 'takeaways' && (<p>...)}` inside the chapter content `<div>`, after `<Section />`
   - `text-[0.5rem] uppercase tracking-[0.45em] text-off-white/30 select-none mt-8`
   - Renders ONLY when `view === 'takeaways'`

---

## Hard Rules Compliance

- No transmission materials added anywhere
- Brass plate material: `color="#8E7547" roughness={0.5} metalness={0.6}` (all 3 new plates)
- All brass plate text: drei `<Text>` color `#2A1A08` with `letterSpacing`
- DOM captions use existing Tailwind tokens: `font-body`, `text-off-white/N`, `uppercase`, wide tracking
- DOM captions use `select-none`; no pointer-events modifications
- Tools plate is inside `crateGroupRef` — confirmed rotates with crate
- Agent plate is inside `groupRef` — confirmed rotates with dispenser
- No other elements modified in any owned file — pure additions only

---

## Build Result

```
tsc -b && vite build
✓ 645 modules transformed
✓ built in 2.34s
0 type errors
0 build errors
```

Chunk size warning is pre-existing (unrelated to this phase).
