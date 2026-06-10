// Period "phonograph" treatment for the background ragtime. The raw track is
// far too clean for an 1890s pharmacy, so the <audio> element is routed
// through a small WebAudio graph: band-limited to a brass-horn frequency
// window, with a generated shellac-crackle bed mixed in underneath.
//
//   media element ── highpass 180 Hz ── lowpass 3.2 kHz ──┐
//                                                          ├── master ── out
//   crackle loop ─── bandpass 2.5 kHz ── crackle gain ────┘
//
// Everything feeds one master gain, so the existing music toggle silences the
// whole soundscape (suspend) — music and crackle together.
//
// CAUTION: creating a MediaElementAudioSourceNode permanently reroutes the
// element's output through this graph — the element is silent on its own from
// then on. connect() is therefore idempotent and the chain must live as long
// as the element does; dispose() discards both together.

export interface PhonographChain {
  /** Build the graph (once) and resume it if suspended. Call before/at play. */
  connect(): void;
  /** Halt all output — filtered music AND the crackle bed. */
  suspend(): void;
  /** Tear down for good. The element cannot produce audio afterwards. */
  dispose(): void;
}

// Effective music loudness. The element used to play at volume 0.32; the
// band-limit filters shave a couple of dB of energy, so the master gain sits
// slightly above that to land at roughly the same perceived level.
const MASTER_GAIN = 0.38;
const FALLBACK_ELEMENT_VOLUME = 0.32; // un-treated playback if WebAudio fails
const HIGHPASS_HZ = 180; // horn can't reproduce lows…
const LOWPASS_HZ = 3200; // …or anything bright
const CRACKLE_GAIN = 0.05;
const CRACKLE_BANDPASS_HZ = 2500;
const CRACKLE_SECONDS = 2.5;
const CRACKLE_POPS_PER_SECOND = 45;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Deterministic PRNG (mulberry32) so the crackle bed is identical on every
// visit — a stable part of the soundscape rather than a random one.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCrackleBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(CRACKLE_SECONDS * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const rand = mulberry32(0x1886); // seed nods to the soda fountain's year

  // Faint surface-noise floor under the pops — shellac hiss.
  for (let i = 0; i < length; i++) data[i] = (rand() * 2 - 1) * 0.012;

  // Sparse pops: short exponentially-decaying impulses at random positions
  // with varying amplitude and polarity — dust under the needle.
  const pops = Math.floor(CRACKLE_SECONDS * CRACKLE_POPS_PER_SECOND);
  for (let p = 0; p < pops; p++) {
    const at = Math.floor(rand() * (length - 64));
    const amp = (0.25 + rand() * 0.75) * (rand() < 0.5 ? -1 : 1);
    const span = 8 + Math.floor(rand() * 24); // ≈0.2–0.7 ms at 44.1 kHz
    for (let i = 0; i < span; i++) data[at + i] += amp * Math.exp(-i / (span * 0.35));
  }
  return buffer;
}

export function createPhonographChain(audioEl: HTMLAudioElement): PhonographChain {
  let ctx: AudioContext | null = null;
  let crackle: AudioBufferSourceNode | null = null;
  let failed = false;
  let disposed = false;

  const connect = (): void => {
    if (failed || disposed) return;
    if (ctx) {
      // Already built — just wake it up (suspended by toggle-off / tab-hide).
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    try {
      // Lazy AudioContext: by the time music first plays, the Press-Start
      // gesture has already unlocked audio. Safari still ships the prefixed
      // constructor on older versions.
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) throw new Error('WebAudio unavailable');
      ctx = new Ctor();

      // Claim the element FIRST: createMediaElementSource is the only call
      // here with a realistic failure mode (element already claimed), and
      // failing before it lets the catch fall back to plain element playback.
      const source = ctx.createMediaElementSource(audioEl);

      const master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);

      // Music path: element -> horn band-limit -> master.
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = HIGHPASS_HZ;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = LOWPASS_HZ;
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(master);

      // Crackle bed: looped generated buffer -> bandpass -> own gain -> master.
      crackle = ctx.createBufferSource();
      crackle.buffer = buildCrackleBuffer(ctx);
      crackle.loop = true;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = CRACKLE_BANDPASS_HZ;
      bandpass.Q.value = 0.9;
      const crackleGain = ctx.createGain();
      crackleGain.gain.value = CRACKLE_GAIN;
      crackle.connect(bandpass);
      bandpass.connect(crackleGain);
      crackleGain.connect(master);
      crackle.start();

      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch {
      // No WebAudio (or the element was already claimed). Fall back to plain
      // element playback at the historical volume — music still works, just
      // without the period treatment.
      failed = true;
      ctx?.close().catch(() => {});
      ctx = null;
      crackle = null;
      audioEl.volume = FALLBACK_ELEMENT_VOLUME;
    }
  };

  const suspend = (): void => {
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  };

  const dispose = (): void => {
    disposed = true;
    try {
      crackle?.stop();
    } catch {
      /* already stopped */
    }
    crackle = null;
    ctx?.close().catch(() => {});
    ctx = null;
  };

  return { connect, suspend, dispose };
}
