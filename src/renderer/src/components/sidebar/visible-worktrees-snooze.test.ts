import { describe, expect, it } from 'vitest'
import { computeVisibleWorktreeIds } from './visible-worktrees'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import { LOCAL_EXECUTION_HOST_ID } from '../../../../shared/execution-host'

function makeWorktree(id: string, repoId = 'repo1'): Worktree {
  return {
    id,
    repoId,
    path: `/tmp/${id}`,
    head: 'abc123',
    branch: 'refs/heads/main',
    isBare: false,
    isMainWorktree: false,
    displayName: id,
    comment: '',
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    isUnread: false,
    isPinned: false,
    sortOrder: 0,
    lastActivityAt: 0
  }
}

const repoMap = new Map<string, Repo>([
  ['repo1', { id: 'repo1', path: '/repo1', displayName: 'Repo 1', badgeColor: '#000', addedAt: 0 }]
])

type VisibleOptions = Parameters<typeof computeVisibleWorktreeIds>[2]

function visibleOptions(overrides: Partial<VisibleOptions> = {}): VisibleOptions {
  return {
    filterRepoIds: [],
    showSleepingWorkspaces: true,
    tabsByWorktree: {},
    ptyIdsByTabId: {},
    browserTabsByWorktree: {},
    worktreeIdsWithLiveAgent: new Set(),
    hideDefaultBranchWorkspace: false,
    hideAutomationGeneratedWorkspaces: false,
    hideCliCreatedWorkspaces: false,
    hideDetachedHeadWorkspaces: false,
    hideWorkspacesFromOtherDevices: false,
    pairedDeviceIdsByEnvironment: new Map(),
    repoMap,
    workspaceHostScope: 'all',
    defaultHostId: LOCAL_EXECUTION_HOST_ID,
    worktreeLineageById: {},
    ...overrides
  }
}

describe('computeVisibleWorktreeIds snooze filtering', () => {
  const now = 1_000_000

  function snoozed(id: string, snoozedUntil: number | null): Worktree {
    return { ...makeWorktree(id), snoozedUntil }
  }

  it('hides workspaces whose wake time is still in the future', () => {
    const awake = makeWorktree('awake')
    const asleep = snoozed('asleep', now + 60_000)
    const ids = computeVisibleWorktreeIds(
      { repo1: [awake, asleep] },
      [awake.id, asleep.id],
      visibleOptions({ now })
    )
    expect(ids).toEqual([awake.id])
  })

  it('reveals them once the toggle is on', () => {
    const asleep = snoozed('asleep', now + 60_000)
    const ids = computeVisibleWorktreeIds(
      { repo1: [asleep] },
      [asleep.id],
      visibleOptions({ now, showSnoozedWorkspaces: true })
    )
    expect(ids).toEqual([asleep.id])
  })

  it('brings a workspace back with no write once its wake time passes', () => {
    const asleep = snoozed('asleep', now)
    const ids = computeVisibleWorktreeIds(
      { repo1: [asleep] },
      [asleep.id],
      visibleOptions({ now: now + 1 })
    )
    expect(ids).toEqual([asleep.id])
  })

  it('hides a snoozed workspace even when it is pinned', () => {
    const asleep = { ...snoozed('asleep', now + 60_000), isPinned: true }
    const ids = computeVisibleWorktreeIds({ repo1: [asleep] }, [asleep.id], visibleOptions({ now }))
    expect(ids).toEqual([])
  })

  it('leaves workspaces with a cleared snooze visible', () => {
    const cleared = snoozed('cleared', null)
    const ids = computeVisibleWorktreeIds(
      { repo1: [cleared] },
      [cleared.id],
      visibleOptions({ now })
    )
    expect(ids).toEqual([cleared.id])
  })
})
