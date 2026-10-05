import { describe, expect, it } from 'vitest'
import { buildRows } from './build-rows'
import type { NestedSidebarGroupBy } from '../../../../../../shared/sidebar-group-by-levels'
import { getNestedGroupKey } from '../../../../../../shared/sidebar-group-by-levels'
import { repo, repoMap, worktree } from '../../worktree-list-groups-test-fixtures'
import type { FolderWorkspace } from '../../../../../../shared/folder-workspace-types'
import type { ProjectGroup } from '../../../../../../shared/project-group-types'
import type { Repo } from '../../../../../../shared/repo-types'
import type { Worktree } from '../../../../../../shared/worktree/types'
import type { Row, WorktreeGroupBy } from './row-types'

const urgentReview: Worktree = {
  ...worktree,
  id: 'wt-urgent-review',
  priority: 'urgent',
  workspaceStatus: 'in-review'
}
const urgentProgress: Worktree = {
  ...worktree,
  id: 'wt-urgent-progress',
  priority: 'urgent',
  workspaceStatus: 'in-progress'
}
const lowReview: Worktree = {
  ...worktree,
  id: 'wt-low-review',
  priority: 'low',
  workspaceStatus: 'in-review'
}
const all = [urgentReview, urgentProgress, lowReview]

const URGENT = 'priority:urgent'
const LOW = 'priority:low'
const REVIEW = 'workspace-status:in-review'
const PROGRESS = 'workspace-status:in-progress'
const PR_IN_PROGRESS = 'pr:in-progress'

function rowsFor(
  groupBy: WorktreeGroupBy,
  nestedGroupBy: readonly NestedSidebarGroupBy[],
  worktrees: Worktree[] = all,
  collapsedGroups = new Set<string>(),
  options: {
    repoMap?: Map<string, Repo>
    folderWorkspaces?: FolderWorkspace[]
    projectGroups?: ProjectGroup[]
  } = {}
): Row[] {
  return buildRows(
    groupBy,
    worktrees,
    options.repoMap ?? repoMap,
    null,
    collapsedGroups,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    false,
    undefined,
    options.projectGroups ?? [],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    options.folderWorkspaces ?? [],
    undefined,
    undefined,
    undefined,
    undefined,
    nestedGroupBy
  )
}

function headerSummary(rows: Row[]) {
  return rows.flatMap((row) =>
    row.type === 'header' ? [[row.key, row.label, row.count, row.nestDepth ?? 0]] : []
  )
}

function itemSummary(rows: Row[]) {
  return rows.flatMap((row) =>
    row.type === 'item' ? [[row.worktree.id, row.sectionKey, row.groupDepth]] : []
  )
}

describe('nested group by', () => {
  it('nests a second level under each first-level lane', () => {
    const rows = rowsFor('priority', ['workspace-status'])

    expect(headerSummary(rows)).toEqual([
      [URGENT, 'Urgent', 2, 0],
      [getNestedGroupKey(URGENT, PROGRESS), 'In progress', 1, 1],
      [getNestedGroupKey(URGENT, REVIEW), 'In review', 1, 1],
      [LOW, 'Low', 1, 0],
      [getNestedGroupKey(LOW, REVIEW), 'In review', 1, 1]
    ])
    expect(itemSummary(rows)).toEqual([
      [urgentProgress.id, getNestedGroupKey(URGENT, PROGRESS), 1],
      [urgentReview.id, getNestedGroupKey(URGENT, REVIEW), 1],
      [lowReview.id, getNestedGroupKey(LOW, REVIEW), 1]
    ])
  })

  it('nests three levels with a collapse key per path', () => {
    const rows = rowsFor('priority', ['workspace-status', 'pr-status'], [urgentReview, lowReview])
    const urgentReviewKey = getNestedGroupKey(URGENT, REVIEW)
    const lowReviewKey = getNestedGroupKey(LOW, REVIEW)

    expect(headerSummary(rows)).toEqual([
      [URGENT, 'Urgent', 1, 0],
      [urgentReviewKey, 'In review', 1, 1],
      [getNestedGroupKey(urgentReviewKey, PR_IN_PROGRESS), 'In progress', 1, 2],
      [LOW, 'Low', 1, 0],
      [lowReviewKey, 'In review', 1, 1],
      [getNestedGroupKey(lowReviewKey, PR_IN_PROGRESS), 'In progress', 1, 2]
    ])
    expect(itemSummary(rows)).toEqual([
      [urgentReview.id, getNestedGroupKey(urgentReviewKey, PR_IN_PROGRESS), 2],
      [lowReview.id, getNestedGroupKey(lowReviewKey, PR_IN_PROGRESS), 2]
    ])
  })

  it('indents every nested header of a three-level Group by to the depth of its rows', () => {
    const rows = rowsFor('priority', ['workspace-status', 'pr-status'], [urgentReview, lowReview])
    // Mirrors SectionHeader: nested headers pad by projectGroupDepth + nestDepth.
    const headerDepth = new Map(
      rows.flatMap((row) =>
        row.type === 'header' && row.nestDepth
          ? [[row.key, (row.projectGroupDepth ?? 0) + row.nestDepth] as const]
          : []
      )
    )

    expect([...headerDepth.values()]).toEqual([1, 2, 1, 2])
    for (const [, sectionKey, groupDepth] of itemSummary(rows)) {
      expect(headerDepth.get(sectionKey as string)).toBe(groupDepth)
    }
  })

  it('hides every descendant of a collapsed parent and nothing else', () => {
    const rows = rowsFor('priority', ['workspace-status'], all, new Set([URGENT]))

    expect(headerSummary(rows).map(([key]) => key)).toEqual([
      URGENT,
      LOW,
      getNestedGroupKey(LOW, REVIEW)
    ])
    expect(itemSummary(rows).map(([id]) => id)).toEqual([lowReview.id])
  })

  it('hides the third level under a collapsed second-level lane only', () => {
    const urgentReviewKey = getNestedGroupKey(URGENT, REVIEW)
    const rows = rowsFor(
      'priority',
      ['workspace-status', 'pr-status'],
      [urgentReview, lowReview],
      new Set([urgentReviewKey])
    )
    const lowReviewKey = getNestedGroupKey(LOW, REVIEW)

    expect(headerSummary(rows).map(([key]) => key)).toEqual([
      URGENT,
      urgentReviewKey,
      LOW,
      lowReviewKey,
      getNestedGroupKey(lowReviewKey, PR_IN_PROGRESS)
    ])
    expect(itemSummary(rows).map(([id]) => id)).toEqual([lowReview.id])
  })

  it('collapses one nested lane without touching the same lane under another parent', () => {
    const rows = rowsFor(
      'priority',
      ['workspace-status'],
      all,
      new Set([getNestedGroupKey(URGENT, REVIEW)])
    )

    expect(headerSummary(rows)).toHaveLength(5)
    expect(itemSummary(rows).map(([id]) => id)).toEqual([urgentProgress.id, lowReview.id])
  })

  it('never repeats an option across levels', () => {
    const repeated = rowsFor('priority', ['priority', 'workspace-status', 'workspace-status'])
    expect(headerSummary(repeated)).toEqual(
      headerSummary(rowsFor('priority', ['workspace-status']))
    )
  })

  it('ignores nested levels when the first level is none', () => {
    const rows = rowsFor('none', ['priority'])
    expect(headerSummary(rows)).toEqual([['all', 'All', 3, 0]])
  })

  it('nests under project headers', () => {
    const rows = rowsFor('repo', ['priority'])
    const repoKey = `repo:${repo.id}`

    expect(headerSummary(rows)).toEqual([
      [repoKey, 'orca', 3, 0],
      [getNestedGroupKey(repoKey, URGENT), 'Urgent', 2, 1],
      [getNestedGroupKey(repoKey, LOW), 'Low', 1, 1]
    ])
    expect(rows.find((row) => row.type === 'header' && row.nestDepth === 1)).not.toHaveProperty(
      'repo'
    )
  })

  it('nests projects as a lower level', () => {
    const otherRepo: Repo = { ...repo, id: 'repo-2', displayName: 'other' }
    const otherUrgent: Worktree = {
      ...urgentReview,
      id: 'wt-other',
      repoId: otherRepo.id
    }
    const rows = rowsFor('priority', ['repo'], [urgentReview, otherUrgent], new Set(), {
      repoMap: new Map([
        [repo.id, repo],
        [otherRepo.id, otherRepo]
      ])
    })

    expect(headerSummary(rows).map(([key, label, count]) => [key, label, count])).toEqual([
      [URGENT, 'Urgent', 2],
      [getNestedGroupKey(URGENT, `repo:${repo.id}`), 'orca', 1],
      [getNestedGroupKey(URGENT, `repo:${otherRepo.id}`), 'other', 1]
    ])
  })

  it('buckets folder workspaces into nested lanes', () => {
    const group: ProjectGroup = {
      id: 'group-1',
      name: 'Group',
      parentPath: '/tmp/parent',
      parentGroupId: null,
      createdFrom: 'folder-scan',
      tabOrder: 0,
      isCollapsed: false,
      color: null,
      createdAt: 1,
      updatedAt: 1
    }
    const folderWorkspace: FolderWorkspace = {
      id: 'fw-1',
      projectGroupId: group.id,
      name: 'Folder workspace',
      folderPath: '/tmp/parent',
      linkedTask: null,
      comment: '',
      isArchived: false,
      isUnread: false,
      isPinned: false,
      sortOrder: 1,
      lastActivityAt: 1,
      createdAt: 1,
      updatedAt: 1,
      priority: 'low',
      workspaceStatus: 'in-progress'
    }
    const rows = rowsFor('priority', ['workspace-status'], [lowReview], new Set(), {
      folderWorkspaces: [folderWorkspace],
      projectGroups: [group]
    })

    expect(headerSummary(rows)).toEqual([
      [LOW, 'Low', 2, 0],
      [getNestedGroupKey(LOW, PROGRESS), 'In progress', 1, 1],
      [getNestedGroupKey(LOW, REVIEW), 'In review', 1, 1]
    ])
    expect(rows[2]).toMatchObject({ type: 'folder-workspace', groupDepth: 1 })
  })
})
