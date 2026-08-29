import { InvalidArgumentError } from '../core'
import type { OrcaRuntimeService } from '../../orca-runtime'
import type { WorkspaceStatus } from '../../../../shared/worktree/types'
import {
  normalizeWorkspaceStatuses,
  resolveWorkspaceStatusInput
} from '../../../../shared/workspace-statuses'

// Why: the board catalog lives in main-side UI state, so CLI and remote callers can
// only send a name; resolve it here rather than persisting an unmatched id silently.
export function resolveRpcWorkspaceStatus(
  runtime: OrcaRuntimeService,
  value: string | undefined
): WorkspaceStatus | undefined {
  if (value === undefined) {
    return undefined
  }
  const statuses = normalizeWorkspaceStatuses(runtime.getUIState().workspaceStatuses)
  const resolved = resolveWorkspaceStatusInput(value, statuses)
  if (!resolved.ok) {
    throw new InvalidArgumentError(resolved.message)
  }
  return resolved.status
}
