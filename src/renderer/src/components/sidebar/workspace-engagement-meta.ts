import type React from 'react'
import { Hourglass, Zap } from 'lucide-react'
import {
  WORKSPACE_ENGAGEMENTS,
  normalizeWorkspaceEngagement,
  type WorkspaceEngagement
} from '../../../../shared/worktree/engagement'
import { translate } from '@/i18n/i18n'

export const WORKSPACE_ENGAGEMENT_LANE_ORDER: readonly WorkspaceEngagement[] = WORKSPACE_ENGAGEMENTS

export const WORKSPACE_ENGAGEMENT_ICONS: Record<
  WorkspaceEngagement,
  React.ComponentType<{ className?: string }>
> = {
  engaged: Zap,
  queued: Hourglass
}

export function getWorkspaceEngagementLabel(engagement: WorkspaceEngagement): string {
  switch (engagement) {
    case 'engaged':
      return translate('auto.components.sidebar.workspaceEngagement.engaged', 'Engaged')
    case 'queued':
      return translate('auto.components.sidebar.workspaceEngagement.queued', 'Queued')
  }
}

export function getWorkspaceEngagementLaneHeaderMeta(engagement: WorkspaceEngagement): {
  label: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
} {
  return {
    label: getWorkspaceEngagementLabel(engagement),
    icon: WORKSPACE_ENGAGEMENT_ICONS[engagement],
    tone: 'text-foreground'
  }
}

const ENGAGEMENT_LANE_KEY_PREFIX = 'engagement:'

export function getWorkspaceEngagement(workspace: {
  engagement?: WorkspaceEngagement
}): WorkspaceEngagement {
  return normalizeWorkspaceEngagement(workspace.engagement)
}

export function getWorkspaceEngagementLaneKey(engagement: WorkspaceEngagement): string {
  return `${ENGAGEMENT_LANE_KEY_PREFIX}${engagement}`
}

export function getWorkspaceEngagementFromLaneKey(key: string): WorkspaceEngagement {
  return normalizeWorkspaceEngagement(key.slice(ENGAGEMENT_LANE_KEY_PREFIX.length))
}
