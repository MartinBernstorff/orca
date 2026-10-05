import type {
  WorkspaceStatus,
  WorkspaceStatusDefinition
} from '../../../../../../shared/worktree/types'
import { normalizeWorkspaceEngagement } from '../../../../../../shared/worktree/engagement'
import { getGroupKeyPathSegments } from '../../../../../../shared/sidebar-group-by-levels'
import { getWorkspaceStatusFromGroupKey } from '../../workspace-status'
import { getWorkspaceEngagementLaneKey } from '../../workspace-engagement-meta'
import { getWorktreeLineageDropTargetId } from '../../worktree-lineage-drag-drop'
import type { WorktreeSidebarStatusDropTarget } from '../../worktree-sidebar-drop-preview'
import { NO_WORKTREE_SIDEBAR_DROP_TARGET, type WorktreeSidebarLineageDropTarget } from './row-state'

export function getPointerDropStatusTarget(args: {
  container: HTMLElement
  x: number
  y: number
}): WorktreeSidebarLineageDropTarget {
  const target = document.elementFromPoint(args.x, args.y)
  if (!(target instanceof Element) || !args.container.contains(target)) {
    return NO_WORKTREE_SIDEBAR_DROP_TARGET
  }
  const pinTarget = target.closest<HTMLElement>('[data-workspace-pin-drop-target]')
  if (pinTarget && args.container.contains(pinTarget)) {
    return { status: null, isPinDrop: true, engagement: null, lineageParentId: null }
  }
  const engagementTarget = target.closest<HTMLElement>('[data-workspace-engagement-drop-target]')
  if (engagementTarget && args.container.contains(engagementTarget)) {
    return {
      status: null,
      isPinDrop: false,
      engagement: normalizeWorkspaceEngagement(engagementTarget.dataset.workspaceEngagement),
      lineageParentId: null
    }
  }
  const lineageParentId = getWorktreeLineageDropTargetId({
    container: args.container,
    target,
    pointerY: args.y
  })
  const statusTarget = target.closest<HTMLElement>('[data-workspace-status-drop-target]')
  return {
    status:
      statusTarget && args.container.contains(statusTarget)
        ? ((statusTarget.dataset.workspaceStatus as WorkspaceStatus | undefined) ?? null)
        : null,
    isPinDrop: false,
    engagement: null,
    lineageParentId
  }
}

export function shouldPreferSidebarStatusDropTarget(args: {
  sourceGroupKey: string
  target: WorktreeSidebarStatusDropTarget
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
}): boolean {
  if (args.target.isPinDrop) {
    return true
  }
  if (args.target.engagement) {
    // Why: the source lane's own header keeps the reorder path, like a same-status drop.
    return !getGroupKeyPathSegments(args.sourceGroupKey).includes(
      getWorkspaceEngagementLaneKey(args.target.engagement)
    )
  }
  if (!args.target.status) {
    return false
  }
  // Why: under nested grouping, sourceGroupKey is the full path (e.g. status:in-progress␟priority:high),
  // so we must extract just the status segment with getGroupKeyPathSegments, as engagement does above.
  const segments = getGroupKeyPathSegments(args.sourceGroupKey)
  const sourceStatus = segments
    .map((seg) => getWorkspaceStatusFromGroupKey(seg, args.workspaceStatuses))
    .find((status) => status !== null)
  // Why: overlapping edge zones — the section under the pointer must win so guide and drop agree.
  return sourceStatus !== null && args.target.status !== sourceStatus
}
