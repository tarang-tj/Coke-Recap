# Level-up 7: cinematic life + sensory polish + reach

**Status:** in progress · **Branch:** `polish-pass-7` (stacked on `polish-pass-6`/PR #8)
**Mode:** ultracode (workflow discovery + adversarial review panel)

## Why

After PR #8 the content/nav story is complete. What's left is *life*: the home
shot is a static tableau (only smoke moves, camera frozen), the street lamps are
dead geometry, the recap choreography is silent, screen-reader users get no
narration of view changes, the diorama GLB starts downloading only after the JS
chunk parses, and the GitHub README undersells the project.

## Phases

1. **Discover (workflow, 3 parallel agents)** — GLB anatomy (lamp nodes +
   positions, animation clip→target map, wagon/car hierarchy — needed to judge
   the vehicle-glide idea), a11y audit of src/ui, README/repo-presentation
   audit.
2. **feat(camera): idle life** — slow sinusoidal drift of the home look target
   (+ tiny position bob), suspended during recap, reduced-motion guarded.
3. **feat(scene): living street** — flickering warm point lights at the gas
   lamps (positions from discovery; cheap, 2-4 lights, reduced-motion-safe
   steady glow) and — IF the clip map shows separate rig vs wheel tracks —
   vehicle glide: play wagon/car translation clips, keep broken wheel-spin
   clips stopped. Drop if it reads broken on screenshots.
4. **feat(audio): recap SFX** — WebAudio-synthesized coin clink + bottle
   pop/fizz on phase transitions (no audio assets, ~zero bytes); plays only
   when the music preference is on; new `src/audio/` module.
5. **feat(a11y): narration + focus** — aria-live announcer for view/page
   changes, focus the recap page body on open, sr-only h1. Scope from audit.
6. **perf(load): early GLB fetch** — preload hints for the two GLBs in
   index.html; MUST verify no duplicate fetch in the network log (drop if
   credentials-mode mismatch double-downloads).
7. **docs: README** — portfolio-grade README (hero shot, concept, stack,
   controls, attribution). Existing file update only.
8. **Verify + review** — extend the .shot suite (GLB single-fetch, live-region,
   sfx no-crash); eyeball all shots; workflow review panel (correctness / a11y /
   perf-r3f lenses) on the full diff; fix findings.

## Out of scope

Wheel re-rig in Blender, service worker, copy rewrites (Tarang's voice),
git-history purge, custom domain.
