import React from 'react'
import { Activity } from 'lucide-react'

import { agentStateLabel } from '@/components/AgentStateDot'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { selectWorktreeAgentActivitySummary } from './worktree-agent-activity-summary'

/** Shows that an agent's background shell or session cron (e.g. a CI watcher) is still running. */
export function WorktreeCardBackgroundTaskIcon({
  worktreeId
}: {
  worktreeId: string
}): React.JSX.Element | null {
  const hasRunningBackgroundTask = useAppStore(
    (s) => selectWorktreeAgentActivitySummary(s, worktreeId).hasRunningBackgroundTask
  )
  if (!hasRunningBackgroundTask) {
    return null
  }
  const label = agentStateLabel('monitoring')
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 items-center" aria-label={label}>
          <Activity className="size-3.5 text-yellow-500" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
