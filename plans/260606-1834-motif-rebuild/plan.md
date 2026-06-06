# Motif Rebuild — Coke-Recap

**Branch:** `redesign/polish-pass-3` (continuing on the polish-pass-3 PR)
**Trigger:** User on the live `redesign/polish-pass-3` build called the Role motif a "trash circle with Coca-Cola" and called the Tools bottles "boring silhouettes."
**Start:** 2026-06-06 18:34 ET

## What's wrong with what just shipped

- **Role-act**: red disc with "Coca-Cola" text on it. Too flat, too generic-Coke-mark, too obvious. Doesn't say anything about the actual role.
- **Tools-act**: 6 tiny contour bottles on a ring, each ~0.55 scale. At the chapter camera distance they read as flat red blobs with words on them — silhouettes, not objects.

## New directions

### Role: "Global Human Insights" made literal

A polished **chrome magnifying lens** with **red-tinted optical glass** hovers near a **slowly rotating wireframe globe**. Lens slow-orbits the globe and occasionally drifts across the face of it (the lens magnifies the wireframe lines underneath — fakeable with a slightly scaled inner circle). Subtle bloom on the red glass. No "Coca-Cola" text painted anywhere.

Why: the chapter is called "The Role" and the role is *Global Human Insights Intern*. Globe + lens = global + insight. Period-correct chrome ties to the vending-machine aesthetic. Reads as an intentional motif, not generic Coke product.

### Tools: featured bottle + queue, with life

One **featured bottle** in front at scale ~1.4 in a brief raised pose. Five **queued bottles** in a shallow arc behind it at scale ~0.6 with reduced emissive. Featured bottle has:
- **Animated red liquid fill** inside the glass (cylinder mesh, animated y-scale, slight meniscus)
- **Rising carbonation bubbles** inside the liquid (~10 small spheres on staggered y velocities, recycled at the top)
- **Condensation droplets** on the outside glass (~20 instanced tiny spheres at random y/angle, slight twinkle via shader-light gating)

Featured slot cycles every ~3.5s (auto). Hovering a queued bottle pulls it forward and becomes the featured slot. Click selects (no nav from this act — we're already here).

Why: addresses "silhouettes are boring" with real interior life. Honors user's commitment to the contour bottle as the historic artifact. Single focal point reads as "a tool I'm showing you," not "a wallpaper of bottles."

## Phases

| # | Title | Files | Status |
|---|---|---|---|
| A | Role: lens-over-globe | `scene/acts/act-role.tsx` | pending |
| B | Tools: featured-bottle carousel with liquid + bubbles + condensation | `scene/acts/act-tools.tsx`, `scene/brand/coke-bottle.tsx` (extend with interior-animation props) | pending |

**Parallelism:** A and B touch disjoint act files. B extends `coke-bottle.tsx` with new optional props; A doesn't touch the bottle. Safe to run in parallel.

## Done criteria

- Role-act reads as a deliberate "global insight" motif — no Coca-Cola text on a flat disc.
- Tools-act featured bottle is visibly alive: liquid moving, bubbles rising, droplets sparkling.
- `npm run build` passes.
- User confirms at dev server.

## Agent left untouched

User didn't call out the agent-act. Leaving as-is (glowing red icosahedron + 3 rings + 8 dots) unless they flag it next round.
