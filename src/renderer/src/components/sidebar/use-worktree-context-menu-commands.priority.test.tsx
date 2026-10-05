// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import type { Worktree } from '../../../../shared/worktree/types'
import { worktree } from './worktree-list-groups-test-fixtures'
import { useWorktreeContextMenuCommands } from './use-worktree-context-menu-commands'

type CommandArgs = Parameters<typeof useWorktreeContextMenuCommands>[0]

function setPriorityFromMenu(lane: 'high' | 'none', target: Worktree) {
  const updateWorktreeMeta = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() =>
    useWorktreeContextMenuCommands({
      activeContextWorktrees: [target],
      worktree: target,
      updateWorktreeMeta
    } as unknown as CommandArgs)
  )
  result.current.handleSetPriority(lane)
  return updateWorktreeMeta
}

describe('setting priority from the workspace context menu', () => {
  afterEach(cleanup)

  it('marks a queued workspace Engaged in the same metadata update', () => {
    const update = setPriorityFromMenu('high', { ...worktree, engagement: 'queued' })
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(
      worktree.id,
      { priority: 'high', engagement: 'engaged' },
      { executionHostId: 'local' }
    )
  })

  it('clears priority without touching Engagement', () => {
    const update = setPriorityFromMenu('none', {
      ...worktree,
      priority: 'high',
      engagement: 'queued'
    })
    expect(update).toHaveBeenCalledWith(
      worktree.id,
      { priority: null },
      { executionHostId: 'local' }
    )
  })
})
