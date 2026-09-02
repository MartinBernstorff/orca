import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { Repo } from '../../../../shared/repo-types'
import type { WorktreeCardProperty } from '../../../../shared/ui-chrome-types'
import type { Worktree } from '../../../../shared/worktree/types'

const fetchHostedReviewForBranch = vi.fn()
const fetchIssue = vi.fn()
const fetchLinearIssue = vi.fn()
const openModal = vi.fn()
const updateWorktreeMeta = vi.fn()

let worktreeCardProperties: WorktreeCardProperty[] = ['status', 'unread']
let settings: Partial<GlobalSettings> | null = null

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
      workspacePortScan: null,
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
  useWorktreeActivityStatus: () => 'working'
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
    id: 'repo-1::/repo/worktrees/lane',
    repoId: 'repo-1',
    path: '/repo/worktrees/lane',
    displayName: 'Status lane',
    branch: 'feature/lane',
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

function getInlineRenameTitleTag(markup: string): string {
  const match = markup.match(/<span[^>]*data-worktree-title-inline-rename=""[^>]*>/)
  expect(match).not.toBeNull()
  return match?.[0] ?? ''
}

describe('WorktreeCard status lane removal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    worktreeCardProperties = ['status', 'unread']
    settings = null
  })

  for (const [label, cardStyle] of [
    ['new card style', { experimentalNewWorktreeCardStyle: true }],
    ['legacy card style', { experimentalNewWorktreeCardStyle: false }],
    ['compact cards', { compactWorktreeCards: true, experimentalNewWorktreeCardStyle: false }]
  ] as const) {
    it(`renders no status lane on ${label}, even with a working agent`, async () => {
      settings = cardStyle
      const { default: WorktreeCard } = await import('./WorktreeCard')

      const markup = renderToStaticMarkup(
        <WorktreeCard
          worktree={makeWorktree({ linkedPR: 456, isUnread: true })}
          repo={makeRepo()}
          isActive={false}
        />
      )

      expect(markup).not.toContain('data-worktree-card-status-slot')
      expect(markup).not.toContain('data-worktree-status-lane-unread')
      expect(markup).not.toContain('data-worktree-unread-alert')
      expect(markup).not.toContain('aria-label="Mark as read"')
      expect(markup).not.toContain('aria-label="Mark as unread"')
    }, 20_000)
  }

  it('keeps the unread title emphasis without the lane', async () => {
    settings = { experimentalNewWorktreeCardStyle: true }
    const { default: WorktreeCard } = await import('./WorktreeCard')

    const unreadTitle = getInlineRenameTitleTag(
      renderToStaticMarkup(
        <WorktreeCard
          worktree={makeWorktree({ isUnread: true })}
          repo={makeRepo()}
          isActive={false}
        />
      )
    )
    const readTitle = getInlineRenameTitleTag(
      renderToStaticMarkup(
        <WorktreeCard worktree={makeWorktree()} repo={makeRepo()} isActive={false} />
      )
    )

    expect(unreadTitle).not.toEqual(readTitle)
    expect(unreadTitle).toContain('font-semibold')
  }, 20_000)

  it('drops the unread emphasis gate on the vestigial status property', async () => {
    settings = { experimentalNewWorktreeCardStyle: true }
    worktreeCardProperties = ['pr']
    const { default: WorktreeCard } = await import('./WorktreeCard')

    const unreadTitle = getInlineRenameTitleTag(
      renderToStaticMarkup(
        <WorktreeCard
          worktree={makeWorktree({ isUnread: true })}
          repo={makeRepo()}
          isActive={false}
        />
      )
    )

    expect(unreadTitle).toContain('font-semibold')
  }, 20_000)
})
