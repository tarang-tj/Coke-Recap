# Phase H — Historical tidbits (brass plaques + DOM captions)

**Files owned:**
- `src/ui/start-gate.tsx`
- `src/ui/chapter-overlay.tsx`
- `src/scene/acts/act-role.tsx`
- `src/scene/acts/act-tools.tsx`
- `src/scene/acts/act-agent.tsx`

## Why

User likes the small historical detail (`$0.10 ICE COLD`) on the vending machine — they want more sprinkled across the chapters to demonstrate they actually studied the Coca-Cola brand during the internship. Goal: museum-style period footnotes that reward attention.

## Tasks

### 1. Title screen DOM caption — `ui/start-gate.tsx`

Add a small tracking-wide caption BELOW the existing "click · or press enter · or scroll" hint line. Same styling discipline, smaller and quieter.

```tsx
{/* Existing hint line stays */}
<p className="mt-10 font-body text-[0.48rem] uppercase tracking-[0.5em] text-off-white/30 select-none">
  click&ensp;•&ensp;or press enter&ensp;•&ensp;or scroll
</p>

{/* NEW historical tidbit */}
<p className="mt-4 font-body text-[0.42rem] uppercase tracking-[0.45em] text-off-white/25 select-none">
  1886&ensp;•&ensp;atlanta&ensp;•&ensp;invented by john&nbsp;s. pemberton
</p>
```

### 2. Role brass plate — `scene/acts/act-role.tsx`

The existing brass nameplate on the shadow-box reads `GLOBAL HUMAN INSIGHTS`. Add a SECOND brass plate on a different part of the frame (upper corner of the frame — top-left or top-right) reading:

```
CONTOUR BOTTLE · PATENTED 1915 · ROOT GLASS CO.
```

- Same brass material (`color="#B89668"`, `roughness=0.4`, `metalness=0.7`).
- Drei `<Text>` at `fontSize=0.028` (smaller than the main nameplate), color `#3A2406`, slight tracking.
- Plate box `args=[0.65, 0.085, 0.015]`.
- Place at e.g. `position={[0.7, 1.30, 0.10]}` (upper-right corner of the frame, just proud).

### 3. Tools crate brass plate — `scene/acts/act-tools.tsx`

Add a small brass plate on the FRONT LONG WALL of the crate, positioned BELOW the existing "Drink Coca-Cola" stencil (the front wall is at z = +CRATE_D/2). Read the file's wall-positioning code to find the right z offset.

Plate text:
```
FIRST BOTTLED 1894 · JOSEPH BIEDENHARN · VICKSBURG MS
```

- Material: aged brass `color="#8E7547"` `roughness=0.5` `metalness=0.6`
- `fontSize=0.045` drei Text, color `#2A1A08`, slight tracking
- Plate box `args=[1.0, 0.10, 0.015]`
- Place on the front face at roughly `position={[0, -CRATE_H * 0.15, CRATE_D/2 + 0.012]}` (under the stencil, proud of the wall)
- Don't disturb the crate rotation pattern — add the plate INSIDE the `crateGroupRef` group so it rotates with the crate

### 4. Agent dispenser brass plate — `scene/acts/act-agent.tsx`

Add a small brass plate on the dispenser's PLINTH BASE (the wider chrome ring at the bottom of the column).

Plate text:
```
FIRST SERVED · JACOBS' PHARMACY · MAY 8, 1886
```

- Material: aged brass `color="#8E7547"` `roughness=0.5` `metalness=0.6`
- `fontSize=0.038` drei Text, color `#2A1A08`, slight tracking
- Plate box `args=[0.78, 0.09, 0.015]`
- Place on the front face of the plinth at e.g. `position={[0, -0.78, 0.78]}` (verify by reading current plinth dimensions)
- The plate should be on the dispenser's main group so it rotates with the slow Y rotation

### 5. Takeaways DOM caption — `ui/chapter-overlay.tsx`

When `view === 'takeaways'`, render a small museum-caption-style line BELOW the existing chapter copy. Easiest placement: inside the chapter-copy `<div>` after the `<Section />` render.

Conditional render:
```tsx
{view === 'takeaways' && (
  <p className="mt-8 font-body text-[0.5rem] uppercase tracking-[0.45em] text-off-white/30 select-none">
    sold for 5¢ from 1886&nbsp;–&nbsp;1959&ensp;•&ensp;73 years at the same price
  </p>
)}
```

Style matches the existing chapter selector pills' tracking/case but quieter (text-off-white/30).

## Consistency rules

- All five tidbits use tiny uppercase + wide tracking. No emojis.
- Brass plates all use the same brass material variant (`#8E7547` for the new plates, `#B89668` for the existing one on the Role frame — slight intentional difference between the personal nameplate and the historical plaques).
- Brass plates engrave text via drei `<Text>`, color `#2A1A08` (dark ink), with tracking applied via `letterSpacing` prop.
- No tidbit should be more than ~60 characters — keep them snackable.

## Acceptance criteria

- 5 historical tidbits visible in the right places (one per chapter)
- DOM captions don't overlap any existing element
- Brass plates render at appropriate z-offsets without z-fighting
- `npm run build` passes
- Title screen tidbit visible BELOW the existing hint line
- Takeaways tidbit visible only when `view === 'takeaways'`

## Out of scope

- Don't touch the bottle component
- Don't touch the foundation lighting / postprocessing
- Don't touch any other UI overlay logic (CreditHud, StartGate hover behavior, etc.)
- Don't add tidbits beyond the 5 listed (keep it tasteful)
