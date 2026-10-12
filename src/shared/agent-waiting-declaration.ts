import { AGENT_STATUS_MAX_FIELD_LENGTH } from './agent-status-field-normalization'

/** An agent session's declaration that its ended turn is waiting on others, not the user.
 *  Only the CLI and the workspace card toggle set or clear it; prompts never do. */
export type AgentWaitingDeclaration = {
  paneKey: string
  declaredAt: number
  /** Provider session id when declared; another session in the pane voids the declaration. */
  providerSessionId?: string
}

/** Bounds the persisted file against a runaway caller. */
export const AGENT_WAITING_DECLARATIONS_MAX = 500

function isBoundedString(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= AGENT_STATUS_MAX_FIELD_LENGTH
  )
}

export function normalizeAgentWaitingDeclarations(raw: unknown): AgentWaitingDeclaration[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const byPaneKey = new Map<string, AgentWaitingDeclaration>()
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      continue
    }
    const { paneKey, declaredAt, providerSessionId } = item as Record<string, unknown>
    if (
      !isBoundedString(paneKey) ||
      typeof declaredAt !== 'number' ||
      !Number.isFinite(declaredAt)
    ) {
      continue
    }
    byPaneKey.set(paneKey, {
      paneKey,
      declaredAt,
      ...(isBoundedString(providerSessionId) ? { providerSessionId } : {})
    })
  }
  return [...byPaneKey.values()].slice(-AGENT_WAITING_DECLARATIONS_MAX)
}
