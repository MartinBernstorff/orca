import type { useAppStore } from '@/store'
import type { Worktree } from '../../../shared/worktree/types'
import { isWorkspaceSnoozed } from '../../../shared/worktree/snooze'

/** Ends a snooze when the workspace is activated. */
export function endSnoozeOnActivation(
  state: ReturnType<typeof useAppStore.getState>,
  worktreeId: string,
  wt: Worktree
): void {
  // Why clear rather than reveal: snooze is per-workspace, so unhiding it for
  // this one activation is the same as ending the snooze.
  if (isWorkspaceSnoozed(wt, Date.now())) {
    void state.updateWorktreeMeta(
      worktreeId,
      { snoozedUntil: null },
      { executionHostId: wt.hostId ?? 'local' }
    )
  }
}
