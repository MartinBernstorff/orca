import { describe, expect, it } from 'vitest'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { worktree } from '../../worktree-list-groups-test-fixtures'
import { buildWorkspaceEngagementDropUpdates } from './engagement-drop'

describe('buildWorkspaceEngagementDropUpdates', () => {
  it('skips workspaces already in the target lane', () => {
    const worktrees: Worktree[] = [
      { ...worktree, id: 'wt-queued' },
      { ...worktree, id: 'wt-engaged', engagement: 'engaged' }
    ]
    const updates = buildWorkspaceEngagementDropUpdates({
      worktreeIds: ['wt-queued', 'wt-engaged'],
      engagement: 'engaged',
      worktreeMap: new Map(worktrees.map((entry) => [entry.id, entry]))
    })
    expect(updates.map((update) => update.worktreeId)).toEqual(['wt-queued'])
  })

  it('writes folder workspaces, which the worktree map does not hold', () => {
    const updates = buildWorkspaceEngagementDropUpdates({
      worktreeIds: ['folder:fw-1'],
      engagement: 'engaged',
      worktreeMap: new Map()
    })
    expect(updates).toEqual([{ worktreeId: 'folder:fw-1', updates: { engagement: 'engaged' } }])
  })
})
