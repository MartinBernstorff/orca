import { useMemo } from 'react'
import { useNow } from '@/components/dashboard/useNow'
import { useAppStore } from '@/store'
import { getAllWorktreesFromState } from '@/store/selectors'
import type { Worktree } from '../../../../shared/worktree/types'
import { isWorkspaceSnoozed } from '../../../../shared/worktree/snooze'

/** Coarse on purpose: a snooze resolution finer than a minute has no UI meaning. */
export const SNOOZE_EXPIRY_TICK_MS = 60_000

const EMPTY_WORKTREES_BY_REPO: Record<string, Worktree[]> = {}

export function useSnoozedWorkspaceCount(): number {
  const now = useNow(SNOOZE_EXPIRY_TICK_MS)
  const worktreesByRepo = useAppStore((s) => s.worktreesByRepo ?? EMPTY_WORKTREES_BY_REPO)
  return useMemo(
    () =>
      getAllWorktreesFromState({ worktreesByRepo }).filter(
        (worktree) => !worktree.isArchived && isWorkspaceSnoozed(worktree, now)
      ).length,
    [worktreesByRepo, now]
  )
}
