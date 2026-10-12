import type React from 'react'
import type { AppState } from '@/store/types'
import type { FolderWorkspacePathStatus } from '../../../../../../shared/folder-workspace-path-status'
import type { ProjectGroup } from '../../../../../../shared/project-group-types'
import type { ExecutionHostId } from '../../../../../../shared/execution-host'
import type {
  WorkspaceStatus,
  WorkspaceStatusDefinition
} from '../../../../../../shared/worktree/types'
import type { WorkspaceEngagement } from '../../../../../../shared/worktree/engagement'
import type { WorktreeGroupBy } from '../grouping/row-types'
import type { WorktreeSidebarHeaderDrag } from '../drag/use-header-drag'
import type { RepoHeaderProjectActions } from './repo-header-project-actions'
import type { SidebarHoverSectionsContext } from './hover-section-header'

export type SectionHeaderRowContext = {
  groupBy: WorktreeGroupBy
  collapsedGroups: Set<string>
  workspaceStatuses: readonly WorkspaceStatusDefinition[]
  projectGroups: readonly ProjectGroup[]
  sshConnectionStates: AppState['sshConnectionStates']
  highlightedRevealRowKey: string | null
  dragOverStatus: WorkspaceStatus | null
  dragOverEngagement: WorkspaceEngagement | null
  pinDragOver: boolean
  headerDrag: WorktreeSidebarHeaderDrag
  getCachedFolderWorkspacePathStatus: (request: {
    scope: 'project-group'
    projectGroupId: string
  }) => FolderWorkspacePathStatus | null
  toggleGroupWithScrollAnchor: (groupKey: string) => void
  hoverSections: SidebarHoverSectionsContext
  projectActions: RepoHeaderProjectActions
  onRenameProjectGroup: (groupId: string, currentName: string, hostId?: ExecutionHostId) => void
  onDeleteProjectGroup: (groupId: string, groupName: string, hostId?: ExecutionHostId) => void
  onCreateFolderWorkspace: (projectGroup: ProjectGroup) => void
  onWorkspaceStatusDragOver: (event: React.DragEvent, status: WorkspaceStatus) => void
  onWorkspaceStatusDragLeave: (event: React.DragEvent) => void
  onWorkspacePinDragOver: (event: React.DragEvent) => void
  onWorkspacePinDragLeave: (event: React.DragEvent) => void
  onWorkspaceEngagementDragOver: (event: React.DragEvent, engagement: WorkspaceEngagement) => void
  onWorkspaceEngagementDragLeave: (event: React.DragEvent) => void
  onWorkspaceStatusDrop: (event: React.DragEvent, status: WorkspaceStatus) => void
}
