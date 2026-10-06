// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import { useWorktreeCardWorkspaceActions } from './use-worktree-card-workspace-actions'

function makeClickEvent(): React.MouseEvent<HTMLButtonElement> {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  } as unknown as React.MouseEvent<HTMLButtonElement>
}

describe('useWorktreeCardWorkspaceActions', () => {
  it('engages the workspace on its own execution host', () => {
    const updateWorktreeMeta = vi.fn().mockResolvedValue(undefined)
    const worktree = { id: 'repo-1::/repo/wt', hostId: 'ssh:box' } as unknown as Worktree
    const { result } = renderHook(() =>
      useWorktreeCardWorkspaceActions({
        worktree,
        lineageChildCount: 0,
        folderWorkspaceId: null,
        deleteFolderWorkspace: vi.fn(),
        setActiveWorktree: vi.fn(),
        setShowRenameErrorDialog: vi.fn(),
        updateWorktreeMeta,
        isDeleting: false,
        showDeleteQuickAction: false
      } as unknown as Parameters<typeof useWorktreeCardWorkspaceActions>[0])
    )

    const event = makeClickEvent()
    result.current.handleEngageQuickAction(event)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(updateWorktreeMeta).toHaveBeenCalledWith(
      'repo-1::/repo/wt',
      { engagement: 'engaged' },
      { executionHostId: 'ssh:box' }
    )
  })
})
