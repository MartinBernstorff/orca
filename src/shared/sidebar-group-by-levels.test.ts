import { describe, expect, it } from 'vitest'
import {
  getFirstChangedNestedLevel,
  getNestedGroupKey,
  getCollapsedGroupsAboveNestedLevel,
  isSidebarGroupBy,
  normalizeNestedGroupBy
} from './sidebar-group-by-levels'

describe('isSidebarGroupBy', () => {
  it('accepts every option and rejects values from other builds', () => {
    expect(isSidebarGroupBy('none')).toBe(true)
    expect(isSidebarGroupBy('agent-state')).toBe(true)
    expect(isSidebarGroupBy('future-option')).toBe(false)
    expect(isSidebarGroupBy(undefined)).toBe(false)
  })
})

describe('normalizeNestedGroupBy', () => {
  it('drops unknown values, repeats of any level above, and levels past the third', () => {
    expect(
      normalizeNestedGroupBy('priority', [
        'bogus',
        'priority',
        'repo',
        'repo',
        'pr-status',
        'workspace-status'
      ])
    ).toEqual(['repo', 'pr-status'])
  })

  it('has no nested levels without a first level or with a malformed value', () => {
    expect(normalizeNestedGroupBy('none', ['priority'])).toEqual([])
    expect(normalizeNestedGroupBy('repo', 'priority')).toEqual([])
  })
})

describe('getCollapsedGroupsAboveNestedLevel', () => {
  const top = 'priority:urgent'
  const second = getNestedGroupKey(top, 'workspace-status:todo')
  const third = getNestedGroupKey(second, 'pr:done')

  it('keeps shallower collapse state when a deeper level changes', () => {
    expect(getCollapsedGroupsAboveNestedLevel([top, second, third, 'lineage:wt'], 1)).toEqual([
      top,
      second,
      'lineage:wt'
    ])
    expect(getCollapsedGroupsAboveNestedLevel([top, second, third], 0)).toEqual([top])
  })

  it('finds the first changed nested level', () => {
    expect(getFirstChangedNestedLevel(['repo'], ['repo', 'priority'])).toBe(1)
    expect(getFirstChangedNestedLevel(['repo', 'priority'], ['pr-status', 'priority'])).toBe(0)
    expect(getFirstChangedNestedLevel(['repo'], ['repo'])).toBeNull()
  })
})
