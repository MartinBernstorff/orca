/** Per-workspace prompt tally behind the Engagement sort. */
export type WorkspaceEngagement = {
  promptCount: number
  lastPromptAt: number
}

export function normalizeWorkspaceEngagement(raw: {
  promptCount?: unknown
  lastPromptAt?: unknown
}): WorkspaceEngagement {
  const count = raw.promptCount
  const at = raw.lastPromptAt
  return {
    promptCount:
      typeof count === 'number' && Number.isFinite(count) && count > 0 ? Math.floor(count) : 0,
    lastPromptAt: typeof at === 'number' && Number.isFinite(at) && at > 0 ? at : 0
  }
}

export function recordWorkspacePrompt(
  current: { promptCount?: unknown; lastPromptAt?: unknown } | undefined,
  submittedAt: number
): WorkspaceEngagement {
  const { promptCount, lastPromptAt } = normalizeWorkspaceEngagement(current ?? {})
  return { promptCount: promptCount + 1, lastPromptAt: Math.max(lastPromptAt, submittedAt) }
}
