import { resolveLinkedTaskIdentifier } from '@/lib/worktree-palette-evidence'
import type { HostedReviewInfo } from '../../../../shared/hosted-review'
import type { Worktree } from '../../../../shared/worktree/types'

export type WorkspaceJumpLinks = {
  /** Linked task identifier, e.g. `ENG-42`; empty when none. */
  taskId: string
  /** Linked review number with its provider sigil, e.g. `#123` or `!45`; empty when none. */
  reviewId: string
  /** Text the Cmd+K jump filter matches. */
  keywords: string[]
}

export function resolveWorkspaceJumpLinks(
  worktree: Worktree,
  repoName: string | undefined,
  review: HostedReviewInfo | null | undefined
): WorkspaceJumpLinks {
  const taskId = resolveLinkedTaskIdentifier(worktree)
  let reviewId = ''
  let reviewTitle = ''
  if (review) {
    reviewId = `${review.provider === 'gitlab' ? '!' : '#'}${review.number}`
    reviewTitle = review.title
  } else if (review === undefined && worktree.linkedPR != null) {
    // Why: Checks hasn't resolved this branch yet, but the persisted link still identifies the PR.
    reviewId = `#${worktree.linkedPR}`
  }
  const keywords = [
    worktree.displayName,
    repoName ?? '',
    taskId,
    worktree.linkedWorkItem?.title ?? '',
    reviewId,
    reviewTitle
  ].filter(Boolean)
  return { taskId, reviewId, keywords }
}
