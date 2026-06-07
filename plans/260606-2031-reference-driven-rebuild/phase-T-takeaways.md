# Phase T — Takeaways bottle position

**Files owned:** `src/scene/acts/act-bottle.tsx`

## Why

User: *"in takeaways the bottles too high up."* The hero contour bottle in the Takeaways act floats above viewport center. Bring it down so its vertical center aligns with viewport center.

## Tasks

1. Read `src/scene/acts/act-bottle.tsx`. Find the bottle's `<group>` y position (or where `<CokeBottle>` is rendered).
2. The bottle is approximately 1.55 units tall with base at y=0. Currently the bottle group is likely positioned at y=0 (base at origin), meaning the bottle's CENTER is at y=0.775. That puts the whole bottle high in frame.
3. **Lower the bottle group** by ~0.7 units so the bottle's center sits at viewport center. Suggested: `groupRef.position.y = -0.75` (or whatever the existing position is, MINUS 0.7).
4. If there's a pedestal/podium under the bottle, lower the entire act so they move together.
5. Verify the envelope-driven entrance pattern still works (`g.visible = envelope > 0.002`, z-lerp, scale-lerp). Apply the y offset INSIDE the envelope block so it sits at the right y when the act is active.

## Acceptance criteria

- Hero bottle's vertical center sits at viewport vertical center (roughly)
- Entrance dive still works
- `npm run build` passes

## Out of scope

- Don't touch the bottle component or geometry (Phase B owns that)
- Don't touch lighting, navigation, camera-rig
- Don't change any other act
