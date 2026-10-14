import type { AgentStatusEntry } from './agent-status-types'

/** Display and urgency order: a workspace takes the first state any of its agent panes is in. */
export const WORKSPACE_AGENT_STATES = ['needs-you', 'working', 'waiting-on-others'] as const
export type WorkspaceAgentState = (typeof WORKSPACE_AGENT_STATES)[number]

/** A workspace with no running agent is waiting on the user. */
export const IDLE_WORKSPACE_AGENT_STATE: WorkspaceAgentState = 'needs-you'

type PaneTurnStatus = Pick<AgentStatusEntry, 'state' | 'workingMode' | 'leadTurnEnded'>

type PaneAgentStatus = PaneTurnStatus & {
  /** The pane's agent session declared it is waiting on others (CLI or card toggle). */
  waitingOnOthers?: boolean
}

/** A turn that stopped — including one kept alive only by a background shell, session cron
 *  (`working` + `monitoring`) or background sub-agent — is waiting on someone; only the agent's
 *  declaration says who. */
export function hasEndedTurn(pane: PaneTurnStatus): boolean {
  return (
    pane.state === 'done' ||
    (pane.state === 'working' && (pane.workingMode === 'monitoring' || pane.leadTurnEnded === true))
  )
}

export function getPaneAgentState(pane: PaneAgentStatus): WorkspaceAgentState {
  // Why: the declaration outranks background work, but never an active turn or a permission prompt.
  if (pane.waitingOnOthers === true && hasEndedTurn(pane)) {
    return 'waiting-on-others'
  }
  return pane.state === 'working' && pane.workingMode !== 'monitoring' ? 'working' : 'needs-you'
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

/** Why: the agent declared it is waiting on others, so its turn ending is not a call for the user. */
export function suppressesAgentCompletionAttention(state: WorkspaceAgentState): boolean {
  return state === 'waiting-on-others'
}
