import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  AGENT_WAITING_DECLARATIONS_MAX,
  normalizeAgentWaitingDeclarations,
  type AgentWaitingDeclaration
} from '../../shared/agent-waiting-declaration'
import type {
  AgentStatusClearIpcPayload,
  AgentStatusIpcPayload
} from '../../shared/agent-status-types'
import { writeFileAtomically } from '../codex-accounts/fs-utils'

export const AGENT_WAITING_DECLARATIONS_FILE_NAME = 'agent-waiting-declarations.json'

export type AgentWaitingHookStatusSource = {
  getStatusForPane: (paneKey: string) => AgentStatusIpcPayload | null
  subscribeEnrichedStatus: (
    listener: (status: { paneKey: string; providerSession?: { id: string } }) => void
  ) => () => void
  subscribePaneStatusClear: (listener: (clear: AgentStatusClearIpcPayload) => void) => () => void
}

export type AgentWaitingSetResult = 'set' | 'cleared' | 'unchanged' | 'no-agent'

type ChangeListener = (declarations: AgentWaitingDeclaration[]) => void

/** Main-process owner of "waiting on others" declarations: one per agent session, persisted so a
 *  restart keeps waiting workspaces out of Needs You. */
export class AgentWaitingDeclarationStore {
  private declarations = new Map<string, AgentWaitingDeclaration>()
  private filePath: string | null = null
  private hooks: AgentWaitingHookStatusSource | null = null
  private readonly listeners = new Set<ChangeListener>()

  load(filePath: string): void {
    this.filePath = filePath
    if (!existsSync(filePath)) {
      return
    }
    try {
      const declarations = normalizeAgentWaitingDeclarations(
        JSON.parse(readFileSync(filePath, 'utf-8'))
      )
      this.declarations = new Map(declarations.map((entry) => [entry.paneKey, entry]))
    } catch (error) {
      console.error('[agent-waiting] failed to read declarations', error)
    }
  }

  /** Session lifetime: a new provider session or a cleared pane ends the declaration. */
  attach(hooks: AgentWaitingHookStatusSource): () => void {
    this.hooks = hooks
    const unsubscribeStatus = hooks.subscribeEnrichedStatus((status) => {
      const declaration = this.declarations.get(status.paneKey)
      const sessionId = status.providerSession?.id
      if (!declaration || !sessionId || declaration.providerSessionId === sessionId) {
        return
      }
      if (declaration.providerSessionId === undefined) {
        this.declarations.set(status.paneKey, { ...declaration, providerSessionId: sessionId })
        this.persist()
        return
      }
      this.declarations.delete(status.paneKey)
      this.commit()
    })
    const unsubscribeClear = hooks.subscribePaneStatusClear((clear) => {
      // Why: a transient SSH disconnect clear is loss of contact, not the agent session ending.
      if ('paneKey' in clear && this.declarations.delete(clear.paneKey)) {
        this.commit()
      }
    })
    return () => {
      unsubscribeStatus()
      unsubscribeClear()
      this.hooks = null
    }
  }

  list(): AgentWaitingDeclaration[] {
    return [...this.declarations.values()]
  }

  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setWaiting(paneKey: string, waiting: boolean, now = Date.now()): AgentWaitingSetResult {
    const status = this.hooks?.getStatusForPane(paneKey) ?? null
    const resolvedPaneKey = status?.paneKey ?? paneKey
    if (!waiting) {
      const deleted = this.declarations.delete(resolvedPaneKey)
      if (deleted) {
        this.commit()
      }
      return deleted ? 'cleared' : 'unchanged'
    }
    if (!status) {
      return 'no-agent'
    }
    const sessionId = status.providerSession?.id
    const existing = this.declarations.get(resolvedPaneKey)
    if (existing && existing.providerSessionId === sessionId) {
      return 'unchanged'
    }
    this.declarations.delete(resolvedPaneKey)
    this.declarations.set(resolvedPaneKey, {
      paneKey: resolvedPaneKey,
      declaredAt: now,
      ...(sessionId ? { providerSessionId: sessionId } : {})
    })
    while (this.declarations.size > AGENT_WAITING_DECLARATIONS_MAX) {
      const oldest = this.declarations.keys().next().value
      if (oldest === undefined) {
        break
      }
      this.declarations.delete(oldest)
    }
    this.commit()
    return 'set'
  }

  private commit(): void {
    this.persist()
    const declarations = this.list()
    for (const listener of this.listeners) {
      try {
        listener(declarations)
      } catch (error) {
        console.error('[agent-waiting] change listener threw', error)
      }
    }
  }

  private persist(): void {
    if (!this.filePath) {
      return
    }
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileAtomically(this.filePath, JSON.stringify(this.list()))
    } catch (error) {
      console.error('[agent-waiting] failed to persist declarations', error)
    }
  }
}

export const agentWaitingDeclarations = new AgentWaitingDeclarationStore()
