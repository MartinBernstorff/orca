import { z } from 'zod'
import { agentWaitingDeclarations } from '../../../agent-waiting/agent-waiting-declarations'
import { defineMethod, type RpcMethod } from '../core'

const AgentWaitingSetParams = z
  .object({
    paneKey: z.string().min(1).max(200),
    waiting: z.boolean()
  })
  .strict()

export const AGENT_WAITING_METHODS: readonly RpcMethod[] = [
  defineMethod({
    name: 'agentWaiting.set',
    params: AgentWaitingSetParams,
    handler: (params) => {
      const result = agentWaitingDeclarations.setWaiting(params.paneKey, params.waiting)
      if (result === 'no-agent') {
        throw new Error('No agent is reporting status in this pane, so it cannot wait on others.')
      }
      return { paneKey: params.paneKey, waiting: params.waiting, result }
    }
  })
]
