# Phase B — Authentic Coca-Cola bottle

**Files owned:**
- `src/scene/brand/coke-bottle.tsx`
- `src/scene/brand/coke-bottle-geometry.ts`

**Cross-cutting consumers (DO NOT modify, but verify they still work):**
- `src/scene/brand/vending-machine.tsx` (machine slot bottles)
- `src/scene/acts/act-tools.tsx` (crate bottles — uses `showLogo={true}`)
- `src/scene/acts/act-bottle.tsx` (takeaways hero bottle)

## Detailed tasks

### 1. Glass color — Georgia green

Change in `coke-bottle.tsx`:

```ts
// OLD
const GLASS_COLOR = '#8B0008';        // deep red
const GLASS_EMISSIVE = '#3A0004';     // dark red glow

// NEW
const GLASS_COLOR = '#2F4D2A';        // historic Georgia green glass
const GLASS_EMISSIVE = '#1A2D14';     // subtle green inner glow
```

In the glass body's `meshPhysicalMaterial`:
- `roughness=0.10` (slightly smoother for glass shine)
- `metalness=0.05` (unchanged)
- `clearcoat=1` (unchanged)
- `clearcoatRoughness=0.06` (slightly tighter)
- `opacity=0.85` (slightly less transparent so the glass has more presence; let any interior render show through)
- Keep `transparent`, `side=DoubleSide`

For the rib geometry's `meshPhysicalMaterial`:
- Color slightly lighter green `#3D6035` (highlight ridge effect)
- Same opacity treatment

### 2. Silhouette refinement in `coke-bottle-geometry.ts`

Rewrite `buildContourProfile()` with ~65–75 points hitting these landmarks:

- Total height: ~1.55 (preserve)
- **Belly peak: max radius ~0.355 at y ≈ 0.44** (moved up from y=0.37, slightly slimmer max)
- Sustained belly: from y=0.40 → 0.50 keep radius >= 0.348
- **Waist pinch: r ≈ 0.205 at y ≈ 0.62** (slightly tighter than current 0.21)
- **Shoulder bulge: r ≈ 0.33 at y ≈ 0.80** (slightly more bulge above waist)
- Smooth S-curve waist → shoulder via 6–8 intermediate samples
- Neck taper from y=0.85 (r=0.255) → y=1.30 (r=0.150) via a soft S-curve
- Slight neck swell at the collar (y ≈ 1.34, r=0.165) before the cap seating
- Bottle top rim: y=1.55, r=0.150

In `buildBottleGeometrySet()`:
- Bump default `segments` parameter from 64 → 96 for the lathe
- Rib y range stays approximately y=0.06 → 0.54
- Rib bulge stays ~0.013

### 3. Label band — bigger and bolder

In `coke-bottle.tsx`:

```ts
// OLD
const LABEL_Y = 0.46;
const LABEL_R = 0.362;
const LABEL_H = 0.26;

// NEW
const LABEL_Y = 0.42;      // centered slightly lower on the belly
const LABEL_R = 0.358;     // matches new belly peak ~0.355 with thin proud offset
const LABEL_H = 0.42;      // taller label band — 60% bigger
```

Label material: stay `meshStandardMaterial color={LABEL_RED}` but add `emissive={LABEL_EMISSIVE_RED}` color `#A60010` `emissiveIntensity={0.2}` so the label catches presence under low fill light.

`LABEL_RED` stays `#F40009` (Coca-Cola red).

### 4. Wordmark — readable size

```ts
// OLD wordmark plane
<mesh position={[0, LOGO_Y, LOGO_Z]}>
  <planeGeometry args={[0.34, 0.10]} />
  ...
</mesh>

// NEW wordmark plane
<mesh position={[0, LABEL_Y + 0.02, LABEL_R + 0.008]}>
  <planeGeometry args={[0.62, 0.18]} />   // ~1.8× bigger
  ...
</mesh>
```

Keep `meshBasicMaterial map={logoTex} transparent toneMapped={false} depthWrite={false}`. The cream wordmark from `useLogoTexture` will be ~1.8× larger and clearly readable.

### 5. `customLabel` — readable when used

```ts
<Text
  position={[0, LABEL_Y + 0.02, LABEL_R + 0.008]}
  fontSize={0.13}           // up from 0.085 — ~1.5× bigger
  color="#FFFEF6"
  outlineWidth={0.016}      // up from 0.012
  outlineColor="#0A0203"
  anchorX="center"
  anchorY="middle"
  maxWidth={0.52}           // up from 0.32 — wraps longer names
  letterSpacing={0.02}
>
  {customLabel}
</Text>
```

### 6. Crown cap — replace screw cap

Drop the current screw cap (the `cylinderGeometry args={[0.163, 0.163, 0.075, 24]}` mesh at y=1.485 and the cap-top disc at y=1.525).

Replace with a **crimped crown cap** sitting at the bottle top:

```tsx
{/* Crown cap — thin disc with crimped rim, red enamel */}
<group position={[0, 1.50, 0]}>
  {/* Cap body — thin red disc */}
  <mesh>
    <cylinderGeometry args={[0.158, 0.165, 0.035, 28]} />
    <meshPhysicalMaterial
      color={LABEL_RED}
      roughness={0.35}
      metalness={0.25}
      clearcoat={0.6}
      clearcoatRoughness={0.18}
    />
  </mesh>
  {/* Top wordmark stamp */}
  <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[0.18, 0.07]} />
    <meshBasicMaterial
      map={logoTex}
      transparent
      toneMapped={false}
      depthWrite={false}
    />
  </mesh>
  {/* 21 crimps around the rim — instanced wedges */}
  <CrownCrimps />
</group>
```

`CrownCrimps` is a small internal component:

```tsx
const CRIMP_COUNT = 21;
const crimpMatrices = useMemo(() => {
  const helper = new THREE.Object3D();
  return Array.from({ length: CRIMP_COUNT }, (_, i) => {
    const angle = (i / CRIMP_COUNT) * Math.PI * 2;
    helper.position.set(
      Math.cos(angle) * 0.163,
      0,
      Math.sin(angle) * 0.163,
    );
    helper.rotation.set(0, -angle, 0);
    helper.updateMatrix();
    return helper.matrix.clone();
  });
}, []);

useLayoutEffect(() => {
  const mesh = crimpRef.current;
  if (!mesh) return;
  crimpMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
}, [crimpMatrices]);

return (
  <instancedMesh ref={crimpRef} args={[undefined, undefined, CRIMP_COUNT]} frustumCulled={false}>
    <boxGeometry args={[0.018, 0.04, 0.015]} />
    <meshStandardMaterial color="#A60010" roughness={0.4} metalness={0.3} />
  </instancedMesh>
);
```

(Reference pattern from prior `act-role.tsx` flute instancing — but smaller, on the cap rim.)

### 7. Neck ring + punt ring

Re-verify positions for the new profile:
- Neck ring `torusGeometry args={[0.152, 0.010, ...]}` — adjust y to match new collar (~y=1.34 with new profile)
- Punt ring at the base — keep at y=0.028 but adjust radius to match new base flare (~0.255)

Add an additional **embossed-feel base ring** halfway up the punt for the historic dimpled-bottom look — `torusGeometry args={[0.21, 0.005, ...]}` at y=0.05, glass-green color.

## Acceptance criteria

- Bottle reads as a **green-glass** historic Coca-Cola contour bottle
- Wordmark is **clearly readable** from the chapter camera distance
- Crown cap is visibly crimped (21 flutes around the rim) and red-enamel
- All cross-cutting consumers (machine slots, crate, takeaways) render correctly
- `customLabel` text is much larger and more readable than before
- `npm run build` passes; tsc clean
- No transmission materials

## Out of scope

- Don't touch any consumer file. If a consumer breaks, report it (don't fix it).
- Don't change the bottle's `interior` prop behavior or `<CokeBottleProps>` shape.
- Don't change the `useLogoTexture` hook.
