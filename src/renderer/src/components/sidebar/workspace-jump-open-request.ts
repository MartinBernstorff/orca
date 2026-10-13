import { createSidebarPopoverOpenRequest } from './sidebar-popover-open-request'

const workspaceJumpOpenRequest = createSidebarPopoverOpenRequest('orca:open-workspace-jump')

export const requestOpenWorkspaceJump = workspaceJumpOpenRequest.request
export const consumeWorkspaceJumpOpenRequest = workspaceJumpOpenRequest.consume
export const subscribeWorkspaceJumpOpenRequest = workspaceJumpOpenRequest.subscribe
