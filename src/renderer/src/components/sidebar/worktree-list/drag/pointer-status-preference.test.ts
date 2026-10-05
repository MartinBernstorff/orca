import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_WORKSPACE_STATUSES } from '../../../../../../shared/workspace-status-defaults'
import { getWorkspaceStatusGroupKey } from '../../../../../../shared/workspace-statuses'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import type { WorktreeDropCommitContext } from './drop-commit-context'
import type { WorktreePointerDrag, WorktreeSidebarLineageDropTarget } from './row-state'
import { flushWorktreePointerDragFrame } from './pointer-flush'
import { commitWorktreePointerDrop } from './pointer-commit'
import type * as StatusTargetModule from './status-target'

const pointerTarget = vi.hoisted(() => ({
  current: null as WorktreeSidebarLineageDropTarget | null
}))

vi.mock('./status-target', async (importOriginal) => ({
  ...(await importOriginal<typeof StatusTargetModule>()),
  getPointerDropStatusTarget: () => pointerTarget.current
}))
vi.mock('../../workspace-kanban-sidebar-drop', () => ({
  clearWorkspaceKanbanSidebarDropTargetVisual: vi.fn(),
  hasWorkspaceKanbanSidebarDropBoard: () => true,
  isWorkspaceKanbanSidebarDropPointInBoard: () => false,
  updateWorkspaceKanbanSidebarDropTargetVisual: () => ({ status: null, isPinDrop: false }),
  getWorkspaceKanbanSidebarDropGroups: () => [],
  getWorkspaceKanbanSidebarDropTarget: () => null,
  resolveWorkspaceKanbanSidebarFullLaneDropIndex: () => 0
}))
vi.mock('../../workspace-kanban-card-pointer-drag-dom', () => ({
  resolveWorkspaceKanbanCardDropCommitTarget: () => ({
    status: null,
    isPinDrop: false,
    dropIndex: null
  })
}))
vi.mock('../../worktree-sidebar-pointer-drag-dom', () => ({
  updateSidebarDragPreviewPosition: vi.fn()
}))

const inProgress = getWorkspaceStatusGroupKey('in-progress')
const reorderPreview = { dropIndex: 0, lineTop: 0, offsets: new Map() }

function makeCtx(): WorktreeDropCommitContext {
  return {
    scrollRef: { current: {} as HTMLDivElement },
    workspaceStatuses: DEFAULT_WORKSPACE_STATUSES,
    worktreeDragGroups: [],
    worktreeDragUnitGroups: [],
    computeWorktreeDrop: vi.fn(() => reorderPreview as never),
    computeWorktreeStatusDrop: vi.fn(() => null),
    refreshWorktreeDragSession: () => true,
    getEligibleLineageDropTarget: (target) => target,
    commitWorktreeLineageParentDrop: vi.fn(() => false),
    clearReorderedWorktreeParents: vi.fn(),
    clearWorktreeDrag: vi.fn(),
    onMoveWorktreesToStatus: vi.fn(),
    onMoveWorktreesToStatusAtIndex: vi.fn(),
    onReorderWorktrees: vi.fn(),
    onPinWorktrees: vi.fn(),
    onSetWorktreesEngagement: vi.fn()
  }
}

function makeDrag(sourceGroupKey: string): WorktreePointerDrag {
  return {
    pointerId: 1,
    sourceRow: {} as HTMLElement,
    startX: 0,
    startY: 0,
    currentX: 10,
    currentY: 10,
    worktreeId: 'wt-1',
    draggedIds: ['wt-1'],
    reorderDraggedIds: ['wt-1'],
    reorderUnitDraggedIds: ['wt-1'],
    sourceGroupKey,
    rects: [],
    active: true,
    preview: {} as HTMLElement,
    previewOffsetX: 0,
    previewOffsetY: 0,
    workspaceBoardDragPreviewRequested: true,
    frameId: null,
    latestBoardDropTarget: null,
    latestStatusDropTarget: null
  }
}

function hover(sourceGroupKey: string, ctx: WorktreeDropCommitContext) {
  const setDragOverStatus = vi.fn()
  flushWorktreePointerDragFrame({
    drag: makeDrag(sourceGroupKey),
    ctx,
    workspaceBoardOpen: true,
    onWorkspaceBoardDragPreviewStart: vi.fn(),
    onWorkspaceBoardDragPreviewCommit: vi.fn(),
    shouldShowWorkspaceBoardDropIndicator: () => false,
    setWorktreeDragState: vi.fn(),
    setDragOverStatus,
    setDragOverEngagement: vi.fn(),
    setPinDragOver: vi.fn()
  })
  return setDragOverStatus
}

function drop(sourceGroupKey: string, ctx: WorktreeDropCommitContext) {
  commitWorktreePointerDrop({
    event: { clientX: 10, clientY: 10 } as PointerEvent,
    drag: makeDrag(sourceGroupKey),
    ctx,
    onWorkspaceBoardDragPreviewCommit: vi.fn(),
    onDropWorktreesOnWorkspaceBoard: vi.fn()
  })
}

describe('pointer drop onto an adjacent status header under nested Group by', () => {
  beforeEach(() => {
    pointerTarget.current = {
      status: 'in-review',
      isPinDrop: false,
      engagement: null,
      lineageParentId: null
    }
  })

  it.each([
    ['status as the first level', getNestedGroupKey(inProgress, 'priority:high')],
    ['status as a nested level', getNestedGroupKey('priority:high', inProgress)]
  ])('hover preview and drop both pick the status target with %s', (_label, sourceKey) => {
    const hoverCtx = makeCtx()
    expect(hover(sourceKey, hoverCtx)).toHaveBeenLastCalledWith('in-review')
    expect(hoverCtx.computeWorktreeDrop).not.toHaveBeenCalled()

    const dropCtx = makeCtx()
    drop(sourceKey, dropCtx)
    expect(dropCtx.onMoveWorktreesToStatus).toHaveBeenCalledWith(['wt-1'], 'in-review')
    expect(dropCtx.onReorderWorktrees).not.toHaveBeenCalled()
  })

  it('hover preview and drop both keep reordering within the source status', () => {
    const sourceKey = getNestedGroupKey('priority:high', getWorkspaceStatusGroupKey('in-review'))
    const hoverCtx = makeCtx()
    expect(hover(sourceKey, hoverCtx)).toHaveBeenLastCalledWith(null)
    expect(hoverCtx.computeWorktreeDrop).toHaveBeenCalled()

    const dropCtx = makeCtx()
    drop(sourceKey, dropCtx)
    expect(dropCtx.onMoveWorktreesToStatus).not.toHaveBeenCalled()
    expect(dropCtx.onReorderWorktrees).toHaveBeenCalled()
  })
})
