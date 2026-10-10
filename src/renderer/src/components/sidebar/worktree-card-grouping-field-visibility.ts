import { WORKTREE_CARD_GROUPING_FIELDS } from '../../../../shared/worktree/card-grouping-fields'
import {
  normalizeNestedGroupBy,
  type SidebarGroupBy
} from '../../../../shared/sidebar-group-by-levels'
import type { WorktreeCardGroupingField } from '../../../../shared/ui-chrome-types'

export type WorktreeCardGroupingFieldVisibility = {
  showWorkspaceStatus: boolean
  showPriority: boolean
}

/** Grouping fields already shown by a group header at some sidebar grouping level. */
export function getGroupedWorktreeCardFields(
  groupBy: SidebarGroupBy,
  nestedGroupBy: unknown
): WorktreeCardGroupingField[] {
  const levels: SidebarGroupBy[] =
    groupBy === 'none' ? [] : [groupBy, ...normalizeNestedGroupBy(groupBy, nestedGroupBy)]
  return WORKTREE_CARD_GROUPING_FIELDS.filter((field) => levels.includes(field))
}

export function resolveWorktreeCardGroupingFieldVisibility({
  enabledFields,
  groupedFields,
  inPinnedSection,
  newCardStyle
}: {
  enabledFields: readonly WorktreeCardGroupingField[]
  groupedFields: readonly WorktreeCardGroupingField[]
  inPinnedSection: boolean
  newCardStyle: boolean
}): WorktreeCardGroupingFieldVisibility {
  // Why: the toggles only exist on new-style cards; legacy cards keep their always-on priority icon.
  if (!newCardStyle) {
    return { showWorkspaceStatus: false, showPriority: true }
  }
  // Why: pinned mixes workspaces from every group, so the group header no longer carries the value.
  const isVisible = (field: WorktreeCardGroupingField): boolean =>
    enabledFields.includes(field) && (inPinnedSection || !groupedFields.includes(field))
  return {
    showWorkspaceStatus: isVisible('workspace-status'),
    showPriority: isVisible('priority')
  }
}
