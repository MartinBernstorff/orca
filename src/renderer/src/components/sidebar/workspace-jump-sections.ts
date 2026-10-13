import type { Worktree } from '../../../../shared/worktree/types'
import { folderWorkspaceToWorktree } from '../../../../shared/folder-workspace-worktree'
import type { AppState } from '@/store/types'
import { buildRenderedSidebarRows } from './rendered-sidebar-worktree-order'
import { getPreferredWorktreeRows } from './worktree-sidebar-row-preference'
import type { WorktreeRow } from './worktree-list/grouping/row-types'

export type WorkspaceJumpSection = {
  key: string
  /** Header path from the outermost group down, e.g. ['orca', 'Working']; empty when ungrouped. */
  headingPath: string[]
  worktrees: Worktree[]
}

const NO_COLLAPSED_GROUPS: ReadonlySet<string> = new Set<string>()

/** Sidebar workspaces grouped under their headers, in sidebar order, with collapsed groups expanded. */
export function computeWorkspaceJumpSections(
  state: AppState,
  visibleWorktrees: readonly Worktree[]
): WorkspaceJumpSection[] {
  const { sectionRows, pinnedDisplayPolicy } = buildRenderedSidebarRows(
    state,
    visibleWorktrees,
    NO_COLLAPSED_GROUPS as AppState['collapsedGroups']
  )
  const itemRows = sectionRows.filter((row): row is WorktreeRow => row.type === 'item')
  const preferredRowKeys = new Set(
    getPreferredWorktreeRows(itemRows, pinnedDisplayPolicy).map((row) => row.rowKey)
  )

  const sections: WorkspaceJumpSection[] = []
  let hostLabel: string | null = null
  let headerPath: string[] = []
  let current: WorkspaceJumpSection | null = null
  const startSection = (key: string): WorkspaceJumpSection => {
    const section: WorkspaceJumpSection = {
      key,
      headingPath: hostLabel ? [hostLabel, ...headerPath] : [...headerPath],
      worktrees: []
    }
    sections.push(section)
    current = section
    return section
  }
  const push = (worktree: Worktree): void => {
    ;(current ?? startSection('root')).worktrees.push(worktree)
  }

  for (const row of sectionRows) {
    if (row.type === 'host-header') {
      hostLabel = row.label
      headerPath = []
      startSection(row.key)
    } else if (row.type === 'header') {
      const depth = (row.projectGroupDepth ?? 0) + (row.nestDepth ?? 0)
      headerPath = [...headerPath.slice(0, depth), row.label]
      startSection(row.key)
    } else if (row.type === 'item' && preferredRowKeys.has(row.rowKey)) {
      push(row.worktree)
    } else if (row.type === 'folder-workspace') {
      push(folderWorkspaceToWorktree(row.folderWorkspace))
    }
  }
  return sections.filter((section) => section.worktrees.length > 0)
}
