import { describe, expect, it } from 'vitest'
import type { Worktree } from '../../../../shared/worktree/types'
import { buildWorktreeComparator } from './smart-sort'
import { repoMap, worktree } from './worktree-list-groups-test-fixtures'

const NOW = new Date('2026-03-27T12:00:00.000Z').getTime()

function make(id: string, overrides: Partial<Worktree>): Worktree {
  return { ...worktree, id, displayName: id, path: `/tmp/${id}`, ...overrides }
}

function sortIds(worktrees: Worktree[]): string[] {
  return [...worktrees].sort(buildWorktreeComparator('priority', repoMap, NOW)).map((w) => w.id)
}

describe('priority sort', () => {
  it('orders urgent first and unprioritized last', () => {
    expect(
      sortIds([
        make('none', {}),
        make('low', { priority: 'low' }),
        make('urgent', { priority: 'urgent' }),
        make('medium', { priority: 'medium' }),
        make('high', { priority: 'high' })
      ])
    ).toEqual(['urgent', 'high', 'medium', 'low', 'none'])
  })

  it('breaks ties by creation time, oldest first, then name', () => {
    expect(
      sortIds([
        make('b-new', { priority: 'high', createdAt: 2, lastActivityAt: 9 }),
        make('b-old', { priority: 'high', createdAt: 1 }),
        make('a-old', { priority: 'high', createdAt: 1 }),
        make('legacy', { priority: 'high' })
      ])
    ).toEqual(['legacy', 'a-old', 'b-old', 'b-new'])
  })
})
