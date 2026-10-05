import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { getAllWorktreesFromState } from '@/store/selectors'
import { persistWorktreeSortOrderByHost } from '@/lib/worktree-sort-order-persistence'
import type { Repo } from '../../../../../../shared/repo-types'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { buildWorktreeComparator, type SortBy } from '../../smart-sort'
import { useReusedArrayIdentity } from './use-reused-array-identity'
import { useFrozenSortOrder } from './frozen-sort-order'

// Debounce re-sort after a sortEpoch bump so background score changes don't jar row positions.
export const SORT_SETTLE_MS = 3_000

// Why debounce: background activity bumps sortEpoch often; settle to coalesce so rows don't jump.
// Structural changes (add/remove) bypass the debounce so a new worktree appears at its sorted position immediately.
function useDebouncedSortEpoch(worktreeCount: number, sortBy: SortBy): number {
  const sortEpoch = useAppStore((s) => s.sortEpoch)
  const [debouncedSortEpoch, setDebouncedSortEpoch] = useState(sortEpoch)
  const prevWorktreeCountRef = useRef(worktreeCount)
  useEffect(() => {
    if (debouncedSortEpoch === sortEpoch) {
      return
    }

    const structuralChange = worktreeCount !== prevWorktreeCountRef.current
    prevWorktreeCountRef.current = worktreeCount

    // Why: manual drag/drop is direct manipulation; the settle-window delay would make a successful drop look broken.
    if (structuralChange || sortBy === 'manual') {
      setDebouncedSortEpoch(sortEpoch)
      return
    }

    const timer = setTimeout(() => setDebouncedSortEpoch(sortEpoch), SORT_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [sortEpoch, debouncedSortEpoch, worktreeCount, sortBy])
  return debouncedSortEpoch
}

// ── Stable sort order ──────────────────────────────────────────
// Why sortEpoch (not selection): selection side-effects (clearing isUnread, PR-cache refresh) must not reorder the sidebar under the user.
// Why useMemo not useEffect: order must be computed synchronously before the worktrees memo reads it.
export function useSidebarWorktreeSortOrder(args: {
  allWorktrees: readonly Worktree[]
  repoMap: Map<string, Repo>
  sortBy: SortBy
  /** Pointer is over the sidebar: keep the rendered order; pending re-sorts apply once false. */
  freezeOrder?: boolean
}): string[] {
  const { allWorktrees, repoMap, sortBy, freezeOrder = false } = args
  // Non-archived count — detects structural changes (add/remove) so the debounce below can apply immediately.
  const worktreeCount = useMemo(() => {
    let count = 0
    for (const worktree of allWorktrees) {
      if (!worktree.isArchived) {
        count++
      }
    }
    return count
  }, [allWorktrees])
  const debouncedSortEpoch = useDebouncedSortEpoch(worktreeCount, sortBy)

  const recomputedSortedIds = useMemo(() => {
    const nonArchivedWorktrees = getAllWorktreesFromState(useAppStore.getState()).filter(
      (worktree) => !worktree.isArchived
    )
    nonArchivedWorktrees.sort(buildWorktreeComparator(sortBy, repoMap, Date.now()))
    return nonArchivedWorktrees.map((w) => w.id)
    // debouncedSortEpoch is an intentional trigger not read in the memo; its change (debounced) signals a recompute.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSortEpoch, repoMap, sortBy])
  // Why: stable ID order prevents rank-only refreshes from echoing an unchanged snapshot.
  const recomputedIds = useReusedArrayIdentity(recomputedSortedIds)
  // Why exempt manual: its re-sorts are the user's own drops, which must land immediately.
  const sortedIds = useFrozenSortOrder(recomputedIds, sortBy, freezeOrder && sortBy !== 'manual')

  // Why: sortOrder seeds Manual sort for never-dragged workspaces and the palette's cold start, so keep it tracking Engagement.
  useEffect(() => {
    if (sortBy !== 'smart' || sortedIds.length === 0) {
      return
    }
    // Why: sortOrder lives in each host's worktreeMeta, so persist each host's ids on that host.
    persistWorktreeSortOrderByHost(useAppStore.getState(), sortedIds)
  }, [sortedIds, sortBy])

  return sortedIds
}
