import { createSidebarPopoverOpenRequest } from './sidebar-popover-open-request'

const projectFilterOpenRequest = createSidebarPopoverOpenRequest('orca:open-project-filter')

export const requestOpenProjectFilter = projectFilterOpenRequest.request
export const consumeProjectFilterOpenRequest = projectFilterOpenRequest.consume
export const subscribeProjectFilterOpenRequest = projectFilterOpenRequest.subscribe
