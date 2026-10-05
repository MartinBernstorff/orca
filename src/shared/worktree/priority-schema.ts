import { z } from 'zod'
import { WORKSPACE_PRIORITIES } from './priority'

export const WorkspacePrioritySchema = z.enum(WORKSPACE_PRIORITIES)
