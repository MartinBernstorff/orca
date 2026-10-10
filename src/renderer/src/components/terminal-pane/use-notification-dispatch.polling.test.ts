import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dispatchTerminalNotification } from './use-notification-dispatch'
import type { AgentStatusEntry } from '../../../../shared/agent-status-types'

const LIVE_LEAF_ID = '11111111-1111-4111-8111-111111111111'
const SIBLING_LEAF_ID = '22222222-2222-4222-8222-222222222222'
const paneKey = `tab-1:${LIVE_LEAF_ID}`
const siblingPaneKey = `tab-1:${SIBLING_LEAF_ID}`

let mockState: Record<string, unknown> & {
  agentStatusByPaneKey: Record<string, AgentStatusEntry>
  markWorktreeUnread: ReturnType<typeof vi.fn>
  markAgentCompletionPaneUnread: ReturnType<typeof vi.fn>
}

vi.mock('@/store', () => ({
  useAppStore: { getState: () => mockState }
}))

vi.mock('@/lib/desktop-notification-sound', () => ({
  playDesktopNotificationSound: vi.fn()
}))

function makeAgentStatus(key: string, overrides: Partial<AgentStatusEntry> = {}): AgentStatusEntry {
  const now = Date.now()
  return {
    state: 'done',
    prompt: 'ship it',
    updatedAt: now,
    stateStartedAt: now,
    agentType: 'claude',
    paneKey: key,
    stateHistory: [],
    ...overrides
  }
}

describe('dispatchTerminalNotification while the workspace is Polling', () => {
  beforeEach(() => {
    mockState = {
      activeWorktreeId: 'wt-other',
      activeTabId: 'tab-1',
      tabsByWorktree: { 'wt-primary': [{ id: 'tab-1', ptyId: 'pty-1' }] },
      ptyIdsByTabId: { 'tab-1': ['pty-1'] },
      suppressedPtyExitIds: {},
      terminalLayoutsByTabId: {
        'tab-1': {
          root: {
            type: 'split',
            direction: 'vertical',
            first: { type: 'leaf', leafId: LIVE_LEAF_ID },
            second: { type: 'leaf', leafId: SIBLING_LEAF_ID }
          },
          activeLeafId: LIVE_LEAF_ID,
          expandedLeafId: null,
          ptyIdsByLeafId: { [LIVE_LEAF_ID]: 'pty-1' }
        }
      },
      browserTabsByWorktree: {},
      retainedAgentsByPaneKey: {},
      agentStatusByPaneKey: {},
      worktreesByRepo: { repo1: [{ id: 'wt-primary', repoId: 'repo1', displayName: 'main' }] },
      repos: [{ id: 'repo1', displayName: 'orca', connectionId: null }],
      settings: { notifications: {} },
      markWorktreeUnread: vi.fn(),
      markTerminalTabUnread: vi.fn(),
      markTerminalPaneUnread: vi.fn(),
      markAgentCompletionPaneUnread: vi.fn()
    }
    vi.stubGlobal('window', {
      api: { notifications: { dispatch: vi.fn().mockResolvedValue({ delivered: true }) } }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('suppresses the turn-end notification and unread marks', () => {
    const workingStartedAt = Date.now() - 60_000
    mockState.agentStatusByPaneKey = {
      [paneKey]: makeAgentStatus(paneKey, {
        state: 'working',
        workingMode: 'monitoring',
        stateStartedAt: workingStartedAt
      })
    }

    // Shape of the announcement the coordinator synthesizes when a turn ends into monitoring.
    dispatchTerminalNotification('wt-primary', {
      source: 'agent-task-complete',
      terminalTitle: 'claude',
      paneKey,
      agentStatusSnapshot: {
        ...makeAgentStatus(paneKey, { stateStartedAt: workingStartedAt }),
        turnCompletedAt: Date.now()
      }
    })

    expect(window.api.notifications.dispatch).not.toHaveBeenCalled()
    expect(mockState.markWorktreeUnread).not.toHaveBeenCalled()
    expect(mockState.markAgentCompletionPaneUnread).not.toHaveBeenCalled()
  })

  it('still notifies when another pane in the workspace needs the user', () => {
    mockState.agentStatusByPaneKey = {
      [paneKey]: makeAgentStatus(paneKey),
      [siblingPaneKey]: makeAgentStatus(siblingPaneKey, {
        state: 'working',
        workingMode: 'monitoring'
      })
    }

    dispatchTerminalNotification('wt-primary', {
      source: 'agent-task-complete',
      terminalTitle: 'claude',
      paneKey
    })

    expect(window.api.notifications.dispatch).toHaveBeenCalledTimes(1)
    expect(mockState.markWorktreeUnread).toHaveBeenCalledWith('wt-primary')
  })
})
