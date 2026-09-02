// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_WORKSPACE_STATUSES } from '../../../../../../shared/workspace-status-defaults'
import { getWorkspaceStatusGroupKey } from '../../../../../../shared/workspace-statuses'
import type { GroupHeaderRow, WorktreeGroupBy } from '../grouping/row-types'
import { PROJECT_GROUP_META } from '../grouping/group-keys'
import { renderWorktreeSectionHeaderRow, type SectionHeaderRowContext } from './SectionHeader'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@/store/slices/project-group-owner-routing', () => ({
  getProjectGroupHostId: () => undefined
}))

const emptyDrag = {
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

function makeContext(groupBy: WorktreeGroupBy): SectionHeaderRowContext {
  return {
    groupBy,
    collapsedGroups: new Set<string>(),
    workspaceStatuses: DEFAULT_WORKSPACE_STATUSES,
    projectGroups: [],
    sshConnectionStates: new Map(),
    highlightedRevealRowKey: null,
    dragOverStatus: null,
    pinDragOver: false,
    headerDrag: emptyDrag,
    getCachedFolderWorkspacePathStatus: () => null,
    toggleGroupWithScrollAnchor: vi.fn(),
    projectActions: {},
    onRenameProjectGroup: vi.fn(),
    onDeleteProjectGroup: vi.fn(),
    onCreateFolderWorkspace: vi.fn(),
    onWorkspaceStatusDragOver: vi.fn(),
    onWorkspaceStatusDragLeave: vi.fn(),
    onWorkspacePinDragOver: vi.fn(),
    onWorkspacePinDragLeave: vi.fn(),
    onWorkspaceStatusDrop: vi.fn()
  } as unknown as SectionHeaderRowContext
}

function makeStatusHeaderRow(count: number): GroupHeaderRow {
  const status = DEFAULT_WORKSPACE_STATUSES[0]!
  return {
    type: 'header',
    key: getWorkspaceStatusGroupKey(status.id),
    label: status.label,
    count,
    tone: 'text-muted-foreground'
  }
}

let container: HTMLDivElement
let root: Root

function render(row: GroupHeaderRow, groupBy: WorktreeGroupBy): void {
  act(() => {
    root.render(
      renderWorktreeSectionHeaderRow({
        ctx: makeContext(groupBy),
        row,
        vItem: { index: 0, key: 'row-0', start: 0 } as never,
        isActiveStickyHeader: false,
        hasStickyHost: false,
        hasHeaderTopSpacing: false,
        measureVirtualRowElement: () => {}
      })
    )
  })
}

function countText(): string | null {
  return container.querySelector('[data-worktree-section-header-count]')?.textContent ?? null
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('status section header count', () => {
  it('renders the group count on a status header', () => {
    render(makeStatusHeaderRow(3), 'workspace-status')
    expect(countText()).toBe('3')
  })

  it('omits the count for an empty status lane', () => {
    render(makeStatusHeaderRow(0), 'workspace-status')
    expect(countText()).toBeNull()
  })

  it('omits the count on non-status headers', () => {
    render(
      {
        type: 'header',
        key: 'repo:one',
        label: 'one',
        count: 4,
        tone: PROJECT_GROUP_META.tone
      },
      'repo'
    )
    expect(countText()).toBeNull()
  })
})
