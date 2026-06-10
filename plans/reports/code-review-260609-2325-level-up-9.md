# Code Review — polish-pass-9 vs polish-pass-8 (level-up 9)

Date: 2026-06-09 · Reviewer: code-reviewer agent
Scope: `git diff polish-pass-8...polish-pass-9 -- src index.html public/llms.txt` (4 commits, ~117 LOC added)
Files: camera-rig.tsx, recap-context.tsx, recap-dispenser.tsx, recap-panel.tsx, index.html, public/llms.txt
Pre-verified by requester (not re-litigated): 26/26 behavioral checks, llms.txt serves, tsc clean, chapter drift composition.

## Overall Assessment

Tight, well-commented diff. Phase machine extension is sound (all interleavings checked below), camera refactor preserves home-view behavior bit-for-bit, metadata is syntactically valid and factually accurate against the codebase. One real animation bug shipped with the closing beat — newly *visible*, partly pre-existing.

## Critical Issues

None (no security/data-loss/breaking-change findings).

## High Priority

### H1. Closing beat exposes an unbounded hero-spin unwind — visible backspin blur on every Done
`src/scene/recap/recap-dispenser.tsx:86-92`

During `reveal`, `spin.current += dt * 0.5` accumulates without bound (0.5 rad/s — ~9.5 full turns after 2 min of reading). On `close()` the else branch damps `bottle.rotation.y` from the *full accumulated angle* to 0 at k=5.5:

```ts
bottle.rotation.y += (0 - bottle.rotation.y) * (1 - Math.exp(-k * dt));
```

Initial angular velocity = k × angle. After a 2-min read: ~330 rad/s (~52 rev/s); even a quick 20 s skim gives ~8.7 rev/s. At 60 fps the per-frame delta exceeds π, so the bottle strobes/aliases while still at hero scale (scale only decays to ~58% in the first 100 ms — the bottle is fully visible during the worst of it). Pass-8 never showed this: `reset()` jumped straight to `idle` and the group unmounted the same frame. The closing beat is the first time this code path renders.

Same root cause, pre-existing sibling bug: `spin.current` is never reset, so a *second* activation's reveal snaps `rotation.y` from 0 to the stale accumulated angle on its first frame (label flips discontinuously the instant the bottle starts floating to hero).

**Minimal fix** (handles both): wrap to the nearest turn and keep `spin` synced in the else branch:

```ts
} else {
  // Unwind from the nearest turn, not every accumulated hero rotation,
  // and keep spin synced so the next reveal resumes instead of snapping.
  bottle.rotation.y =
    THREE.MathUtils.euclideanModulo(bottle.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  bottle.rotation.y += (0 - bottle.rotation.y) * (1 - Math.exp(-k * dt));
  spin.current = bottle.rotation.y;
}
```

Max unwind is then <½ turn — reads as the bottle settling square, which is the intended beat.

## Medium Priority

### M1. Stale contract comment at the top of camera-rig
`src/scene/camera-rig.tsx:12-13`

> "Before PRESS START it holds the home pose; clicking the gate simply removes it (no entry dolly animation needed)."

Both claims are now false: pre-start holds `INTRO_POSE`, and the entry dolly *is* the point of this commit. This is the file's header contract — first thing the next reader trusts. Update to describe the intro hold + arrival breath.

## Low Priority

### L1. Canvas initial camera no longer matches the pre-start target — slow backward drift behind the gate
`src/scene/scene-root.tsx:25` (`camera={{ position: [-8, 7, -34], ... }}` = `POSES.machine.pos`)

With the pre-start target now `INTRO_POSE` ([-9, 7.8, -37.8]), a non-reduced visitor sees the camera dolly *backward* ~4 units over ~3.2 s behind the gate scrim on load, then forward again on Press Start. Subtle and arguably harmless, but the comment says "hold". One-value fix: initialize the Canvas camera at the intro pose so the gate frame is static and the breath only ever plays forward. (Reduced motion is unaffected — useFrame snaps before first paint, no flash.)

### L2. JSON-LD `worksFor` — defensible now, will go stale
`index.html:52`

`worksFor` asserts *current* employment. It is consistent with the site's present-tense copy (jobTitle "Global Human Insights Intern", "I'm developing an AI agent…"), so it's defensible today. When the internship ends, switch to `alumniOf` (schema.org has no past-tense `worksFor`). Syntax validated: parses clean, `@graph` [Person, WebSite], sameAs/url match `portfolio-content.ts` and the canonical URL. Optional (skip per YAGNI): `@id` cross-link between Person and WebSite.

### L3. VendingHotspot has no `started` guard — currently unreachable, latent only
`src/scene/recap/vending-hotspot.tsx:83-116`

Verified unreachable pre-start: the gate is `fixed inset-0 z-50` with `pointerEvents: 'auto'` until `started` (start-gate.tsx:84-90), so the canvas never raycasts; the keyboard activate path (chapter-overlay.tsx:25) returns null pre-start. But if the gate ever becomes pointer-transparent, a pre-start recap would run with the camera pinned at `INTRO_POSE` (the `!isStarted` branch wins over `recapActive` in camera-rig.tsx:157-161) — coin/bottle animating half-off-frame. Not worth a guard today (YAGNI); noting so the coupling is on record.

## Edge Cases Scouted — Verified OK

- **Pre-start REDUCED**: snap to INTRO_POSE on frame 1 (useFrame runs before paint — no flash), snap to `POSES[view]` on start. Instant transitions are correct reduced-motion semantics; gate fade is also disabled there. Acceptable.
- **applyIdleDrift module-vector mutation**: safe — single CameraRig instance, `_targetPos/_targetLook.set()` precedes drift every frame, single-threaded; no reentrancy.
- **Drift mid-flight to a chapter pose**: the ≤0.47 rad/s sinusoid is low-passed by the 3.2 s damp — curved approach, no wobble. Machine-view drift is numerically identical to pass-8 (seed 0 reproduces old phases; pos.y amp 0.225 vs 0.22 — immaterial).
- **Done during closing**: impossible — pager unmounts (`open = phase === 'reveal'`, recap-panel.tsx:32, 137).
- **activate() during closing**: triple-guarded — idle-only setter (recap-context.tsx:58), hotspot null unless idle (vending-hotspot.tsx:98), DOM prompt idle-only (chapter-overlay.tsx:80).
- **ESC during closing**: capture handler stays mounted (`phase !== 'idle'`), reset → effect cleanup clears the closing timer (recap-dispenser.tsx:48), dispenser returns null → bottle vanishes mid-return. Documented intent ("escape means NOW"); acceptable. ESC racing the timer: both write 'idle', idempotent.
- **SFX on closing**: silent — effect only branches on 'coin'/'dispense' (recap-dispenser.tsx:53-56).
- **Arrow/1-4 keys during closing**: swallowed as no-ops (open=false) — correct; prevents NavigationProvider flying the camera mid-return.
- **LiveAnnouncer during closing**: falls to home message while camera still at RECAP_POSE — *identical announcement timing to pass-8* (reset fired the same message at the same click; closing→idle produces no second change, so no re-announce). Not a regression; no flag.
- **Hash/back-button during closing**: view≠machine effect resets to idle (recap-context.tsx:51-53) — same as pass-8's reveal behavior.
- **Tuple annotation** `['dispense'|'reveal'|'idle', number]`: sound — literal members ⊂ RecapPhase, contextual typing applies; `ms` computed-then-discarded under `reduced` is fine.
- **llms.txt accuracy** — all claims verified against source: chapter labels (section-registry.tsx:15-20), hash routes (navigation-context.tsx:21, 40-43), tools incl. "Internal Tooling" (portfolio-content.ts:27-58), takeaways = `learnings` paraphrase, contact links/email match, repo URL matches `origin`, tailwindcss + @react-three/postprocessing in package.json, **meshopt confirmed in both shipped GLB binaries** (EXT_meshopt_compression + quantization markers). robots.txt does not block it.

## Positive Observations

- The closing phase reuses the useFrame defaults instead of adding a parallel animation path — the timer is genuinely the only new logic. Good KISS.
- DRIFT_SEED.machine = 0 preserving the exact pass-8 phases is a careful refactor; the seed*2 on look.x keeps chapters incommensurate.
- ESC-instant vs Done-graceful distinction is documented at the state machine, not just at the call sites.
- The `['dispense'|'reveal'|'idle', number]` annotation keeps the timer table exhaustive-ish and readable.

## Recommended Actions

1. **Fix H1** (spin wrap + sync in the else branch) — the only thing I'd block the PR on; it fires on every Done.
2. Fix M1 stale header comment in the same commit.
3. Optional, same PR or never: L1 Canvas init pose; L2 revisit `worksFor` post-internship.

## Metrics

- tsc: clean (pre-verified) · Lint: not run (no lint-affecting patterns observed)
- Behavioral: 26/26 pre-verified; H1 is an unexercised *rendering* path (phase transitions all pass — the artifact is temporal aliasing, not a state bug)

## Unresolved Questions

- None blocking. H1 reproduction: open recap, stay on reveal ≥20 s, click Done — watch the bottle's first ~200 ms.
