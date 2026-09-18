import { describe, expect, it } from 'vitest'

import type { HostedReviewInfo } from '../../../../shared/hosted-review'

import { getWorktreeCardLinkedRefs } from './worktree-card-linked-refs'

function build(
  overrides: Partial<Parameters<typeof getWorktreeCardLinkedRefs>[0]> = {}
): ReturnType<typeof getWorktreeCardLinkedRefs> {
  return getWorktreeCardLinkedRefs({
    linkedLinearIssue: null,
    linearIssueUrl: null,
    prDisplay: null,
    showLinearIssue: true,
    showReview: true,
    ...overrides
  })
}

describe('getWorktreeCardLinkedRefs', () => {
  it('returns nothing without a linked issue or review', () => {
    expect(build()).toEqual([])
  })

  it('uppercases the Linear identifier and carries its URL', () => {
    expect(
      build({ linkedLinearIssue: 'e-1466', linearIssueUrl: 'https://linear.app/acme/issue/E-1466' })
    ).toEqual([{ key: 'linear', label: 'E-1466', url: 'https://linear.app/acme/issue/E-1466' }])
  })

  it('leaves a ref inert when its URL is unresolved', () => {
    expect(build({ linkedLinearIssue: 'E-1466' })).toEqual([
      { key: 'linear', label: 'E-1466', url: null }
    ])
    expect(build({ prDisplay: { provider: 'github', number: 7, title: 'PR' } })).toEqual([
      { key: 'review', label: '#7', url: null }
    ])
  })

  it('orders the Linear identifier before the review number', () => {
    expect(
      build({
        linkedLinearIssue: 'E-1466',
        prDisplay: {
          provider: 'github',
          number: 4321,
          title: 'PR',
          url: 'https://github.com/acme/orca/pull/4321'
        }
      }).map((ref) => ref.label)
    ).toEqual(['E-1466', '#4321'])
  })

  it('marks GitLab merge requests with a bang', () => {
    expect(
      build({ prDisplay: { provider: 'gitlab', number: 12, title: 'MR' } }).map((ref) => ref.label)
    ).toEqual(['!12'])
  })

  it('skips reviews without a usable number', () => {
    const unsupportedReview: HostedReviewInfo = {
      provider: 'unsupported',
      number: 7,
      title: 'PR',
      state: 'open',
      url: '',
      status: 'pending',
      updatedAt: '',
      mergeable: 'UNKNOWN'
    }
    expect(build({ prDisplay: unsupportedReview })).toEqual([])
    expect(
      build({ linkedLinearIssue: '   ', prDisplay: { provider: 'github', number: 0, title: 'PR' } })
    ).toEqual([])
  })

  it('honours the card property toggles', () => {
    const args = {
      linkedLinearIssue: 'E-1466',
      prDisplay: { provider: 'github' as const, number: 9, title: 'PR' }
    }
    expect(build({ ...args, showLinearIssue: false }).map((ref) => ref.key)).toEqual(['review'])
    expect(build({ ...args, showReview: false }).map((ref) => ref.key)).toEqual(['linear'])
    expect(build({ ...args, showLinearIssue: false, showReview: false })).toEqual([])
  })
})
