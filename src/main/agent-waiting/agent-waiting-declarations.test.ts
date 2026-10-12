import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type {
  AgentStatusClearIpcPayload,
  AgentStatusIpcPayload
} from '../../shared/agent-status-types'
import {
  AgentWaitingDeclarationStore,
  type AgentWaitingHookStatusSource
} from './agent-waiting-declarations'

const PANE = 'tab-1:11111111-1111-4111-8111-111111111111'

function makeHooks(statuses: Record<string, { sessionId?: string }>) {
  const statusListeners = new Set<
    (status: { paneKey: string; providerSession?: { id: string } }) => void
  >()
  const clearListeners = new Set<(clear: AgentStatusClearIpcPayload) => void>()
  const hooks: AgentWaitingHookStatusSource = {
    getStatusForPane: (paneKey) => {
      const status = statuses[paneKey]
      if (!status) {
        return null
      }
      return {
        paneKey,
        state: 'done',
        prompt: '',
        connectionId: null,
        receivedAt: 1,
        stateStartedAt: 1,
        ...(status.sessionId ? { providerSession: { key: 'claude', id: status.sessionId } } : {})
      } as AgentStatusIpcPayload
    },
    subscribeEnrichedStatus: (listener) => {
      statusListeners.add(listener)
      return () => statusListeners.delete(listener)
    },
    subscribePaneStatusClear: (listener) => {
      clearListeners.add(listener)
      return () => clearListeners.delete(listener)
    }
  }
  return {
    hooks,
    emitStatus: (paneKey: string, sessionId: string) =>
      statusListeners.forEach((listener) =>
        listener({ paneKey, providerSession: { id: sessionId } })
      ),
    emitClear: (clear: AgentStatusClearIpcPayload) =>
      clearListeners.forEach((listener) => listener(clear))
  }
}

describe('AgentWaitingDeclarationStore', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'agent-waiting-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('refuses to declare a pane with no agent status', () => {
    const store = new AgentWaitingDeclarationStore()
    store.attach(makeHooks({}).hooks)

    expect(store.setWaiting(PANE, true)).toBe('no-agent')
    expect(store.list()).toEqual([])
  })

  it('persists declarations across a reload', () => {
    const filePath = join(dir, 'declarations.json')
    const store = new AgentWaitingDeclarationStore()
    store.load(filePath)
    store.attach(makeHooks({ [PANE]: { sessionId: 's1' } }).hooks)

    expect(store.setWaiting(PANE, true, 5)).toBe('set')

    const reloaded = new AgentWaitingDeclarationStore()
    reloaded.load(filePath)
    expect(reloaded.list()).toEqual([{ paneKey: PANE, declaredAt: 5, providerSessionId: 's1' }])
    expect(JSON.parse(readFileSync(filePath, 'utf-8'))).toHaveLength(1)
  })

  it('keeps the declaration across prompts in the same session', () => {
    const { hooks, emitStatus } = makeHooks({ [PANE]: { sessionId: 's1' } })
    const store = new AgentWaitingDeclarationStore()
    store.attach(hooks)
    store.setWaiting(PANE, true)

    emitStatus(PANE, 's1')

    expect(store.list()).toHaveLength(1)
  })

  it('ends the declaration when a new agent session reports in the pane', () => {
    const { hooks, emitStatus } = makeHooks({ [PANE]: { sessionId: 's1' } })
    const store = new AgentWaitingDeclarationStore()
    store.attach(hooks)
    const changes: number[] = []
    store.subscribe((declarations) => changes.push(declarations.length))
    store.setWaiting(PANE, true)

    emitStatus(PANE, 's2')

    expect(store.list()).toEqual([])
    expect(changes).toEqual([1, 0])
  })

  it('ends the declaration on pane teardown but not on a transient SSH disconnect', () => {
    const { hooks, emitClear } = makeHooks({ [PANE]: {} })
    const store = new AgentWaitingDeclarationStore()
    store.attach(hooks)
    store.setWaiting(PANE, true)

    emitClear({ transient: true, connectionId: 'ssh-1', clearedAt: 1 })
    expect(store.list()).toHaveLength(1)

    emitClear({ paneKey: PANE })
    expect(store.list()).toEqual([])
  })

  it('clears explicitly', () => {
    const store = new AgentWaitingDeclarationStore()
    store.attach(makeHooks({ [PANE]: {} }).hooks)
    store.setWaiting(PANE, true)

    expect(store.setWaiting(PANE, false)).toBe('cleared')
    expect(store.setWaiting(PANE, false)).toBe('unchanged')
  })
})
