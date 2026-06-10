import { audioPrefOn } from './audio-prefs';

// Recap sound effects, synthesized with WebAudio — zero audio assets, zero
// network bytes. Two cues matching the dispense choreography:
//   coin clink  — two detuned high partials + a noise tick, fast decay
//   bottle pop + fizz — a short downward pitch sweep, then band-passed noise
// All cues are gated on the shared audio preference (music off = silence) and
// every call is try/caught: SFX must never be able to break the experience.

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    // The recap starts from a click, so we're inside a user-activation window
    // and resume() is allowed.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null; // no WebAudio (ancient browser / autoplay policy) — stay silent
  }
}

// Shared 1-second white-noise buffer, built lazily once.
let noiseBuffer: AudioBuffer | null = null;
function noise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function envGain(ac: AudioContext, t0: number, peak: number, decay: number): GainNode {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  g.connect(ac.destination);
  return g;
}

export function playCoinClink(): void {
  if (!audioPrefOn()) return;
  try {
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + 0.18; // a beat after the coin starts dropping

    // Two detuned metallic partials.
    [2350, 3150].forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(envGain(ac, t0 + i * 0.004, 0.09, 0.16));
      osc.start(t0);
      osc.stop(t0 + 0.25);
    });

    // Tiny impact tick.
    const tick = ac.createBufferSource();
    tick.buffer = noise(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4200;
    bp.Q.value = 1.2;
    tick.connect(bp);
    bp.connect(envGain(ac, t0, 0.06, 0.06));
    tick.start(t0);
    tick.stop(t0 + 0.1);
  } catch {
    /* never let SFX break the recap */
  }
}

export function playBottleFizz(): void {
  if (!audioPrefOn()) return;
  try {
    const ac = ensureContext();
    if (!ac) return;
    const t0 = ac.currentTime + 0.05;

    // Cap pop — quick downward sweep.
    const pop = ac.createOscillator();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(360, t0);
    pop.frequency.exponentialRampToValueAtTime(90, t0 + 0.07);
    pop.connect(envGain(ac, t0, 0.16, 0.12));
    pop.start(t0);
    pop.stop(t0 + 0.15);

    // Carbonation fizz — band-passed noise swelling in and dying away.
    const fizz = ac.createBufferSource();
    fizz.buffer = noise(ac);
    fizz.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 5200;
    bp.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.1);
    fizz.connect(bp);
    bp.connect(g);
    g.connect(ac.destination);
    fizz.start(t0 + 0.04);
    fizz.stop(t0 + 1.2);
  } catch {
    /* never let SFX break the recap */
  }
}
