import type { WorktreeCardGroupingField } from '../ui-chrome-types'

/** Every card grouping field, in title-row render order. Client schemas derive
 *  their accepted value domain from this so a new field cannot drift out of them. */
export const WORKTREE_CARD_GROUPING_FIELDS = [
  'workspace-status',
  'priority'
] as const satisfies readonly WorktreeCardGroupingField[]

// Why: priority rendered unconditionally before it became toggleable, so absent state keeps it on.
export const DEFAULT_WORKTREE_CARD_GROUPING_FIELDS: WorktreeCardGroupingField[] = ['priority']

export function normalizeWorktreeCardGroupingFields(
  fields: readonly unknown[] | null | undefined
): WorktreeCardGroupingField[] {
  const source = fields ?? DEFAULT_WORKTREE_CARD_GROUPING_FIELDS
  return WORKTREE_CARD_GROUPING_FIELDS.filter((field) => source.includes(field))
}
