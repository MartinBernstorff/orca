import { describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../shared/repo-types'
import type { FolderWorkspace } from '../../shared/folder-workspace-types'
import type { WorktreeMeta } from '../../shared/worktree/meta-types'
import { folderWorkspaceKey } from '../../shared/workspace-scope'
import {
  recordPromptOnWorkspace,
  type WorkspacePromptCounterStore
} from './workspace-prompt-counter'

function makeDeps(repo: Partial<Repo>, folderWorkspace?: Partial<FolderWorkspace>) {
  const metaByHost = new Map<string, Partial<WorktreeMeta>>()
  let folder = folderWorkspace as FolderWorkspace | undefined
  const store: WorkspacePromptCounterStore = {
    getRepo: (id) => (id === 'repo-1' ? ({ id, ...repo } as Repo) : undefined),
    getWorktreeIdForTab: () => undefined,
    getWorktreeMetaForHost: (id, host) => metaByHost.get(`${host}|${id}`) as WorktreeMeta,
    setWorktreeMetaForHost: (id, host, meta) => {
      const next = { ...metaByHost.get(`${host}|${id}`), ...meta }
      metaByHost.set(`${host}|${id}`, next)
      return next as WorktreeMeta
    },
    setWorktreeMeta: () => {
      throw new Error('unqualified write')
    },
    getFolderWorkspace: () => folder,
    updateFolderWorkspace: (_id, updates) => {
      folder = { ...folder!, ...updates }
      return folder
    }
  }
  const deps = {
    store,
    resolveWorktreeIdForPaneKey: () => undefined,
    notifyWorktreeMetaChanged: vi.fn(),
    notifyFolderWorkspaceChanged: vi.fn()
  }
  return { deps, metaByHost, getFolder: () => folder }
}

const event = (worktreeId: string, submittedAt: number) => ({
  paneKey: 'pane-1',
  tabId: undefined,
  worktreeId,
  submittedAt
})

describe('recordPromptOnWorkspace', () => {
  it('increments the SSH host partition and notifies the repo', () => {
    const { deps, metaByHost } = makeDeps({ connectionId: 'conn-1' })
    recordPromptOnWorkspace(event('repo-1::/w', 10), deps)
    recordPromptOnWorkspace(event('repo-1::/w', 20), deps)
    expect(metaByHost.get('ssh:conn-1|repo-1::/w')).toMatchObject({
      promptCount: 2,
      lastPromptAt: 20
    })
    expect(deps.notifyWorktreeMetaChanged).toHaveBeenCalledWith('repo-1')
  })

  it('increments a folder workspace', () => {
    const { deps, getFolder } = makeDeps({}, { id: 'f1', promptCount: 4, lastPromptAt: 5 })
    recordPromptOnWorkspace(event(folderWorkspaceKey('f1'), 9), deps)
    expect(getFolder()).toMatchObject({ promptCount: 5, lastPromptAt: 9 })
    expect(deps.notifyFolderWorkspaceChanged).toHaveBeenCalled()
  })

  it('ignores prompts it cannot attribute to a known workspace', () => {
    const { deps, metaByHost } = makeDeps({})
    recordPromptOnWorkspace(event('unknown-repo::/w', 1), deps)
    recordPromptOnWorkspace({ ...event('', 1), worktreeId: undefined }, deps)
    expect(metaByHost.size).toBe(0)
    expect(deps.notifyWorktreeMetaChanged).not.toHaveBeenCalled()
  })
})
