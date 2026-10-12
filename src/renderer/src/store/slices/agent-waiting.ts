import type { StateCreator } from 'zustand'
import type { AppState } from '../types'
import type { AgentWaitingDeclaration } from '../../../../shared/agent-waiting-declaration'

/** Mirror of main's "waiting on others" declarations; main owns session lifetime and persistence. */
export type AgentWaitingSlice = {
  agentWaitingByPaneKey: Readonly<Record<string, true>>
  setAgentWaitingDeclarations: (declarations: readonly AgentWaitingDeclaration[]) => void
}

const NO_WAITING_PANES: Readonly<Record<string, true>> = {}

export const createAgentWaitingSlice: StateCreator<AppState, [], [], AgentWaitingSlice> = (
  set
) => ({
  agentWaitingByPaneKey: NO_WAITING_PANES,
  setAgentWaitingDeclarations: (declarations) => {
    set((s) => {
      const current = s.agentWaitingByPaneKey
      const unchanged =
        Object.keys(current).length === declarations.length &&
        declarations.every((declaration) => current[declaration.paneKey] === true)
      if (unchanged) {
        return s
      }
      const next: Record<string, true> = {}
      for (const declaration of declarations) {
        next[declaration.paneKey] = true
      }
      return { agentWaitingByPaneKey: next }
    })
  }
})
