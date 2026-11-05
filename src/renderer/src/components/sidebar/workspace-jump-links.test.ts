import { describe, expect, it } from 'vitest'
import type { HostedReviewInfo } from '../../../../shared/hosted-review'
import type { Worktree } from '../../../../shared/worktree/types'
import { resolveWorkspaceJumpLinks } from './workspace-jump-links'

const base = { displayName: 'my-task', linkedPR: null, linkedLinearIssue: null } as Worktree

describe('resolveWorkspaceJumpLinks', () => {
  it('exposes the linked work item identifier and searches its title', () => {
    const worktree = {
      ...base,
      linkedWorkItem: { linearIdentifier: 'ENG-7', title: 'Fix login', number: 0 }
    } as Worktree

    expect(resolveWorkspaceJumpLinks(worktree, 'orca', undefined)).toEqual({
      taskId: 'ENG-7',
      reviewId: '',
      keywords: ['my-task', 'orca', 'ENG-7', 'Fix login']
    })
  })

  it('falls back to the legacy Linear identifier', () => {
    expect(
      resolveWorkspaceJumpLinks({ ...base, linkedLinearIssue: 'ENG-9' }, undefined, undefined)
    ).toMatchObject({ taskId: 'ENG-9', keywords: ['my-task', 'ENG-9'] })
  })

  it('uses the resolved review number and title', () => {
    const review = { provider: 'github', number: 12, title: 'Add search' } as HostedReviewInfo

    expect(resolveWorkspaceJumpLinks({ ...base, linkedPR: 3 }, undefined, review)).toEqual({
      taskId: '',
      reviewId: '#12',
      keywords: ['my-task', '#12', 'Add search']
    })
  })

  it('marks GitLab merge requests with !', () => {
    const review = { provider: 'gitlab', number: 5, title: '' } as HostedReviewInfo

    expect(resolveWorkspaceJumpLinks(base, undefined, review).reviewId).toBe('!5')
  })

  it('falls back to the persisted PR link when no review was resolved', () => {
    expect(resolveWorkspaceJumpLinks({ ...base, linkedPR: 3 }, undefined, undefined)).toMatchObject(
      { reviewId: '#3', keywords: ['my-task', '#3'] }
    )
  })

  it('trusts an authoritative empty review over the persisted PR link', () => {
    expect(resolveWorkspaceJumpLinks({ ...base, linkedPR: 3 }, undefined, null)).toMatchObject({
      reviewId: '',
      keywords: ['my-task']
    })
  })
})
