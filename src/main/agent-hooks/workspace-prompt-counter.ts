import type { Repo } from '../../shared/repo-types'
import type { FolderWorkspace } from '../../shared/folder-workspace-types'
import { getRepoExecutionHostId } from '../../shared/execution-host'
import { getRepoIdFromWorktreeId } from '../../shared/worktree/id'
import { parseWorkspaceKey } from '../../shared/workspace-scope'
import { recordWorkspacePrompt, type WorkspaceEngagement } from '../../shared/worktree/engagement'
import {
  readWorktreeMetaForHost,
  writeWorktreeMetaForHost,
  type HostQualifiedWorktreeMetaStore
} from '../persistence/host-qualified-worktree-meta'
import type { AgentPromptSubmittedEvent } from './prompt-submission-dedupe'

export type WorkspacePromptCounterStore = Pick<
  HostQualifiedWorktreeMetaStore,
  'setWorktreeMeta' | 'setWorktreeMetaForHost' | 'getWorktreeMetaForHost'
> & {
  getWorktreeIdForTab: (tabId: string) => string | undefined
  getRepo: (repoId: string) => Repo | undefined
  getFolderWorkspace: (id: string) => FolderWorkspace | undefined
  updateFolderWorkspace: (
    id: string,
    updates: Partial<WorkspaceEngagement>
  ) => FolderWorkspace | null | undefined
}

export type WorkspacePromptCounterDeps = {
  store: WorkspacePromptCounterStore
  resolveWorktreeIdForPaneKey: (paneKey: string) => string | null | undefined
  notifyWorktreeMetaChanged: (repoId: string) => void
  notifyFolderWorkspaceChanged: () => void
}

/** Persist one submitted prompt on the owning workspace; the host that ingests hooks owns the count. */
export function recordPromptOnWorkspace(
  event: AgentPromptSubmittedEvent,
  deps: WorkspacePromptCounterDeps
): void {
  const { store } = deps
  // Why tab first: the agent-echoed worktreeId can be stale after a folder rename or missing on some events.
  const workspaceKey =
    (event.tabId ? store.getWorktreeIdForTab(event.tabId) : undefined) ??
    event.worktreeId ??
    deps.resolveWorktreeIdForPaneKey(event.paneKey) ??
    undefined
  if (!workspaceKey) {
    return
  }
  const scope = parseWorkspaceKey(workspaceKey)
  if (scope?.type === 'folder') {
    const folderWorkspace = store.getFolderWorkspace(scope.folderWorkspaceId)
    if (!folderWorkspace) {
      return
    }
    store.updateFolderWorkspace(
      scope.folderWorkspaceId,
      recordWorkspacePrompt(folderWorkspace, event.submittedAt)
    )
    deps.notifyFolderWorkspaceChanged()
    return
  }
  const worktreeId = scope?.type === 'worktree' ? scope.worktreeId : workspaceKey
  const repoId = getRepoIdFromWorktreeId(worktreeId)
  const repo = store.getRepo(repoId)
  if (!repo) {
    return
  }
  // Why host-qualified: SSH worktree meta is partitioned per execution host in this store.
  const hostId = getRepoExecutionHostId(repo)
  const current = readWorktreeMetaForHost(store, worktreeId, hostId)
  writeWorktreeMetaForHost(
    store,
    worktreeId,
    hostId,
    recordWorkspacePrompt(current, event.submittedAt)
  )
  deps.notifyWorktreeMetaChanged(repoId)
}
