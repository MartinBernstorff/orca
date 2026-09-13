import { afterEach, describe, expect, it, vi } from 'vitest'
import { activateAndRevealWorktree } from './worktree-activation'
import { registerWorktreeActivationReset } from './worktree-activation-test-harness'
import { useAppStore } from '@/store'

registerWorktreeActivationReset()

describe('activateAndRevealWorktree', () => {
  afterEach(() => {
    useAppStore.setState({
      activeRepoId: null,
      activeWorktreeId: null,
      activeView: 'terminal',
      filterRepoIds: [],
      isNavigatingHistory: false
    })
  })

  function seedStore(overrides: Record<string, unknown> = {}): void {
    useAppStore.setState({
      activeRepoId: null,
      activeWorktreeId: null,
      activeView: 'settings',
      filterRepoIds: [],
      isNavigatingHistory: false,
      repos: [{ id: 'repo-1', connectionId: null }],
      worktreesByRepo: {
        'repo-1': [
          {
            id: 'wt-1',
            repoId: 'repo-1',
            path: '/repo',
            displayName: 'main',
            branch: 'main',
            head: 'abc',
            isBare: false,
            isMainWorktree: true
          }
        ]
      },
      getKnownWorktreeById: (worktreeId: string) =>
        worktreeId === 'wt-1'
          ? ({
              id: 'wt-1',
              repoId: 'repo-1',
              path: '/repo',
              displayName: 'main',
              branch: 'main',
              head: 'abc',
              isBare: false,
              isMainWorktree: true
            } as never)
          : null,
      setActiveRepo: vi.fn(),
      setActiveView: vi.fn(),
      setActiveWorktree: vi.fn(),
      markWorktreeVisited: vi.fn(),
      recordWorktreeVisit: vi.fn(),
      reconcileWorktreeTabModel: vi.fn(() => ({ renderableTabCount: 0 })),
      createTab: vi.fn(() => ({ id: 'tab-1' })),
      setActiveTab: vi.fn(),
      setTabCustomTitle: vi.fn(),
      setTabColor: vi.fn(),
      markDefaultTerminalTabsApplied: vi.fn(),
      queueTabStartupCommand: vi.fn(),
      queueTabInitialCwd: vi.fn(),
      queueTabSetupSplit: vi.fn(),
      queueTabIssueCommandSplit: vi.fn(),
      revealWorktreeInSidebar: vi.fn(),
      setFilterRepoIds: vi.fn(),
      ...overrides
    } as never)
  }

  it('queues a one-shot initial cwd for the primary activation-created tab', () => {
    const queueTabInitialCwd = vi.fn()
    const revealWorktreeInSidebar = vi.fn()
    seedStore({ queueTabInitialCwd, revealWorktreeInSidebar })

    const result = activateAndRevealWorktree('wt-1', {
      initialCwd: '/repo/packages/web',
      executionHostId: 'ssh:box'
    })

    expect(result).toEqual({ primaryTabId: 'tab-1' })
    expect(queueTabInitialCwd).toHaveBeenCalledWith('tab-1', '/repo/packages/web')
    expect(revealWorktreeInSidebar).toHaveBeenCalledWith('wt-1', {
      executionHostId: 'ssh:box'
    })
  })

  it('adds the target project to an active project filter instead of clearing it', () => {
    const setFilterRepoIds = vi.fn()
    seedStore({ filterRepoIds: ['repo-2'], setFilterRepoIds })

    activateAndRevealWorktree('wt-1')

    expect(setFilterRepoIds).toHaveBeenCalledWith(['repo-2', 'repo-1'])
  })

  it('leaves the project filter alone when it already lists the target project', () => {
    const setFilterRepoIds = vi.fn()
    seedStore({ filterRepoIds: ['repo-1'], setFilterRepoIds })

    activateAndRevealWorktree('wt-1')

    expect(setFilterRepoIds).not.toHaveBeenCalled()
  })
})
