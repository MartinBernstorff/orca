/** Also the sidebar lane order when grouping by engagement. */
export const WORKSPACE_ENGAGEMENTS = ['engaged', 'queued'] as const

export type WorkspaceEngagement = (typeof WORKSPACE_ENGAGEMENTS)[number]

/** Absent or unknown reads as Queued, the default for new workspaces. */
export function normalizeWorkspaceEngagement(value: unknown): WorkspaceEngagement {
  return value === 'engaged' ? 'engaged' : 'queued'
}
