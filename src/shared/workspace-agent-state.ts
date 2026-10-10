import type { AgentStatusEntry } from './agent-status-types'

/** Display and urgency order: a workspace takes the first state any of its agent panes is in. */
export const WORKSPACE_AGENT_STATES = ['needs-you', 'working', 'polling'] as const
export type WorkspaceAgentState = (typeof WORKSPACE_AGENT_STATES)[number]

/** A workspace with no running agent is waiting on the user. */
export const IDLE_WORKSPACE_AGENT_STATE: WorkspaceAgentState = 'needs-you'

type PaneAgentStatus = Pick<AgentStatusEntry, 'state' | 'workingMode'>

/** Hook status only: a running turn or subagent is `working`; a stopped turn kept alive by a
 *  background shell or session cron reports `working` + `monitoring`. */
export function getPaneAgentState(pane: PaneAgentStatus): WorkspaceAgentState {
  if (pane.state !== 'working') {
    return 'needs-you'
  }
  return pane.workingMode === 'monitoring' ? 'polling' : 'working'
}

export function mostUrgentAgentState(
  current: WorkspaceAgentState | null,
  next: WorkspaceAgentState
): WorkspaceAgentState {
  if (current === null) {
    return next
  }
  return WORKSPACE_AGENT_STATES.indexOf(next) < WORKSPACE_AGENT_STATES.indexOf(current)
    ? next
    : current
}

export function deriveWorkspaceAgentState(panes: Iterable<PaneAgentStatus>): WorkspaceAgentState {
  let state: WorkspaceAgentState | null = null
  for (const pane of panes) {
    state = mostUrgentAgentState(state, getPaneAgentState(pane))
  }
  return state ?? IDLE_WORKSPACE_AGENT_STATE
}

/** Why: a polling agent's turn already ended, but it is still watching its background work. */
export function suppressesAgentCompletionAttention(state: WorkspaceAgentState): boolean {
  return state === 'polling'
}
