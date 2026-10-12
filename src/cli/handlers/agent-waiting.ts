import type { CommandHandler } from '../dispatch'
import { printResult } from '../format'
import { RuntimeClientError, type RuntimeClient } from '../runtime-client'

type AgentWaitingResult = { paneKey: string; waiting: boolean; result: string }

async function setAgentWaiting(
  client: RuntimeClient,
  json: boolean,
  waiting: boolean
): Promise<void> {
  const paneKey = process.env.ORCA_PANE_KEY
  if (!paneKey) {
    throw new RuntimeClientError(
      'invalid_environment',
      `orca agent waiting ${waiting ? 'on' : 'off'} must be run inside an Orca terminal.`
    )
  }
  const response = await client.call<AgentWaitingResult>('agentWaiting.set', { paneKey, waiting })
  printResult(response, json, (result) =>
    result.waiting ? 'Marked as waiting on others.' : 'Cleared waiting on others.'
  )
}

export const AGENT_WAITING_HANDLERS: Record<string, CommandHandler> = {
  'agent waiting on': ({ client, json }) => setAgentWaiting(client, json, true),
  'agent waiting off': ({ client, json }) => setAgentWaiting(client, json, false)
}
