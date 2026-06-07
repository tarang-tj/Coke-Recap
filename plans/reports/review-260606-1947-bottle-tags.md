# Consolidated SDD Review — Bottle Authenticity (Phases B + L)

**Branch:** `redesign/polish-pass-3`
**Date:** 2026-06-06
**Reviewer:** code-reviewer
**Build:** `npx vite build` PASS, `tsc -b` PASS

---

## Phase B — Authentic bottle

### SPEC: PASS

All spec items verified against `phase-B-bottle.md`:

| Spec item | File:line | Status |
|---|---|---|
| Glass color `#2F4D2A` (Georgia green) | coke-bottle.tsx:26 | PASS |
| Glass emissive `#1A2D14` | coke-bottle.tsx:27 | PASS |
| Rib color `#3D6035` lighter green | coke-bottle.tsx:28 | PASS |
| Glass `roughness=0.10`, `clearcoatRoughness=0.06`, `opacity=0.85` | coke-bottle.tsx:427-430 | PASS |
| Label band height 0.42 (was 0.26) | coke-bottle.tsx:39 | PASS |
| Label position `LABEL_Y=0.42`, `LABEL_R=0.358` | coke-bottle.tsx:37-38 | PASS |
| Label emissive `#A60010` intensity 0.2 | coke-bottle.tsx:452-453 | PASS |
| Wordmark plane `[0.62, 0.18]` (was `[0.34, 0.10]`) | coke-bottle.tsx:478 | PASS |
| Wordmark `meshBasicMaterial` with `toneMapped={false}` + `depthWrite={false}` | coke-bottle.tsx:479-484 | PASS |
| customLabel `fontSize=0.13`, `maxWidth=0.52`, `outlineWidth=0.016` | coke-bottle.tsx:464-470 | PASS |
| Crown cap: thin disc `[0.158, 0.165, 0.035, 28]` + 21 instanced crimps | coke-bottle.tsx:325, 60, 296-357 | PASS |
| Cap top wordmark stamp | coke-bottle.tsx:336-344 | PASS |
| 21 crimps via `instancedMesh` (`CRIMP_COUNT=21`) | coke-bottle.tsx:60, 348 | PASS |
| Profile points ~65–75 | coke-bottle-geometry.ts:15-108 (74 points counted) | PASS |
| Lathe segments default 96 (was 64) | coke-bottle-geometry.ts:123; coke-bottle.tsx:380 | PASS |
| Belly peak r≈0.355 at y≈0.42 | coke-bottle-geometry.ts:40 `[0.355, 0.420]` | PASS |
| Waist pinch r≈0.205 at y≈0.62 | coke-bottle-geometry.ts:57 `[0.205, 0.630]` | PASS |
| Shoulder bulge r≈0.33 at y≈0.80 | coke-bottle-geometry.ts:70-73 `[0.332, 0.770]` | PASS |
| Neck collar swell ~y=1.34, r=0.165 | coke-bottle-geometry.ts:100 `[0.165, 1.350]` | PASS |
| Top rim y=1.55, r=0.150 | coke-bottle-geometry.ts:107 `[0.150, 1.550]` | PASS |
| Neck ring `args=[0.152, 0.010, ...]` at y=1.34 | coke-bottle.tsx:496-499 | PASS |
| Punt ring at y=0.028, r=0.255 | coke-bottle.tsx:505-508 | PASS |
| Additional embossed base ring at y≈0.05, r=0.21 | coke-bottle.tsx:511-514 | PASS |
| `CokeBottleProps` shape preserved (all 10 props) | coke-bottle.tsx:82-106 | PASS |
| `interior` prop still works | coke-bottle.tsx:406-416 | PASS |
| No transmission materials | only comments mention "no transmission" | PASS |
| Old screw cap removed | no `cylinderGeometry args={[0.163, 0.163, 0.075...` found | PASS |

### QUALITY

**Must-fix (correctness / leak / perf-cliff):** none

**Should-fix:**

1. **coke-bottle.tsx:195-197 — `useMemo` used as side-effect, returns void.** The block
   ```ts
   useMemo(() => { positionsRef.current = bubbleData.map((b) => b.phaseY); }, [bubbleData]);
   ```
   is dead code: `bubbleData` comes from `useMemo(..., [])` so it never changes, and `positionsRef.current` is already initialized at line 165 with the same value. Delete lines 195-197. (Pre-existing — not introduced by Phase B, but visible inside the touched file.)

2. **coke-bottle.tsx:378-382 — geometry leak risk.** `bodyGeo` (`LatheGeometry`) and `flutesGeo` (`BufferGeometry`) are built in `useMemo([])` but have no `useEffect` cleanup calling `.dispose()`. If a parent ever unmounts a bottle, GPU buffers leak. Phase L's `act-tools.tsx:562-569` correctly disposes its CanvasTextures — mirror that pattern here:
   ```ts
   useEffect(() => () => { bodyGeo.dispose(); flutesGeo.dispose(); }, [bodyGeo, flutesGeo]);
   ```

3. **coke-bottle.tsx CrownCrimps + main body — per-instance material allocation.** The bottle is rendered in 6 crate slots (act-tools) + up to ~12 vending-machine slots + hero bottle. Each render allocates fresh `meshPhysicalMaterial` × 3 (glass, ribs, cap), `meshStandardMaterial` × 4 (label, crimps, neck ring, two base rings), `meshBasicMaterial` × 2 (wordmark plane, cap stamp), plus `boxGeometry`/`cylinderGeometry`/`torusGeometry` × ~7. Pre-existing pattern. Not blocking at current instance counts, but consider hoisting shared materials to module scope if bottle count grows.

**Nit:**

- coke-bottle.tsx:449 label cylinder uses `64` radial segments while body lathe uses `96`. May produce slight faceting visible where label sits proud of the belly. Cosmetic — bump to 96 if perfect alignment is desired.

---

## Phase L — Tools-act neck-tag readability

### SPEC: PASS

All spec items verified against `phase-L-tags.md`:

| Spec item | File:line | Status |
|---|---|---|
| `buildNeckTagTexture` canvas 512×384 | act-tools.tsx:137-138 | PASS |
| `texture.anisotropy = 8` | act-tools.tsx:236 | PASS |
| Aged cream background `#EAD8B0` | act-tools.tsx:145 | PASS |
| Dark ink border ~6px stroke | act-tools.tsx:153-155 | PASS |
| Bold Courier ~80px text, shrink-to-fit | act-tools.tsx:198-209 | PASS |
| "TOOL" microtype red stamp at top | act-tools.tsx:163-170 (`bold 28px Georgia, #A60010, letterSpacing 4px`) | PASS |
| Tag plane `args=[0.32, 0.20, 0.005]` (was `[0.18, 0.11, 0.005]`) | act-tools.tsx:508 | PASS |
| Tag positioned forward of neck (`+z=0.14`) | act-tools.tsx:507 | PASS |
| Tag y below crown cap (~y=0.80 local → ~1.14 bottle-local ÷ scale 0.7) | act-tools.tsx:507 | PASS |
| All 6 tags render with correct names from `tools` | act-tools.tsx:556-559, 659-667; portfolio-content.ts:27-58 | PASS |
| CanvasTexture dispose cleanup on unmount | act-tools.tsx:562-569 | PASS |
| No edits outside owned file (`act-tools.tsx`) | confirmed | PASS |

### QUALITY

**Must-fix (correctness / leak / perf-cliff):** none

**Should-fix:**

1. **act-tools.tsx:506 — stale TODO note in comment.** Comment reads: *"NOTE: final y may need a small adjustment after Phase B's crown-cap geometry merges."* Phase B has merged. Either remove the note or document the verified-correct y/rotation. (Crown cap world y≈1.50 × bottle scale 0.7 = ~1.05; tag y=0.80 sits below cap — confirmed correct.)

2. **act-tools.tsx:556-559 — `useMemo` missing `tools` in deps.** `tagTextures = useMemo(() => tools.map((t) => buildNeckTagTexture(t.name)), [])`. `tools` is imported and `as const` so safe in practice, but `react-hooks/exhaustive-deps` will flag it. Add `tools` to deps (or eslint-disable with justification).

**Nit:**

- act-tools.tsx:167-169 `ctx.letterSpacing = '4px'` combined with literal `'T  O  O  L'` double-spaces produces extra visual gaps. Intentional period-feel choice — keep if desired.
- act-tools.tsx:236 hardcoded `anisotropy = 8` rather than `renderer.capabilities.getMaxAnisotropy()`. Spec explicitly allowed either; hardcoded 8 is reasonable.

---

## Concurrency / Correctness audit (both phases)

- **No `setState` in `useFrame`.** All animations write to refs (`hRef`, `fillRef`, `positionsRef`, `initialized`, `spotIntensityRef`, `hoveredRef`) or material/mesh properties directly. PASS.
- **Per-frame allocations.** `CondensationMounted` allocates `new THREE.Object3D()` once per init (gated by `initialized.current`). PASS. No `new THREE.Color()`, `new THREE.Vector3()`, or `.clone()` inside hot frame paths.
- **Hook order stable across branches.** `CokeBottle` interior subtree uses `{interior && ...}` for components that contain their own hooks — `LiquidMesh`/`Bubbles`/`CondensationMounted` are gated as JSX children of a conditional render, which is valid (each is a separate component with its own hook scope). PASS.
- **API contract / backward compat.** `CokeBottleProps` (lines 82-106) preserves all 10 named props with same semantics. Existing consumers pass only subsets (`scale/showLogo/highlight` in `act-bottle.tsx:41`, `act-tools.tsx:496`, `vending-machine.tsx:102/183`) — all honored. No breaking changes. PASS.
- **Material disposal.** Phase L's CanvasTextures: disposed (`act-tools.tsx:562-569`). Phase B's bottle geometries (`bodyGeo`, `flutesGeo`): **not disposed** — see Should-fix #2 above.
- **No dead code from prior bottle revision.** No leftover screw cap mesh, no commented-out blocks, no `// OLD` markers. PASS.
- **No transmission materials anywhere.** Only comments reference the rule. PASS.

---

## OVERALL: APPROVED-WITH-FIXES

Both phases match spec precisely. The implementation is clean, with no must-fix correctness or security issues. The two phases are ship-ready; the should-fix items below are cleanup that can land in a follow-up commit.

### Top 3 recommendations

1. **Add geometry disposal to `CokeBottle`** (coke-bottle.tsx:378-382) — mirror Phase L's texture cleanup pattern. Low effort, prevents real GPU leak if any future code unmounts bottles.
2. **Delete dead `useMemo` side-effect** at coke-bottle.tsx:195-197 — harmless but misleading. Pre-existing but visible.
3. **Clear the stale "verify after Phase B merges" note** at act-tools.tsx:506 (and add `tools` to deps array at act-tools.tsx:559) for lint hygiene.

---

## Unresolved questions

- None.
