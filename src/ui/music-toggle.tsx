import { useEffect, useRef, useState } from 'react';
import { useExperience } from '../scene/experience-context';

// Festive background music + on/off toggle. The track ("Jingle Bells" by Kevin
// MacLeod, CC BY 3.0 — attributed on the start gate) loops quietly to match the
// Coca-Cola holiday vibe. Browsers block autoplay-with-sound until a user
// gesture, so playback only starts after Press Start; the toggle persists the
// listener's choice across visits.

const SRC = '/assets/audio/festive.mp3';
const KEY = 'coke-recap:music';

export function MusicToggle() {
  const { started } = useExperience();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(KEY) !== 'off';
  });

  // One looping audio element for the lifetime of the app.
  useEffect(() => {
    const audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = 0.32;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Playback follows (started && on). The Press-Start gesture unlocks autoplay,
  // so play() is only attempted once the experience has begun.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (started && on) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [started, on]);

  useEffect(() => {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  }, [on]);

  // The control only makes sense once you're in the experience.
  if (!started) return null;

  return (
    <button
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={`Toggle festive music. Currently ${on ? 'on' : 'off'}.`}
      title="Music: “Jingle Bells” — Kevin MacLeod (incompetech.com), CC BY 3.0"
      className="fixed bottom-16 left-4 z-40 rounded-full border border-cream/20 bg-coke-black/40 px-3 py-1.5 text-xs uppercase tracking-widest text-cream/70 backdrop-blur transition hover:border-cream/40 hover:text-cream"
    >
      {on ? '♪ Music: On' : '♪ Music: Off'}
    </button>
  );
}
