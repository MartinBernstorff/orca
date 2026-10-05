import type { JSX } from 'react'
import type { WorktreeContextMenuModel } from './use-worktree-context-menu-model'
import { WorktreeStatusMenuItems } from './WorktreeStatusMenuItems'
import { WorkspacePriorityMenuItems } from './WorkspacePriorityMenuItems'
import { WorkspaceEngagementMenuItems } from './WorkspaceEngagementMenuItems'

/** Context-menu setters for the user-set fields the sidebar can group by. */
export function WorkspaceGroupingFieldMenuItems({
  model
}: {
  model: WorktreeContextMenuModel
}): JSX.Element {
  return (
    <>
      <WorktreeStatusMenuItems
        contextWorkspaceStatus={model.contextWorkspaceStatus}
        deletingContext={model.deletingContext}
        isMultiContext={model.isMultiContext}
        onAssignWorkspaceStatus={model.handleAssignWorkspaceStatus}
        workspaceStatuses={model.workspaceStatuses}
      />
      <WorkspacePriorityMenuItems
        disabled={model.deletingContext}
        worktrees={model.activeContextWorktrees}
        onSetPriority={model.handleSetPriority}
      />
      <WorkspaceEngagementMenuItems
        disabled={model.deletingContext}
        worktrees={model.activeContextWorktrees}
        onSetEngagement={model.handleSetEngagement}
      />
    </>
  )
}
