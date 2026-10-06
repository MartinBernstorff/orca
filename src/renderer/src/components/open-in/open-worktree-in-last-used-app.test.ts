import { beforeEach, describe, expect, it, vi } from 'vitest'
import { openWorktreeInLastUsedApp } from './open-worktree-in-last-used-app'
import type * as WorktreeOpenInMenu from './WorktreeOpenInMenu'

const { mockSettings, openInMenuEntryMock } = vi.hoisted(() => ({
  mockSettings: {
    current: {} as {
      openInApplications?: { id: string; label: string; command: string }[]
      lastUsedOpenInApplicationId?: string
    }
  },
  openInMenuEntryMock: vi.fn()
}))

vi.mock('@/store', () => ({
  useAppStore: { getState: () => ({ settings: mockSettings.current }) }
}))

vi.mock('@/lib/local-file-manager-label', () => ({
  getLocalFileManagerLabel: () => 'Finder'
}))

vi.mock('./WorktreeOpenInMenu', async (importOriginal) => ({
  ...(await importOriginal<typeof WorktreeOpenInMenu>()),
  openInMenuEntry: openInMenuEntryMock
}))

describe('openWorktreeInLastUsedApp', () => {
  beforeEach(() => {
    openInMenuEntryMock.mockReset()
    mockSettings.current = {
      openInApplications: [
        { id: 'vscode', label: 'VS Code', command: 'code' },
        { id: 'cursor', label: 'Cursor', command: 'cursor' }
      ]
    }
  })

  it('opens the last used app', async () => {
    mockSettings.current.lastUsedOpenInApplicationId = 'cursor'

    await openWorktreeInLastUsedApp({ worktreePath: '/tmp/workspace', connectionId: 'ssh-1' })

    expect(openInMenuEntryMock).toHaveBeenCalledWith({
      entry: expect.objectContaining({ id: 'cursor', command: 'cursor' }),
      worktreePath: '/tmp/workspace',
      connectionId: 'ssh-1'
    })
  })

  it('falls back to the first app when nothing was used yet', async () => {
    await openWorktreeInLastUsedApp({ worktreePath: '/tmp/workspace', connectionId: null })

    expect(openInMenuEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({ entry: expect.objectContaining({ id: 'vscode' }) })
    )
  })

  it('falls back to the file manager when no apps are configured', async () => {
    mockSettings.current = {}

    await openWorktreeInLastUsedApp({ worktreePath: '/tmp/workspace', connectionId: null })

    expect(openInMenuEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({ entry: expect.objectContaining({ id: 'file-manager' }) })
    )
  })
})
