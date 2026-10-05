import { describe, expect, it } from 'vitest'
import { DEFAULT_WORKSPACE_STATUSES } from '../../../../../../shared/workspace-status-defaults'
import { getWorkspaceStatusGroupKey } from '../../../../../../shared/workspace-statuses'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import { getWorkspaceEngagementLaneKey } from '../../workspace-engagement-meta'
import { shouldPreferSidebarStatusDropTarget } from './status-target'

describe('preferring an Engagement header over reorder', () => {
  const engagedTarget = { status: null, isPinDrop: false, engagement: 'engaged' as const }
  const prefers = (sourceGroupKey: string) =>
    shouldPreferSidebarStatusDropTarget({
      sourceGroupKey,
      target: engagedTarget,
      workspaceStatuses: DEFAULT_WORKSPACE_STATUSES
    })

  it('prefers the header of another lane, top-level or nested', () => {
    expect(prefers(getWorkspaceEngagementLaneKey('queued'))).toBe(true)
    expect(prefers(getNestedGroupKey('repo:repo-1', getWorkspaceEngagementLaneKey('queued')))).toBe(
      true
    )
  })

  it("leaves the source lane's own header to the reorder path", () => {
    expect(prefers(getWorkspaceEngagementLaneKey('engaged'))).toBe(false)
    expect(
      prefers(getNestedGroupKey(getWorkspaceEngagementLaneKey('engaged'), 'repo:repo-1'))
    ).toBe(false)
  })
})

describe('preferring a status header over reorder', () => {
  const prefers = (sourceGroupKey: string, status: string) =>
    shouldPreferSidebarStatusDropTarget({
      sourceGroupKey,
      target: { status, isPinDrop: false, engagement: null },
      workspaceStatuses: DEFAULT_WORKSPACE_STATUSES
    })
  const [first, second] = DEFAULT_WORKSPACE_STATUSES
  const firstKey = getWorkspaceStatusGroupKey(first.id)

  it('decodes the status segment of a nested source lane', () => {
    expect(prefers(getNestedGroupKey(firstKey, 'priority:high'), second.id)).toBe(true)
    expect(prefers(getNestedGroupKey('priority:high', firstKey), second.id)).toBe(true)
    expect(prefers(getNestedGroupKey(firstKey, 'priority:high'), first.id)).toBe(false)
  })

  it('keeps the reorder path when the source lane has no status', () => {
    expect(prefers('repo:repo-1', second.id)).toBe(false)
    expect(prefers(getNestedGroupKey('repo:repo-1', 'priority:high'), second.id)).toBe(false)
  })
})
