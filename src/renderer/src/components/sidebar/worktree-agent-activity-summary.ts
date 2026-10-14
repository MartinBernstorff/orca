import type { AppState } from '@/store'
import { isExplicitAgentStatusFresh } from '@/lib/agent-status'
import { migrationUnsupportedToAgentStatusEntry } from '@/lib/migration-unsupported-agent-entry'
import {
  mergeAgentStatusOrchestration,
  parseAgentStatusPaneIdentity,
  resolveAgentStatusWorktreeId
} from '@/lib/agent-status-worktree-attribution'
import { summariesEqual } from './worktree-agent-activity-summary-equality'
import {
  AGENT_STATUS_STALE_AFTER_MS,
  type AgentStatusEntry,
  type AgentStatusOrchestrationContext
} from '../../../../shared/agent-status-types'
import {
  IDLE_WORKSPACE_AGENT_STATE,
  getPaneAgentState,
  hasEndedTurn,
  mostUrgentAgentState,
  type WorkspaceAgentState
} from '../../../../shared/workspace-agent-state'

export type WorktreeAgentActivitySummary = {
  hasPermission: boolean
  hasLiveWorking: boolean
  hasLiveMonitoring: boolean
  /** A pane's ended turn is kept alive by a background shell or session cron (e.g. a CI watcher). */
  hasRunningBackgroundTask: boolean
  /** Fresh interrupted completion, kept separate from clean done outcomes. */
  hasInterrupted: boolean
  hasLiveDone: boolean
  hasRetainedDone: boolean
  /** Most urgent state across fresh hook panes and declared panes; null when there are none. */
  agentState: WorkspaceAgentState | null
  /** Panes whose turn ended without a waiting-on-others declaration. */
  endedTurnPaneKeys: readonly string[]
  /** Panes whose agent session declared it is waiting on others. */
  waitingPaneKeys: readonly string[]
  agentStatusPaneIdsByTabId: Record<string, ReadonlySet<string>>
}

const EMPTY_AGENT_STATUS_PANE_IDS_BY_TAB_ID: Record<string, ReadonlySet<string>> = {}
const NO_PANE_KEYS: readonly string[] = []

const EMPTY_SUMMARY: WorktreeAgentActivitySummary = {
  hasPermission: false,
  hasLiveWorking: false,
  hasLiveMonitoring: false,
  hasRunningBackgroundTask: false,
  hasInterrupted: false,
  hasLiveDone: false,
  hasRetainedDone: false,
  agentState: null,
  endedTurnPaneKeys: NO_PANE_KEYS,
  waitingPaneKeys: NO_PANE_KEYS,
  agentStatusPaneIdsByTabId: EMPTY_AGENT_STATUS_PANE_IDS_BY_TAB_ID
}

type AgentActivityTabsByWorktree = Record<string, readonly { id: string }[]>

export type AgentActivityInput = Pick<
  AppState,
  | 'agentStatusEpoch'
  | 'agentStatusByPaneKey'
  | 'migrationUnsupportedByPtyId'
  | 'retainedAgentsByPaneKey'
> &
  Partial<Pick<AppState, 'agentWaitingByPaneKey'>> & {
    tabsByWorktree: AgentActivityTabsByWorktree
    runtimeAgentOrchestrationByPaneKey?: AppState['runtimeAgentOrchestrationByPaneKey']
  }

type AgentActivityCache = {
  tabsByWorktree: AgentActivityTabsByWorktree
  agentStatusEpoch: number
  migrationUnsupportedByPtyId: AppState['migrationUnsupportedByPtyId']
  retainedAgentsByPaneKey: AppState['retainedAgentsByPaneKey']
  agentWaitingByPaneKey: AppState['agentWaitingByPaneKey'] | undefined
  runtimeAgentOrchestrationByPaneKey: AppState['runtimeAgentOrchestrationByPaneKey'] | undefined
  summaries: Map<string, WorktreeAgentActivitySummary>
}

let agentActivityCache: AgentActivityCache | null = null

export function selectWorktreeAgentActivitySummary(
  state: AgentActivityInput,
  worktreeId: string
): WorktreeAgentActivitySummary {
  return getWorktreeAgentActivitySummaries(state).get(worktreeId) ?? EMPTY_SUMMARY
}

export function selectWorkspaceAgentState(
  state: AgentActivityInput,
  worktreeId: string
): WorkspaceAgentState {
  return (
    selectWorktreeAgentActivitySummary(state, worktreeId).agentState ?? IDLE_WORKSPACE_AGENT_STATE
  )
}

const EMPTY_AGENT_STATES: ReadonlyMap<string, WorkspaceAgentState> = new Map()
let agentStatesCache: {
  summaries: Map<string, WorktreeAgentActivitySummary>
  states: ReadonlyMap<string, WorkspaceAgentState>
} | null = null

/** Agent state of every workspace with a fresh hook pane; absent ids are idle. Identity-stable
 *  while no workspace changes state, so grouping only rebuilds on a real transition. */
export function selectWorkspaceAgentStates(
  state: AgentActivityInput
): ReadonlyMap<string, WorkspaceAgentState> {
  const summaries = getWorktreeAgentActivitySummaries(state)
  if (agentStatesCache?.summaries === summaries) {
    return agentStatesCache.states
  }
  const next = new Map<string, WorkspaceAgentState>()
  for (const [worktreeId, summary] of summaries) {
    if (summary.agentState !== null) {
      next.set(worktreeId, summary.agentState)
    }
  }
  const previous = agentStatesCache?.states ?? EMPTY_AGENT_STATES
  const unchanged =
    previous.size === next.size &&
    [...next].every(([worktreeId, agentState]) => previous.get(worktreeId) === agentState)
  agentStatesCache = { summaries, states: unchanged ? previous : next }
  return agentStatesCache.states
}

function getWorktreeAgentActivitySummaries(
  state: AgentActivityInput
): Map<string, WorktreeAgentActivitySummary> {
  const runtimeAgentOrchestrationByPaneKey = state.runtimeAgentOrchestrationByPaneKey
  if (
    agentActivityCache &&
    agentActivityCache.tabsByWorktree === state.tabsByWorktree &&
    agentActivityCache.agentStatusEpoch === state.agentStatusEpoch &&
    agentActivityCache.migrationUnsupportedByPtyId === state.migrationUnsupportedByPtyId &&
    agentActivityCache.retainedAgentsByPaneKey === state.retainedAgentsByPaneKey &&
    agentActivityCache.agentWaitingByPaneKey === state.agentWaitingByPaneKey &&
    agentActivityCache.runtimeAgentOrchestrationByPaneKey === runtimeAgentOrchestrationByPaneKey
  ) {
    return agentActivityCache.summaries
  }

  // Why: status dots render once per visible worktree. Build the tab/worktree
  // index once per store snapshot so agent pings are O(worktrees + agents),
  // not O(worktrees * agents).
  const tabIdToWorktreeId = new Map<string, string>()
  for (const [worktreeId, tabs] of Object.entries(state.tabsByWorktree)) {
    for (const tab of tabs) {
      tabIdToWorktreeId.set(tab.id, worktreeId)
    }
  }

  const summaries = new Map<string, WorktreeAgentActivitySummary>()
  const summaryForWorktree = (worktreeId: string): WorktreeAgentActivitySummary => {
    let summary = summaries.get(worktreeId)
    if (!summary) {
      summary = { ...EMPTY_SUMMARY }
      summaries.set(worktreeId, summary)
    }
    return summary
  }

  const now = Date.now()
  for (const [paneKey, entry] of Object.entries(state.agentStatusByPaneKey)) {
    const paneIdentity = parseAgentStatusPaneIdentity(paneKey)
    if (!paneIdentity) {
      continue
    }
    const orchestration = mergeAgentStatusOrchestration(
      entry,
      runtimeAgentOrchestrationByPaneKey?.[paneKey]
    )
    const worktreeId = resolveAgentStatusWorktreeId(entry, tabIdToWorktreeId, orchestration)
    if (!worktreeId) {
      continue
    }
    const summary = summaryForWorktree(worktreeId)
    const waitingOnOthers = state.agentWaitingByPaneKey?.[paneKey] === true
    if (waitingOnOthers) {
      summary.waitingPaneKeys = [...summary.waitingPaneKeys, paneKey]
    } else if (!entry.restoredUnconfirmed && hasEndedTurn(entry)) {
      summary.endedTurnPaneKeys = [...summary.endedTurnPaneKeys, paneKey]
    }
    // Why: not freshness-gated — a running background task emits no hooks; its exit starts a new turn that clears this.
    if (
      !entry.restoredUnconfirmed &&
      entry.state === 'working' &&
      entry.workingMode === 'monitoring'
    ) {
      summary.hasRunningBackgroundTask = true
    }
    const fresh =
      !entry.restoredUnconfirmed &&
      isExplicitAgentStatusFresh(entry, now, AGENT_STATUS_STALE_AFTER_MS)
    if (!fresh) {
      if (entry.restoredUnconfirmed) {
        addAgentStatusPaneId(summary, paneIdentity.tabId, paneIdentity.paneId)
      }
      // Why: a declared wait outlives hook freshness and restarts; only the CLI or card clears it.
      if (waitingOnOthers) {
        summary.agentState = mostUrgentAgentState(summary.agentState, 'waiting-on-others')
      }
      continue
    }
    addAgentStatusPaneId(summary, paneIdentity.tabId, paneIdentity.paneId)
    if (entry.state === 'done') {
      addParentPaneId(summary, orchestration, worktreeId, tabIdToWorktreeId)
    }
    applyLiveAgentState(summary, entry, waitingOnOthers)
  }

  for (const unsupported of Object.values(state.migrationUnsupportedByPtyId ?? {})) {
    const entry = migrationUnsupportedToAgentStatusEntry(unsupported)
    const worktreeId = entry ? worktreeIdForPaneKey(entry.paneKey, tabIdToWorktreeId) : null
    if (worktreeId) {
      summaryForWorktree(worktreeId).hasPermission = true
    }
  }

  for (const retained of Object.values(state.retainedAgentsByPaneKey ?? {})) {
    const summary = summaryForWorktree(retained.worktreeId)
    summary.hasRetainedDone = true
    const paneIdentity = parseAgentStatusPaneIdentity(retained.entry?.paneKey)
    if (paneIdentity) {
      addAgentStatusPaneId(summary, paneIdentity.tabId, paneIdentity.paneId)
    }
    const orchestration = mergeAgentStatusOrchestration(
      retained.entry,
      runtimeAgentOrchestrationByPaneKey?.[retained.entry.paneKey]
    )
    addParentPaneId(summary, orchestration, retained.worktreeId, tabIdToWorktreeId)
  }

  // Why: epoch changes rebuild every summary, so reuse structurally equal results
  // to keep unrelated worktree subscriptions from scheduling card renders.
  const previousSummaries = agentActivityCache?.summaries
  if (previousSummaries) {
    for (const [worktreeId, summary] of summaries) {
      const previous = previousSummaries.get(worktreeId)
      if (previous && summariesEqual(previous, summary)) {
        summaries.set(worktreeId, previous)
      }
    }
  }

  agentActivityCache = {
    tabsByWorktree: state.tabsByWorktree,
    agentStatusEpoch: state.agentStatusEpoch,
    migrationUnsupportedByPtyId: state.migrationUnsupportedByPtyId,
    retainedAgentsByPaneKey: state.retainedAgentsByPaneKey,
    agentWaitingByPaneKey: state.agentWaitingByPaneKey,
    runtimeAgentOrchestrationByPaneKey,
    summaries
  }
  return summaries
}

function applyLiveAgentState(
  summary: WorktreeAgentActivitySummary,
  entry: Pick<AgentStatusEntry, 'state' | 'workingMode' | 'leadTurnEnded' | 'interrupted'>,
  waitingOnOthers: boolean
): void {
  summary.agentState = mostUrgentAgentState(
    summary.agentState,
    getPaneAgentState({ ...entry, waitingOnOthers })
  )
  if (entry.state === 'blocked' || entry.state === 'waiting') {
    summary.hasPermission = true
  } else if (entry.interrupted === true) {
    // Interrupted is encoded as done, so it must be checked first.
    summary.hasInterrupted = true
  } else if (entry.state === 'working') {
    if (entry.workingMode === 'monitoring') {
      summary.hasLiveMonitoring = true
    } else {
      summary.hasLiveWorking = true
    }
  } else if (entry.state === 'done') {
    summary.hasLiveDone = true
  }
}

function addAgentStatusPaneId(
  summary: WorktreeAgentActivitySummary,
  tabId: string,
  paneId: string
): void {
  if (summary.agentStatusPaneIdsByTabId === EMPTY_AGENT_STATUS_PANE_IDS_BY_TAB_ID) {
    summary.agentStatusPaneIdsByTabId = {}
  }
  let paneIds = summary.agentStatusPaneIdsByTabId[tabId] as Set<string> | undefined
  if (!paneIds) {
    paneIds = new Set<string>()
    summary.agentStatusPaneIdsByTabId[tabId] = paneIds
  }
  paneIds.add(paneId)
}

function worktreeIdForPaneKey(
  paneKey: string | undefined,
  tabIdToWorktreeId: Map<string, string>
): string | null {
  const paneIdentity = parseAgentStatusPaneIdentity(paneKey)
  return paneIdentity ? (tabIdToWorktreeId.get(paneIdentity.tabId) ?? null) : null
}

function addParentPaneId(
  summary: WorktreeAgentActivitySummary,
  orchestration: AgentStatusOrchestrationContext | undefined,
  worktreeId: string,
  tabIdToWorktreeId: Map<string, string>
): void {
  const parentPaneIdentity = parseAgentStatusPaneIdentity(orchestration?.parentPaneKey)
  if (!parentPaneIdentity) {
    return
  }
  // Why: a completed worker can be the only visible row for a worktree while
  // its parent pane still carries a stale spinner title. Let that row own the
  // parent pane's title for this worktree without touching other worktrees.
  if (tabIdToWorktreeId.get(parentPaneIdentity.tabId) !== worktreeId) {
    return
  }
  addAgentStatusPaneId(summary, parentPaneIdentity.tabId, parentPaneIdentity.paneId)
}
