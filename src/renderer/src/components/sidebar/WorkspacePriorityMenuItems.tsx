import type { JSX } from 'react'
import { Signal } from 'lucide-react'
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import type { Worktree } from '../../../../shared/worktree/types'
import {
  WORKSPACE_PRIORITY_LANE_ORDER,
  WorkspacePriorityIcon,
  getWorkspacePriorityLabel,
  getWorkspacePriorityLane,
  type WorkspacePriorityLane
} from './workspace-priority-meta'

export function WorkspacePriorityMenuItems({
  disabled,
  worktrees,
  onSetPriority
}: {
  disabled: boolean
  worktrees: readonly Worktree[]
  onSetPriority: (lane: WorkspacePriorityLane) => void
}): JSX.Element {
  const [first, ...rest] = worktrees
  const lane = first ? getWorkspacePriorityLane(first) : 'none'
  // Why '': a mixed multi-selection has no single current priority to check.
  const value = rest.every((item) => getWorkspacePriorityLane(item) === lane) ? lane : ''
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <Signal className="size-3.5" />
        {translate('auto.components.sidebar.WorkspacePriorityMenuItems.priority', 'Priority')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuRadioGroup value={value}>
          {WORKSPACE_PRIORITY_LANE_ORDER.map((option) => (
            <DropdownMenuRadioItem
              key={option}
              value={option}
              onSelect={() => onSetPriority(option)}
            >
              <WorkspacePriorityIcon lane={option} className="size-3.5" />
              {getWorkspacePriorityLabel(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
