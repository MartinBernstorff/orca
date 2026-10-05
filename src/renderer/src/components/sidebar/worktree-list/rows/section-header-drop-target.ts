import type React from 'react'
import type { WorkspaceEngagement } from '../../../../../../shared/worktree/engagement'
import type { WorkspaceStatus } from '../../../../../../shared/worktree/types'

type SectionHeaderDropContext = {
  dragOverStatus: WorkspaceStatus | null
  dragOverEngagement: WorkspaceEngagement | null
  pinDragOver: boolean
  onWorkspaceStatusDragOver: (event: React.DragEvent, status: WorkspaceStatus) => void
  onWorkspaceStatusDragLeave: (event: React.DragEvent) => void
  onWorkspacePinDragOver: (event: React.DragEvent) => void
  onWorkspacePinDragLeave: (event: React.DragEvent) => void
  onWorkspaceEngagementDragOver: (event: React.DragEvent, engagement: WorkspaceEngagement) => void
  onWorkspaceEngagementDragLeave: (event: React.DragEvent) => void
  onWorkspaceStatusDrop: (event: React.DragEvent, status: WorkspaceStatus) => void
}

/** DOM markers, native-drag handlers, and hover state for a header that accepts workspace drops. */
export function getSectionHeaderDropTarget(
  ctx: SectionHeaderDropContext,
  target: {
    status: WorkspaceStatus | null
    engagement: WorkspaceEngagement | null
    isPinned: boolean
  }
) {
  const { status, engagement, isPinned } = target
  const isDragOver =
    (status !== null && ctx.dragOverStatus === status) ||
    (engagement !== null && ctx.dragOverEngagement === engagement) ||
    (isPinned && ctx.pinDragOver)
  return {
    isDragOver,
    props: {
      'data-workspace-status-drop-target': status ? '' : undefined,
      'data-workspace-status': status ?? undefined,
      'data-workspace-pin-drop-target': isPinned ? '' : undefined,
      'data-workspace-engagement-drop-target': engagement ? '' : undefined,
      'data-workspace-engagement': engagement ?? undefined,
      onDragOver: isPinned
        ? ctx.onWorkspacePinDragOver
        : engagement
          ? (event: React.DragEvent) => ctx.onWorkspaceEngagementDragOver(event, engagement)
          : status
            ? (event: React.DragEvent) => ctx.onWorkspaceStatusDragOver(event, status)
            : undefined,
      onDragLeave: isPinned
        ? ctx.onWorkspacePinDragLeave
        : engagement
          ? ctx.onWorkspaceEngagementDragLeave
          : status
            ? ctx.onWorkspaceStatusDragLeave
            : undefined,
      // Why: native engagement drops commit from the document capture listener, like pin drops.
      onDrop: status
        ? (event: React.DragEvent) => ctx.onWorkspaceStatusDrop(event, status)
        : undefined
    }
  }
}
