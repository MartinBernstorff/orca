import { useEffect } from 'react'
import type React from 'react'
import {
  normalizeWorkspaceEngagement,
  type WorkspaceEngagement
} from '../../../../shared/worktree/engagement'
import type { WorkspaceStatus } from '../../../../shared/worktree/types'
import { hasWorkspaceDragData, readWorkspaceDragDataIds } from './workspace-status'

const WORKSPACE_STATUS_DROP_TARGET = '[data-workspace-status-drop-target]'
const WORKSPACE_PIN_DROP_TARGET = '[data-workspace-pin-drop-target]'
const WORKSPACE_ENGAGEMENT_DROP_TARGET = '[data-workspace-engagement-drop-target]'

type MoveWorktreeToStatus = (worktreeId: string, status: WorkspaceStatus) => void
type MoveWorktreesToStatus = (worktreeIds: readonly string[], status: WorkspaceStatus) => void
type PinWorktree = (worktreeId: string) => void
type PinWorktrees = (worktreeIds: readonly string[]) => void
type SetWorktreesEngagement = (
  worktreeIds: readonly string[],
  engagement: WorkspaceEngagement
) => void

type WorkspaceStatusDocumentDropOptions = {
  onMoveWorktreesToStatus?: MoveWorktreesToStatus
  onPinWorktrees?: PinWorktrees
  onSetWorktreesEngagement?: SetWorktreesEngagement
}

export function commitWorkspaceStatusDocumentDrop(params: {
  worktreeIds: readonly string[]
  status: WorkspaceStatus | null
  isPinDrop: boolean
  engagement?: WorkspaceEngagement | null
  onMoveWorktreeToStatus: MoveWorktreeToStatus
  onMoveWorktreesToStatus?: MoveWorktreesToStatus
  onPinWorktree: PinWorktree
  onPinWorktrees?: PinWorktrees
  onSetWorktreesEngagement?: SetWorktreesEngagement
}): void {
  const {
    worktreeIds,
    status,
    isPinDrop,
    onMoveWorktreeToStatus,
    onMoveWorktreesToStatus,
    onPinWorktree,
    onPinWorktrees,
    engagement,
    onSetWorktreesEngagement
  } = params

  if (isPinDrop) {
    if (onPinWorktrees) {
      onPinWorktrees(worktreeIds)
      return
    }
    for (const worktreeId of worktreeIds) {
      onPinWorktree(worktreeId)
    }
    return
  }

  if (engagement) {
    onSetWorktreesEngagement?.(worktreeIds, engagement)
    return
  }

  if (!status) {
    return
  }

  if (onMoveWorktreesToStatus) {
    onMoveWorktreesToStatus(worktreeIds, status)
    return
  }

  for (const worktreeId of worktreeIds) {
    onMoveWorktreeToStatus(worktreeId, status)
  }
}

export function useWorkspaceStatusDocumentDrop<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  onMoveWorktreeToStatus: MoveWorktreeToStatus,
  onPinWorktree: PinWorktree,
  onDragFinish: () => void,
  enabled = true,
  options?: WorkspaceStatusDocumentDropOptions
): void {
  const { onMoveWorktreesToStatus, onPinWorktrees, onSetWorktreesEngagement } = options ?? {}

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleDrop = (event: DragEvent): void => {
      const dataTransfer = event.dataTransfer
      if (!dataTransfer || !hasWorkspaceDragData(dataTransfer)) {
        return
      }

      onDragFinish()

      const container = containerRef.current
      const target = event.target
      if (!container || !(target instanceof Element) || !container.contains(target)) {
        return
      }

      const pinTarget = target.closest<HTMLElement>(WORKSPACE_PIN_DROP_TARGET)
      const engagementTarget = target.closest<HTMLElement>(WORKSPACE_ENGAGEMENT_DROP_TARGET)
      const statusTarget = target.closest<HTMLElement>(WORKSPACE_STATUS_DROP_TARGET)
      const dropTarget =
        [pinTarget, engagementTarget, statusTarget].find(
          (candidate) => candidate && container.contains(candidate)
        ) ?? null
      if (!dropTarget) {
        return
      }

      const worktreeIds = readWorkspaceDragDataIds(dataTransfer)
      if (worktreeIds.length === 0) {
        return
      }

      // Why: Electron's preload bridge stops native drops before React sees
      // them, so board drops commit from this scoped capture listener.
      event.preventDefault()
      event.stopPropagation()
      commitWorkspaceStatusDocumentDrop({
        worktreeIds,
        status: dropTarget.dataset.workspaceStatus ?? null,
        isPinDrop: dropTarget === pinTarget,
        engagement:
          dropTarget === engagementTarget
            ? normalizeWorkspaceEngagement(dropTarget.dataset.workspaceEngagement)
            : null,
        onMoveWorktreeToStatus,
        onMoveWorktreesToStatus,
        onPinWorktree,
        onPinWorktrees,
        onSetWorktreesEngagement
      })
    }

    const handleDragFinish = (): void => {
      onDragFinish()
    }

    document.addEventListener('drop', handleDrop, true)
    document.addEventListener('dragend', handleDragFinish, true)
    return () => {
      document.removeEventListener('drop', handleDrop, true)
      document.removeEventListener('dragend', handleDragFinish, true)
    }
  }, [
    containerRef,
    enabled,
    onDragFinish,
    onMoveWorktreeToStatus,
    onMoveWorktreesToStatus,
    onPinWorktree,
    onPinWorktrees,
    onSetWorktreesEngagement
  ])
}
