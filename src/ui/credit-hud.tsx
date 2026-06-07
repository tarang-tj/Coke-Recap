import { useExperience } from '../scene/experience-context';
import { useNavigation } from '../scene/navigation-context';
import { useReducedMotion } from '../hooks/use-reduced-motion';

// Bottom-right authorship credit. Shown on the Press-Start gate and machine-hub
// view; hidden inside chapter views so it doesn't compete with chapter copy.
// Never unmounted — toggled via opacity so the fade transition always fires.

export function CreditHud() {
  const { started } = useExperience();
  const { view } = useNavigation();
  const reducedMotion = useReducedMotion();

  // Visible when the gate is still up OR we're back at the machine hub.
  const show = !started || view === 'machine';

  return (
    <p
      aria-hidden="true"
      className="pointer-events-none fixed bottom-6 right-7 z-30 font-body text-[0.55rem] uppercase tracking-[0.4em] text-off-white/45"
      style={{
        opacity: show ? 1 : 0,
        transition: reducedMotion ? 'none' : 'opacity 200ms ease',
      }}
    >
      by TJ Jammalamadaka
    </p>
  );
}
