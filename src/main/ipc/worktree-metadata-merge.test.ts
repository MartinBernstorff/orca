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

describe('mergeWorktree priority projection', () => {
  const meta = {
    instanceId: '11111111-1111-4111-8111-111111111111',
    hostId: 'local' as const,
    displayName: '',
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

  it('carries a persisted priority onto the listing row', () => {
    expect(mergeWorktree('repo-1', git, { ...meta, priority: 'high' }).priority).toBe('high')
  })

  it('projects a missing or unknown priority as an explicit null', () => {
    expect(mergeWorktree('repo-1', git, undefined).priority).toBeNull()
    expect(mergeWorktree('repo-1', git, { ...meta, priority: 'p0' as never }).priority).toBeNull()
  })
})

describe('mergeWorktree engagement projection', () => {
  const meta = {
    instanceId: '11111111-1111-4111-8111-111111111111',
    hostId: 'local' as const,
    displayName: '',
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

  it('keeps the persisted prompt count across a listing refresh', () => {
    const merged = mergeWorktree('repo-1', git, { ...meta, promptCount: 7, lastPromptAt: 42 })
    expect(merged).toMatchObject({ promptCount: 7, lastPromptAt: 42 })
  })

  it('projects a missing count as an explicit zero', () => {
    expect(mergeWorktree('repo-1', git, undefined)).toMatchObject({
      promptCount: 0,
      lastPromptAt: 0
    })
  })
})
