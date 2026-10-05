import type { Worktree } from '../../../../../../shared/worktree/types'
import {
  getNestedGroupKey,
  type NestedSidebarGroupBy
} from '../../../../../../shared/sidebar-group-by-levels'
import type { RenderableFolderWorkspace } from './folder-workspace-lanes'
import type { SectionAppendContext } from './group-sections'
import { buildLaneHeaderRow } from './lane-header-row'
import { appendWorktreeRows, buildFolderWorkspaceRow } from './row-builders'
import type { PendingCreationRef } from './row-types'
import { buildOrderedGroups } from './worktree-grouping'

const NO_REPO_IDS: ReadonlySet<string> = new Set()
const NO_NOTICES: ReadonlyMap<string, never> = new Map<string, never>()
const NO_PENDING: ReadonlyMap<string, PendingCreationRef[]> = new Map()

/**
 * Splits one section's members into lanes of `levels[0]`, recursing for the
 * levels below. Lane keys are paths, so each nested header collapses on its own.
 */
export function appendNestedLanes(
  ctx: SectionAppendContext,
  args: {
    parentKey: string
    items: readonly Worktree[]
    folderPairs: readonly RenderableFolderWorkspace[]
    levels: readonly NestedSidebarGroupBy[]
    parentGroupDepth: number
    nestDepth?: number
  }
): void {
  const [groupBy, ...deeperLevels] = args.levels
  if (!groupBy) {
    return
  }
  const { result, collapsedGroups } = ctx
  const nestDepth = (args.nestDepth ?? 0) + 1
  const groupDepth = args.parentGroupDepth + 1
  const lanes = buildOrderedGroups({
    groupBy,
    naturalWorktrees: args.items,
    repoMap: ctx.repoMap,
    prCache: ctx.prCache,
    settings: ctx.settings,
    workspaceStatuses: ctx.workspaceStatuses,
    projectIndex: ctx.projectIndex,
    // Why empty: placeholder, notice and pending rows belong to the top-level project section.
    placeholderRepoIds: NO_REPO_IDS,
    importedWorktreesByRepo: NO_NOTICES,
    newExternalWorktreesInboxByRepo: NO_NOTICES,
    pendingByRepo: NO_PENDING,
    repoOrder: ctx.repoOrder,
    projectOrderBy: ctx.projectOrderBy,
    folderWorkspaces: [...args.folderPairs],
    // Why: an empty lane per parent multiplies header noise; empty lanes stay top-level only.
    showEmptyWorkspaceStatuses: false
  })
  for (const [laneKey, lane] of lanes) {
    const key = getNestedGroupKey(args.parentKey, laneKey)
    const lanePairs = lane.folderWorkspaces ?? []
    result.push({
      ...buildLaneHeaderRow({
        groupBy,
        laneKey,
        group: lane,
        workspaceStatuses: ctx.workspaceStatuses,
        repoMap: ctx.repoMap,
        defaultHostId: ctx.defaultHostId
      }),
      key,
      laneKey,
      laneGroupBy: groupBy,
      nestDepth,
      projectGroupDepth: args.parentGroupDepth
    })
    if (collapsedGroups.has(key)) {
      continue
    }
    if (deeperLevels.length > 0) {
      appendNestedLanes(ctx, {
        parentKey: key,
        items: lane.items,
        folderPairs: lanePairs,
        levels: deeperLevels,
        parentGroupDepth: groupDepth,
        nestDepth
      })
      continue
    }
    appendWorktreeRows(result, lane.items, ctx.repoMap, ctx.lineageById, ctx.worktreeMap, {
      nestLineage: ctx.nestLineage,
      collapsedGroups,
      groupDepth,
      sectionKey: key,
      hostContextLabelByWorktreeIdentity: ctx.mixedWorktreeHostContextLabels,
      cyclicLineageIds: ctx.cyclicLineageIds
    })
    for (const pair of lanePairs) {
      result.push(buildFolderWorkspaceRow(pair, groupDepth))
    }
  }
  // Why: project lanes never hold folder workspaces, so they stay in the parent section.
  if (groupBy === 'repo') {
    for (const pair of args.folderPairs) {
      result.push(buildFolderWorkspaceRow(pair, args.parentGroupDepth))
    }
  }
}
