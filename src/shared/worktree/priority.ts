/** Highest first; also the sidebar lane order when grouping by priority. */
export const WORKSPACE_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const

export type WorkspacePriority = (typeof WORKSPACE_PRIORITIES)[number]

/** Sort rank: urgent first, no priority last. */
export function getWorkspacePriorityRank(priority: unknown): number {
  const normalized = normalizeWorkspacePriority(priority)
  return normalized ? WORKSPACE_PRIORITIES.indexOf(normalized) : WORKSPACE_PRIORITIES.length
}

export function normalizeWorkspacePriority(value: unknown): WorkspacePriority | null {
  return WORKSPACE_PRIORITIES.includes(value as WorkspacePriority)
    ? (value as WorkspacePriority)
    : null
}
