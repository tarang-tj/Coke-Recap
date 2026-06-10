import { useNavigation, CHAPTERS } from '../scene/navigation-context';
import { useRecap } from '../scene/recap/recap-context';
import { useExperience } from '../scene/experience-context';
import { CHAPTER_LABELS, type ChapterId } from './sections/section-registry';

// Screen-reader narration for a no-page-reload experience. The whole site is
// a view state machine — without this, assistive tech hears nothing when the
// camera flies to a chapter or the recap opens. A visually-hidden polite
// live region announces every state change; aria-live fires on text change,
// so simply rendering the current description is enough.

export function LiveAnnouncer() {
  const { view } = useNavigation();
  const { phase } = useRecap();
  const { started } = useExperience();

  let message: string;
  if (!started) {
    // Empty until Press Start: live regions only announce text CHANGES, so
    // the orientation message must flip '' -> text at the moment it becomes
    // true — content present at mount is never spoken.
    message = '';
  } else if (phase === 'reveal') {
    // Silent: the recap panel narrates its own pages — two live regions
    // announcing the same moment would double-speak.
    message = '';
  } else if (phase === 'coin') {
    message = 'Inserting a nickel…';
  } else if (phase === 'dispense') {
    message = 'Dispensing a Coca-Cola bottle…';
  } else if (view === 'machine') {
    message = 'Home — an 1886 Atlanta street diorama. Press 1 to 4 to visit a chapter, or activate the vending machine for the recap.';
  } else {
    const i = CHAPTERS.indexOf(view as ChapterId);
    message = `${CHAPTER_LABELS[view as ChapterId]} — chapter ${i + 1} of ${CHAPTERS.length}. Escape returns home.`;
  }

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {message}
    </div>
  );
}
