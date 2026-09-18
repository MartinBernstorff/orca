import { isPositiveHostedReviewNumber } from '../../../../shared/hosted-review'
import type { WorktreeCardPrDisplay } from './worktree-card-pr-display'

export type WorktreeCardLinkedRef = {
  key: 'linear' | 'review'
  label: string
  /** Null when the provider URL can't be resolved; the ref then renders as inert text. */
  url: string | null
}

/** Quiet identifiers for a sidebar card: the linked Linear issue and the linked
 *  review number, in that order, each carrying the URL it opens. */
export function getWorktreeCardLinkedRefs({
  linkedLinearIssue,
  linearIssueUrl,
  prDisplay,
  showLinearIssue,
  showReview
}: {
  linkedLinearIssue: string | null | undefined
  linearIssueUrl: string | null | undefined
  prDisplay: WorktreeCardPrDisplay | null | undefined
  showLinearIssue: boolean
  showReview: boolean
}): WorktreeCardLinkedRef[] {
  const refs: WorktreeCardLinkedRef[] = []
  const linearIdentifier = linkedLinearIssue?.trim()
  if (showLinearIssue && linearIdentifier) {
    refs.push({
      key: 'linear',
      label: linearIdentifier.toUpperCase(),
      url: linearIssueUrl?.trim() || null
    })
  }
  if (
    showReview &&
    prDisplay &&
    prDisplay.provider !== 'unsupported' &&
    isPositiveHostedReviewNumber(prDisplay.number)
  ) {
    // GitLab numbers merge requests with `!`; every other provider uses `#`.
    refs.push({
      key: 'review',
      label: `${prDisplay.provider === 'gitlab' ? '!' : '#'}${prDisplay.number}`,
      url: prDisplay.url?.trim() || null
    })
  }
  return refs
}
