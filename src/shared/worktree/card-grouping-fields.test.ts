import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WORKTREE_CARD_GROUPING_FIELDS,
  normalizeWorktreeCardGroupingFields
} from './card-grouping-fields'

describe('normalizeWorktreeCardGroupingFields', () => {
  it('keeps priority on when nothing was persisted', () => {
    expect(normalizeWorktreeCardGroupingFields(undefined)).toEqual(
      DEFAULT_WORKTREE_CARD_GROUPING_FIELDS
    )
  })

  it('keeps an explicit empty selection empty', () => {
    expect(normalizeWorktreeCardGroupingFields([])).toEqual([])
  })

  it('drops unknown values and returns canonical order', () => {
    expect(normalizeWorktreeCardGroupingFields(['priority', 'bogus', 'workspace-status'])).toEqual([
      'workspace-status',
      'priority'
    ])
  })

  it('is idempotent', () => {
    const once = normalizeWorktreeCardGroupingFields(['priority', 'workspace-status', 'priority'])
    expect(normalizeWorktreeCardGroupingFields(once)).toEqual(once)
  })
})
