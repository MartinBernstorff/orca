import { useEffect, useMemo, useRef } from 'react'
import type { SortBy } from '../../smart-sort'
import { useReusedArrayIdentity } from './use-reused-array-identity'

/**
 * Keep `frozenIds` in place, drop ids missing from `nextIds`, and slot each new id
 * right after the frozen id that precedes it in `nextIds`.
 */
export function mergeNewIdsIntoFrozenOrder(
  frozenIds: readonly string[],
  nextIds: readonly string[]
): string[] {
  const frozenIdSet = new Set(frozenIds)
  const newIdsByAnchor = new Map<string | null, string[]>()
  let anchor: string | null = null
  for (const id of nextIds) {
    if (frozenIdSet.has(id)) {
      anchor = id
      continue
    }
    const group = newIdsByAnchor.get(anchor)
    if (group) {
      group.push(id)
    } else {
      newIdsByAnchor.set(anchor, [id])
    }
  }
  const nextIdSet = new Set(nextIds)
  const merged = [...(newIdsByAnchor.get(null) ?? [])]
  for (const id of frozenIds) {
    if (nextIdSet.has(id)) {
      merged.push(id, ...(newIdsByAnchor.get(id) ?? []))
    }
  }
  return merged
}

// Why: re-sorting under the pointer moves the row the user is about to click.
// A sort-mode switch is explicit, so it applies even while frozen.
export function useFrozenSortOrder(nextIds: string[], sortBy: SortBy, frozen: boolean): string[] {
  const committedRef = useRef({ sortBy, ids: nextIds })
  const committed = committedRef.current
  const keepCommitted = frozen && committed.sortBy === sortBy
  const merged = useMemo(
    () => (keepCommitted ? mergeNewIdsIntoFrozenOrder(committed.ids, nextIds) : nextIds),
    [keepCommitted, committed, nextIds]
  )
  const ids = useReusedArrayIdentity(merged)
  // Why effect: React can replay or discard render, so a render-time ref write can leak a discarded order.
  useEffect(() => {
    committedRef.current = { sortBy, ids }
  }, [sortBy, ids])
  return ids
}
