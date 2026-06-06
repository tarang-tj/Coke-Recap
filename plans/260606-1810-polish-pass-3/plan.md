# Polish Pass 3 — Coke-Recap

**Branch:** `redesign/polish-pass-3` (in-place, no worktree)
**Base:** `main @ d156cea`
**Start:** 2026-06-06 18:10 ET

## User feedback addressed

1. Bottle looks **squished / horrendous** — needs the real iconic hobble-skirt silhouette
2. Vending machine **isn't classic enough** (top logo is the only good part)
3. Inner-act visuals feel **random and clip through other objects**
4. Missing **"by TJ Jammalamadaka"** credit in bottom-right on home/machine views

## Decisions locked

- Branch in-place; ship to `main` via merge when all 4 phases pass review.
- Credit text: **`by TJ Jammalamadaka`** (plain, no year, no separator).
- Tools-act direction: **B — chip-labeled bottle silhouettes.** The contour bottle is the brand's most historic artifact; tool labels ride the bottle's label band.
- Don't touch the machine header logo (user explicitly approved last pass).
- Reuse the shared `<CokeBottle>` everywhere it appears (machine slots, Tools chips, Takeaways hero).

## Phases

| # | Title | Files | Depends on | Status |
|---|---|---|---|---|
| 01 | Iconic contour bottle | `scene/brand/coke-bottle-geometry.ts`, `scene/brand/coke-bottle.tsx` | — | pending |
| 02 | Classic machine polish | `scene/brand/vending-machine.tsx` | 01 | pending |
| 03 | Inner-act motifs | `scene/acts/act-role.tsx`, `scene/acts/act-tools.tsx`, `scene/acts/act-agent.tsx` | 01 | pending |
| 04 | Credit HUD | `ui/credit-hud.tsx` (new), `app.tsx` | — | pending |

**Parallelism:** Phases 01 + 04 dispatch in parallel (disjoint files). Phases 02 + 03 dispatch in parallel after 01 lands (both consume the new `CokeBottle`).

## Per-phase review gate

Each phase: implementer → spec review (against this plan) → quality review (code-reviewer) → commit. Visual verification via `npm run build` + dev-server screenshot before phase is marked complete.

## Definition of done

- All four phases committed on `redesign/polish-pass-3`
- `npm run build` passes; runtime console clean
- Dev-server screenshot of each chapter + machine-hub shared back with user
- PR ready for merge to `main`

## Open threads (deferred)

- Vintage wear/patina, coin-insert animation, audio — punted to a future pass
- Vercel wiring + custom domain
- Camera keyframe/parallax tuning

## Related

- Prior session: `~/Documents/Obsidian Vault/Brain/Projects/Coke-Recap/2026-06-06 Coke-Recap - polish pass 3 scope + stale CWD block.md`
- Repo: https://github.com/tarang-tj/coke-recap
