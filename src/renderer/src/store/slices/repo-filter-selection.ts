// Why: catalog refreshes re-filter this on every fetch; six identity-sensitive subscribers
// (App.tsx at the root among them) re-render on a new array even when nothing was pruned.
export function retainValidFilterRepoIds(
  filterRepoIds: readonly string[],
  validRepoIds: ReadonlySet<string>
): readonly string[] {
  return filterRepoIds.every((repoId) => validRepoIds.has(repoId))
    ? filterRepoIds
    : filterRepoIds.filter((repoId) => validRepoIds.has(repoId))
}

/**
 * Widens an active project filter so `repoId` survives it, instead of dropping
 * the user's whole selection to reveal one workspace.
 *
 * Returns null when nothing needs to change: an empty filter shows every
 * project already, and a filter that lists this one hides nothing.
 */
export function withRepoIncludedInFilter(
  filterRepoIds: readonly string[],
  repoId: string
): string[] | null {
  if (filterRepoIds.length === 0 || filterRepoIds.includes(repoId)) {
    return null
  }
  return [...filterRepoIds, repoId]
}
