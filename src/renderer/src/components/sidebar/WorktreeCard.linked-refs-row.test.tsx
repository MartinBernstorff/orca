import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { Repo } from '../../../../shared/repo-types'
import type {
  WorktreeCardInteraction,
  WorktreeCardProperty
} from '../../../../shared/ui-chrome-types'
import type { Worktree } from '../../../../shared/worktree/types'

const fetchHostedReviewForBranch = vi.fn()
const fetchIssue = vi.fn()
const fetchLinearIssue = vi.fn()
const openModal = vi.fn()
const updateWorktreeMeta = vi.fn()

let worktreeCardProperties: WorktreeCardProperty[] = ['status', 'linear-issue', 'pr']
let worktreeCardInteractions: WorktreeCardInteraction[] = []
let settings: Partial<GlobalSettings> | null = { experimentalNewWorktreeCardStyle: true }
let hostedReviewCache: Record<string, unknown> = {}

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      deleteStateByWorktreeId: {},
      fetchHostedReviewForBranch,
      fetchIssue,
      fetchLinearIssue,
      gitConflictOperationByWorktree: {},
      hostedReviewCache,
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
      worktreeCardInteractions,
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
    id: 'repo-1::/repo/worktrees/refs-row',
    repoId: 'repo-1',
    path: '/repo/worktrees/refs-row',
    displayName: 'Refs row',
    branch: 'refs-row',
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

async function renderCard(worktree: Worktree): Promise<string> {
  const WorktreeCard = (await import('./WorktreeCard')).default
  return renderToStaticMarkup(
    <WorktreeCard worktree={worktree} repo={makeRepo()} isActive={false} />
  )
}

describe('WorktreeCard linked refs row', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    worktreeCardProperties = ['status', 'linear-issue', 'pr']
    worktreeCardInteractions = []
    settings = { experimentalNewWorktreeCardStyle: true }
    hostedReviewCache = {}
  })

  it('links a ref whose provider URL is known and leaves the rest as text', async () => {
    hostedReviewCache = {
      'local::repo-1::refs-row': {
        data: {
          provider: 'github',
          number: 4242,
          title: 'Refs row',
          state: 'open',
          url: 'https://github.com/acme/orca/pull/4242',
          status: 'success',
          updatedAt: '2026-05-17T00:00:00.000Z',
          mergeable: 'MERGEABLE'
        },
        fetchedAt: Date.now()
      }
    }

    const markup = await renderCard(
      makeWorktree({
        linkedLinearIssue: 'gup-12',
        linkedLinearIssueOrganizationUrlKey: 'acme',
        linkedPR: 4242
      })
    )

    expect(markup).toContain('data-worktree-card-linked-ref="linear"')
    expect(markup).toContain('>GUP-12</button>')
    expect(markup).toContain('>#4242</button>')
    // Why: pointer-only by design, so the sidebar doesn't grow two tab stops per card.
    expect(markup).toContain('tabindex="-1"')
  })

  it('leaves a Linear ref inert when no authoritative org key resolves it', async () => {
    const markup = await renderCard(makeWorktree({ linkedLinearIssue: 'gup-12' }))

    expect(markup).toContain('>GUP-12</span>')
    expect(markup).not.toContain('>GUP-12</button>')
  })

  it('hides a ref whose card property is turned off', async () => {
    worktreeCardProperties = ['status', 'pr']

    const markup = await renderCard(makeWorktree({ linkedLinearIssue: 'gup-12', linkedPR: 4242 }))

    expect(markup).not.toContain('GUP-12')
    expect(markup).toContain('>#4242</span>')
  })

  it('renders linked refs on their own row below the title', async () => {
    const markup = await renderCard(makeWorktree({ linkedLinearIssue: 'gup-12', linkedPR: 4242 }))

    expect(markup).toContain('data-worktree-card-linked-refs-row=""')
    const refsRowIndex = markup.indexOf('data-worktree-card-linked-refs-row=""')
    expect(markup.indexOf('Refs row')).toBeLessThan(refsRowIndex)
    expect(markup.slice(refsRowIndex)).toContain('GUP-12')
  })

  it('drops the redundant Linear icon when the identifier is already in the refs row', async () => {
    const markup = await renderCard(makeWorktree({ linkedLinearIssue: 'gup-12' }))

    expect(markup).toContain('GUP-12')
    expect(markup).not.toContain('Linked Linear gup-12')
  })

  it('omits the refs row when nothing is linked and delete is not an enabled interaction', async () => {
    const markup = await renderCard(makeWorktree())

    expect(markup).not.toContain('data-worktree-card-linked-refs-row=""')
    expect(markup).not.toContain('aria-label="Delete workspace"')
  })

  it('keeps delete in the title row instead of opening a refs row for an unlinked workspace', async () => {
    worktreeCardInteractions = ['delete']

    const markup = await renderCard(makeWorktree())

    expect(markup).not.toContain('data-worktree-card-linked-refs-row=""')
    expect(markup).toContain('aria-label="Delete workspace"')
  })

  it('shows the hover delete button beside the refs once the delete interaction is enabled', async () => {
    worktreeCardInteractions = ['delete']

    const markup = await renderCard(makeWorktree({ linkedLinearIssue: 'gup-12' }))

    const refsRowIndex = markup.indexOf('data-worktree-card-linked-refs-row=""')
    expect(refsRowIndex).toBeGreaterThanOrEqual(0)
    const refsRowMarkup = markup.slice(refsRowIndex)
    expect(refsRowMarkup).toContain('aria-label="Delete workspace"')
    // Right-aligned text label, no icon.
    expect(refsRowMarkup).toContain('>Delete</button>')
    expect(refsRowMarkup).toContain('ml-auto')
    expect(markup).not.toContain('lucide-trash')
    // Why: hover-only reveal, so the button ships opaque-zero rather than hidden.
    expect(markup).toContain('group-hover/worktree-card:opacity-100')
  })

  it('keeps the delete interaction off the primary worktree', async () => {
    worktreeCardInteractions = ['delete']

    const markup = await renderCard(makeWorktree({ isMainWorktree: true }))

    expect(markup).not.toContain('aria-label="Delete workspace"')
  })
})
