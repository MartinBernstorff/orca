import type React from 'react'
import { DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import type { NestedSidebarGroupBy } from '../../../../shared/sidebar-group-by-levels'
import type { WorktreeGroupBy } from './worktree-list/grouping/row-types'
import { GROUP_BY_OPTIONS } from './sidebar-workspace-option-items'
import { SidebarGroupByToggle } from './SidebarGroupByToggle'

// One entry per level below Group by (MAX_GROUP_BY_LEVELS - 1).
const NESTED_LEVEL_IDS = ['second-level', 'third-level'] as const

type SidebarNestedGroupByTogglesProps = {
  groupBy: WorktreeGroupBy
  nestedGroupBy: readonly NestedSidebarGroupBy[]
  setNestedGroupBy: (levels: readonly NestedSidebarGroupBy[]) => void
}

/** "Then by" pickers for the levels below Group by; each appears once the level above is set. */
export function SidebarNestedGroupByToggles({
  groupBy,
  nestedGroupBy,
  setNestedGroupBy
}: SidebarNestedGroupByTogglesProps) {
  if (groupBy === 'none') {
    return null
  }
  const levels: React.JSX.Element[] = []
  for (const [index, levelId] of NESTED_LEVEL_IDS.entries()) {
    if (index > nestedGroupBy.length) {
      break
    }
    const usedAbove = new Set<WorktreeGroupBy>([groupBy, ...nestedGroupBy.slice(0, index)])
    // Why 'none' stays: here it means "no further level".
    const options = GROUP_BY_OPTIONS.filter(
      (option) => option.id === 'none' || !usedAbove.has(option.id)
    )
    if (options.length <= 1) {
      break
    }
    levels.push(
      <div key={levelId}>
        <DropdownMenuLabel>
          {translate('auto.components.sidebar.SidebarWorkspaceOptionsMenu.thenBy', 'Then by')}
        </DropdownMenuLabel>
        <div className="px-2 pt-0.5 pb-1">
          <SidebarGroupByToggle
            groupBy={nestedGroupBy[index] ?? 'none'}
            options={options}
            setGroupBy={(value) =>
              setNestedGroupBy(
                value === 'none'
                  ? nestedGroupBy.slice(0, index)
                  : [...nestedGroupBy.slice(0, index), value, ...nestedGroupBy.slice(index + 1)]
              )
            }
          />
        </div>
      </div>
    )
  }
  return <>{levels}</>
}
