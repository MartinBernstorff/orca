import { afterEach, describe, expect, it } from 'vitest'
import { useAppStore } from '@/store'
import type { AppState } from '@/store/types'
import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import { getFilteredSidebarWorktrees } from './visible-worktrees'
import { computeWorkspaceJumpSections } from './workspace-jump-sections'

const initialState = useAppStore.getInitialState()

function makeWorktree(id: string, repoId: string, overrides: Partial<Worktree> = {}): Worktree {
  return {
    id,
    repoId,
    path: `/tmp/${id}`,
    head: 'abc123',
    branch: 'refs/heads/feature',
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
    lastActivityAt: 0,
    ...overrides
  } as Worktree
}

function makeRepo(id: string): Repo {
  return {
    id,
    name: id,
    displayName: id,
    path: `/tmp/${id}`,
    defaultBranch: 'main',
    connectionId: null
  } as unknown as Repo
}

function seedStore(overrides: Partial<AppState> = {}): AppState {
  useAppStore.setState(
    {
      ...initialState,
      repos: [makeRepo('alpha'), makeRepo('beta')],
      worktreesByRepo: {
        alpha: [
          makeWorktree('alpha-feature', 'alpha', { sortOrder: 1 }),
          makeWorktree('alpha-main', 'alpha', {
            isMainWorktree: true,
            branch: 'refs/heads/main'
          })
        ],
        beta: [makeWorktree('beta-feature', 'beta')]
      },
      // Why: fixtures have no PTYs, so the activity filter would otherwise drop every workspace.
      showSleepingWorkspaces: true,
      groupBy: 'repo',
      sortBy: 'manual',
      ...overrides
    } as AppState,
    true
  )
  return useAppStore.getState()
}

function summarize(state: AppState): { heading: string; ids: string[] }[] {
  return computeWorkspaceJumpSections(state, getFilteredSidebarWorktrees(state)).map((section) => ({
    heading: section.headingPath.join(' / '),
    ids: section.worktrees.map((worktree) => worktree.id)
  }))
}

describe('computeWorkspaceJumpSections', () => {
  afterEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('lists workspaces under their sidebar headers in sidebar order', () => {
    expect(summarize(seedStore())).toEqual([
      { heading: 'alpha', ids: ['alpha-main', 'alpha-feature'] },
      { heading: 'beta', ids: ['beta-feature'] }
    ])
  })

  it('only lists projects selected in the project filter', () => {
    expect(summarize(seedStore({ filterRepoIds: ['beta'] }))).toEqual([
      { heading: 'beta', ids: ['beta-feature'] }
    ])
  })

  it('lists members of groups collapsed in the sidebar', () => {
    const state = seedStore({
      collapsedGroups: new Set(['project:repo:alpha'])
    })
    expect(summarize(state).map((section) => section.heading)).toEqual(['alpha', 'beta'])
  })

  it('lists a pinned workspace once', () => {
    const state = seedStore({
      worktreesByRepo: {
        alpha: [makeWorktree('alpha-pinned', 'alpha', { isPinned: true })],
        beta: []
      },
      settings: { showPinnedWorktreesInGroups: true } as AppState['settings']
    })
    const ids = summarize(state).flatMap((section) => section.ids)
    expect(ids).toEqual(['alpha-pinned'])
  })
})
