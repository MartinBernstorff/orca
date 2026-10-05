import {
  WORKSPACE_PRIORITIES,
  normalizeWorkspacePriority,
  type WorkspacePriority
} from '../../shared/worktree/priority'
import { RuntimeClientError } from '../runtime-client'

/** `none` (or `null`) clears the priority; omitting the flag leaves it unchanged. */
export function getOptionalWorkspacePriorityFlag(
  flags: Map<string, string | boolean>,
  name: string
): WorkspacePriority | null | undefined {
  const value = flags.get(name)
  if (value === undefined) {
    return undefined
  }
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (normalized === 'none' || normalized === 'null') {
    return null
  }
  const priority = normalizeWorkspacePriority(normalized)
  if (!priority) {
    throw new RuntimeClientError(
      'invalid_argument',
      `Invalid --${name}. Use one of: ${[...WORKSPACE_PRIORITIES, 'none'].join(', ')}.`
    )
  }
  return priority
}
