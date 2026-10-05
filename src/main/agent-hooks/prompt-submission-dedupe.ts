import type { AgentKind } from '../../shared/telemetry-events'
import type { AgentStatusState } from '../../shared/agent-status-types'

export type PromptSubmissionDedupeEntry = {
  agentKind: AgentKind
  promptHash: string
  promptInteractionKey?: string
}

export type AgentPromptSubmittedEvent = {
  paneKey: string
  tabId: string | undefined
  worktreeId: string | undefined
  submittedAt: number
}

export type PromptSubmissionCandidate = {
  isReplay?: boolean
  hasExplicitPrompt?: boolean
  restoredUnconfirmed?: boolean
  state: AgentStatusState
  interrupted?: boolean
  sessionBoundary?: boolean
  prompt?: string
  promptInteractionKey?: string
  agentKind: AgentKind
}

/**
 * Decide whether a status row is a newly submitted prompt, deduped per pane.
 * Returns the pane's next dedupe entry when it is, or null when the row adds nothing.
 */
export function detectPromptSubmission(
  candidate: PromptSubmissionCandidate,
  previousState: AgentStatusState | undefined,
  previousDedupe: PromptSubmissionDedupeEntry | undefined,
  hashPrompt: (prompt: string) => string
): PromptSubmissionDedupeEntry | null {
  if (
    candidate.isReplay === true ||
    candidate.hasExplicitPrompt !== true ||
    candidate.restoredUnconfirmed === true ||
    // Why: interrupts and session boundaries end or reset a turn; they never submit one.
    (candidate.state === 'done' &&
      (candidate.interrupted === true || candidate.sessionBoundary === true))
  ) {
    return null
  }
  const prompt = candidate.prompt?.trim() ?? ''
  if (prompt.length === 0) {
    return null
  }
  const { agentKind } = candidate
  const promptHash = hashPrompt(prompt)
  const promptInteractionKey =
    typeof candidate.promptInteractionKey === 'string' &&
    candidate.promptInteractionKey.trim().length > 0
      ? candidate.promptInteractionKey.trim()
      : undefined
  const isCompletedTurnBoundary = previousState === 'done' && candidate.state === 'working'
  if (
    previousDedupe?.agentKind === agentKind &&
    previousDedupe.promptInteractionKey !== undefined &&
    previousDedupe.promptInteractionKey === promptInteractionKey &&
    (agentKind === 'opencode' || previousDedupe.promptHash === promptHash)
  ) {
    return null
  }
  if (
    previousDedupe?.agentKind === agentKind &&
    previousDedupe.promptHash === promptHash &&
    !(
      previousState === 'done' &&
      candidate.state === 'done' &&
      previousDedupe.promptInteractionKey !== undefined &&
      promptInteractionKey !== undefined &&
      previousDedupe.promptInteractionKey !== promptInteractionKey
    ) &&
    !isCompletedTurnBoundary
  ) {
    return null
  }
  return { agentKind, promptHash, promptInteractionKey }
}
