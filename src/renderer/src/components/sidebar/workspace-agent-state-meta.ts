import type React from 'react'
import { Activity, LoaderCircle, MessageCircleQuestion } from 'lucide-react'
import {
  IDLE_WORKSPACE_AGENT_STATE,
  WORKSPACE_AGENT_STATES,
  type WorkspaceAgentState
} from '../../../../shared/workspace-agent-state'
import { translate } from '@/i18n/i18n'

export type WorkspaceAgentStates = ReadonlyMap<string, WorkspaceAgentState>

const AGENT_STATE_LANE_KEY_PREFIX = 'agent-state:'

// Why the dashboard keys: lane names must match the agent dashboard's buckets.
export function getWorkspaceAgentStateLabel(state: WorkspaceAgentState): string {
  switch (state) {
    case 'needs-you':
      return translate('dashboardPopout.bucket.attention', 'Needs You')
    case 'working':
      return translate('dashboardPopout.bucket.working', 'Working')
    case 'polling':
      return translate('auto.components.sidebar.workspaceAgentState.polling', 'Polling')
  }
}

const AGENT_STATE_LANE_META: Record<
  WorkspaceAgentState,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  'needs-you': { icon: MessageCircleQuestion, tone: 'text-agent-question' },
  working: { icon: LoaderCircle, tone: 'text-foreground' },
  polling: { icon: Activity, tone: 'text-yellow-500' }
}

export function getWorkspaceAgentStateLaneHeaderMeta(state: WorkspaceAgentState): {
  label: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
} {
  return { label: getWorkspaceAgentStateLabel(state), ...AGENT_STATE_LANE_META[state] }
}

export function getWorkspaceAgentState(
  agentStates: WorkspaceAgentStates | undefined,
  worktreeId: string
): WorkspaceAgentState {
  return agentStates?.get(worktreeId) ?? IDLE_WORKSPACE_AGENT_STATE
}

export function getWorkspaceAgentStateLaneKey(state: WorkspaceAgentState): string {
  return `${AGENT_STATE_LANE_KEY_PREFIX}${state}`
}

export function getWorkspaceAgentStateFromLaneKey(key: string): WorkspaceAgentState {
  const state = key.slice(AGENT_STATE_LANE_KEY_PREFIX.length)
  return (
    WORKSPACE_AGENT_STATES.find((candidate) => candidate === state) ?? IDLE_WORKSPACE_AGENT_STATE
  )
}
