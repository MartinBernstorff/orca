import type { JSX } from 'react'
import { Zap } from 'lucide-react'
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
  WORKSPACE_ENGAGEMENTS,
  type WorkspaceEngagement
} from '../../../../shared/worktree/engagement'
import {
  WORKSPACE_ENGAGEMENT_ICONS,
  getWorkspaceEngagement,
  getWorkspaceEngagementLabel
} from './workspace-engagement-meta'

export function WorkspaceEngagementMenuItems({
  disabled,
  worktrees,
  onSetEngagement
}: {
  disabled: boolean
  worktrees: readonly Worktree[]
  onSetEngagement: (engagement: WorkspaceEngagement) => void
}): JSX.Element {
  const [first, ...rest] = worktrees
  const current = first ? getWorkspaceEngagement(first) : 'queued'
  // Why '': a mixed multi-selection has no single current engagement to check.
  const value = rest.every((item) => getWorkspaceEngagement(item) === current) ? current : ''
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <Zap className="size-3.5" />
        {translate('auto.components.sidebar.WorkspaceEngagementMenuItems.engagement', 'Engagement')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        <DropdownMenuRadioGroup value={value}>
          {WORKSPACE_ENGAGEMENTS.map((option) => {
            const Icon = WORKSPACE_ENGAGEMENT_ICONS[option]
            return (
              <DropdownMenuRadioItem
                key={option}
                value={option}
                onSelect={() => onSetEngagement(option)}
              >
                <Icon className="size-3.5" />
                {getWorkspaceEngagementLabel(option)}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
