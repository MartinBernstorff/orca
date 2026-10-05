import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import { getFolderWorkspaceLaneKey } from './folder-workspace-lanes'
import { getGroupKeyForWorktree } from './worktree-group-keys'
import { repo, repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import type { FolderWorkspace } from '../../../../../../shared/folder-workspace-types'
import type { ProjectGroup } from '../../../../../../shared/project-group-types'
import type { Worktree } from '../../../../../../shared/worktree/types'

const low: Worktree = { ...worktree, id: 'wt-low', path: '/tmp/low', priority: 'low' }
const urgent: Worktree = { ...worktree, id: 'wt-urgent', path: '/tmp/urgent', priority: 'urgent' }
const unset: Worktree = { ...worktree, id: 'wt-unset', path: '/tmp/unset' }
const cleared: Worktree = { ...worktree, id: 'wt-cleared', path: '/tmp/cleared', priority: null }

function headers(rows: ReturnType<typeof buildRows>) {
  return rows.flatMap((row) => (row.type === 'header' ? [row] : []))
}

describe('groupBy priority', () => {
  it('orders lanes from urgent down to no priority and skips empty lanes', () => {
    const rows = buildRows('priority', [low, unset, urgent], repoMap, null, new Set())
    expect(headers(rows).map((row) => [row.key, row.label, row.count])).toEqual([
      ['priority:urgent', 'Urgent', 1],
      ['priority:low', 'Low', 1],
      ['priority:none', 'No priority', 1]
    ])
  })

  it('treats a missing and a cleared priority as the same lane', () => {
    expect(getGroupKeyForWorktree('priority', unset, repoMap, null)).toBe('priority:none')
    expect(getGroupKeyForWorktree('priority', cleared, repoMap, null)).toBe('priority:none')
    expect(getGroupKeyForWorktree('priority', urgent, repoMap, null)).toBe('priority:urgent')
  })

  it('places a folder workspace in its own priority lane', () => {
    const group: ProjectGroup = {
      id: 'group-1',
      name: 'Group',
      parentPath: '/tmp/parent',
      parentGroupId: null,
      createdFrom: 'folder-scan',
      tabOrder: 0,
      isCollapsed: false,
      color: null,
      createdAt: 1,
      updatedAt: 1
    }
    const folderWorkspace: FolderWorkspace = {
      id: 'fw-1',
      projectGroupId: group.id,
      name: 'Folder workspace',
      folderPath: '/tmp/parent',
      linkedTask: null,
      comment: '',
      isArchived: false,
      isUnread: false,
      isPinned: false,
      sortOrder: 1,
      lastActivityAt: 1,
      createdAt: 1,
      updatedAt: 1,
      priority: 'high'
    }
    expect(
      getFolderWorkspaceLaneKey({ folderWorkspace, projectGroup: group }, 'priority', [])
    ).toBe('priority:high')
    const rows = buildRows(
      'priority',
      [unset],
      new Map([[repo.id, { ...repo, projectGroupId: group.id }]]),
      null,
      new Set(),
      undefined,
      undefined,
      'manual',
      {},
      new Map([[unset.id, unset]]),
      false,
      undefined,
      [group],
      new Set(),
      new Map(),
      new Map(),
      [],
      undefined,
      [folderWorkspace]
    )
    expect(headers(rows).map((row) => row.key)).toEqual(['priority:high', 'priority:none'])
    expect(rows[1]).toMatchObject({ type: 'folder-workspace', key: 'folder-workspace:fw-1' })
  })
})
