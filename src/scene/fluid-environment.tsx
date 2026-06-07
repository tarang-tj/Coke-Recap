import { Bubbles } from './bubbles';
import { useNavigation } from './navigation-context';

// FluidEnvironment — carbonation bubbles for the abstract chapter views.
// Gated on chapter views only (role / tools / agent / takeaways / bottle).
// Hidden on 'exterior' and 'machine' to avoid the "red floating circles" vibe
// leaking into the store/machine scenes.

export function FluidEnvironment() {
  const { view } = useNavigation();
  const isChapterView = view !== 'exterior' && view !== 'machine';
  if (!isChapterView) return null;
  return <Bubbles />;
}
