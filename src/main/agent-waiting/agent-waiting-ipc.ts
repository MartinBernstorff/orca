import { ipcMain } from 'electron'
import type { AgentWaitingDeclaration } from '../../shared/agent-waiting-declaration'
import { agentWaitingDeclarations } from './agent-waiting-declarations'

export function registerAgentWaitingIpcHandlers(): void {
  ipcMain.removeHandler('agentWaiting:list')
  ipcMain.removeHandler('agentWaiting:set')
  ipcMain.handle('agentWaiting:list', (): AgentWaitingDeclaration[] =>
    agentWaitingDeclarations.list()
  )
  ipcMain.handle('agentWaiting:set', (_event, args: { paneKeys: unknown; waiting: unknown }) => {
    if (!Array.isArray(args?.paneKeys) || typeof args.waiting !== 'boolean') {
      return
    }
    for (const paneKey of args.paneKeys) {
      if (typeof paneKey === 'string' && paneKey.length > 0) {
        agentWaitingDeclarations.setWaiting(paneKey, args.waiting)
      }
    }
  })
}
