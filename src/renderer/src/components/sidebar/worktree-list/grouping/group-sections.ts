import type { Repo } from '../../../../../../shared/repo-types'
import type { WorktreeLineage } from '../../../../../../shared/worktree/lineage-types'
import type { WorkspaceStatusDefinition, Worktree } from '../../../../../../shared/worktree/types'
import type { ExecutionHostId } from '../../../../../../shared/execution-host'
import type { ProjectOrderBy } from '../../../../../../shared/ui-chrome-types'
import type { NestedSidebarGroupBy } from '../../../../../../shared/sidebar-group-by-levels'
import type { AppState } from '../../../../store/types'
import { PROJECT_GROUP_META } from './group-keys'
import type { NoticeHostContext } from './host-labels'
import { getMixedHostContextLabels } from './host-labels'
import { buildLaneHeaderRow } from './lane-header-row'
import { appendNestedLanes } from './nested-group-sections'
import type { OrderedGroupEntry, ProjectGroupingIndex } from './project-grouping'
import {
  appendWorktreeRows,
  buildFolderWorkspaceRow,
  buildImportedWorktreesCardRow,
  buildNewExternalWorktreesInboxRow,
  buildPendingCreationRow
} from './row-builders'
import type {
  ImportedWorktreesCardCandidate,
  NewExternalWorktreesInboxCandidate,
  GroupHeaderRow,
  PendingCreationRef,
  Row,
  WorktreeGroupBy
} from './row-types'
import { orderMainWorktreeFirst } from './section-order'
import type { WorkspaceAgentStates } from '../../workspace-agent-state-meta'

/** Everything section emission reads that stays fixed for one buildRows call. */
export type SectionAppendContext = {
  result: Row[]
  groupBy: WorktreeGroupBy
  collapsedGroups: Set<string>
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
  repoMap: Map<string, Repo>
  defaultHostId: ExecutionHostId
  hostLabelById: ReadonlyMap<string, string> | undefined
  projectIndex: ProjectGroupingIndex | null
  importedWorktreesByRepo: ReadonlyMap<string, ImportedWorktreesCardCandidate>
  newExternalWorktreesInboxByRepo: ReadonlyMap<string, NewExternalWorktreesInboxCandidate>
  pendingByRepo: ReadonlyMap<string, PendingCreationRef[]>
  mixedWorktreeHostContextLabels: Map<string, string> | undefined
  noticeHostContextLabelByRepoId: Map<string, NoticeHostContext> | undefined
  lineageById: Record<string, WorktreeLineage>
  worktreeMap: Map<string, Worktree>
  nestLineage: boolean
  cyclicLineageIds: ReadonlySet<string>
  /** Group by levels below `groupBy`, already normalized. */
  nestedGroupBy: readonly NestedSidebarGroupBy[]
  prCache: Record<string, unknown> | null
  settings: AppState['settings'] | undefined
  repoOrder: Map<string, number> | undefined
  projectOrderBy: ProjectOrderBy
  agentStates: WorkspaceAgentStates | undefined
}

export function appendOrderedGroups(
  ctx: SectionAppendContext,
  groupsToAppend: OrderedGroupEntry[],
  projectGroupDepth = 0
): void {
  const {
    result,
    groupBy,
    collapsedGroups,
    workspaceStatuses,
    repoMap,
    defaultHostId,
    hostLabelById,
    projectIndex,
    importedWorktreesByRepo,
    newExternalWorktreesInboxByRepo,
    pendingByRepo,
    mixedWorktreeHostContextLabels,
    lineageById,
    worktreeMap,
    nestLineage,
    cyclicLineageIds
  } = ctx
  for (const [key, group] of groupsToAppend) {
    const isCollapsed = collapsedGroups.has(key)
    const repo = group.repo
    const folderPairs = group.folderWorkspaces ?? []
    const header: GroupHeaderRow =
      groupBy === 'repo'
        ? {
            type: 'header',
            key,
            label: group.label,
            count: group.items.length,
            tone: PROJECT_GROUP_META.tone,
            icon: PROJECT_GROUP_META.icon,
            repo,
            projectGroupDepth
          }
        : buildLaneHeaderRow({
            groupBy,
            laneKey: key,
            group,
            workspaceStatuses,
            repoMap,
            defaultHostId
          })

    result.push(header)
    if (!isCollapsed) {
      if (groupBy === 'repo') {
        const repoIds =
          group.repoIds.size > 0
            ? [...group.repoIds]
            : repo
              ? [repo.id]
              : key.startsWith('repo:')
                ? [key.slice('repo:'.length)]
                : []
        for (const repoId of repoIds) {
          const candidate = importedWorktreesByRepo.get(repoId)
          if (candidate) {
            result.push(
              buildImportedWorktreesCardRow(
                candidate,
                'repo-group',
                ctx.noticeHostContextLabelByRepoId?.get(repoId)
              )
            )
          }
        }
        for (const repoId of repoIds) {
          const candidate = newExternalWorktreesInboxByRepo.get(repoId)
          if (candidate) {
            result.push(
              buildNewExternalWorktreesInboxRow(
                candidate,
                ctx.noticeHostContextLabelByRepoId?.get(repoId)
              )
            )
          }
        }
        // Why: surface in-progress creates at the top of their own repo so the
        // new workspace appears where it will land, not flashed to the very top
        // of the sidebar.
        for (const repoId of repoIds) {
          for (const creation of pendingByRepo.get(repoId) ?? []) {
            result.push(buildPendingCreationRow(creation, repoMap))
          }
        }
      }
      const items = groupBy === 'repo' ? orderMainWorktreeFirst(group.items) : group.items
      if (ctx.nestedGroupBy.length > 0) {
        appendNestedLanes(ctx, {
          parentKey: key,
          items,
          folderPairs,
          levels: ctx.nestedGroupBy,
          parentGroupDepth: projectGroupDepth
        })
        continue
      }
      const hostContextLabelByRepoId =
        groupBy === 'repo'
          ? getMixedHostContextLabels(group, repoMap, projectIndex, hostLabelById)
          : undefined
      // Why (STA-4343): repo grouping normally labels by repo, but one repo id can
      // be registered on two hosts — then every row in the group shares a repo id
      // and the per-repo label cannot tell them apart. Fall back to the per-row
      // host labels, which are keyed by host-qualified identity.
      const hostContextLabelByWorktreeIdentity =
        groupBy === 'repo' && hostContextLabelByRepoId ? undefined : mixedWorktreeHostContextLabels
      appendWorktreeRows(result, items, repoMap, lineageById, worktreeMap, {
        nestLineage,
        collapsedGroups,
        groupDepth: projectGroupDepth,
        sectionKey: key,
        hostContextLabelByRepoId,
        hostContextLabelByWorktreeIdentity,
        cyclicLineageIds
      })
      for (const pair of folderPairs) {
        result.push(buildFolderWorkspaceRow(pair, projectGroupDepth))
      }
    }
  }
}
