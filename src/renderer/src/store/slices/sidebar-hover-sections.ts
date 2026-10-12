import type { StateCreator } from 'zustand'
import type { AppState } from '../types'
import { isGroupKeyWithin } from '../../../../shared/sidebar-group-by-levels'

/** Pointer-driven open state of open-on-hover sidebar sections; never persisted. */
export type SidebarHoverSectionsSlice = {
  /** Sections open on hover unless opted out; mock stores without it keep every section expanded. */
  openOnHoverByDefault: boolean
  hoverOpenedGroups: ReadonlySet<string>
  /** Subset of hoverOpenedGroups the user clicked to keep open after the pointer leaves. */
  hoverPinnedGroups: ReadonlySet<string>
  openHoverGroup: (key: string) => void
  closeHoverGroup: (key: string) => void
  toggleHoverGroupPin: (key: string) => void
  /** Closes the section even when pinned, e.g. when its open-on-hover setting is turned off. */
  resetHoverGroup: (key: string) => void
}

const NO_GROUPS: ReadonlySet<string> = new Set()

function closeKeysWithin(
  s: Pick<SidebarHoverSectionsSlice, 'hoverOpenedGroups' | 'hoverPinnedGroups'>,
  key: string
): Pick<SidebarHoverSectionsSlice, 'hoverOpenedGroups' | 'hoverPinnedGroups'> {
  return {
    hoverOpenedGroups: withoutKeysWithin(s.hoverOpenedGroups, key),
    hoverPinnedGroups: withoutKeysWithin(s.hoverPinnedGroups, key)
  }
}

function withoutKeysWithin(keys: ReadonlySet<string>, ancestorKey: string): ReadonlySet<string> {
  const next = new Set([...keys].filter((key) => !isGroupKeyWithin(key, ancestorKey)))
  return next.size === keys.size ? keys : next
}

export const createSidebarHoverSectionsSlice: StateCreator<
  AppState,
  [],
  [],
  SidebarHoverSectionsSlice
> = (set) => ({
  openOnHoverByDefault: true,
  hoverOpenedGroups: NO_GROUPS,
  hoverPinnedGroups: NO_GROUPS,
  openHoverGroup: (key) =>
    set((s) =>
      s.hoverOpenedGroups.has(key)
        ? s
        : { hoverOpenedGroups: new Set([...s.hoverOpenedGroups, key]) }
    ),
  // Why within: leaving a section also closes every open section nested inside it.
  closeHoverGroup: (key) =>
    set((s) =>
      s.hoverPinnedGroups.has(key) || !s.hoverOpenedGroups.has(key) ? s : closeKeysWithin(s, key)
    ),
  toggleHoverGroupPin: (key) =>
    set((s) =>
      s.hoverPinnedGroups.has(key)
        ? closeKeysWithin(s, key)
        : {
            hoverOpenedGroups: new Set([...s.hoverOpenedGroups, key]),
            hoverPinnedGroups: new Set([...s.hoverPinnedGroups, key])
          }
    ),
  resetHoverGroup: (key) => set((s) => closeKeysWithin(s, key))
})
