import { useEffect, useRef, useState } from 'react';
import { useExperience } from '../scene/experience-context';
import { MUSIC_PREF_KEY as KEY, audioPrefOn } from '../audio/audio-prefs';
import { createPhonographChain, type PhonographChain } from '../audio/phonograph-chain';

// Background music + on/off toggle. The track ("Fig Leaf Times Two" by Kevin
// MacLeod, CC BY 3.0 — attributed on the start gate) is a light old-timey
// ragtime that matches the 1886 soda-fountain setting. The element is routed
// through a WebAudio "phonograph" chain (horn band-limit + shellac crackle —
// see audio/phonograph-chain.ts), which also owns the loudness via its master
// gain. Browsers block autoplay-with-sound until a user gesture, so playback
// only starts after Press Start; the toggle persists the listener's choice
// across visits.

const SRC = '/assets/audio/ambient-ragtime.m4a';

export function MusicToggle() {
  const { started } = useExperience();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chainRef = useRef<PhonographChain | null>(null);
  const [on, setOn] = useState<boolean>(audioPrefOn); // throw-safe storage read

  // Playback follows (started && on). The Press-Start gesture unlocks autoplay,
  // so play() is only attempted once the experience has begun.
  //
  // The Audio element is constructed LAZILY on the first play: with an eager
  // `new Audio(SRC)` + preload the browser pulled the whole multi-MB track at
  // page load — competing with three.js and the diorama GLB for first-paint
  // bandwidth, even for visitors who had music toggled off.
  //
  // No element volume here: loudness lives in the phonograph chain's master
  // gain. The chain must be connected BEFORE play — once it claims the element
  // via MediaElementAudioSourceNode, sound only flows through the graph. When
  // toggled off, the element is paused AND the chain suspended: the crackle
  // bed is context-driven, so a pause alone would leave it hissing.
  useEffect(() => {
    if (started && on) {
      if (!audioRef.current) {
        const audio = new Audio(SRC);
        audio.loop = true;
        audioRef.current = audio;
        chainRef.current = createPhonographChain(audio);
      }
      chainRef.current?.connect(); // idempotent; resumes if suspended
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
      chainRef.current?.suspend();
    }
  }, [started, on]);

  // Pause when the tab is hidden; resume on return if still enabled. Audio
  // elements are exempt from the browser's background-tab throttling, so
  // without this the ragtime keeps playing over whatever tab you switch to.
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
        chainRef.current?.suspend(); // crackle ignores the element pause
      } else if (started && on) {
        chainRef.current?.connect();
        audio.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [started, on]);

  // Stop playback if the toggle ever unmounts. The chain is disposed (crackle
  // stopped, context closed) and the claimed element discarded with it — a
  // remount builds a fresh pair.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      chainRef.current?.dispose();
      chainRef.current = null;
      audioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      /* storage blocked — preference just won't persist */
    }
  }, [on]);

  // The control only makes sense once you're in the experience.
  if (!started) return null;

  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={`Toggle music (phonograph treatment). Currently ${on ? 'on' : 'off'}.`}
      title="Music: “Fig Leaf Times Two” — Kevin MacLeod (incompetech.com), CC BY 3.0 — phonograph treatment"
      className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 md:top-auto md:right-auto md:bottom-16 md:left-4 z-40 rounded-full border border-cream/20 bg-coke-black/40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 backdrop-blur transition hover:border-cream/40 hover:text-cream"
    >
      {on ? '♪ Music: On' : '♪ Music: Off'}
    </button>
  );
}
