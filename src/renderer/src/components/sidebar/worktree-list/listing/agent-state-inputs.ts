import {
  normalizeNestedGroupBy,
  type NestedSidebarGroupBy
} from '../../../../../../shared/sidebar-group-by-levels'
import type { WorktreeGroupBy } from '../grouping/row-types'
import type { WorkspaceAgentStates } from '../../workspace-agent-state-meta'
import {
  selectWorkspaceAgentStates,
  type AgentActivityInput
} from '../../worktree-agent-activity-summary'

const NO_AGENT_STATES: WorkspaceAgentStates = new Map()

export function usesAgentStateGrouping(
  groupBy: WorktreeGroupBy,
  nestedGroupBy: readonly NestedSidebarGroupBy[]
): boolean {
  return (
    groupBy === 'agent-state' ||
    normalizeNestedGroupBy(groupBy, nestedGroupBy).includes('agent-state')
  )
}

/** Why gated: every agent transition would otherwise rebuild the row model for other groupings. */
export function selectSidebarAgentStates(
  state: AgentActivityInput,
  groupBy: WorktreeGroupBy,
  nestedGroupBy: readonly NestedSidebarGroupBy[]
): WorkspaceAgentStates {
  return usesAgentStateGrouping(groupBy, nestedGroupBy)
    ? selectWorkspaceAgentStates(state)
    : NO_AGENT_STATES
}
