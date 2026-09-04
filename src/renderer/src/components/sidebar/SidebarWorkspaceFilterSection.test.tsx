// @vitest-environment happy-dom

/**
 * The "Except default branch" exemption only bites during the "Hide sleeping"
 * sweep, so its row must stay out of the filter list until the parent row is on.
 */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  state: {} as Record<string, unknown>
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mocks.state)
}))

import SidebarWorkspaceFilterSection from './SidebarWorkspaceFilterSection'

const EXEMPTION_LABEL = 'Except default branch'

function setState(overrides: Record<string, unknown> = {}): void {
  mocks.state = {
    showSleepingWorkspaces: true,
    setShowSleepingWorkspaces: vi.fn(),
    hideDefaultBranchWorkspace: false,
    setHideDefaultBranchWorkspace: vi.fn(),
    hideAutomationGeneratedWorkspaces: false,
    setHideAutomationGeneratedWorkspaces: vi.fn(),
    hideCliCreatedWorkspaces: false,
    setHideCliCreatedWorkspaces: vi.fn(),
    hideDetachedHeadWorkspaces: false,
    setHideDetachedHeadWorkspaces: vi.fn(),
    hideWorkspacesFromOtherDevices: false,
    setHideWorkspacesFromOtherDevices: vi.fn(),
    runtimeEnvironments: [],
    runtimeEnvironmentCatalogHydrated: true,
    alwaysShowDefaultBranchWorkspace: true,
    setAlwaysShowDefaultBranchWorkspace: vi.fn(),
    showSnoozedWorkspaces: false,
    setShowSnoozedWorkspaces: vi.fn(),
    worktreesByRepo: {},
    ...overrides
  }
}

let container: HTMLDivElement
let root: Root

function render(): void {
  act(() => {
    root.render(<SidebarWorkspaceFilterSection />)
  })
}

function rowLabels(): string[] {
  return Array.from(container.querySelectorAll('[role="switch"]')).map(
    (el) => el.textContent?.trim() ?? ''
  )
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('SidebarWorkspaceFilterSection', () => {
  it('hides the default-branch exemption row while sleeping workspaces are shown', () => {
    setState({ showSleepingWorkspaces: true })
    render()
    expect(rowLabels()).not.toContain(EXEMPTION_LABEL)
  })

  it('shows the exemption row once "Hide sleeping" is ticked', () => {
    setState({ showSleepingWorkspaces: false })
    render()
    expect(rowLabels()).toContain(EXEMPTION_LABEL)
  })

  it('keeps the exemption row hidden even when it is switched off', () => {
    setState({ showSleepingWorkspaces: true, alwaysShowDefaultBranchWorkspace: false })
    render()
    expect(rowLabels()).not.toContain(EXEMPTION_LABEL)
  })

  it('shows the other-client filter when a remote server is configured', () => {
    setState({
      runtimeEnvironments: [{ id: 'server' }]
    })
    render()

    expect(rowLabels()).toContain('Hide other-client workspaces')
  })

  it('keeps the other-client filter visible while the remote catalog loads', () => {
    setState({ runtimeEnvironmentCatalogHydrated: false })
    render()

    expect(rowLabels()).toContain('Hide other-client workspaces')
  })

  it('hides the other-client filter for local-only clients', () => {
    setState({ runtimeEnvironmentCatalogHydrated: true })
    render()

    expect(rowLabels()).not.toContain('Hide other-client workspaces')
  })

  it('keeps an enabled other-client filter available to turn off', () => {
    setState({ hideWorkspacesFromOtherDevices: true })
    render()

    expect(rowLabels()).toContain('Hide other-client workspaces')
  })
})

describe('SidebarWorkspaceFilterSection snooze row', () => {
  function worktree(id: string, snoozedUntil: number | null): Record<string, unknown> {
    return { id, repoId: 'repo1', hostId: 'local', isArchived: false, snoozedUntil }
  }

  it('offers a snooze reveal row with no count while nothing is snoozed', () => {
    setState({ worktreesByRepo: { repo1: [worktree('a', null)] } })
    render()
    expect(rowLabels()).toContain('Show snoozed')
  })

  it('counts only workspaces whose wake time is still ahead', () => {
    const now = Date.now()
    setState({
      worktreesByRepo: {
        repo1: [
          worktree('future', now + 60_000),
          worktree('past', now - 60_000),
          worktree('never', null)
        ]
      }
    })
    render()
    expect(rowLabels().find((label) => label.startsWith('Show snoozed'))).toBe('Show snoozed· 1')
  })

  it('leaves archived snoozed workspaces out of the count', () => {
    setState({
      worktreesByRepo: {
        repo1: [{ ...worktree('gone', Date.now() + 60_000), isArchived: true }]
      }
    })
    render()
    expect(rowLabels().find((label) => label.startsWith('Show snoozed'))).toBe('Show snoozed')
  })
})
