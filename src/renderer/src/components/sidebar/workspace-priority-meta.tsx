import React from 'react'
import {
  WORKSPACE_PRIORITIES,
  normalizeWorkspacePriority,
  type WorkspacePriority
} from '../../../../shared/worktree/priority'
import { LinearPriorityIcon } from '../linear-priority-icon'
import { translate } from '@/i18n/i18n'

export type WorkspacePriorityLane = WorkspacePriority | 'none'

export const WORKSPACE_PRIORITY_LANE_ORDER: readonly WorkspacePriorityLane[] = [
  ...WORKSPACE_PRIORITIES,
  'none'
]

// Why Linear's scale: the sidebar reuses the Linear priority glyphs so workspace
// priority reads the same as the linked issues' priority.
const LINEAR_PRIORITY_BY_LANE: Record<WorkspacePriorityLane, number> = {
  none: 0,
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4
}

export function getWorkspacePriorityLabel(lane: WorkspacePriorityLane): string {
  switch (lane) {
    case 'urgent':
      return translate('auto.components.sidebar.workspacePriority.urgent', 'Urgent')
    case 'high':
      return translate('auto.components.sidebar.workspacePriority.high', 'High')
    case 'medium':
      return translate('auto.components.sidebar.workspacePriority.medium', 'Medium')
    case 'low':
      return translate('auto.components.sidebar.workspacePriority.low', 'Low')
    case 'none':
      return translate('auto.components.sidebar.workspacePriority.none', 'No priority')
  }
}

export function WorkspacePriorityIcon({
  lane,
  className
}: {
  lane: WorkspacePriorityLane
  className?: string
}): React.JSX.Element {
  return (
    <LinearPriorityIcon
      priority={LINEAR_PRIORITY_BY_LANE[lane]}
      label={getWorkspacePriorityLabel(lane)}
      className={className}
    />
  )
}

const LANE_ICONS = Object.fromEntries(
  WORKSPACE_PRIORITY_LANE_ORDER.map((lane) => {
    const Icon = ({ className }: { className?: string }): React.JSX.Element => (
      <WorkspacePriorityIcon lane={lane} className={className} />
    )
    Icon.displayName = `WorkspacePriorityLaneIcon(${lane})`
    return [lane, Icon]
  })
) as Record<WorkspacePriorityLane, React.ComponentType<{ className?: string }>>

export function getWorkspacePriorityLaneHeaderMeta(lane: WorkspacePriorityLane): {
  label: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
} {
  return {
    label: getWorkspacePriorityLabel(lane),
    icon: LANE_ICONS[lane],
    tone: 'text-foreground'
  }
}

const PRIORITY_LANE_KEY_PREFIX = 'priority:'

export function getWorkspacePriorityLane(workspace: {
  priority?: WorkspacePriority | null
}): WorkspacePriorityLane {
  return normalizeWorkspacePriority(workspace.priority) ?? 'none'
}

export function getWorkspacePriorityLaneKey(lane: WorkspacePriorityLane): string {
  return `${PRIORITY_LANE_KEY_PREFIX}${lane}`
}

export function getWorkspacePriorityLaneFromKey(key: string): WorkspacePriorityLane {
  return normalizeWorkspacePriority(key.slice(PRIORITY_LANE_KEY_PREFIX.length)) ?? 'none'
}
