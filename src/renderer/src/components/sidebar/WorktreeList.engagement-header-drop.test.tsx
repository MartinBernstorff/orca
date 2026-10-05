// @vitest-environment happy-dom

import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../../../shared/repo-types'
import type { WorktreeCardProperty } from '../../../../shared/ui-chrome-types'
import type { WorktreeLineage } from '../../../../shared/worktree/lineage-types'
import type { WorkspaceEngagement } from '../../../../shared/worktree/engagement'
import type { Worktree } from '../../../../shared/worktree/types'
import type { WorktreeMetaBatchUpdate } from '../../store/slices/worktree-helpers'
import { DEFAULT_WORKSPACE_STATUSES } from '../../../../shared/workspace-status-defaults'
import {
  WORKSPACE_STATUS_DRAG_IDS_TYPE,
  WORKSPACE_STATUS_DRAG_TYPE
} from './workspace-status-drag-data'
import { getWorkspaceEngagement } from './workspace-engagement-meta'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockStore = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  activateWorktreeFromSidebar: vi.fn(),
  openModal: vi.fn(),
  updateWorktreeMeta: vi.fn(),
  updateWorktreesMeta: vi.fn(),
  setSortBy: vi.fn(),
  fetchHostedReviewForBranch: vi.fn(),
  fetchIssue: vi.fn(),
  fetchLinearIssue: vi.fn(),
  openTaskPage: vi.fn()
}))

type WorktreeListComponent = React.ComponentType<{
  scrollOffsetRef: React.RefObject<number>
  scrollAnchorRef: React.RefObject<unknown>
}>

let WorktreeList: WorktreeListComponent

function makeFolderWorkspacePathStatusMockState(): Record<string, unknown> {
  return {
    fetchFolderWorkspacePathStatus: vi.fn(),
    folderWorkspaces: [],
    folderWorkspacePathStatuses: {},
    getFolderWorkspacePathStatusCacheKey: (request: unknown) => JSON.stringify(request),
    getFreshFolderWorkspacePathStatus: () => null
  }
}

vi.mock('@/store', () => {
  const useAppStore = ((selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockStore.state)) as ((
    selector: (state: Record<string, unknown>) => unknown
  ) => unknown) & {
    getState: () => Record<string, unknown>
  }
  useAppStore.getState = () => mockStore.state
  return { useAppStore }
})

vi.mock('@tanstack/react-virtual', () => ({
  defaultRangeExtractor: ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) =>
    Array.from({ length: endIndex - startIndex + 1 }, (_, index) => startIndex + index),
  measureElement: () => 32,
  useVirtualizer: ({ count }: { count: number }) => ({
    elementsCache: new Map(),
    getTotalSize: () => count * 96,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: `row-${index}`,
        start: index * 96
      })),
    measureElement: vi.fn(),
    scrollToIndex: vi.fn()
  })
}))

vi.mock('@/hooks/useVirtualizedScrollAnchor', () => ({
  VIRTUALIZED_SCROLL_ANCHOR_RECORD_EVENT: 'orca:test-record-scroll-anchor',
  useVirtualizedScrollAnchor: vi.fn()
}))

vi.mock('./project-header-drag', () => ({
  useRepoHeaderDrag: () => ({
    state: { draggingRepoId: null, dropIndicatorY: null },
    onHandlePointerDown: vi.fn()
  }),
  isRepoHeaderActionTarget: () => false
}))

vi.mock('@/components/ui/hover-card', () => ({
  HoverCard: ({ children }: { children: ReactNode }) => <>{children}</>,
  HoverCardContent: ({ children }: { children: ReactNode }) => (
    <div data-hover-card-content="">{children}</div>
  ),
  HoverCardTrigger: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) => (
    <button onClick={onSelect}>{children}</button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuSub: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuSubContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSubTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('@/lib/sidebar-worktree-activation', () => ({
  activateWorktreeFromSidebar: mockStore.activateWorktreeFromSidebar
}))

vi.mock('@/lib/worktree-activation', () => ({
  activateAndRevealWorktree: vi.fn()
}))

vi.mock('@/runtime/runtime-rpc-client', () => ({
  getActiveRuntimeTarget: () => ({ kind: 'local' }),
  callRuntimeRpc: vi.fn()
}))

vi.mock('./CacheTimer', () => ({
  default: () => null,
  usePromptCacheCountdownStartedAt: () => null
}))

vi.mock('./WorktreeCardAgents', () => ({
  default: ({ worktreeId }: { worktreeId: string }) => (
    <div data-agent-worktree-id={worktreeId}>Agent row</div>
  ),
  SUPPRESS_WORKTREE_LIST_SCROLL_ADJUSTMENT_EVENT: 'orca:test-suppress-scroll-adjustment'
}))

vi.mock('./WorktreeContextMenu', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
  CLOSE_ALL_CONTEXT_MENUS_EVENT: 'orca:test-close-context-menus',
  WORKTREE_CONTEXT_MENU_SCOPE_ATTR: 'data-orca-context-menu-scope',
  WORKTREE_NATIVE_CONTEXT_MENU_ATTR: 'data-worktree-native-context-menu'
}))

const REPO_ID = 'repo-1'

function makeRepo(): Repo {
  return {
    id: REPO_ID,
    path: '/tmp/engagement-drop',
    displayName: 'engagement-drop',
    badgeColor: '#999999',
    addedAt: 1
  }
}

function makeWorktree(args: {
  id: string
  sortOrder: number
  engagement?: WorkspaceEngagement
}): Worktree {
  return {
    id: args.id,
    instanceId: `${args.id}-instance`,
    repoId: REPO_ID,
    path: `/tmp/engagement-drop/${args.id}`,
    displayName: args.id,
    branch: `${args.id}-branch`,
    head: 'abc123',
    isBare: false,
    isMainWorktree: false,
    comment: '',
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    isUnread: false,
    isPinned: false,
    sortOrder: args.sortOrder,
    lastActivityAt: args.sortOrder,
    engagement: args.engagement
  }
}

function makeLineage(worktree: Worktree, parent: Worktree): WorktreeLineage {
  return {
    worktreeId: worktree.id,
    worktreeInstanceId: worktree.instanceId!,
    parentWorktreeId: parent.id,
    parentWorktreeInstanceId: parent.instanceId!,
    origin: 'orchestration',
    capture: { source: 'orchestration-context', confidence: 'explicit' },
    createdAt: 1
  }
}

// Fake store write: applies batched meta updates so tests read Engagement back from state.
function applyWorktreesMeta(updates: readonly WorktreeMetaBatchUpdate[]): void {
  const worktreesByRepo = mockStore.state.worktreesByRepo as Record<string, Worktree[]>
  mockStore.state = {
    ...mockStore.state,
    worktreesByRepo: {
      [REPO_ID]: worktreesByRepo[REPO_ID]!.map((worktree) => {
        const update = updates.find((entry) => entry.worktreeId === worktree.id)
        return update ? { ...worktree, ...update.updates } : worktree
      })
    }
  }
}

function readEngagement(worktreeId: string): WorkspaceEngagement {
  const worktreesByRepo = mockStore.state.worktreesByRepo as Record<string, Worktree[]>
  return getWorkspaceEngagement(worktreesByRepo[REPO_ID]!.find((w) => w.id === worktreeId)!)
}

// Parent + its visible lineage child are Queued; the bystander is Engaged.
function setEngagementState(grouping: { groupBy: string; nestedGroupBy: string[] }): void {
  const repo = makeRepo()
  const parent = makeWorktree({ id: 'parent', sortOrder: 30 })
  const child = makeWorktree({ id: 'child', sortOrder: 20 })
  const bystander = makeWorktree({ id: 'bystander', sortOrder: 10, engagement: 'engaged' })
  mockStore.state = {
    ...makeFolderWorkspacePathStatusMockState(),
    activeModal: '',
    activeView: 'terminal',
    activeWorktreeId: null,
    agentStatusByPaneKey: {},
    agentStatusEpoch: 0,
    browserTabsByWorktree: {},
    clearPendingRevealWorktreeId: vi.fn(),
    collapsedGroups: new Set<string>(),
    deleteStateByWorktreeId: {},
    detectedWorktreesByRepo: {},
    fetchHostedReviewForBranch: mockStore.fetchHostedReviewForBranch,
    fetchIssue: mockStore.fetchIssue,
    fetchLinearIssue: mockStore.fetchLinearIssue,
    filterRepoIds: [],
    gitConflictOperationByWorktree: {},
    groupBy: grouping.groupBy,
    nestedGroupBy: grouping.nestedGroupBy,
    hideDefaultBranchWorkspace: false,
    hostedReviewCache: {},
    issueCache: {},
    linearIssueCache: {},
    linearStatus: null,
    migrationUnsupportedByPtyId: {},
    openModal: mockStore.openModal,
    openSettingsPage: vi.fn(),
    openSettingsTarget: null,
    openTaskPage: mockStore.openTaskPage,
    pendingRevealWorktree: null,
    prCache: {},
    projectGroups: [],
    ptyIdsByTabId: {},
    recordFeatureInteraction: vi.fn(),
    remoteBranchConflictByWorktreeId: {},
    reorderRepos: vi.fn(),
    reportVisibleGitHubPRRefreshCandidates: vi.fn(),
    repos: [repo],
    retainedAgentsByPaneKey: {},
    revealWorktreeInSidebar: vi.fn(),
    runtimePaneTitlesByTabId: {},
    setFilterRepoIds: vi.fn(),
    setHideDefaultBranchWorkspace: vi.fn(),
    setRenamingWorktreeId: vi.fn(),
    setShowSleepingWorkspaces: vi.fn(),
    setSortBy: mockStore.setSortBy,
    setWorktreesPinnedAndReveal: vi.fn(),
    settings: null,
    showSleepingWorkspaces: true,
    sortBy: 'manual',
    sortEpoch: 0,
    sshConnectedGeneration: 0,
    sshConnectionStates: new Map(),
    sshTargetLabels: new Map(),
    tabsByWorktree: {},
    terminalLayoutsByTabId: {},
    toggleCollapsedGroup: vi.fn(),
    updateRepo: vi.fn(),
    updateWorktreeMeta: mockStore.updateWorktreeMeta,
    updateWorktreesMeta: mockStore.updateWorktreesMeta,
    workspaceHostScope: 'all',
    workspacePortScan: null,
    workspaceStatuses: [...DEFAULT_WORKSPACE_STATUSES],
    worktreeCardProperties: ['status', 'comment'] satisfies WorktreeCardProperty[],
    worktreeLineageById: { [child.id]: makeLineage(child, parent) },
    worktreesByRepo: { [repo.id]: [parent, child, bystander] }
  }
}

const mountedRoots: Root[] = []

async function renderWorktreeList(): Promise<HTMLDivElement> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mountedRoots.push(root)
  await act(async () => {
    root.render(
      <WorktreeList scrollOffsetRef={{ current: 0 }} scrollAnchorRef={{ current: null }} />
    )
  })
  return container
}

function makeWorktreeIdDataTransfer(worktreeIds: readonly string[]): DataTransfer {
  const [firstId] = worktreeIds
  const data: Record<string, string> = {
    [WORKSPACE_STATUS_DRAG_TYPE]: firstId ?? '',
    [WORKSPACE_STATUS_DRAG_IDS_TYPE]: JSON.stringify(worktreeIds),
    'text/plain': firstId ?? ''
  }
  return {
    effectAllowed: 'move',
    types: Object.keys(data),
    getData: (type: string) => data[type] ?? '',
    setData: () => {}
  } as unknown as DataTransfer
}

function findEngagementHeaders(
  container: HTMLElement,
  engagement: WorkspaceEngagement
): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(
      `[data-workspace-engagement-drop-target][data-workspace-engagement="${engagement}"]`
    )
  ]
}

async function dropWorktreesOnHeader(
  header: HTMLElement,
  worktreeIds: readonly string[]
): Promise<void> {
  const event = new Event('drop', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: makeWorktreeIdDataTransfer(worktreeIds)
  })
  await act(async () => {
    header.dispatchEvent(event)
  })
}

describe('WorktreeList drop onto an Engagement header', () => {
  beforeAll(async () => {
    WorktreeList = (await import('./WorktreeList')).default as WorktreeListComponent
  }, 60_000)

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.updateWorktreesMeta.mockImplementation(applyWorktreesMeta)
  })

  afterEach(async () => {
    await act(async () => {
      for (const root of mountedRoots.splice(0)) {
        root.unmount()
      }
    })
    document.body.innerHTML = ''
  })

  it('moves a dragged parent and its visible lineage child to Engaged', async () => {
    setEngagementState({ groupBy: 'engagement', nestedGroupBy: [] })
    const container = await renderWorktreeList()
    const [engagedHeader] = findEngagementHeaders(container, 'engaged')

    await dropWorktreesOnHeader(engagedHeader!, ['parent'])

    expect(readEngagement('parent')).toBe('engaged')
    expect(readEngagement('child')).toBe('engaged')
  })

  it('moves a workspace to Queued via a nested Queued header', async () => {
    setEngagementState({ groupBy: 'repo', nestedGroupBy: ['engagement'] })
    const container = await renderWorktreeList()
    const [queuedHeader] = findEngagementHeaders(container, 'queued')

    await dropWorktreesOnHeader(queuedHeader!, ['bystander'])

    expect(readEngagement('bystander')).toBe('queued')
    expect(readEngagement('parent')).toBe('queued')
  })

  it('renders the empty Engaged lane as a drop target when nested', async () => {
    setEngagementState({ groupBy: 'repo', nestedGroupBy: ['engagement'] })
    mockStore.state = {
      ...mockStore.state,
      worktreesByRepo: {
        [REPO_ID]: (mockStore.state.worktreesByRepo as Record<string, Worktree[]>)[REPO_ID]!.filter(
          (worktree) => worktree.id !== 'bystander'
        )
      }
    }
    const container = await renderWorktreeList()
    const [engagedHeader] = findEngagementHeaders(container, 'engaged')

    await dropWorktreesOnHeader(engagedHeader!, ['parent'])

    expect(readEngagement('parent')).toBe('engaged')
  })
})
