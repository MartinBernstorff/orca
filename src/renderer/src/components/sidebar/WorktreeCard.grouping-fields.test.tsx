import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { Repo } from '../../../../shared/repo-types'
import type {
  WorktreeCardGroupingField,
  WorktreeCardProperty
} from '../../../../shared/ui-chrome-types'
import { cloneDefaultWorkspaceStatuses } from '../../../../shared/workspace-statuses'
import type { Worktree } from '../../../../shared/worktree/types'
import type { WorktreeCardProps } from './worktree-card-model'

const fetchHostedReviewForBranch = vi.fn()
const fetchIssue = vi.fn()
const fetchLinearIssue = vi.fn()
const openModal = vi.fn()
const updateWorktreeMeta = vi.fn()

const worktreeCardProperties: WorktreeCardProperty[] = ['status']
let worktreeCardGroupingFields: WorktreeCardGroupingField[] = ['priority']
let settings: Partial<GlobalSettings> | null = {
  experimentalNewWorktreeCardStyle: true
}

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      deleteStateByWorktreeId: {},
      fetchHostedReviewForBranch,
      fetchIssue,
      fetchLinearIssue,
      gitConflictOperationByWorktree: {},
      hostedReviewCache: {},
      issueCache: {},
      linearIssueCache: {},
      openModal,
      prCache: {},
      projectGroups: [],
      remoteBranchConflictByWorktreeId: {},
      settings,
      sshConnectionStates: new Map(),
      sshTargetLabels: new Map(),
      updateWorktreeMeta,
      workspaceStatuses: cloneDefaultWorkspaceStatuses(),
      worktreeCardInteractions: [],
      worktreeCardGroupingFields,
      worktreeCardProperties
    })
}))

vi.mock('@/lib/worktree-activation', () => ({
  activateAndRevealWorktree: vi.fn()
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>
}))

vi.mock('./use-worktree-activity-status', () => ({
  useWorktreeActivityStatus: () => 'idle'
}))

vi.mock('./CacheTimer', () => ({
  default: () => null,
  usePromptCacheCountdownStartedAt: () => null
}))

vi.mock('./WorktreeCardAgents', () => ({
  default: () => null
}))

vi.mock('./WorktreeContextMenu', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
  CLOSE_ALL_CONTEXT_MENUS_EVENT: 'orca:test-close-context-menus',
  WORKTREE_NATIVE_CONTEXT_MENU_ATTR: 'data-worktree-native-context-menu',
  WORKTREE_CONTEXT_MENU_SCOPE_ATTR: 'data-orca-context-menu-scope'
}))

function makeRepo(): Repo {
  return {
    id: 'repo-1',
    path: '/repo',
    displayName: 'orca',
    badgeColor: '#999999',
    addedAt: 1
  }
}

function makeWorktree(overrides: Partial<Worktree> = {}): Worktree {
  return {
    id: 'repo-1::/repo/worktrees/grouping-fields',
    repoId: 'repo-1',
    path: '/repo/worktrees/grouping-fields',
    displayName: 'Grouping fields',
    branch: 'grouping-fields',
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
    sortOrder: 0,
    lastActivityAt: 1,
    ...overrides
  }
}

async function renderCard(
  worktree: Worktree,
  cardProps: Partial<Pick<WorktreeCardProps, 'groupedFields' | 'inPinnedSection'>> = {}
): Promise<string> {
  const WorktreeCard = (await import('./WorktreeCard')).default
  return renderToStaticMarkup(
    <WorktreeCard worktree={worktree} repo={makeRepo()} isActive={false} {...cardProps} />
  )
}

const PRIORITY_ICON = 'title="High"'
const IN_PROGRESS_ICON = 'aria-label="In progress"'

describe('WorktreeCard grouping fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    worktreeCardGroupingFields = ['priority']
    settings = { experimentalNewWorktreeCardStyle: true }
  })

  it('shows priority but not workspace status by default', async () => {
    const markup = await renderCard(makeWorktree({ priority: 'high' }))

    expect(markup).toContain(PRIORITY_ICON)
    expect(markup).not.toContain(IN_PROGRESS_ICON)
  })

  it('shows the fallback workspace status when enabled and none is set', async () => {
    worktreeCardGroupingFields = ['workspace-status']

    const markup = await renderCard(makeWorktree({ priority: 'high' }))

    expect(markup).toContain(IN_PROGRESS_ICON)
    expect(markup).not.toContain(PRIORITY_ICON)
  })

  it('renders workspace status before priority', async () => {
    worktreeCardGroupingFields = ['workspace-status', 'priority']

    const markup = await renderCard(
      makeWorktree({ priority: 'high', workspaceStatus: 'in-review' })
    )

    expect(markup.indexOf('aria-label="In review"')).toBeGreaterThan(-1)
    expect(markup.indexOf('aria-label="In review"')).toBeLessThan(markup.indexOf(PRIORITY_ICON))
  })

  it('hides a field the sidebar is grouped by', async () => {
    worktreeCardGroupingFields = ['workspace-status', 'priority']

    const markup = await renderCard(makeWorktree({ priority: 'high' }), {
      groupedFields: ['priority']
    })

    expect(markup).not.toContain(PRIORITY_ICON)
    expect(markup).toContain(IN_PROGRESS_ICON)
  })

  it('keeps grouped fields in the pinned section', async () => {
    const markup = await renderCard(makeWorktree({ priority: 'high' }), {
      groupedFields: ['priority'],
      inPinnedSection: true
    })

    expect(markup).toContain(PRIORITY_ICON)
  })

  it('keeps legacy cards on always-on priority', async () => {
    settings = { experimentalNewWorktreeCardStyle: false }
    worktreeCardGroupingFields = ['workspace-status']

    const markup = await renderCard(makeWorktree({ priority: 'high' }), {
      groupedFields: ['priority']
    })

    expect(markup).toContain(PRIORITY_ICON)
    expect(markup).not.toContain(IN_PROGRESS_ICON)
  })
})
