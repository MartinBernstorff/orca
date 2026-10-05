import { z } from 'zod'
import { WORKSPACE_ENGAGEMENTS } from './engagement'

export const WorkspaceEngagementSchema = z.enum(WORKSPACE_ENGAGEMENTS)
