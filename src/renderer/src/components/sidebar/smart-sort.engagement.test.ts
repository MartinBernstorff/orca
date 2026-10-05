import { describe, expect, it } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import { buildWorktreeComparator } from './smart-sort'
import { repoMap, worktree } from './worktree-list-groups-test-fixtures'

const NOW = new Date('2026-03-27T12:00:00.000Z').getTime()

function make(id: string, overrides: Partial<Worktree>): Worktree {
  return { ...worktree, id, displayName: id, path: `/tmp/${id}`, ...overrides }
}

function sortIds(worktrees: Worktree[]): string[] {
  return [...worktrees].sort(buildWorktreeComparator('engagement', repoMap, NOW)).map((w) => w.id)
}

describe('engagement sort', () => {
  it('orders the highest prompt count first and unprompted workspaces last', () => {
    expect(
      sortIds([
        make('none', {}),
        make('three', { promptCount: 3, lastPromptAt: 1 }),
        make('ten', { promptCount: 10, lastPromptAt: 1 }),
        make('one', { promptCount: 1, lastPromptAt: 5 })
      ])
    ).toEqual(['ten', 'three', 'one', 'none'])
  })

  it('breaks count ties by the most recent prompt', () => {
    expect(
      sortIds([
        make('older', { promptCount: 4, lastPromptAt: 100 }),
        make('newer', { promptCount: 4, lastPromptAt: 200 })
      ])
    ).toEqual(['newer', 'older'])
  })

  it('ignores terminal activity, so an active but unprompted workspace does not jump up', () => {
    expect(
      sortIds([
        make('busy-terminal', { promptCount: 0, lastActivityAt: NOW }),
        make('prompted', { promptCount: 1, lastPromptAt: 1, lastActivityAt: 0 })
      ])
    ).toEqual(['prompted', 'busy-terminal'])
  })
})
