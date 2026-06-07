# Phase J — Jacobs' Pharmacy interior around the machine

**Files owned:**
- `src/scene/jacobs-pharmacy.tsx` (NEW)
- `src/scene/machine-hub.tsx` (mount + minor)

## Why

User: *"the overall environment around the coca cola machine feels like it
could be better maybe lets do this machine in jacobs pharamcy like history"*

Jacobs' Pharmacy, Atlanta, May 8, 1886 — where John S. Pemberton first served
Coca-Cola at the soda fountain. The history footnote on the agent's plinth
(`FIRST SERVED · JACOBS' PHARMACY · MAY 8, 1886`) gives this room a tangible
context. Building the pharmacy interior around the machine makes the brand
story diegetic, not just incidental.

## Period reference

Late-Victorian American apothecary with a soda fountain. Cohesive 1880s
aesthetic:
- Wide dark wood plank flooring (or hexagonal tile — going with wood for warmth)
- Vertical narrow-plank wood paneling, dark walnut
- Brass chair-rail molding at chest height
- Open shelves above with apothecary jars in muted period colors
- Marble soda-fountain counter with brass trim
- Brass pendant gas-lamp (electric was just arriving)
- Framed lithograph advertisements
- Pressed-tin ceiling implied (out of frame)

## Tasks

### 1. Create `src/scene/jacobs-pharmacy.tsx`

Export a single component `<JacobsPharmacy />` containing all elements as a
single `<group>`. No props needed — the parent machine-hub fades it via
envelope opacity through scene-transition.

Stay under ~280 lines. Use `useMemo` for all manually-allocated geometries +
CanvasTextures, and `useEffect` cleanup for disposal.

### 2. Floor

A dark wood plank floor extending under and around the machine:

```tsx
<mesh position={[0, -3.0, -1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
  <planeGeometry args={[10, 8]} />
  <meshStandardMaterial map={floorTex} roughness={0.85} metalness={0} />
</mesh>
```

`floorTex` is a procedural CanvasTexture (1024×768):
- Base: warm dark brown `#3A2A1A`
- 6 horizontal plank stripes with slightly varying brown shades (`#3D2C1C`,
  `#4A3520`, `#352618`, `#3F2E1F`, `#42301E`, `#3A2A1A`)
- Thin dark grout lines `#1A1208` between planks (2-3px)
- Subtle horizontal grain noise within each plank
- `wrapS = wrapT = RepeatWrapping; repeat.set(2, 2)` so the planks read as longer/realistic

### 3. Back wall (paneling + chair rail)

A vertical wall at z = -5.0 spanning width 12, height 7:

```tsx
<mesh position={[0, 0.5, -5.0]} receiveShadow>
  <planeGeometry args={[12, 7]} />
  <meshStandardMaterial map={wallTex} roughness={0.75} metalness={0} />
</mesh>
```

`wallTex` is a procedural CanvasTexture (1024×768):
- Vertical wood paneling: 12 narrow planks across the width in dark walnut
  `#3D2A1A`, faint vertical seam lines in `#1A1208`
- Lower 60% of the texture is the wood paneling
- Upper 40% transitions to a darker painted band `#2A1A0E` (the unpaneled
  wall above the chair rail)
- Subtle vertical grain noise within each plank

Brass chair-rail molding strip horizontally across the wall at y=0.5 (chest
height in this scene):

```tsx
<mesh position={[0, 0.5, -4.95]}>
  <boxGeometry args={[12, 0.10, 0.08]} />
  <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
</mesh>
```

### 4. Apothecary shelves with jars

Two shelves above the chair rail. Each shelf is a thin dark wood plank
`boxGeometry args={[5, 0.05, 0.4]}` color `#3D2A1A` roughness 0.85, positioned
at z = -4.6 (in front of the wall by 0.4):

- Lower shelf: y = +1.4
- Upper shelf: y = +2.6

On each shelf, six instanced apothecary jars distributed along the length:

- Jar body: `cylinderGeometry args={[0.16, 0.18, 0.42, 16]}` (slightly tapered)
- Jar cap: `cylinderGeometry args={[0.18, 0.18, 0.06, 16]}` sitting on top
- Position: `x = -1.8 + i * 0.72` for i in 0..5 (spread across the 5-unit
  shelf)
- Per-jar color cycles: amber `#B8804A`, cobalt `#1A2D5C`, opal cream
  `#E5D5B0`, dark green `#2E4F3A`, then repeat from amber. Use the index
  modulo 4 to pick.
- All jar bodies share a single `meshStandardMaterial roughness=0.4
  metalness=0.05` with `vertexColors=true` if using a shared instanced mesh
  with per-instance colors. Caps share a single material `meshStandardMaterial
  color="#5A3A20" roughness=0.5 metalness=0.3` (dark brown wood).

Implementation hint: use 2 InstancedMesh for the 12 jar bodies (6 per shelf)
and 2 InstancedMesh for the 12 jar caps. Per-instance colors via
`setColorAt`. Y positions are the shelf y plus 0.21 (half jar body height)
for body, plus 0.45 for cap.

### 5. Marble soda-fountain counter

To the right of the machine at x = +3.5, z = -1.5:

```tsx
<group position={[3.5, -2.0, -1.5]}>
  {/* Counter base — dark wood */}
  <mesh>
    <boxGeometry args={[2.2, 1.4, 1.1]} />
    <meshStandardMaterial color="#3D2A1A" roughness={0.85} metalness={0} />
  </mesh>

  {/* Marble top */}
  <mesh position={[0, 0.72, 0]}>
    <boxGeometry args={[2.3, 0.06, 1.2]} />
    <meshStandardMaterial map={marbleTex} roughness={0.3} metalness={0.05} />
  </mesh>

  {/* Brass trim along the top edge front */}
  <mesh position={[0, 0.69, 0.6]}>
    <boxGeometry args={[2.3, 0.03, 0.05]} />
    <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
  </mesh>

  {/* Chrome apothecary jar of straws on the counter */}
  <group position={[0.5, 1.0, 0]}>
    <mesh>
      <cylinderGeometry args={[0.18, 0.20, 0.55, 20]} />
      <meshStandardMaterial color="#D2D6D2" roughness={0.18} metalness={0.85} />
    </mesh>
    {/* 5 cream straws sticking out at various tilts */}
    {[-0.08, -0.04, 0, 0.04, 0.08].map((x, i) => (
      <mesh key={i} position={[x, 0.45, 0]} rotation={[0, 0, 0.04 * (i - 2)]}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
        <meshStandardMaterial color="#F1E9DA" roughness={0.7} metalness={0} />
      </mesh>
    ))}
  </group>
</group>
```

`marbleTex` is a procedural CanvasTexture (512×512):
- Base: cream `#F1E9DA`
- Veining: 5-8 random irregular curves in `#8E7547` (drab gold/tan), low
  opacity ~0.4
- Subtle grain noise

### 6. Brass pendant lamp above the machine

Place at world y = +4.5, slightly forward of the machine:

```tsx
<group position={[0, 4.5, 0]}>
  {/* Cord descending from ceiling (out of frame) */}
  <mesh position={[0, 0.7, 0]}>
    <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
    <meshStandardMaterial color="#1A1208" roughness={0.9} metalness={0} />
  </mesh>

  {/* Brass dome shade */}
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    <meshStandardMaterial
      color="#9C7A3C"
      roughness={0.35}
      metalness={0.75}
      side={THREE.DoubleSide}
    />
  </mesh>

  {/* Inner bulb glow */}
  <mesh position={[0, -0.18, 0]} rotation={[Math.PI, 0, 0]}>
    <sphereGeometry args={[0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
    <meshStandardMaterial
      color="#FFE4A0"
      emissive="#FFE4A0"
      emissiveIntensity={2.4}
      toneMapped={false}
    />
  </mesh>

  {/* Diegetic point light */}
  <pointLight
    position={[0, -0.3, 0]}
    intensity={0.8}
    color="#FFE4A0"
    distance={5}
    decay={1.5}
  />
</group>
```

### 7. Framed period advertisement

On the back wall at center, at y = +3.5:

```tsx
<group position={[0, 3.5, -4.9]}>
  {/* Brass frame */}
  <mesh>
    <boxGeometry args={[1.7, 1.1, 0.06]} />
    <meshStandardMaterial color="#9C7A3C" roughness={0.4} metalness={0.7} />
  </mesh>

  {/* Recessed advertisement plane */}
  <mesh position={[0, 0, 0.035]}>
    <planeGeometry args={[1.5, 0.92]} />
    <meshBasicMaterial map={adTex} toneMapped={false} />
  </mesh>
</group>
```

`adTex` is a procedural CanvasTexture (1024×640):

Canvas drawing recipe:
```
Background: cream #F1E9DA fillRect

Red horizontal rule top: y=80, height=10, color #F40009
Red horizontal rule bottom: y=560, height=10, color #F40009

Centered text (vertically distributed in the cream area):
  y=170:  "DELICIOUS"      bold 64px serif (or Pacifico fallback)
                            color #F40009
                            tracking wide
  y=300:  "Coca-Cola"      italic-ish script feel, 120px Pacifico
                            color #F40009
                            (use system serif italic if Pacifico unavailable
                             in the Canvas 2D context — common gotcha)
  y=430:  "REFRESHING"     bold 64px serif
                            color #F40009
                            tracking wide
  y=600:  "5¢ AT ALL FOUNTAINS"
                            bold 36px serif
                            color #2A1A08 (dark ink)
                            tracking wide
```

The Pacifico CSS font may not be available in the 2D canvas context (similar
gotcha to Phase R's role poster — Georgia italic fallback was used). Fallback
acceptable.

### 8. Mount in `machine-hub.tsx`

Read the file to see how the machine envelope is currently wired. Mount
`<JacobsPharmacy />` INSIDE the same group that gets faded by the machine
envelope, BEFORE the `<VendingMachine />` element so it renders behind in
draw order.

```tsx
import { JacobsPharmacy } from './jacobs-pharmacy';

// inside the machine-hub group:
<JacobsPharmacy />
<VendingMachine ... />
```

If the machine-hub uses `useFrame` to set the group's `visible` based on
envelope > 0.002 (common pattern), no extra work is needed — the pharmacy
inherits the same visibility.

### 9. Reduced motion

No animation in the pharmacy, so reduced motion is a no-op.

### 10. Disposal

All manually-allocated CanvasTextures (floor, wall, marble, ad) — bake once
in `useMemo`, dispose in `useEffect` cleanup.

InstancedMesh geometries auto-clean when the component unmounts (R3F handles
geometry created via JSX). For any geometry built with `new
THREE.BufferGeometry()` manually, dispose explicitly.

## Acceptance criteria

- Wood plank floor under the machine
- Back wall with vertical paneling + brass chair rail + 2 apothecary shelves
  with 12 instanced jars in period colors
- Marble counter to the right of the machine with chrome jar + cream straws
- Brass pendant gas-lamp above the machine with warm bulb glow + diegetic
  point light
- Framed *DELICIOUS · Coca-Cola · REFRESHING · 5¢ AT ALL FOUNTAINS*
  advertisement on the back wall
- All elements fade in/out with the machine envelope (don't show in chapter views)
- `npm run build` passes; tsc clean
- No transmission materials anywhere
- Performance: extra geometry stays under ~5k tris, uses `InstancedMesh` for
  apothecary jars

## Out of scope

- Don't touch any act file (Role/Tools/Agent/Takeaways)
- Don't touch the bottle component (Phase B's domain)
- Don't touch scene-lighting, scene-backdrop, or postprocessing (Round 5
  already tuned them)
- Don't change navigation, scene-transition, or camera-rig
- Don't add additional pendant lamps or further period elements beyond the
  listed set (keep it tight)
- Don't replace the existing skydome backdrop — the pharmacy interior sits
  IN FRONT of the backdrop, partially occluding it. The red atmosphere can
  still leak through the gaps and gives the scene depth.
