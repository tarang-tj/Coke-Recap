# Adversarial review panel — polish-pass-7 (3 lenses)

3 parallel reviewers (r3f / react / a11y) on `git diff polish-pass-6...polish-pass-7`.
All findings fixed in the `fix(review)` commit except one accepted-low.

## Fixed

- **[high a11y] recap-panel live region born with its first message** — live
  regions only announce text CHANGES in an existing region; mounted-with-content
  is the classic NVDA/VoiceOver silent case. Region now always mounted ('' when
  closed), visual panel gated on `open`.
- **[high r3f] vehicle loop-seam teleports visible from takeaways pull-back**
  (geometrically confirmed: half-width ~36 wu at street plane). Vehicles gated
  to the home view only (was already in the working tree, now committed).
- **[med ×2] LiveAnnouncer home message never announced on first entry** — it
  was the region's initial content (mount ≠ change). Now '' until Press Start;
  the ''→text flip announces.
- **[med a11y] hint button label-in-name (WCAG 2.5.3)** — aria-label now starts
  with the visible text "Click the Coca-Cola machine — …" so voice-control users
  can target it.
- **[med a11y] start gate aria-hidden-focus during the 600 ms fade** — replaced
  `aria-hidden={started}` with React 19 `inert={started}` (blurs + removes from
  the tree in one attribute).
- **[low r3f] lamps strand at random mid-flicker intensity if reduced-motion
  flips mid-session** — reduced path now writes the steady BASE values.
- **[low react] `audioPrefOn()` raw localStorage read throws under blocked
  storage** and escaped both SFX try blocks → try/catch returning default-on.
  Same hardening for music-toggle + reduced-motion-toggle reads/writes.
- **[low react] `void ctx.resume()` unhandled rejection** → `.catch(() => {})`.
- **[low a11y] ReducedMotionToggle was a tabbable control behind the modal
  gate** → renders null pre-start (pref still applied via body attribute).

## Accepted (not fixed)

- **[low r3f] fadeIn/fadeOut restart mid-ramp snaps vehicle weight** (three.js
  always schedules fades from 0/1, not current weight) on sub-600 ms view
  flips. Fix needs the private `_scheduleFading`; the 3.2 s camera glide hides
  the pop. Revisit only if visible in practice.

## Verified non-issues (worth remembering)

- Wheel-pivot identity reset is safe/idempotent: rig clips are position-only,
  wheel clips quaternion-only and never activated, so `useAnimations` never
  snapshots/restores the bad baked rest pose.
- StreetLamps' per-frame `emissiveIntensity` write is a plain uniform update
  (no recompile); its 3 PointLights mount in the same Suspense commit as the
  diorama → light count stable from first compile, no mid-session recompile.
- The 700 ms vehicle stop-timer cannot race the 0.6 s fade; cleanup-before-rerun
  clears stale timers on every machine→chapter→machine interleaving.
- Headless-only: SwiftShader shader-recompile freezes (10 s+) when
  PerformanceMonitor drops perfFactor — suite uses a 30 s budget for the
  keyboard recap check; real GPUs recompile in ~100 ms.
