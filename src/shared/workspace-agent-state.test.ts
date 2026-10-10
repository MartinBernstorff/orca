import { describe, expect, it } from 'vitest'
import type { AgentStatusEntry } from './agent-status-types'
import {
  WORKSPACE_AGENT_STATES,
  deriveWorkspaceAgentState,
  getPaneAgentState,
  suppressesAgentCompletionAttention,
  type WorkspaceAgentState
} from './workspace-agent-state'

type Pane = Pick<AgentStatusEntry, 'state' | 'workingMode'>

const PANES: readonly Pane[] = [
  { state: 'working' },
  { state: 'working', workingMode: 'monitoring' },
  { state: 'done' },
  { state: 'blocked' },
  { state: 'waiting' }
]

// Every pane list up to length 3 — small enough to check exhaustively instead of sampling.
function paneLists(maxLength: number): Pane[][] {
  const lists: Pane[][] = [[]]
  let frontier: Pane[][] = [[]]
  for (let length = 1; length <= maxLength; length++) {
    frontier = frontier.flatMap((list) => PANES.map((pane) => [...list, pane]))
    lists.push(...frontier)
  }
  return lists
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) {
    return [[...items]]
  }
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
      item,
      ...rest
    ])
  )
}

const rank = (state: WorkspaceAgentState) => WORKSPACE_AGENT_STATES.indexOf(state)

describe('getPaneAgentState', () => {
  it('maps hook status to Needs you / Working / Polling', () => {
    expect(PANES.map(getPaneAgentState)).toEqual([
      'working',
      'polling',
      'needs-you',
      'needs-you',
      'needs-you'
    ])
  })
})

describe('deriveWorkspaceAgentState', () => {
  it('needs you when no agent pane is running', () => {
    expect(deriveWorkspaceAgentState([])).toBe('needs-you')
  })

  it('takes the most urgent pane state', () => {
    for (const panes of paneLists(3).filter((list) => list.length > 0)) {
      const expected = panes
        .map(getPaneAgentState)
        .reduce((best, state) => (rank(state) < rank(best) ? state : best))
      expect(deriveWorkspaceAgentState(panes)).toBe(expected)
    }
  })

  it('does not depend on pane order', () => {
    for (const panes of paneLists(3)) {
      const expected = deriveWorkspaceAgentState(panes)
      for (const ordering of permutations(panes)) {
        expect(deriveWorkspaceAgentState(ordering)).toBe(expected)
      }
    }
  })

  it('never ranks below any single pane', () => {
    for (const panes of paneLists(3)) {
      const derived = rank(deriveWorkspaceAgentState(panes))
      for (const pane of panes) {
        expect(derived).toBeLessThanOrEqual(rank(getPaneAgentState(pane)))
      }
    }
  })
})

describe('suppressesAgentCompletionAttention', () => {
  it('suppresses completion attention only while Polling', () => {
    expect(WORKSPACE_AGENT_STATES.filter(suppressesAgentCompletionAttention)).toEqual(['polling'])
  })
})
