# Phonograph treatment for nostalgic music — report

Date: 2026-06-10 | Branch: polish-pass-10 | Status: DONE

## What changed

**NEW `src/audio/phonograph-chain.ts`** (160 lines)
- `createPhonographChain(audioEl)` → `{ connect, suspend, dispose }`.
- Graph: MediaElementSource → highpass 180 Hz → lowpass 3.2 kHz → master gain → destination.
- Master gain 0.38 (old element volume was 0.32; filters shave a couple dB, so perceived loudness lands ≈ same).
- Crackle bed: generated 2.5 s AudioBuffer — seeded PRNG (mulberry32, seed 0x1886) so it's identical every visit; 45 pops/s as short exp-decaying impulses with random amplitude/polarity + faint 0.012 noise floor — looped → bandpass 2.5 kHz (Q 0.9) → gain 0.05 → same master gain (toggle silences everything).
- `connect()` idempotent: lazy ctx on first call (post-Press-Start gesture), `webkitAudioContext` fallback for old Safari, `resume()` if suspended. `createMediaElementSource` is called FIRST inside the try so the catch can safely fall back to plain element playback at volume 0.32 (un-treated music, never silence).
- `suspend()` halts ctx (music + crackle). `dispose()` stops crackle + closes ctx.

**`src/ui/music-toggle.tsx`** (106 lines)
- Element no longer sets volume; chain owns loudness. `chain.connect()` before `play()` (MediaElementSource claims the element's output permanently).
- Toggle off / tab hidden: pause element AND `chain.suspend()` — crackle is ctx-driven and would otherwise keep hissing.
- Unmount: pause + `chain.dispose()` + discard both refs (fresh pair on remount — a closed ctx kills the claimed element).
- Title: `…CC BY 3.0 — phonograph treatment`; aria-label mentions phonograph treatment.
- localStorage behavior unchanged (same `MUSIC_PREF_KEY`, same on/off writes). Track file and start-gate attribution untouched.

## Verification
- `npm run typecheck` — clean.
- `node .shot-diag.mjs http://localhost:5173 /tmp/phono-home.png` (autoplay enabled, start gate auto-passed, music pref defaults on → chain actually constructed): **no console errors, no failed requests**, home diorama renders normally with toggle visible.
- StrictMode checked: refs are null during the mount double-invoke (chain only built after Press Start); a live-music remount disposes and rebuilds a fresh element+chain pair.

## Unresolved questions
- Gain values (master 0.38, crackle 0.05) are tuned by reasoning, not by ear — worth a human listen; both are named constants at the top of phonograph-chain.ts.
