// Shared audio preference — one localStorage key consumed by both the music
// toggle (background ragtime) and the recap SFX (coin clink / bottle fizz).
// One switch governs ALL sound: visitors who turned music off get a fully
// silent experience, no surprise effects.

export const MUSIC_PREF_KEY = 'coke-recap:music';

export function audioPrefOn(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUSIC_PREF_KEY) !== 'off';
}
