import type { WorkspaceEngagement } from '../../../../../../shared/worktree/engagement'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { parseWorkspaceKey } from '../../../../../../shared/workspace-scope'
import type { WorktreeMetaBatchUpdate } from '../../../../store/slices/worktree-helpers'
import { getWorkspaceEngagement } from '../../workspace-engagement-meta'

/** Meta writes for dropping workspaces onto an Engagement header; skips no-op moves. */
export function buildWorkspaceEngagementDropUpdates(args: {
  worktreeIds: readonly string[]
  engagement: WorkspaceEngagement
  worktreeMap: ReadonlyMap<string, Worktree>
}): WorktreeMetaBatchUpdate[] {
  const updates: WorktreeMetaBatchUpdate[] = []
  for (const worktreeId of args.worktreeIds) {
    const current = args.worktreeMap.get(worktreeId)
    if (current) {
      if (getWorkspaceEngagement(current) !== args.engagement) {
        updates.push({
          worktreeId,
          updates: { engagement: args.engagement },
          executionHostId: current.hostId ?? 'local'
        })
      }
      continue
    }
    // Why: folder workspaces are not in the worktree map; the store routes their key to the folder update.
    if (parseWorkspaceKey(worktreeId)?.type === 'folder') {
      updates.push({ worktreeId, updates: { engagement: args.engagement } })
    }
  }
  return updates
}
