import { WORKSPACE_ENGAGEMENTS, type WorkspaceEngagement } from '../../shared/worktree/engagement'
import { RuntimeClientError } from '../runtime-client'

/** Omitting the flag leaves the engagement unchanged. */
export function getOptionalWorkspaceEngagementFlag(
  flags: Map<string, string | boolean>,
  name: string
): WorkspaceEngagement | undefined {
  const value = flags.get(name)
  if (value === undefined) {
    return undefined
  }
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const engagement = WORKSPACE_ENGAGEMENTS.find((option) => option === normalized)
  if (!engagement) {
    throw new RuntimeClientError(
      'invalid_argument',
      `Invalid --${name}. Use one of: ${WORKSPACE_ENGAGEMENTS.join(', ')}.`
    )
  }
  return engagement
}
