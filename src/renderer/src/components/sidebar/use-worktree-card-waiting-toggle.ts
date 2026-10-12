import React, { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { IDLE_WORKSPACE_AGENT_STATE } from '../../../../shared/workspace-agent-state'
import { selectWorktreeAgentActivitySummary } from './worktree-agent-activity-summary'

export type WaitingQuickAction = 'mark' | 'clear' | null

/** Card toggle between Needs You and Waiting on others for the workspace's ended-turn agents. */
export function useWorktreeCardWaitingToggle(
  worktreeId: string,
  enabled: boolean
): {
  waitingQuickAction: WaitingQuickAction
  handleWaitingQuickAction: (event: React.MouseEvent<HTMLButtonElement>) => void
} {
  const { agentState, endedTurnPaneKeys, waitingPaneKeys } = useAppStore(
    useShallow((s) => {
      const summary = selectWorktreeAgentActivitySummary(s, worktreeId)
      return {
        agentState: summary.agentState ?? IDLE_WORKSPACE_AGENT_STATE,
        endedTurnPaneKeys: summary.endedTurnPaneKeys,
        waitingPaneKeys: summary.waitingPaneKeys
      }
    })
  )
  const waitingQuickAction: WaitingQuickAction = !enabled
    ? null
    : agentState === 'waiting-on-others'
      ? 'clear'
      : agentState === 'needs-you' && endedTurnPaneKeys.length > 0
        ? 'mark'
        : null
  const handleWaitingQuickAction = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (waitingQuickAction === null) {
        return
      }
      const waiting = waitingQuickAction === 'mark'
      void window.api.agentStatus.setWaiting({
        paneKeys: [...(waiting ? endedTurnPaneKeys : waitingPaneKeys)],
        waiting
      })
    },
    [endedTurnPaneKeys, waitingPaneKeys, waitingQuickAction]
  )
  return { waitingQuickAction, handleWaitingQuickAction }
}
