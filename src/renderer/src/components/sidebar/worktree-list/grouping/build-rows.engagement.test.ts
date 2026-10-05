import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import { getFolderWorkspaceLaneKey } from './folder-workspace-lanes'
import { getGroupKeyForWorktree } from './worktree-group-keys'
import { repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import type { FolderWorkspace } from '../../../../../../shared/folder-workspace-types'
import type { ProjectGroup } from '../../../../../../shared/project-group-types'
import type { Worktree } from '../../../../../../shared/worktree/types'

const queued: Worktree = { ...worktree, id: 'wt-queued', path: '/tmp/queued', engagement: 'queued' }
const engaged: Worktree = {
  ...worktree,
  id: 'wt-engaged',
  path: '/tmp/engaged',
  engagement: 'engaged'
}
const unset: Worktree = { ...worktree, id: 'wt-unset', path: '/tmp/unset' }

function headers(rows: ReturnType<typeof buildRows>) {
  return rows.flatMap((row) => (row.type === 'header' ? [row] : []))
}

describe('groupBy engagement', () => {
  it('orders the Engaged lane before the Queued lane', () => {
    const rows = buildRows('engagement', [queued, unset, engaged], repoMap, null, new Set())
    expect(headers(rows).map((row) => [row.key, row.label, row.count])).toEqual([
      ['engagement:engaged', 'Engaged', 1],
      ['engagement:queued', 'Queued', 2]
    ])
  })

  it('places a workspace without an engagement in Queued', () => {
    expect(getGroupKeyForWorktree('engagement', unset, repoMap, null)).toBe('engagement:queued')
    expect(getGroupKeyForWorktree('engagement', engaged, repoMap, null)).toBe('engagement:engaged')
  })

  it('places a folder workspace in its engagement lane', () => {
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
      engagement: 'engaged'
    }
    expect(
      getFolderWorkspaceLaneKey({ folderWorkspace, projectGroup: group }, 'engagement', [])
    ).toBe('engagement:engaged')
    expect(
      getFolderWorkspaceLaneKey(
        { folderWorkspace: { ...folderWorkspace, engagement: undefined }, projectGroup: group },
        'engagement',
        []
      )
    ).toBe('engagement:queued')
  })
})
