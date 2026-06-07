# Phase B — Reference-true bottle

**Files owned:**
- `src/scene/brand/coke-bottle.tsx`
- `src/scene/brand/coke-bottle-geometry.ts`

## Reference

User-provided image: classic soda-bottle illustration at `/Users/tarangjammalamadaka/Downloads/classic-soda-bottle-illustration/3c78e603-2ea2-4066-b76f-d2d269f9c8ed.jpg`. Shows:
- Clear/very-light-gray glass with strong white gloss highlights
- Visible brown caramel liquid filling roughly 75% of belly height
- Bright cream highlight at the liquid surface (meniscus)
- Red crimped crown cap at the top
- **No label band**
- Hobble-skirt flutes visible through the clear glass
- Height-to-max-diameter ratio approximately 3.5:1 (slimmer than what we have)

## Tasks

### 1. Slim the silhouette in `coke-bottle-geometry.ts`

Current peak radius is ~0.355 at y=0.44 (H:D ≈ 1.55 / 0.71 = 2.2:1). Slim to:

- **Max belly radius: ~0.24** at y ≈ 0.44 (H:D ≈ 1.55 / 0.48 = 3.2:1)
- Waist pinch: r ≈ 0.155 at y ≈ 0.62 (proportionally tighter)
- Shoulder bulge: r ≈ 0.22 at y ≈ 0.80
- Neck taper from y=0.85 (r=0.17) → y=1.30 (r=0.10)
- Bottle top rim: y=1.55, r=0.10
- Foot ring: r=0.18 at base

Use ~70 profile points for smoothness. Lathe segments stay at 96.

Update rib geometry accordingly — flutes still in lower hobble-skirt band y=0.06 → 0.54, but rib bulge stays subtle (~0.010, slightly less than before since the bottle is slimmer).

### 2. New liquid mesh function in `coke-bottle-geometry.ts`

Add an exported helper `buildLiquidGeometry(): THREE.LatheGeometry` that builds a lathe shape following the bottle's interior profile from y=0.06 to y≈1.05 (~75% of belly + lower neck), with each sample's radius set to `profileRadius(y) - 0.012` (inset just inside the glass wall). Return as a single LatheGeometry.

### 3. Bottle glass material in `coke-bottle.tsx`

Replace the green-glass material:

```ts
// OLD
const GLASS_COLOR = '#2F4D2A';      // Georgia green
const GLASS_EMISSIVE = '#1A2D14';   // green inner glow

// NEW
const GLASS_COLOR = '#DCE0DC';      // very light gray, near clear
// (no emissive — clear glass doesn't glow)
```

In the body's `meshPhysicalMaterial`:
- `color={GLASS_COLOR}`
- DROP `emissive` and `emissiveIntensity` (no glow)
- `roughness=0.05` (very smooth — clear glass)
- `metalness=0.0`
- `clearcoat=1`
- `clearcoatRoughness=0.04` (very tight clearcoat)
- `transparent=true`
- `opacity=0.18` (very transparent — let the liquid + env show through)
- `side={THREE.DoubleSide}` (preserve)

The rib geometry stays the same color family (slightly lighter `#E8EBE8`).

### 4. Add internal liquid mesh

In `coke-bottle.tsx`, add a `useMemo` for the liquid geometry, then render it as a child mesh INSIDE the glass:

```tsx
const liquidGeo = useMemo(() => buildLiquidGeometry(), []);

// Dispose on unmount with the existing useEffect pattern
useEffect(() => () => liquidGeo.dispose(), [liquidGeo]);

// ... in the JSX, after the glass body:
{/* Caramel cola liquid — visible through clear glass */}
<mesh geometry={liquidGeo}>
  <meshStandardMaterial
    color="#3D1E0F"
    roughness={0.45}
    metalness={0}
    emissive="#3D1E0F"
    emissiveIntensity={0.18}
    side={THREE.FrontSide}
  />
</mesh>

{/* Meniscus highlight — thin disc at liquid top */}
<mesh position={[0, 1.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
  <circleGeometry args={[0.165, 24]} />
  <meshStandardMaterial
    color="#7A4519"
    emissive="#5A2F12"
    emissiveIntensity={0.4}
    roughness={0.2}
    metalness={0}
    side={THREE.FrontSide}
  />
</mesh>
```

### 5. Drop the red label band

Remove the existing label cylinder mesh + its wordmark plane + the microstrip below. **All three meshes are gone.** The bottle's brand identity now lives on:
- The contour SILHOUETTE (trademark shape)
- The brown LIQUID color
- The CROWN CAP (red with wordmark embossed on top)

### 6. Crown cap (keep, verify it still works)

The crown cap from the prior pass (red disc + 21 instanced crimps + wordmark on top) stays. Verify it sits at the right y for the new (slimmer) profile — bottle top rim is at y=1.55 r=0.10, so crown cap diameter must come down. Suggestions:
- Crown cap disc: `cylinderGeometry args={[0.105, 0.115, 0.035, 28]}` (down from 0.158/0.165)
- Wordmark stamp plane: `0.13 × 0.05` (smaller to fit)
- Crimp ring radius: 0.113 (down from 0.163)

### 7. Optional upper-neck embossed wordmark

Add a subtle drei `<Text>` element near y ≈ 0.95 reading `Coca-Cola` in white/cream with `outlineWidth=0.003`, color `#E8EAE8` (subtle), `fontSize=0.06` — like the embossed wordmark on real bottle glass. Position it so it appears on the FRONT of the bottle (z = profile_radius_at_0.95 + 0.005).

If `customLabel` prop is provided, swap this embossed wordmark for the customLabel string. Same styling, same position.

### 8. Preserve `CokeBottleProps` API

```ts
export interface CokeBottleProps {
  scale?: number;
  lift?: number;
  highlight?: number;
  showLogo?: boolean;       // still toggles the crown-cap wordmark stamp
  customLabel?: string;     // now overrides the upper-neck embossed wordmark
  interior?: BottleInteriorProps;  // KEEP prop but make it a no-op now (liquid is always rendered)
  reducedMotion?: boolean;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}
```

The `interior` prop becomes a no-op (you can still accept it without breaking consumers, but no extra liquid/bubbles/condensation needs to render — the always-on liquid replaces what `interior` used to opt-into).

### 9. Highlight prop

Keep the existing emissive-lerp behavior on the glass material — but since glass no longer has emissive, redirect the highlight target to the LIQUID's emissiveIntensity (0.18 base → 0.45 on highlight=1). Smooth lerp via the existing `useFrame` pattern.

## Acceptance criteria

- Bottle reads as the reference: clear glass with visible brown liquid inside, red crown cap, no label
- Silhouette is slimmer (H:D ~3.2:1 — visibly less squat than before)
- All decoration positions update for the new geometry
- All consumers (vending machine, tools-act crate, takeaways) render the new bottle correctly
- `CokeBottleProps` API unchanged in shape
- `npm run build` passes; tsc clean
- No transmission materials

## Out of scope

- Don't touch any consumer file
- Don't change the `interior` prop's TYPE signature — just no-op its behavior
- Don't add bubbles or condensation — the liquid stands alone
