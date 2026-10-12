import { useAppStore } from '../../store'

export function registerAgentWaitingIpcBridge(unsubs: (() => void)[]): void {
  const { listWaitingDeclarations, onWaitingDeclarationsChanged } = window.api.agentStatus
  if (typeof listWaitingDeclarations !== 'function') {
    return
  }
  let receivedPush = false
  const unsubscribe = onWaitingDeclarationsChanged?.((declarations) => {
    receivedPush = true
    useAppStore.getState().setAgentWaitingDeclarations(declarations)
  })
  if (typeof unsubscribe === 'function') {
    unsubs.push(unsubscribe)
  }
  void Promise.resolve(listWaitingDeclarations()).then((declarations) => {
    // Why: a push that landed while the list was in flight is newer than this snapshot.
    if (!receivedPush && Array.isArray(declarations)) {
      useAppStore.getState().setAgentWaitingDeclarations(declarations)
    }
  })
}
