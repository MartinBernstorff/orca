import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import { getFolderWorkspaceLaneKey } from './folder-workspace-lanes'
import { repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import { makeFolderWorkspace } from '../../../../store/slices/worktrees-slice-test-fixtures'
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
  it('orders the Engaged lane before the Queued lane, with unset workspaces in Queued', () => {
    const rows = buildRows('engagement', [queued, unset, engaged], repoMap, null, new Set())
    expect(headers(rows).map((row) => [row.key, row.label, row.count])).toEqual([
      ['engagement:engaged', 'Engaged', 1],
      ['engagement:queued', 'Queued', 2]
    ])
  })

  it('places a folder workspace in its engagement lane', () => {
    // Why a bare group: the engagement lane ignores the project group.
    const projectGroup = {} as ProjectGroup
    const laneKey = (folderWorkspace: ReturnType<typeof makeFolderWorkspace>) =>
      getFolderWorkspaceLaneKey({ folderWorkspace, projectGroup }, 'engagement', [])
    expect(laneKey(makeFolderWorkspace({ engagement: 'engaged' }))).toBe('engagement:engaged')
    expect(laneKey(makeFolderWorkspace())).toBe('engagement:queued')
  })
})
