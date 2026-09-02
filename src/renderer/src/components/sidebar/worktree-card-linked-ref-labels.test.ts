import { describe, expect, it } from 'vitest'

import type { HostedReviewInfo } from '../../../../shared/hosted-review'

import { getWorktreeCardLinkedRefLabels } from './worktree-card-linked-ref-labels'

describe('getWorktreeCardLinkedRefLabels', () => {
  it('returns nothing without a linked issue or review', () => {
    expect(getWorktreeCardLinkedRefLabels(null, null)).toEqual([])
  })

  it('uppercases the Linear identifier', () => {
    expect(getWorktreeCardLinkedRefLabels('e-1466', null)).toEqual(['E-1466'])
  })

  it('orders the Linear identifier before the review number', () => {
    expect(
      getWorktreeCardLinkedRefLabels('E-1466', {
        provider: 'github',
        number: 4321,
        title: 'PR'
      })
    ).toEqual(['E-1466', '#4321'])
  })

  it('marks GitLab merge requests with a bang', () => {
    expect(
      getWorktreeCardLinkedRefLabels(null, { provider: 'gitlab', number: 12, title: 'MR' })
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
    expect(getWorktreeCardLinkedRefLabels(null, unsupportedReview)).toEqual([])
    expect(
      getWorktreeCardLinkedRefLabels('   ', { provider: 'github', number: 0, title: 'PR' })
    ).toEqual([])
  })
})
