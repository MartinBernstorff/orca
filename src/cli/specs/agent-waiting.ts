import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const AGENT_WAITING_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['agent', 'waiting', 'on'],
    summary:
      "Mark this terminal's agent as waiting on others, so its ended turn shows as Waiting on others instead of Needs You",
    usage: 'orca agent waiting on [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['orca agent waiting on']
  },
  {
    path: ['agent', 'waiting', 'off'],
    summary: "Clear this terminal's waiting-on-others mark so its ended turn shows as Needs You",
    usage: 'orca agent waiting off [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['orca agent waiting off']
  }
]
