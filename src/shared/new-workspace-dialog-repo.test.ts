import { describe, expect, it } from 'vitest'
import { getRepoExecutionHostId } from './execution-host'
import type { Repo } from './repo-types'
import {
  getNewWorkspaceDialogEligibleRepos,
  resolveNewWorkspaceDialogGitRepoId,
  resolveNewWorkspaceDialogRepoId
} from './new-workspace-dialog-repo'

function makeRepo(id: string, overrides: Partial<Repo> = {}): Repo {
  return {
    id,
    path: `/repos/${id}`,
    displayName: id,
    badgeColor: '#000000',
    addedAt: 0,
    ...overrides
  }
}

describe('new workspace dialog repo selection', () => {
  it('matches the dialog repo priority order', () => {
    const eligibleRepos = [
      makeRepo('first'),
      makeRepo('active'),
      makeRepo('initial'),
      makeRepo('draft')
    ]

    expect(
      resolveNewWorkspaceDialogRepoId({
        eligibleRepos,
        draftRepoId: 'draft',
        initialRepoId: 'initial',
        activeRepoId: 'active'
      })
    ).toBe('draft')
  })

  it('falls back through initial, active, then first eligible repo', () => {
    const eligibleRepos = [makeRepo('first'), makeRepo('active')]

    expect(resolveNewWorkspaceDialogRepoId({ eligibleRepos, initialRepoId: 'missing' })).toBe(
      'first'
    )
    expect(resolveNewWorkspaceDialogRepoId({ eligibleRepos, activeRepoId: 'active' })).toBe(
      'active'
    )
  })

  describe('with a sidebar project filter', () => {
    const eligibleRepos = [makeRepo('a'), makeRepo('b'), makeRepo('c')]

    it('keeps the active repo when it is filtered in', () => {
      expect(
        resolveNewWorkspaceDialogRepoId({
          eligibleRepos,
          activeRepoId: 'c',
          filterRepoIds: ['b', 'c']
        })
      ).toBe('c')
    })

    it('falls back to the first filtered repo in repo order when the active repo is filtered out', () => {
      expect(
        resolveNewWorkspaceDialogRepoId({
          eligibleRepos,
          activeRepoId: 'a',
          filterRepoIds: ['c', 'b']
        })
      ).toBe('b')
    })

    it('ignores a filter that only names stale repos', () => {
      expect(
        resolveNewWorkspaceDialogRepoId({
          eligibleRepos,
          activeRepoId: 'a',
          filterRepoIds: ['gone']
        })
      ).toBe('a')
    })

    it('lets explicit draft and initial repos bypass the filter', () => {
      expect(
        resolveNewWorkspaceDialogRepoId({ eligibleRepos, initialRepoId: 'a', filterRepoIds: ['b'] })
      ).toBe('a')
      expect(
        resolveNewWorkspaceDialogRepoId({ eligibleRepos, draftRepoId: 'a', filterRepoIds: ['b'] })
      ).toBe('a')
    })

    it('only picks a focused-host repo from within the filter', () => {
      const repos = [
        makeRepo('remote-out', { connectionId: 'ssh-1' }),
        makeRepo('local-in'),
        makeRepo('remote-in', { connectionId: 'ssh-1' })
      ]
      const focusedHostScope = getRepoExecutionHostId(repos[0])
      expect(
        resolveNewWorkspaceDialogRepoId({
          eligibleRepos: repos,
          focusedHostScope,
          filterRepoIds: ['local-in', 'remote-in']
        })
      ).toBe('remote-in')
    })
  })

  it('returns null for create-base prefetch when the dialog default is a folder repo', () => {
    const eligibleRepos = [makeRepo('folder', { kind: 'folder' }), makeRepo('git')]

    expect(resolveNewWorkspaceDialogGitRepoId({ eligibleRepos })).toBeNull()
  })

  it('excludes repos without paths from dialog defaults', () => {
    expect(
      getNewWorkspaceDialogEligibleRepos([makeRepo('missing-path', { path: '' }), makeRepo('repo')])
    ).toEqual([expect.objectContaining({ id: 'repo' })])
  })

  it('excludes runtime-owned (per-workspace-env) SSH repos but keeps user SSH repos', () => {
    const eligible = getNewWorkspaceDialogEligibleRepos([
      makeRepo('local-repo'),
      makeRepo('user-ssh', { connectionId: 'my-server' }),
      makeRepo('runtime-ssh', { connectionId: 'runtime-ssh-orca-1' })
    ])

    expect(eligible.map((repo) => repo.id)).toEqual(['local-repo', 'user-ssh'])
  })

  it('defaults to a repo on the focused host when no explicit repo is chosen', () => {
    const eligibleRepos = [
      makeRepo('local-repo'),
      makeRepo('ssh-repo', { connectionId: 'win-vm' }),
      makeRepo('runtime-repo', { executionHostId: 'runtime:env-1' })
    ]

    expect(resolveNewWorkspaceDialogRepoId({ eligibleRepos, focusedHostScope: 'ssh:win-vm' })).toBe(
      'ssh-repo'
    )
    expect(
      resolveNewWorkspaceDialogRepoId({ eligibleRepos, focusedHostScope: 'runtime:env-1' })
    ).toBe('runtime-repo')
    expect(resolveNewWorkspaceDialogRepoId({ eligibleRepos, focusedHostScope: 'local' })).toBe(
      'local-repo'
    )
  })

  it('lets explicit draft/initial/active choices win over the focused host', () => {
    const eligibleRepos = [makeRepo('local-repo'), makeRepo('ssh-repo', { connectionId: 'win-vm' })]

    expect(
      resolveNewWorkspaceDialogRepoId({
        eligibleRepos,
        activeRepoId: 'local-repo',
        focusedHostScope: 'ssh:win-vm'
      })
    ).toBe('local-repo')
  })

  it('ignores host scope "all" and falls back to the first eligible repo', () => {
    const eligibleRepos = [makeRepo('local-repo'), makeRepo('ssh-repo', { connectionId: 'win-vm' })]

    expect(resolveNewWorkspaceDialogRepoId({ eligibleRepos, focusedHostScope: 'all' })).toBe(
      'local-repo'
    )
  })
})
