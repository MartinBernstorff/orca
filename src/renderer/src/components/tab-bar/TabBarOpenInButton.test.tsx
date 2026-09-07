import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TabBarOpenInButton } from './TabBarOpenInButton'
import { WorktreeOpenInMenuBody } from '@/components/open-in/WorktreeOpenInMenu'

type ReactElementLike = {
  type: unknown
  props: Record<string, unknown>
}

const { mockState, openInExternalEditorMock, openInFileManagerMock, updateSettingsMock } =
  vi.hoisted(() => ({
    mockState: {
      settings: {
        activeRuntimeEnvironmentId: null as string | null,
        openInApplications: [] as { id: string; label: string; command: string }[],
        lastUsedOpenInApplicationId: null as string | null
      },
      worktreePath: '/tmp/workspace' as string | null,
      connectionId: null as string | null | undefined
    },
    openInExternalEditorMock: vi.fn(),
    openInFileManagerMock: vi.fn(),
    updateSettingsMock: vi.fn()
  }))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

vi.mock('@/store', () => {
  const state = {
    get settings() {
      return mockState.settings
    },
    getKnownWorktreeById: () =>
      mockState.worktreePath ? { path: mockState.worktreePath } : undefined,
    updateSettings: updateSettingsMock
  }
  const useAppStore = Object.assign(
    (selector: (value: typeof state) => unknown) => selector(state),
    {
      getState: () => state
    }
  )
  return { useAppStore }
})

vi.mock('@/lib/connection-owner-resolution', () => ({
  getConnectionIdFromState: () => mockState.connectionId
}))

function visit(node: unknown, cb: (node: ReactElementLike) => void): void {
  if (node == null || typeof node === 'string' || typeof node === 'number') {
    return
  }
  if (Array.isArray(node)) {
    node.forEach((entry) => visit(entry, cb))
    return
  }
  const element = node as ReactElementLike
  cb(element)
  if (element.props?.children) {
    visit(element.props.children, cb)
  }
}

function findButtons(node: unknown): ReactElementLike[] {
  const buttons: ReactElementLike[] = []
  visit(node, (entry) => {
    if (entry.type === 'button') {
      buttons.push(entry)
    }
  })
  return buttons
}

function render(): React.ReactNode {
  return TabBarOpenInButton({ worktreeId: 'repo-1::/tmp/workspace' }) as React.ReactNode
}

describe('TabBarOpenInButton', () => {
  beforeEach(() => {
    mockState.settings = {
      activeRuntimeEnvironmentId: null,
      openInApplications: [
        { id: 'vscode-1', label: 'VS Code', command: 'code' },
        { id: 'zed-1', label: 'Zed', command: 'zed' }
      ],
      lastUsedOpenInApplicationId: null
    }
    mockState.worktreePath = '/tmp/workspace'
    mockState.connectionId = null
    openInExternalEditorMock.mockReset()
    openInFileManagerMock.mockReset()
    updateSettingsMock.mockReset()
    openInExternalEditorMock.mockResolvedValue({ ok: true })
    openInFileManagerMock.mockResolvedValue({ ok: true })
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        api: {
          shell: {
            openInFileManager: openInFileManagerMock,
            openInExternalEditor: openInExternalEditorMock
          }
        }
      }
    })
  })

  it('opens the remembered app immediately on the primary segment', async () => {
    mockState.settings.lastUsedOpenInApplicationId = 'zed-1'

    const [primary] = findButtons(render())
    await (primary.props.onClick as () => Promise<void> | void)?.()

    expect(openInExternalEditorMock).toHaveBeenCalledWith({
      path: '/tmp/workspace',
      command: 'zed',
      connectionId: null
    })
  })

  it('falls back to the first configured app when nothing is remembered', async () => {
    const [primary] = findButtons(render())
    await (primary.props.onClick as () => Promise<void> | void)?.()

    expect(openInExternalEditorMock).toHaveBeenCalledWith({
      path: '/tmp/workspace',
      command: 'code',
      connectionId: null
    })
  })

  it('falls back to the first configured app when the remembered app was removed', async () => {
    mockState.settings.lastUsedOpenInApplicationId = 'deleted-app'

    const [primary] = findButtons(render())
    await (primary.props.onClick as () => Promise<void> | void)?.()

    expect(openInExternalEditorMock).toHaveBeenCalledWith({
      path: '/tmp/workspace',
      command: 'code',
      connectionId: null
    })
  })

  it('disables only the primary segment when the target cannot open this workspace', () => {
    mockState.settings.lastUsedOpenInApplicationId = 'zed-1'
    mockState.connectionId = 'ssh-host-1'

    const [primary, caret] = findButtons(render())

    expect(primary.props.disabled).toBe(true)
    expect(caret.props.disabled).toBeFalsy()
  })

  it('keeps the primary segment enabled for a VS Code SSH workspace', () => {
    mockState.settings.lastUsedOpenInApplicationId = 'vscode-1'
    mockState.connectionId = 'ssh-host-1'

    const [primary] = findButtons(render())

    expect(primary.props.disabled).toBeFalsy()
  })

  it('offers the same menu body as the sidebar submenu', () => {
    let found = false
    visit(render(), (entry) => {
      if (entry.type === WorktreeOpenInMenuBody) {
        found = true
        expect(entry.props.worktreePath).toBe('/tmp/workspace')
        expect(entry.props.connectionId).toBe(null)
      }
    })
    expect(found).toBe(true)
  })

  it('hides itself when the workspace has no resolvable path', () => {
    mockState.worktreePath = null
    expect(render()).toBeNull()
  })

  it('still renders when only the file-manager row remains', () => {
    mockState.settings.openInApplications = []
    expect(render()).not.toBeNull()
  })
})
