import { useMemo } from 'react'
import {
  getHoverOverlayRowsByHeaderKey,
  getOpenOnHoverGroups
} from '../grouping/hover-section-rows'
import type { Row } from '../grouping/row-types'

const NO_GROUPS: ReadonlySet<string> = new Set()
const NO_HOVER_OVERLAYS: ReadonlyMap<string, Row[]> = new Map()

function withKeys(base: Set<string>, keys: ReadonlySet<string>): Set<string> {
  return keys.size === 0 ? base : new Set([...base, ...keys])
}

function withoutKeys(base: Set<string>, keys: ReadonlySet<string>): Set<string> {
  const next = new Set(base)
  for (const key of keys) {
    next.delete(key)
  }
  return next
}

/**
 * Open-on-hover sections rest collapsed in the list; hover-opened ones render their contents
 * as an overlay. Discovery uses the regular build, so nested sections are found too.
 */
export function useHoverSectionRows(args: {
  buildRowsWithCollapsed: (collapsedGroups: Set<string>) => Row[]
  effectiveCollapsedGroups: Set<string>
  openOnHoverByDefault: boolean
  openOnHoverDisabledGroups: ReadonlySet<string>
  forcedOpenGroups: ReadonlySet<string>
  hoverOpenedGroups: ReadonlySet<string>
}) {
  const {
    buildRowsWithCollapsed,
    effectiveCollapsedGroups,
    openOnHoverByDefault,
    openOnHoverDisabledGroups,
    forcedOpenGroups,
    hoverOpenedGroups
  } = args
  const discoveryRows = useMemo(
    () => buildRowsWithCollapsed(effectiveCollapsedGroups),
    [buildRowsWithCollapsed, effectiveCollapsedGroups]
  )
  const openOnHoverGroups = useMemo(
    () =>
      openOnHoverByDefault
        ? getOpenOnHoverGroups(discoveryRows, openOnHoverDisabledGroups, forcedOpenGroups)
        : NO_GROUPS,
    [discoveryRows, forcedOpenGroups, openOnHoverByDefault, openOnHoverDisabledGroups]
  )
  const listCollapsedGroups = useMemo(
    () => withKeys(effectiveCollapsedGroups, openOnHoverGroups),
    [effectiveCollapsedGroups, openOnHoverGroups]
  )
  const rows = useMemo(
    () =>
      listCollapsedGroups === effectiveCollapsedGroups
        ? discoveryRows
        : buildRowsWithCollapsed(listCollapsedGroups),
    [buildRowsWithCollapsed, discoveryRows, effectiveCollapsedGroups, listCollapsedGroups]
  )
  const hoverOverlayRowsByHeaderKey = useMemo(() => {
    if (hoverOpenedGroups.size === 0 || openOnHoverGroups.size === 0) {
      return NO_HOVER_OVERLAYS
    }
    return getHoverOverlayRowsByHeaderKey(
      rows,
      buildRowsWithCollapsed(withoutKeys(listCollapsedGroups, hoverOpenedGroups))
    )
  }, [buildRowsWithCollapsed, hoverOpenedGroups, listCollapsedGroups, openOnHoverGroups, rows])
  return { rows, listCollapsedGroups, openOnHoverGroups, hoverOverlayRowsByHeaderKey }
}
