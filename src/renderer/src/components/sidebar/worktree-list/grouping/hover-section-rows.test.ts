import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import { getHoverOverlayRowsByHeaderKey, getOpenOnHoverGroups } from './hover-section-rows'
import { repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import type { Worktree } from '../../../../../../shared/worktree/types'
import type { WorkspaceAgentStates } from '../../workspace-agent-state-meta'
import { getWorkspaceEngagementLaneKey } from '../../workspace-engagement-meta'
import { getWorkspaceAgentStateLaneKey } from '../../workspace-agent-state-meta'
import type { Row } from './row-types'

const engagedWorking: Worktree = { ...worktree, id: 'wt-a', path: '/tmp/a', engagement: 'engaged' }
const queuedWorking: Worktree = { ...worktree, id: 'wt-b', path: '/tmp/b', engagement: 'queued' }
const queuedNeedsYou: Worktree = { ...worktree, id: 'wt-c', path: '/tmp/c', engagement: 'queued' }

const agentStates: WorkspaceAgentStates = new Map([
  ['wt-a', 'working'],
  ['wt-b', 'working'],
  ['wt-c', 'needs-you']
])

const ENGAGED = getWorkspaceEngagementLaneKey('engaged')
const QUEUED = getWorkspaceEngagementLaneKey('queued')
const QUEUED_WORKING = getNestedGroupKey(QUEUED, getWorkspaceAgentStateLaneKey('working'))
const QUEUED_NEEDS_YOU = getNestedGroupKey(QUEUED, getWorkspaceAgentStateLaneKey('needs-you'))

function rowsWithCollapsed(collapsed: string[]): Row[] {
  return buildRows(
    'engagement',
    [engagedWorking, queuedWorking, queuedNeedsYou],
    repoMap,
    null,
    new Set(collapsed),
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
    ['agent-state'],
    agentStates
  )
}

function describeRows(rows: readonly Row[] | undefined): string[] {
  return (rows ?? []).map((row) =>
    row.type === 'header' ? `header:${row.key}` : row.type === 'item' ? row.worktree.id : row.type
  )
}

describe('getHoverOverlayRowsByHeaderKey', () => {
  it('assigns a hover-opened section its contents and leaves other sections alone', () => {
    const overlays = getHoverOverlayRowsByHeaderKey(
      rowsWithCollapsed([QUEUED]),
      rowsWithCollapsed([])
    )

    expect([...overlays.keys()]).toEqual([QUEUED])
    expect(describeRows(overlays.get(QUEUED))).toEqual([
      `header:${QUEUED_NEEDS_YOU}`,
      'wt-c',
      `header:${QUEUED_WORKING}`,
      'wt-b'
    ])
  })

  it('keeps a nested section opened inside an overlay in its outermost overlay', () => {
    const overlays = getHoverOverlayRowsByHeaderKey(
      rowsWithCollapsed([QUEUED, QUEUED_WORKING]),
      rowsWithCollapsed([])
    )

    expect([...overlays.keys()]).toEqual([QUEUED])
    expect(describeRows(overlays.get(QUEUED))).toContain('wt-b')
  })

  it('overlays a nested section under a regular parent', () => {
    const overlays = getHoverOverlayRowsByHeaderKey(
      rowsWithCollapsed([QUEUED_WORKING]),
      rowsWithCollapsed([])
    )

    expect([...overlays.keys()]).toEqual([QUEUED_WORKING])
    expect(describeRows(overlays.get(QUEUED_WORKING))).toEqual(['wt-b'])
    expect(overlays.has(ENGAGED)).toBe(false)
  })

  it('returns nothing when both builds match', () => {
    const rows = rowsWithCollapsed([])
    expect(getHoverOverlayRowsByHeaderKey(rows, rows).size).toBe(0)
  })
})

describe('getOpenOnHoverGroups', () => {
  it('makes every non-empty section open on hover by default, at every level', () => {
    const keys = getOpenOnHoverGroups(rowsWithCollapsed([]), new Set(), new Set())

    expect([...keys].sort()).toEqual(
      [
        ENGAGED,
        QUEUED,
        QUEUED_NEEDS_YOU,
        QUEUED_WORKING,
        getNestedGroupKey(ENGAGED, getWorkspaceAgentStateLaneKey('working'))
      ].sort()
    )
  })

  it('skips opted-out and force-opened sections', () => {
    const keys = getOpenOnHoverGroups(rowsWithCollapsed([]), new Set([QUEUED]), new Set([ENGAGED]))

    expect(keys.has(QUEUED)).toBe(false)
    expect(keys.has(ENGAGED)).toBe(false)
    expect(keys.has(QUEUED_WORKING)).toBe(true)
  })
})
