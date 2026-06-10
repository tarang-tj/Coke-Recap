import type { ReactElement } from 'react';
import type { ViewId } from '../../scene/navigation-context';
import { RoleSection } from './role-section';
import { ToolsSection } from './tools-section';
import { AgentSection } from './agent-section';
import { LearningsSection } from './learnings-section';

// Single source of truth mapping chapter ids → labels + content components.
// Two surfaces render the same four chapters — the chapter overlay (3-D tour
// mode) and the recap panel (story mode) — so the mapping lives here and the
// copy can never drift between them.

export type ChapterId = Exclude<ViewId, 'machine'>;

export const CHAPTER_LABELS: Record<ChapterId, string> = {
  role: 'The Role',
  tools: 'The Stack',
  agent: 'The Agent',
  takeaways: 'Takeaways',
};

export const CHAPTER_SECTIONS: Record<ChapterId, () => ReactElement> = {
  role: RoleSection,
  tools: ToolsSection,
  agent: AgentSection,
  takeaways: LearningsSection,
};
