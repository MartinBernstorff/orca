import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import { getFolderWorkspaceLaneKey } from './folder-workspace-lanes'
import { getGroupKeysForWorktree } from './worktree-group-keys'
import { repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import { makeFolderWorkspace } from '../../../../store/slices/worktrees-slice-test-fixtures'
import { folderWorkspaceKey } from '../../../../../../shared/workspace-scope'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import type { NestedSidebarGroupBy } from '../../../../../../shared/sidebar-group-by-levels'
import type { ProjectGroup } from '../../../../../../shared/project-group-types'
import type { Worktree } from '../../../../../../shared/worktree/types'
import type { WorkspaceAgentStates } from '../../workspace-agent-state-meta'
import type { WorktreeGroupBy } from './row-types'

const working: Worktree = { ...worktree, id: 'wt-working', path: '/tmp/working' }
const polling: Worktree = { ...worktree, id: 'wt-polling', path: '/tmp/polling' }
const stopped: Worktree = { ...worktree, id: 'wt-stopped', path: '/tmp/stopped' }
const idle: Worktree = { ...worktree, id: 'wt-idle', path: '/tmp/idle' }

const agentStates: WorkspaceAgentStates = new Map([
  ['wt-working', 'working'],
  ['wt-polling', 'polling'],
  ['wt-stopped', 'needs-you']
])

function rowsFor(
  groupBy: WorktreeGroupBy,
  worktrees: Worktree[],
  nestedGroupBy: NestedSidebarGroupBy[] = []
) {
  return buildRows(
    groupBy,
    worktrees,
    repoMap,
    null,
    new Set(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    nestedGroupBy,
    agentStates
  )
}

function headers(rows: ReturnType<typeof buildRows>) {
  return rows.flatMap((row) => (row.type === 'header' ? [row] : []))
}

describe('groupBy agent-state', () => {
  it('orders Needs you, Working, Polling, with agentless workspaces in Needs you', () => {
    const rows = rowsFor('agent-state', [polling, idle, working, stopped])
    expect(headers(rows).map((row) => [row.key, row.label, row.count])).toEqual([
      ['agent-state:needs-you', 'Needs You', 2],
      ['agent-state:working', 'Working', 1],
      ['agent-state:polling', 'Polling', 1]
    ])
  })

  it('omits lanes no workspace is in', () => {
    const rows = rowsFor('agent-state', [working])
    expect(headers(rows).map((row) => row.key)).toEqual(['agent-state:working'])
  })

  it('counts each nested agent-state lane under its parent', () => {
    const rows = rowsFor('repo', [working, polling, idle], ['agent-state'])
    const lanes = headers(rows).filter((row) => row.laneGroupBy === 'agent-state')
    expect(lanes.map((row) => [row.laneKey, row.count, row.nestDepth])).toEqual([
      ['agent-state:needs-you', 1, 1],
      ['agent-state:working', 1, 1],
      ['agent-state:polling', 1, 1]
    ])
  })

  it('nests another option inside agent-state lanes', () => {
    const rows = rowsFor('agent-state', [working, idle], ['engagement'])
    const nested = headers(rows).filter((row) => row.laneGroupBy === 'engagement')
    expect(nested.map((row) => [row.key, row.count])).toEqual([
      [getNestedGroupKey('agent-state:needs-you', 'engagement:engaged'), 0],
      [getNestedGroupKey('agent-state:needs-you', 'engagement:queued'), 1],
      [getNestedGroupKey('agent-state:working', 'engagement:engaged'), 0],
      [getNestedGroupKey('agent-state:working', 'engagement:queued'), 1]
    ])
  })

  it('reveals the lane the workspace renders in', () => {
    expect(
      getGroupKeysForWorktree(
        'priority',
        polling,
        repoMap,
        null,
        undefined,
        undefined,
        undefined,
        undefined,
        ['agent-state'],
        agentStates
      )
    ).toEqual(['priority:none', getNestedGroupKey('priority:none', 'agent-state:polling')])
  })

  it('places a folder workspace by its own agent state', () => {
    const projectGroup = {} as ProjectGroup
    const folderWorkspace = makeFolderWorkspace({ id: 'folder-busy' })
    const states: WorkspaceAgentStates = new Map([[folderWorkspaceKey('folder-busy'), 'working']])
    expect(
      getFolderWorkspaceLaneKey({ folderWorkspace, projectGroup }, 'agent-state', [], states)
    ).toBe('agent-state:working')
    expect(
      getFolderWorkspaceLaneKey(
        { folderWorkspace: makeFolderWorkspace(), projectGroup },
        'agent-state',
        [],
        states
      )
    ).toBe('agent-state:needs-you')
  })
})
