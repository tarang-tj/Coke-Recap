import { Bubbles } from './bubbles';
import { useNavigation } from './navigation-context';

// FluidEnvironment — carbonation bubbles for the abstract chapter views.
// Gated on chapter views only (role / tools / agent / takeaways / bottle).
// Hidden on 'machine' to avoid the "red floating circles" vibe leaking into
// the corner-block home scene.

export function FluidEnvironment() {
  const { view } = useNavigation();
  if (view === 'machine') return null;
  return <Bubbles />;
}
