/** Also the sidebar lane order when grouping by engagement. */
export const WORKSPACE_ENGAGEMENTS = ['engaged', 'inbox', 'queued'] as const

export type WorkspaceEngagement = (typeof WORKSPACE_ENGAGEMENTS)[number]

/** Absent or unknown reads as Inbox, the default for new workspaces. */
export function normalizeWorkspaceEngagement(value: unknown): WorkspaceEngagement {
  return WORKSPACE_ENGAGEMENTS.includes(value as WorkspaceEngagement)
    ? (value as WorkspaceEngagement)
    : 'inbox'
}
