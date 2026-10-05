// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_WORKSPACE_STATUSES } from '../../../../../../shared/workspace-status-defaults'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import type { WorkspaceEngagement } from '../../../../../../shared/worktree/engagement'
import type { Worktree } from '../../../../../../shared/worktree/types'
import type { WorktreeMetaBatchUpdate } from '../../../../store/slices/worktree-helpers'
import { worktree } from '../../worktree-list-groups-test-fixtures'
import {
  getWorkspaceEngagement,
  getWorkspaceEngagementLaneKey
} from '../../workspace-engagement-meta'
import { buildWorkspaceEngagementDropUpdates } from '../drag/engagement-drop'
import { commitSectionTargetDrop } from '../drag/pointer-commit'
import type { WorktreeDropCommitContext } from '../drag/drop-commit-context'
import type { WorktreePointerDrag } from '../drag/row-state'
import { getPointerDropStatusTarget } from '../drag/status-target'
import type { GroupHeaderRow, WorktreeGroupBy } from '../grouping/row-types'
import { renderWorktreeSectionHeaderRow, type SectionHeaderRowContext } from './SectionHeader'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/store/slices/project-group-owner-routing', () => ({
  getProjectGroupHostId: () => undefined
}))

const emptyHeaderDrag = {
  canReorderRepoHeaders: false,
  canReorderProjectGroupHeaders: false,
  repoHeaderIndexByRepoId: new Map(),
  repoHeaderBucketByRepoId: new Map(),
  repoHeaderSectionEndByRepoId: new Map(),
  sidebarRepoHeaderIdsByBucket: new Map(),
  projectGroupHeaderIndexByGroupId: new Map(),
  projectGroupHeaderBucketByGroupId: new Map(),
  projectGroupHeaderSectionEndByGroupId: new Map(),
  sidebarProjectGroupHeaderIdsByBucket: new Map(),
  repoDrag: { state: { draggingRepoId: null }, onHandlePointerDown: vi.fn() },
  projectGroupDrag: { state: { draggingGroupId: null }, onHandlePointerDown: vi.fn() }
}

function makeHeaderContext(groupBy: WorktreeGroupBy): SectionHeaderRowContext {
  return {
    groupBy,
    collapsedGroups: new Set<string>(),
    workspaceStatuses: DEFAULT_WORKSPACE_STATUSES,
    projectGroups: [],
    sshConnectionStates: new Map(),
    highlightedRevealRowKey: null,
    dragOverStatus: null,
    dragOverEngagement: null,
    pinDragOver: false,
    headerDrag: emptyHeaderDrag,
    getCachedFolderWorkspacePathStatus: () => null
  } as unknown as SectionHeaderRowContext
}

// Fake store: applies batched meta writes so the test reads Engagement back.
function makeFakeStore(worktrees: Worktree[]) {
  const worktreeMap = new Map(worktrees.map((entry) => [entry.id, entry]))
  return {
    worktreeMap,
    updateWorktreesMeta(updates: readonly WorktreeMetaBatchUpdate[]) {
      for (const { worktreeId, updates: meta } of updates) {
        const current = worktreeMap.get(worktreeId)
        if (current) {
          worktreeMap.set(worktreeId, { ...current, ...meta })
        }
      }
    }
  }
}

let container: HTMLDivElement
let root: Root

function renderHeader(row: GroupHeaderRow, groupBy: WorktreeGroupBy): HTMLElement {
  act(() => {
    root.render(
      renderWorktreeSectionHeaderRow({
        ctx: makeHeaderContext(groupBy),
        row,
        vItem: { index: 0, key: 'row-0', start: 0 } as never,
        isActiveStickyHeader: false,
        hasStickyHost: false,
        hasHeaderTopSpacing: false,
        measureVirtualRowElement: () => {}
      })
    )
  })
  return container.querySelector<HTMLElement>('[role="button"]')!
}

function dropOnHeader(
  header: HTMLElement,
  worktreeIds: string[],
  store: ReturnType<typeof makeFakeStore>
) {
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(header)
  const target = getPointerDropStatusTarget({ container, x: 1, y: 1 })
  const writeAll = (ids: readonly string[], meta: WorktreeMetaBatchUpdate['updates']) =>
    store.updateWorktreesMeta(ids.map((worktreeId) => ({ worktreeId, updates: meta })))
  const ctx = {
    onPinWorktrees: (ids: readonly string[]) => writeAll(ids, { isPinned: true }),
    onMoveWorktreesToStatus: (ids: readonly string[], status: string) =>
      writeAll(ids, { workspaceStatus: status }),
    onSetWorktreesEngagement: (ids: readonly string[], engagement: WorkspaceEngagement) =>
      store.updateWorktreesMeta(
        buildWorkspaceEngagementDropUpdates({
          worktreeIds: ids,
          engagement,
          worktreeMap: store.worktreeMap
        })
      )
  } as unknown as WorktreeDropCommitContext
  const drag = {
    draggedIds: worktreeIds,
    reorderDraggedIds: worktreeIds
  } as unknown as WorktreePointerDrag
  commitSectionTargetDrop({ ctx, drag }, target, null)
}

function engagementHeader(engagement: WorkspaceEngagement, count: number): GroupHeaderRow {
  return {
    type: 'header',
    key: getWorkspaceEngagementLaneKey(engagement),
    label: engagement,
    count,
    tone: 'text-foreground'
  }
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('dropping a workspace onto an Engagement header', () => {
  it('moves a Queued workspace to Engaged via the empty Engaged header', () => {
    const store = makeFakeStore([{ ...worktree, id: 'wt-a' }])
    const header = renderHeader(engagementHeader('engaged', 0), 'engagement')

    dropOnHeader(header, ['wt-a'], store)

    expect(getWorkspaceEngagement(store.worktreeMap.get('wt-a')!)).toBe('engaged')
  })

  it('moves an Engaged workspace to Queued via a nested Queued header', () => {
    const store = makeFakeStore([{ ...worktree, id: 'wt-a', engagement: 'engaged' }])
    const laneKey = getWorkspaceEngagementLaneKey('queued')
    const header = renderHeader(
      {
        ...engagementHeader('queued', 0),
        key: getNestedGroupKey('repo:repo-1', laneKey),
        laneKey,
        laneGroupBy: 'engagement',
        nestDepth: 1
      },
      'repo'
    )

    dropOnHeader(header, ['wt-a'], store)

    expect(getWorkspaceEngagement(store.worktreeMap.get('wt-a')!)).toBe('queued')
  })

  it('changes only Engagement, not status or pin', () => {
    const store = makeFakeStore([{ ...worktree, id: 'wt-a', workspaceStatus: 'todo' }])
    const header = renderHeader(engagementHeader('engaged', 0), 'engagement')

    dropOnHeader(header, ['wt-a'], store)

    const dropped = store.worktreeMap.get('wt-a')!
    expect(dropped.isPinned).toBe(worktree.isPinned)
    expect(dropped.workspaceStatus).toBe('todo')
  })
})
