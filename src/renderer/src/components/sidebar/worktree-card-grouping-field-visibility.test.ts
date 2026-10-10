import { describe, expect, it } from 'vitest'
import { WORKTREE_CARD_GROUPING_FIELDS } from '../../../../shared/worktree/card-grouping-fields'
import type { WorktreeCardGroupingField } from '../../../../shared/ui-chrome-types'
import {
  getGroupedWorktreeCardFields,
  resolveWorktreeCardGroupingFieldVisibility
} from './worktree-card-grouping-field-visibility'

const FIELD_SUBSETS: WorktreeCardGroupingField[][] = [
  [],
  ['workspace-status'],
  ['priority'],
  ['workspace-status', 'priority']
]
const VISIBILITY_KEY = {
  'workspace-status': 'showWorkspaceStatus',
  priority: 'showPriority'
} as const

describe('getGroupedWorktreeCardFields', () => {
  it('reports nothing when the sidebar is ungrouped', () => {
    expect(getGroupedWorktreeCardFields('none', ['priority'])).toEqual([])
  })

  it('reports fields grouped at the top level', () => {
    expect(getGroupedWorktreeCardFields('priority', [])).toEqual(['priority'])
  })

  it('reports fields grouped at nested levels', () => {
    expect(getGroupedWorktreeCardFields('repo', ['workspace-status', 'priority'])).toEqual([
      'workspace-status',
      'priority'
    ])
  })
})

describe('resolveWorktreeCardGroupingFieldVisibility', () => {
  it('keeps legacy cards on always-on priority and no workspace status', () => {
    for (const enabledFields of FIELD_SUBSETS) {
      for (const groupedFields of FIELD_SUBSETS) {
        expect(
          resolveWorktreeCardGroupingFieldVisibility({
            enabledFields,
            groupedFields,
            inPinnedSection: false,
            newCardStyle: false
          })
        ).toEqual({ showWorkspaceStatus: false, showPriority: true })
      }
    }
  })

  it('shows a field on new-style cards only when enabled and not already grouped by', () => {
    for (const enabledFields of FIELD_SUBSETS) {
      for (const groupedFields of FIELD_SUBSETS) {
        const visibility = resolveWorktreeCardGroupingFieldVisibility({
          enabledFields,
          groupedFields,
          inPinnedSection: false,
          newCardStyle: true
        })
        for (const field of WORKTREE_CARD_GROUPING_FIELDS) {
          expect(visibility[VISIBILITY_KEY[field]]).toBe(
            enabledFields.includes(field) && !groupedFields.includes(field)
          )
        }
      }
    }
  })

  it('ignores grouping in the pinned section', () => {
    for (const enabledFields of FIELD_SUBSETS) {
      const visibility = resolveWorktreeCardGroupingFieldVisibility({
        enabledFields,
        groupedFields: [...WORKTREE_CARD_GROUPING_FIELDS],
        inPinnedSection: true,
        newCardStyle: true
      })
      for (const field of WORKTREE_CARD_GROUPING_FIELDS) {
        expect(visibility[VISIBILITY_KEY[field]]).toBe(enabledFields.includes(field))
      }
    }
  })
})
