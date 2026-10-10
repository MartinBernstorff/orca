import type { PersistedUIState } from './persisted-ui-state-types'

export type SidebarGroupBy = PersistedUIState['groupBy']
/** A Group by level below the first. "none" ends the chain, so it is never a level. */
export type NestedSidebarGroupBy = Exclude<SidebarGroupBy, 'none'>

export const MAX_GROUP_BY_LEVELS = 3

// Why a Record: a new Group by option fails to compile here until it is nestable.
const NESTED_GROUP_BY_VALUES: Record<NestedSidebarGroupBy, true> = {
  'workspace-status': true,
  repo: true,
  'pr-status': true,
  priority: true,
  engagement: true,
  'agent-state': true
}

// Why a control char: lane keys embed user-defined status ids and repo ids.
const GROUP_PATH_SEPARATOR = '\u001f'

export function isSidebarGroupBy(value: unknown): value is SidebarGroupBy {
  return value === 'none' || isNestedSidebarGroupBy(value)
}

export function isNestedSidebarGroupBy(value: unknown): value is NestedSidebarGroupBy {
  return typeof value === 'string' && Object.hasOwn(NESTED_GROUP_BY_VALUES, value)
}

/** Levels below `groupBy`: valid, distinct from every level above, capped. */
export function normalizeNestedGroupBy(
  groupBy: SidebarGroupBy,
  nestedGroupBy: unknown
): NestedSidebarGroupBy[] {
  if (groupBy === 'none' || !Array.isArray(nestedGroupBy)) {
    return []
  }
  const used = new Set<string>([groupBy])
  const levels: NestedSidebarGroupBy[] = []
  for (const value of nestedGroupBy) {
    if (levels.length >= MAX_GROUP_BY_LEVELS - 1) {
      break
    }
    if (isNestedSidebarGroupBy(value) && !used.has(value)) {
      used.add(value)
      levels.push(value)
    }
  }
  return levels
}

/** Collapse key of a lane nested under `parentKey`. */
export function getNestedGroupKey(parentKey: string, laneKey: string): string {
  return `${parentKey}${GROUP_PATH_SEPARATOR}${laneKey}`
}

/** Path keys of the nested lanes holding one member, outermost first; stops where a level has no lane for it. */
export function getNestedGroupPathKeys(
  topLevelKey: string,
  levels: readonly NestedSidebarGroupBy[],
  getLaneKey: (level: NestedSidebarGroupBy) => string | null
): string[] {
  const keys: string[] = []
  let path = topLevelKey
  for (const level of levels) {
    const laneKey = getLaneKey(level)
    if (laneKey === null) {
      break
    }
    path = getNestedGroupKey(path, laneKey)
    keys.push(path)
  }
  return keys
}

/** The lane keys a group path key is built from, outermost first. */
export function getGroupKeyPathSegments(key: string): string[] {
  return key.split(GROUP_PATH_SEPARATOR)
}

/** 0 for a top-level group key, 1 for a key nested once, and so on. */
export function getGroupKeyLevel(key: string): number {
  return key.split(GROUP_PATH_SEPARATOR).length - 1
}

/** Index of the first nested level that differs, or null when none does. */
export function getFirstChangedNestedLevel(
  previous: readonly NestedSidebarGroupBy[],
  next: readonly NestedSidebarGroupBy[]
): number | null {
  const length = Math.max(previous.length, next.length)
  for (let index = 0; index < length; index++) {
    if (previous[index] !== next[index]) {
      return index
    }
  }
  return null
}

/**
 * Collapse keys that survive changing nested level `changedNestedLevel` (0 =
 * the second Group by level). Shallower paths keep their identity, so only
 * paths at or below the changed level are dropped.
 */
export function getCollapsedGroupsAboveNestedLevel(
  collapsedGroups: Iterable<string>,
  changedNestedLevel: number
): string[] {
  return [...collapsedGroups].filter((key) => getGroupKeyLevel(key) <= changedNestedLevel)
}
