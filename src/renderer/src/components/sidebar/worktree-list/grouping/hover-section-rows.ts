import { ALL_GROUP_KEY } from './group-keys'
import type { Row } from './row-types'

/** Section headers that open on hover: every non-empty section unless opted out or force-opened. */
export function getOpenOnHoverGroups(
  rows: readonly Row[],
  disabledGroups: ReadonlySet<string>,
  forcedOpenGroups: ReadonlySet<string>
): ReadonlySet<string> {
  const keys = new Set<string>()
  for (const row of rows) {
    if (
      row.type === 'header' &&
      row.count > 0 &&
      // Why: the ungrouped "All" header is the whole list, not a section.
      row.key !== ALL_GROUP_KEY &&
      !disabledGroups.has(row.key) &&
      !forcedOpenGroups.has(row.key)
    ) {
      keys.add(row.key)
    }
  }
  return keys
}

function getRowIdentity(row: Row): string {
  return row.type === 'item' ? row.rowKey : row.key
}

/**
 * Rows an open-on-hover section shows in its overlay, keyed by the header that stays in the list.
 * `expandedRows` is the same build with the hover-opened sections expanded, so the rows it adds
 * after a header are exactly that section's contents, including nested open sections.
 */
export function getHoverOverlayRowsByHeaderKey(
  listRows: readonly Row[],
  expandedRows: readonly Row[]
): ReadonlyMap<string, Row[]> {
  const overlays = new Map<string, Row[]>()
  let listCursor = 0
  let lastListHeaderKey: string | null = null
  for (const row of expandedRows) {
    const listRow = listRows[listCursor]
    if (listRow && getRowIdentity(listRow) === getRowIdentity(row)) {
      listCursor++
      lastListHeaderKey = row.type === 'header' ? row.key : null
      continue
    }
    if (lastListHeaderKey === null) {
      continue
    }
    const overlay = overlays.get(lastListHeaderKey)
    if (overlay) {
      overlay.push(row)
    } else {
      overlays.set(lastListHeaderKey, [row])
    }
  }
  return overlays
}
