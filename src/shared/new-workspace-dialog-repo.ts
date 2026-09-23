import {
  ALL_EXECUTION_HOSTS_SCOPE,
  getRepoExecutionHostId,
  isRuntimeOwnedSshTargetId,
  type ExecutionHostScope
} from './execution-host'
import { isGitRepoKind } from './repo-kind'
import type { Repo } from './repo-types'

type NewWorkspaceDialogRepo = Pick<
  Repo,
  'id' | 'path' | 'kind' | 'connectionId' | 'executionHostId'
>

export function getNewWorkspaceDialogEligibleRepos<T extends Pick<Repo, 'path' | 'connectionId'>>(
  repos: readonly T[]
): T[] {
  // Why: a runtime-owned (per-workspace-env) SSH repo is hidden plumbing, not a real project. If it
  // were selectable here, creating an ephemeral VM would seed the composer to that repo — which has
  // no recipes — hiding the "Run on" picker entirely on the next create. Exclude it like every other
  // user-facing surface does.
  return repos.filter((repo) => Boolean(repo.path) && !isRuntimeOwnedSshTargetId(repo.connectionId))
}

export function resolveNewWorkspaceDialogRepoId({
  eligibleRepos,
  draftRepoId,
  initialRepoId,
  activeRepoId,
  focusedHostScope,
  filterRepoIds
}: {
  eligibleRepos: readonly NewWorkspaceDialogRepo[]
  draftRepoId?: string | null
  initialRepoId?: string | null
  activeRepoId?: string | null
  focusedHostScope?: ExecutionHostScope | null
  filterRepoIds?: readonly string[]
}): string {
  // Why: every new-workspace dialog should seed the repo the same way. Mobile
  // mirrors this locally because Metro cannot bundle root shared runtime modules.
  const filteredRepos = filterRepoIds?.length
    ? eligibleRepos.filter((repo) => filterRepoIds.includes(repo.id))
    : []
  // Why: implicit defaults stay within the sidebar project filter; explicit picks (draft, initial) don't.
  const defaultPool = filteredRepos.length > 0 ? filteredRepos : eligibleRepos
  const focusedHostRepo =
    focusedHostScope && focusedHostScope !== ALL_EXECUTION_HOSTS_SCOPE
      ? defaultPool.find((repo) => getRepoExecutionHostId(repo) === focusedHostScope)
      : undefined

  const resolvedRepo =
    (draftRepoId && eligibleRepos.find((repo) => repo.id === draftRepoId)) ||
    (initialRepoId && eligibleRepos.find((repo) => repo.id === initialRepoId)) ||
    (activeRepoId && defaultPool.find((repo) => repo.id === activeRepoId)) ||
    focusedHostRepo ||
    defaultPool[0]

  return resolvedRepo?.id ?? ''
}

export function resolveNewWorkspaceDialogGitRepoId(args: {
  eligibleRepos: readonly NewWorkspaceDialogRepo[]
  draftRepoId?: string | null
  initialRepoId?: string | null
  activeRepoId?: string | null
  focusedHostScope?: ExecutionHostScope | null
  filterRepoIds?: readonly string[]
}): string | null {
  const repoId = resolveNewWorkspaceDialogRepoId(args)
  const repo = repoId ? args.eligibleRepos.find((entry) => entry.id === repoId) : null
  return repo && isGitRepoKind(repo) ? repo.id : null
}
