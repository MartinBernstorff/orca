// @vitest-environment happy-dom

/**
 * The filter now opens from its own sidebar trigger instead of a Radix
 * submenu. Pin the trigger summary and the popover's open/search behavior,
 * neither of which typecheck catches.
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

import SidebarProjectFilterMenu from './SidebarProjectFilterMenu'

const REPOS = [
  { id: 'r1', displayName: 'alpha', path: '/tmp/alpha', badgeColor: '#111111' },
  { id: 'r2', displayName: 'beta', path: '/tmp/beta', badgeColor: '#222222' },
  { id: 'r3', displayName: 'gamma', path: '/tmp/gamma', badgeColor: '#333333' }
]

let container: HTMLDivElement
let root: Root
let setFilterRepoIds: ReturnType<typeof vi.fn>

function setState(overrides: Record<string, unknown> = {}): void {
  setFilterRepoIds = vi.fn()
  mocks.state = { repos: REPOS, filterRepoIds: [], setFilterRepoIds, ...overrides }
}

function render(): void {
  act(() => root.render(<SidebarProjectFilterMenu />))
}

function trigger(): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>('[role="combobox"]')
  if (!element) {
    throw new Error('filter trigger not rendered')
  }
  return element
}

function openMenu(): void {
  act(() => trigger().click())
}

function searchInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('[data-slot="command-input"]')
}

function repoRows(): string[] {
  return Array.from(document.querySelectorAll('[data-slot="command-item"]')).map(
    (item) => item.textContent?.trim() ?? ''
  )
}

function repoRow(name: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')).find(
    (item) => item.textContent?.includes(name)
  )
}

/** Selected rows are the ones whose check glyph isn't hidden. */
function checkedRepoIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-slot="command-item"]'))
    .filter((item) => item.querySelector('svg')?.classList.contains('opacity-0') === false)
    .map((item) => item.getAttribute('data-value') ?? '')
}

/** rAF-based focus plus cmdk's own layout effects need a turn to settle. */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  setState()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

describe('SidebarProjectFilterMenu', () => {
  it('summarizes an empty filter as all projects', () => {
    render()

    expect(trigger().textContent).toContain('All projects')
  })

  it('names the single selected project on the trigger', () => {
    setState({ filterRepoIds: ['r2'] })
    render()

    expect(trigger().textContent).toContain('beta')
  })

  it('overflows extra selections into a count on the trigger', () => {
    setState({ filterRepoIds: ['r1', 'r2', 'r3'] })
    render()

    expect(trigger().textContent).toContain('alpha')
    expect(trigger().textContent).toContain('beta')
    expect(trigger().textContent).toContain('+1')
  })

  it("shows the project's own icon on the trigger", () => {
    setState({
      repos: [{ ...REPOS[0], repoIcon: { type: 'emoji', emoji: '🐙' } }, REPOS[1]],
      filterRepoIds: ['r1']
    })
    render()

    expect(trigger().textContent).toContain('🐙')
  })

  it('falls back to a folder glyph for a project with no icon', () => {
    setState({ filterRepoIds: ['r2'] })
    render()

    expect(trigger().querySelector('svg')).not.toBeNull()
  })

  it('shows project icons on the rows in the menu', async () => {
    setState({ repos: [{ ...REPOS[0], repoIcon: { type: 'emoji', emoji: '🐙' } }, REPOS[1]] })
    render()
    openMenu()
    await settle()

    expect(repoRows().some((row) => row.includes('🐙'))).toBe(true)
  })

  it('ignores filter ids for repos that no longer exist', () => {
    setState({ filterRepoIds: ['gone'] })
    render()

    expect(trigger().textContent).toContain('All projects')
  })

  it('focuses the search box when the menu opens', async () => {
    render()
    openMenu()
    await settle()

    expect(searchInput()).not.toBeNull()
    expect(document.activeElement).toBe(searchInput())
  })

  it('adds a project to the filter instead of replacing the selection', async () => {
    setState({ filterRepoIds: ['r1'] })
    render()
    openMenu()
    await settle()

    const betaRow = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="command-item"]')
    ).find((item) => item.textContent?.includes('beta'))
    act(() => betaRow?.click())

    expect(setFilterRepoIds).toHaveBeenCalledWith(['r1', 'r2'])
  })

  it('keeps selected projects in the list and checks them', async () => {
    setState({ filterRepoIds: ['r1'] })
    render()
    openMenu()
    await settle()

    expect(repoRows()).toEqual(['alpha', 'beta', 'gamma'])
    expect(checkedRepoIds()).toEqual(['r1'])
  })

  it('deselects a checked project from the list', async () => {
    setState({ filterRepoIds: ['r1', 'r2'] })
    render()
    openMenu()
    await settle()
    act(() => repoRow('alpha')?.click())

    expect(setFilterRepoIds).toHaveBeenCalledWith(['r2'])
  })

  it('clears the filter from the Clear action', async () => {
    setState({ filterRepoIds: ['r1'] })
    render()
    openMenu()
    await settle()

    const clear = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Clear'
    )
    act(() => clear?.click())

    expect(setFilterRepoIds).toHaveBeenCalledWith([])
  })

  it('hides itself when only one project exists', () => {
    setState({ repos: [REPOS[0]] })
    render()

    expect(document.querySelector('[data-sidebar-project-filter]')).toBeNull()
  })
})
