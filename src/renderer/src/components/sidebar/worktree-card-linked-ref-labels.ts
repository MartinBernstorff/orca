import { isPositiveHostedReviewNumber } from '../../../../shared/hosted-review'
import type { WorktreeCardPrDisplay } from './worktree-card-pr-display'

/** Quiet right-aligned identifiers for a sidebar card: the linked Linear issue
 *  and the linked review number, in that order. */
export function getWorktreeCardLinkedRefLabels(
  linkedLinearIssue: string | null | undefined,
  prDisplay: WorktreeCardPrDisplay | null | undefined
): string[] {
  const labels: string[] = []
  const linearIdentifier = linkedLinearIssue?.trim()
  if (linearIdentifier) {
    labels.push(linearIdentifier.toUpperCase())
  }
  if (
    prDisplay &&
    prDisplay.provider !== 'unsupported' &&
    isPositiveHostedReviewNumber(prDisplay.number)
  ) {
    // GitLab numbers merge requests with `!`; every other provider uses `#`.
    labels.push(`${prDisplay.provider === 'gitlab' ? '!' : '#'}${prDisplay.number}`)
  }
  return labels
}
