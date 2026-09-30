import { describe, expect, it } from 'vitest'
import { canonicalWorktreeIdentity } from '../../shared/worktree/identity'
import type { GitWorktreeInfo } from '../../shared/worktree/types'
import { mergeWorktree } from './worktree-metadata-merge'

const git: GitWorktreeInfo = {
  path: '/workspace/feature',
  head: 'abc123',
  branch: 'refs/heads/feature',
  isBare: false,
  isMainWorktree: false
}

describe('mergeWorktree identity projection', () => {
  it('re-derives an automatic display name from the current branch', () => {
    const worktree = mergeWorktree(
      'repo-1',
      { ...git, branch: 'refs/heads/main' },
      {
        displayName: 'feature',
        displayNameIsPinned: false,
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
    )

    expect(worktree.displayName).toBe('main')
    expect(worktree.displayNameMode).toBe('automatic')
  })

  it('treats legacy CLI labels as fixed display names', () => {
    const worktree = mergeWorktree('repo-1', git, {
      displayName: 'feature',
      cliProvenance: { kind: 'created-by-cli', createdAt: 1 },
      comment: '',
      linkedIssue: null,
      linkedPR: null,
      linkedLinearIssue: null,
      isArchived: false,
      isUnread: false,
      isPinned: false,
      sortOrder: 0,
      lastActivityAt: 0
    })

    expect(worktree.displayNameMode).toBe('fixed')
  })

  it('publishes canonical identity when host and instance metadata are known', () => {
    const worktree = mergeWorktree('repo-1', git, {
      instanceId: '11111111-1111-4111-8111-111111111111',
      hostId: 'ssh:build-box',
      displayName: 'Feature',
      comment: '',
      linkedIssue: null,
      linkedPR: null,
      linkedLinearIssue: null,
      isArchived: false,
      isUnread: false,
      isPinned: false,
      sortOrder: 0,
      lastActivityAt: 0
    })

    expect(worktree.identity).toEqual({
      key: canonicalWorktreeIdentity({
        worktreeId: worktree.id,
        executionHostId: 'ssh:build-box',
        instanceId: '11111111-1111-4111-8111-111111111111'
      }),
      executionHostId: 'ssh:build-box',
      instanceId: '11111111-1111-4111-8111-111111111111'
    })
  })

  it('omits canonical identity for legacy metadata without a proven host', () => {
    const worktree = mergeWorktree('repo-1', git, undefined)

    expect(worktree.identity).toBeUndefined()
  })

  it('projects optional GitHub PR suppression metadata', () => {
    const worktree = mergeWorktree('repo-1', git, {
      displayName: 'Feature',
      comment: '',
      linkedIssue: null,
      linkedPR: null,
      suppressedGitHubPR: 42,
      linkedLinearIssue: null,
      isArchived: false,
      isUnread: false,
      isPinned: false,
      sortOrder: 0,
      lastActivityAt: 0
    })

    expect(worktree.suppressedGitHubPR).toBe(42)
  })
})

describe('mergeWorktree snooze projection', () => {
  it('carries a persisted wake time onto the listing row', () => {
    const worktree = mergeWorktree('repo-1', git, {
      instanceId: '11111111-1111-4111-8111-111111111111',
      hostId: 'local',
      displayName: 'Feature',
      comment: '',
      linkedIssue: null,
      linkedPR: null,
      linkedLinearIssue: null,
      isArchived: false,
      isUnread: false,
      isPinned: false,
      snoozedUntil: 1_800_000_000_000,
      sortOrder: 0,
      lastActivityAt: 0
    })

    expect(worktree.snoozedUntil).toBe(1_800_000_000_000)
  })

  it('projects a missing or unusable wake time as an explicit null', () => {
    // Why explicit: the catalog reconciler treats an absent key as undefined, and a row
    // whose snooze reads undefined is adopted over the renderer's live value.
    expect(mergeWorktree('repo-1', git, undefined).snoozedUntil).toBeNull()
    expect(
      mergeWorktree('repo-1', git, {
        instanceId: '11111111-1111-4111-8111-111111111111',
        hostId: 'local',
        displayName: '',
        comment: '',
        linkedIssue: null,
        linkedPR: null,
        linkedLinearIssue: null,
        isArchived: false,
        isUnread: false,
        isPinned: false,
        snoozedUntil: Number.NaN,
        sortOrder: 0,
        lastActivityAt: 0
      }).snoozedUntil
    ).toBeNull()
  })
})
