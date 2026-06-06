# Phase 02 — Classic vending machine polish

**Priority:** P1
**Status:** pending — **blocked on Phase 01**
**Files (owned):** `src/scene/brand/vending-machine.tsx`

## Why this matters

User: *"the vending machine is bad / not classic — only the top logo is good."* The cabinet currently reads as a generic cream-and-red rectangle. It needs the vintage feel of a 1950s–60s Coca-Cola upright vendor: rounded chrome top, embossed lettering, bottle-shaped buttons, footed base.

## Hard constraint

**DO NOT TOUCH THE HEADER LOGO.** User explicitly approved the existing illuminated header sign with the wordmark on it. Lines 278–320 of `vending-machine.tsx` (header RoundedBox, logo plane, ICE COLD text, chrome trim bands) — leave those alone.

## Tasks

1. **Top cabinet curvature.** Replace the cabinet's flat top with a subtle rounded chrome "hood" — a separate top piece sitting above y ≈ 2.78 (the upper chrome trim) that curves slightly forward. Suggested: a `RoundedBox` with larger `radius` (~0.12), or a small lathe / shaped mesh. Chrome material (`color={CHROME}`, low roughness, high metalness).
2. **Embossed slogan.** Below the dispense chute (around y ≈ -2.3, z front-facing), add embossed "Drink Coca-Cola" lettering using `<Text>` with a slight raised offset (z + 0.02 over a recessed plate) and a cream/chrome material. Reference: classic vendors had this slogan stamped on the lower-front. Don't compete with the header — make it smaller and lower-contrast.
3. **Bottle-shaped buttons.** Replace the current cylinder pill buttons (lines 144–159) with miniaturized bottle-cap or mini-contour-bottle button heads. Two options — pick whichever reads better:
   - **3a.** Render a tiny `<CokeBottle scale={0.12} showLogo={false} />` as the button head (uses Phase 01's bottle).
   - **3b.** Use a small flat disc (bottle cap top-down silhouette) with the crimped-edge ring you can borrow from `act-role.tsx` instancing approach (simplified).
   Keep the chrome bezel behind it. Preserve all existing interaction: hover lift, press scrunch, emissive glow on `lit`, the `Text` index number floating in front.
4. **Coin slot detail.** The current coin slot panel (lines 409–420) is fine but spartan. Add: a thin chrome rim around the slot opening, and a small "$0.10" pricing badge below the INSERT COIN text (small `<Text>`, chrome-colored). Vintage realism.
5. **Footed base.** The current base + rubber feet (lines 443–453) is too low-profile. Make it more substantial: extend the base plate `boxGeometry` to args `[2.7, 0.18, 1.05]` and add small chrome corner kickplates at the front. Keep the two rubber feet but move them outward slightly so they're visible from the front.
6. **Side embossing.** On the cream side panels (or on the front cabinet face below the dispense chute), add subtle vertical "Coca-Cola" embossing — a faint repeated text element with low opacity and a dark outline. Optional but adds vintage feel. Keep it subtle.

## Acceptance criteria

- Cabinet reads as a recognizable 1950s–60s Coke vendor, not a generic box.
- Header logo + ICE COLD subline + chrome trim bands **unchanged** from current.
- Bottle-shaped buttons interactive with same hover/press behavior as before; lit state still glows yellow on hover.
- Embossed "Drink Coca-Cola" slogan visible on the lower cabinet.
- Footed base with visible chrome kickplates.
- `npm run build` passes; runtime console clean.
- Dev-server screenshot from default machine-hub camera shows the polished machine.

## Out of scope

- Don't add vintage wear/dirt textures (deferred to a future polish pass).
- Don't add a coin-insert animation (deferred).
- Don't touch the `BottleSlot` bottle display (Phase 01's bottle drives that).
- Don't touch the navigation context or scene transitions.

## How to verify

```bash
npm run build
npm run dev
# Open the machine-hub. The cabinet should feel more vintage and substantial.
```

## Dependencies

- **Phase 01 must be merged** to this branch before dispatching this phase. The new `CokeBottle` powers task 3 (bottle-shaped buttons option 3a) and the existing bottle slots.
