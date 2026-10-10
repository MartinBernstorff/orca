import React from 'react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { getWorkspaceStatus } from '../../../../shared/workspace-statuses'
import type { Worktree } from '../../../../shared/worktree/types'
import { getWorkspaceStatusVisualMeta } from './workspace-status'

export function WorktreeCardWorkspaceStatusIcon({
  worktree
}: {
  worktree: Pick<Worktree, 'workspaceStatus'>
}): React.JSX.Element {
  const workspaceStatuses = useAppStore((s) => s.workspaceStatuses)
  const statusId = getWorkspaceStatus(worktree, workspaceStatuses)
  const definition = workspaceStatuses.find((status) => status.id === statusId)
  const meta = getWorkspaceStatusVisualMeta(definition ?? statusId)
  const label = definition?.label ?? statusId

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 items-center" aria-label={label}>
          <meta.icon className={cn('size-3.5', meta.tone)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
