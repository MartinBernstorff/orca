// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import { useWorktreeCardWorkspaceActions } from './use-worktree-card-workspace-actions'

const { openWorktreeInLastUsedAppMock } = vi.hoisted(() => ({
  openWorktreeInLastUsedAppMock: vi.fn()
}))

vi.mock('@/components/open-in/open-worktree-in-last-used-app', () => ({
  openWorktreeInLastUsedApp: openWorktreeInLastUsedAppMock
}))

vi.mock('@/lib/connection-owner-resolution', () => ({
  getConnectionIdFromState: (_state: unknown, worktreeId: string) => `conn-for:${worktreeId}`
}))

function renderWorkspaceActions(worktree: Worktree, updateWorktreeMeta = vi.fn()) {
  return renderHook(() =>
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
}

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
    const { result } = renderWorkspaceActions(worktree, updateWorktreeMeta)

    const event = makeClickEvent()
    result.current.handleEngageQuickAction(event)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(updateWorktreeMeta).toHaveBeenCalledWith(
      'repo-1::/repo/wt',
      { engagement: 'engaged' },
      { executionHostId: 'ssh:box' }
    )
  })
  it('opens the workspace in the last used app on its own connection', () => {
    const worktree = { id: 'repo-1::/repo/wt', path: '/repo/wt' } as unknown as Worktree
    const { result } = renderWorkspaceActions(worktree)

    const event = makeClickEvent()
    result.current.handleOpenQuickAction(event)

    expect(event.stopPropagation).toHaveBeenCalled()
    expect(openWorktreeInLastUsedAppMock).toHaveBeenCalledWith({
      worktreePath: '/repo/wt',
      connectionId: 'conn-for:repo-1::/repo/wt'
    })
  })
})
