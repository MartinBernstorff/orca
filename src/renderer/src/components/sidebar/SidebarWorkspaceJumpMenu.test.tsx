// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  activateAndRevealWorkspace: vi.fn(() => false as const),
  queueWorkspaceActivationTerminalFocus: vi.fn(() => true)
}))

vi.mock('@/store', () => ({ useAppStore: { getState: () => ({}) } }))
vi.mock('@/store/selectors', () => ({
  getRepoMapFromState: () =>
    new Map([
      ['r1', { displayName: 'orca' }],
      ['r2', { displayName: 'api' }]
    ])
}))
vi.mock('./visible-worktrees', () => ({
  getFilteredSidebarWorktrees: () => []
}))
vi.mock('./workspace-jump-sections', () => ({
  computeWorkspaceJumpSections: () => [
    {
      key: 'working',
      headingPath: ['Working'],
      worktrees: [
        { id: 'wt-b', repoId: 'r1', displayName: 'beta-task', linkedPR: 101 },
        {
          id: 'wt-a',
          repoId: 'r2',
          displayName: 'alpha-task',
          hostId: 'ssh:box'
        }
      ]
    },
    {
      key: 'waiting',
      headingPath: ['Waiting on others'],
      worktrees: [
        { id: 'wt-c', repoId: 'r1', displayName: 'alpha-later', linkedLinearIssue: 'ENG-42' }
      ]
    }
  ]
}))
vi.mock('@/lib/worktree-activation', () => ({
  activateAndRevealWorkspace: mocks.activateAndRevealWorkspace
}))
vi.mock('@/lib/workspace-activation-terminal-focus', () => ({
  queueWorkspaceActivationTerminalFocus: mocks.queueWorkspaceActivationTerminalFocus
}))

import SidebarWorkspaceJumpMenu from './SidebarWorkspaceJumpMenu'
import { requestOpenWorkspaceJump } from './workspace-jump-open-request'

let container: HTMLDivElement
let root: Root

function rows(): string[] {
  return Array.from(document.querySelectorAll('[data-slot="command-item"]')).map(
    (item) => item.textContent?.trim() ?? ''
  )
}

function headings(): string[] {
  return Array.from(document.querySelectorAll('[cmdk-group-heading]')).map(
    (heading) => heading.textContent ?? ''
  )
}

function searchInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('[data-slot="command-input"]')
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  })
}

async function typeQuery(query: string): Promise<void> {
  const input = searchInput()!
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setValue.call(input, query)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
}

async function openMenu(): Promise<void> {
  act(() => root.render(<SidebarWorkspaceJumpMenu />))
  act(() => requestOpenWorkspaceJump())
  await settle()
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  mocks.activateAndRevealWorkspace.mockClear()
  mocks.queueWorkspaceActivationTerminalFocus.mockClear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('SidebarWorkspaceJumpMenu', () => {
  it('stays closed until the shortcut requests it', () => {
    act(() => root.render(<SidebarWorkspaceJumpMenu />))

    expect(searchInput()).toBeNull()
  })

  it('lists workspaces under their sidebar headings in sidebar order', async () => {
    await openMenu()

    expect(headings()).toEqual(['Working', 'Waiting on others'])
    expect(rows()).toEqual(['beta-taskorca#101', 'alpha-taskapi', 'alpha-laterorcaENG-42'])
  })

  it('opens on mount for a request made while the sidebar was closed', async () => {
    requestOpenWorkspaceJump()
    act(() => root.render(<SidebarWorkspaceJumpMenu />))
    await settle()

    expect(searchInput()).not.toBeNull()
  })

  it('jumps to the chosen workspace on its host and closes', async () => {
    await openMenu()
    const row = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')
    ).find((item) => item.textContent?.includes('alpha-task'))
    act(() => row?.click())
    await settle()

    expect(mocks.activateAndRevealWorkspace).toHaveBeenCalledWith('wt-a', {
      executionHostId: 'ssh:box'
    })
    expect(mocks.queueWorkspaceActivationTerminalFocus).toHaveBeenCalledWith('wt-a', false)
    expect(searchInput()).toBeNull()
  })

  it('filters by linked Linear issue', async () => {
    await openMenu()
    await typeQuery('eng-42')

    expect(rows()).toEqual(['alpha-laterorcaENG-42'])
  })

  it('filters by linked PR number', async () => {
    await openMenu()
    await typeQuery('#101')

    expect(rows()).toEqual(['beta-taskorca#101'])
  })
})
