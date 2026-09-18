import type { WorktreeCardInteraction } from '../ui-chrome-types'

/** Every card interaction, in canonical order. Client schemas derive their
 *  accepted value domain from this so a new interaction cannot drift out of them. */
export const WORKTREE_CARD_INTERACTIONS = [
  'delete'
] as const satisfies readonly WorktreeCardInteraction[]

// Why: destructive affordances stay opt-in; without this, delete is reachable only while holding Option/Alt.
export const DEFAULT_WORKTREE_CARD_INTERACTIONS: WorktreeCardInteraction[] = []

export function normalizeWorktreeCardInteractions(
  interactions: readonly unknown[] | null | undefined
): WorktreeCardInteraction[] {
  const source = interactions ?? DEFAULT_WORKTREE_CARD_INTERACTIONS
  return WORKTREE_CARD_INTERACTIONS.filter((interaction) => source.includes(interaction))
}
