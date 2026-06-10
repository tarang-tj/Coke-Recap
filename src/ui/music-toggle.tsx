import { useEffect, useRef, useState } from 'react';
import { useExperience } from '../scene/experience-context';
import { MUSIC_PREF_KEY as KEY } from '../audio/audio-prefs';

// Background music + on/off toggle. The track ("Fig Leaf Times Two" by Kevin
// MacLeod, CC BY 3.0 — attributed on the start gate) is a light old-timey
// ragtime that matches the 1886 soda-fountain setting. Browsers block
// autoplay-with-sound until a user gesture, so playback only starts after
// Press Start; the toggle persists the listener's choice across visits.

const SRC = '/assets/audio/ambient-ragtime.m4a';

export function MusicToggle() {
  const { started } = useExperience();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(KEY) !== 'off';
  });

  // Playback follows (started && on). The Press-Start gesture unlocks autoplay,
  // so play() is only attempted once the experience has begun.
  //
  // The Audio element is constructed LAZILY on the first play: with an eager
  // `new Audio(SRC)` + preload the browser pulled the whole multi-MB track at
  // page load — competing with three.js and the diorama GLB for first-paint
  // bandwidth, even for visitors who had music toggled off.
  useEffect(() => {
    if (started && on) {
      if (!audioRef.current) {
        const audio = new Audio(SRC);
        audio.loop = true;
        audio.volume = 0.32;
        audioRef.current = audio;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [started, on]);

  // Stop playback if the toggle ever unmounts.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  }, [on]);

  // The control only makes sense once you're in the experience.
  if (!started) return null;

  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={`Toggle music. Currently ${on ? 'on' : 'off'}.`}
      title="Music: “Fig Leaf Times Two” — Kevin MacLeod (incompetech.com), CC BY 3.0"
      className="fixed top-4 right-4 md:top-auto md:right-auto md:bottom-16 md:left-4 z-40 rounded-full border border-cream/20 bg-coke-black/40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 backdrop-blur transition hover:border-cream/40 hover:text-cream"
    >
      {on ? '♪ Music: On' : '♪ Music: Off'}
    </button>
  );
}
