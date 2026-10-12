import type { WorktreeAgentActivitySummary } from './worktree-agent-activity-summary'

export function summariesEqual(
  previous: WorktreeAgentActivitySummary,
  next: WorktreeAgentActivitySummary
): boolean {
  return (
    previous.hasPermission === next.hasPermission &&
    previous.hasLiveWorking === next.hasLiveWorking &&
    previous.hasLiveMonitoring === next.hasLiveMonitoring &&
    previous.hasInterrupted === next.hasInterrupted &&
    previous.hasLiveDone === next.hasLiveDone &&
    previous.hasRetainedDone === next.hasRetainedDone &&
    previous.agentState === next.agentState &&
    paneKeysEqual(previous.endedTurnPaneKeys, next.endedTurnPaneKeys) &&
    paneKeysEqual(previous.waitingPaneKeys, next.waitingPaneKeys) &&
    agentStatusPaneIdsByTabIdEqual(
      previous.agentStatusPaneIdsByTabId,
      next.agentStatusPaneIdsByTabId
    )
  )
}

function paneKeysEqual(previous: readonly string[], next: readonly string[]): boolean {
  return (
    previous.length === next.length && previous.every((paneKey, index) => paneKey === next[index])
  )
}

function agentStatusPaneIdsByTabIdEqual(
  previous: Record<string, ReadonlySet<string>>,
  next: Record<string, ReadonlySet<string>>
): boolean {
  if (previous === next) {
    return true
  }
  const previousKeys = Object.keys(previous)
  if (previousKeys.length !== Object.keys(next).length) {
    return false
  }
  for (const tabId of previousKeys) {
    const previousPaneIds = previous[tabId]
    const nextPaneIds = next[tabId]
    if (!nextPaneIds || previousPaneIds.size !== nextPaneIds.size) {
      return false
    }
    for (const paneId of previousPaneIds) {
      if (!nextPaneIds.has(paneId)) {
        return false
      }
    }
  }
  return true
}
