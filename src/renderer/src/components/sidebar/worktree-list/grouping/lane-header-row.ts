import type { Repo } from '../../../../../../shared/repo-types'
import type { WorkspaceStatusDefinition } from '../../../../../../shared/worktree/types'
import type { ExecutionHostId } from '../../../../../../shared/execution-host'
import {
  getWorkspaceStatusFromGroupKey,
  getWorkspaceStatusVisualMeta
} from '../../workspace-status'
import {
  getWorkspacePriorityLaneHeaderMeta,
  getWorkspacePriorityLaneFromKey
} from '../../workspace-priority-meta'
import {
  getWorkspaceEngagementFromLaneKey,
  getWorkspaceEngagementLaneHeaderMeta
} from '../../workspace-engagement-meta'
import {
  getWorkspaceAgentStateFromLaneKey,
  getWorkspaceAgentStateLaneHeaderMeta
} from '../../workspace-agent-state-meta'
import { ALL_GROUP_META, PROJECT_GROUP_META, PR_GROUP_META } from './group-keys'
import type { PRGroupKey } from './group-keys'
import { getLaneHostWorktreeCounts, getLaneHostWorktreeIds } from './host-labels'
import type { WorktreeGroupEntry } from './project-grouping'
import type { GroupHeaderRow, WorktreeGroupBy } from './row-types'

type LaneHeaderMeta = Pick<GroupHeaderRow, 'label' | 'tone' | 'icon'>

function getLaneHeaderMeta(
  groupBy: WorktreeGroupBy,
  laneKey: string,
  group: WorktreeGroupEntry,
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
): LaneHeaderMeta {
  switch (groupBy) {
    case 'none':
      return ALL_GROUP_META
    case 'repo':
      return {
        label: group.label,
        tone: PROJECT_GROUP_META.tone,
        icon: PROJECT_GROUP_META.icon
      }
    case 'workspace-status': {
      const workspaceStatus =
        getWorkspaceStatusFromGroupKey(laneKey, workspaceStatuses) ??
        workspaceStatuses[0]?.id ??
        'in-progress'
      const definition = workspaceStatuses.find((status) => status.id === workspaceStatus)
      const meta = getWorkspaceStatusVisualMeta(definition ?? workspaceStatus)
      return {
        label: definition?.label ?? workspaceStatus,
        tone: meta.tone,
        icon: meta.icon
      }
    }
    case 'priority':
      return getWorkspacePriorityLaneHeaderMeta(getWorkspacePriorityLaneFromKey(laneKey))
    case 'engagement':
      return getWorkspaceEngagementLaneHeaderMeta(getWorkspaceEngagementFromLaneKey(laneKey))
    case 'agent-state':
      return getWorkspaceAgentStateLaneHeaderMeta(getWorkspaceAgentStateFromLaneKey(laneKey))
    case 'pr-status':
      return PR_GROUP_META[laneKey.replace(/^pr:/, '') as PRGroupKey]
  }
}

/** Header for one lane of `groupBy`, keyed by `laneKey`; nested callers re-key it by path. */
export function buildLaneHeaderRow(args: {
  groupBy: WorktreeGroupBy
  laneKey: string
  group: WorktreeGroupEntry
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
  repoMap: Map<string, Repo>
  defaultHostId: ExecutionHostId
}): GroupHeaderRow {
  const { groupBy, laneKey, group, repoMap, defaultHostId } = args
  const folderPairs = group.folderWorkspaces ?? []
  const meta = getLaneHeaderMeta(groupBy, laneKey, group, args.workspaceStatuses)
  return {
    type: 'header',
    key: laneKey,
    label: meta.label,
    count: group.items.length + folderPairs.length,
    tone: meta.tone,
    icon: meta.icon,
    hostWorktreeCounts: getLaneHostWorktreeCounts(group.items, folderPairs, repoMap, defaultHostId),
    hostWorktreeIds: getLaneHostWorktreeIds(group.items, folderPairs, repoMap, defaultHostId),
    worktreeIds: group.items.map((worktree) => worktree.id)
  }
}
