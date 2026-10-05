// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useAppStore } from '@/store'
import type { Repo } from '../../../../../../shared/repo-types'
import type { Worktree } from '../../../../../../shared/worktree/types'
import { makeRepo, makeWorktree } from '../../../worktree-jump-palette-test-fixtures'
import type { SortBy } from '../../smart-sort'
import { useSidebarWorktreeSortOrder } from './use-sort-order'

const initialState = useAppStore.getInitialState()
const repo = makeRepo()
const repoMap = new Map<string, Repo>([[repo.id, repo]])

function setWorktrees(worktrees: Worktree[]): void {
  useAppStore.setState((s) => ({
    worktreesByRepo: { [repo.id]: worktrees },
    sortEpoch: s.sortEpoch + 1
  }))
}

function renderSortOrder(sortBy: SortBy, worktrees: Worktree[]) {
  setWorktrees(worktrees)
  return renderHook(
    ({ freezeOrder }: { freezeOrder: boolean }) =>
      useSidebarWorktreeSortOrder({
        allWorktrees: useAppStore.getState().worktreesByRepo[repo.id] ?? [],
        repoMap,
        sortBy,
        freezeOrder
      }),
    { initialProps: { freezeOrder: false } }
  )
}

describe('useSidebarWorktreeSortOrder freezeOrder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useAppStore.setState(initialState, true)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    useAppStore.setState(initialState, true)
  })

  it.each<[SortBy, Worktree[], Worktree[]]>([
    [
      'recent',
      [
        makeWorktree('a', 'A', { lastActivityAt: 2 }),
        makeWorktree('b', 'B', { lastActivityAt: 1 })
      ],
      [makeWorktree('a', 'A', { lastActivityAt: 2 }), makeWorktree('b', 'B', { lastActivityAt: 3 })]
    ],
    [
      'name',
      [makeWorktree('a', 'A'), makeWorktree('b', 'B')],
      [makeWorktree('a', 'C'), makeWorktree('b', 'B')]
    ],
    [
      'priority',
      [makeWorktree('a', 'A'), makeWorktree('b', 'B')],
      [makeWorktree('a', 'A'), makeWorktree('b', 'B', { priority: 'urgent' })]
    ]
  ])('holds the %s order while frozen and applies it on release', (sortBy, before, after) => {
    const { result, rerender } = renderSortOrder(sortBy, before)
    expect(result.current).toEqual(['a', 'b'])

    rerender({ freezeOrder: true })
    act(() => setWorktrees(after))
    act(() => vi.advanceTimersByTime(10_000))
    rerender({ freezeOrder: true })
    expect(result.current).toEqual(['a', 'b'])

    rerender({ freezeOrder: false })
    expect(result.current).toEqual(['b', 'a'])
  })

  it('re-sorts after the settle window when not frozen', () => {
    const { result, rerender } = renderSortOrder('name', [
      makeWorktree('a', 'A'),
      makeWorktree('b', 'B')
    ])

    act(() => setWorktrees([makeWorktree('a', 'C'), makeWorktree('b', 'B')]))
    act(() => vi.advanceTimersByTime(10_000))
    rerender({ freezeOrder: false })
    expect(result.current).toEqual(['b', 'a'])
  })

  it('applies manual drops immediately even while frozen', () => {
    const { result, rerender } = renderSortOrder('manual', [
      makeWorktree('a', 'A', { manualOrder: 2 }),
      makeWorktree('b', 'B', { manualOrder: 1 })
    ])
    rerender({ freezeOrder: true })

    act(() =>
      setWorktrees([
        makeWorktree('a', 'A', { manualOrder: 2 }),
        makeWorktree('b', 'B', { manualOrder: 3 })
      ])
    )
    rerender({ freezeOrder: true })
    expect(result.current).toEqual(['b', 'a'])
  })

  it('applies a sort-mode switch immediately even while frozen', () => {
    useAppStore.setState({ sortBy: 'name' })
    setWorktrees([
      makeWorktree('a', 'A', { lastActivityAt: 1 }),
      makeWorktree('b', 'B', { lastActivityAt: 2 })
    ])
    const { result, rerender } = renderHook(
      ({ sortBy }: { sortBy: SortBy }) =>
        useSidebarWorktreeSortOrder({
          allWorktrees: useAppStore.getState().worktreesByRepo[repo.id] ?? [],
          repoMap,
          sortBy,
          freezeOrder: true
        }),
      { initialProps: { sortBy: 'name' } }
    )
    expect(result.current).toEqual(['a', 'b'])

    rerender({ sortBy: 'recent' })
    expect(result.current).toEqual(['b', 'a'])
  })
})
