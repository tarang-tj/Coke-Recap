# Level-up 9: cinematic feel + signature reach

**Status:** ✅ complete — PR pending · **Branch:** `polish-pass-9` (stacked on 8)

## The cut

Engineering is solid after passes 6-8; "amazing" lives in feel. Shipped:

1. **Arrival breath** — pre-start the camera holds the home pose pulled back
   ~12% (INTRO_POSE); Press Start glides in over ~3 s. Deep links breathe into
   their chapter pose the same way.
2. **Per-chapter idle drift** — view-seeded incommensurate sway (half home
   amplitude). On touch (no mouse parallax) chapters were freeze-frames.
3. **Recap closing beat** — Done / back-to-machine enters a new `closing`
   phase: bottle returns to the tray (~0.9 s) before the camera frees. ESC
   stays instant.
4. **JSON-LD** Person + WebSite in index.html; **/llms.txt** — text-readable
   portfolio for AI agents (on brand for an AI-martech internship).

Dropped: procedural birds (no bird nodes found in the GLB; probe errored —
hard-dropped per timebox rule).

## Verification

26/26 prod-preview checks (Done-button path now exercises `closing`);
llms.txt 200; role-chapter composition eyeballed with drift. Reviewer pass
before PR.
