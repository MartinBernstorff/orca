import { describe, expect, it } from 'vitest'
import {
  detectPromptSubmission,
  type PromptSubmissionCandidate,
  type PromptSubmissionDedupeEntry
} from './prompt-submission-dedupe'
import type { AgentStatusState } from '../../shared/agent-status-types'

const hash = (prompt: string): string => `h:${prompt}`

function submit(overrides: Partial<PromptSubmissionCandidate> = {}): PromptSubmissionCandidate {
  return {
    hasExplicitPrompt: true,
    state: 'working',
    prompt: 'fix the spinner',
    agentKind: 'claude-code',
    ...overrides
  }
}

/** Feed rows through the detector like one pane's ingress and count accepted prompts. */
function countPrompts(rows: PromptSubmissionCandidate[]): number {
  let previousState: AgentStatusState | undefined
  let dedupe: PromptSubmissionDedupeEntry | undefined
  let count = 0
  for (const row of rows) {
    const next = detectPromptSubmission(row, previousState, dedupe, hash)
    if (next) {
      dedupe = next
      count += 1
    }
    previousState = row.state
  }
  return count
}

describe('detectPromptSubmission', () => {
  it('counts a new turn once', () => {
    expect(countPrompts([submit()])).toBe(1)
  })

  it('counts each new turn, including the same prompt resubmitted after completion', () => {
    expect(
      countPrompts([
        submit(),
        submit({ state: 'done', hasExplicitPrompt: false }),
        submit({ prompt: 'second' }),
        submit({ state: 'done', hasExplicitPrompt: false }),
        submit({ prompt: 'second' })
      ])
    ).toBe(3)
  })

  it('adds nothing for tool pings that carry the cached prompt', () => {
    expect(
      countPrompts([
        submit(),
        submit({ hasExplicitPrompt: false }),
        submit({ state: 'waiting', hasExplicitPrompt: false }),
        submit({ hasExplicitPrompt: false })
      ])
    ).toBe(1)
  })

  it('adds nothing for an adjacent same-turn report of the explicit prompt', () => {
    expect(countPrompts([submit(), submit({ state: 'done' })])).toBe(1)
  })

  it('adds nothing for replays or restored snapshots', () => {
    expect(countPrompts([submit({ isReplay: true }), submit({ restoredUnconfirmed: true })])).toBe(
      0
    )
  })

  it('adds nothing for interrupts or session boundaries', () => {
    expect(
      countPrompts([
        submit({ state: 'done', interrupted: true }),
        submit({ state: 'done', sessionBoundary: true, prompt: 'other' })
      ])
    ).toBe(0)
  })

  it('adds nothing for an empty prompt', () => {
    expect(countPrompts([submit({ prompt: '   ' })])).toBe(0)
  })
})
