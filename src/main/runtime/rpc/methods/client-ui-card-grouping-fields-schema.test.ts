import { describe, expect, it } from 'vitest'
import { UiUpdate } from './client-ui-schemas'

describe('worktreeCardGroupingFields client-ui schema', () => {
  it('accepts grouping fields alongside sibling updates', () => {
    const parsed = UiUpdate.parse({
      sidebarWidth: 320,
      worktreeCardGroupingFields: ['priority', 'workspace-status']
    })

    expect(parsed.sidebarWidth).toBe(320)
    expect(parsed.worktreeCardGroupingFields).toEqual(['workspace-status', 'priority'])
  })

  it('drops an unknown field value without rejecting the batch', () => {
    const parsed = UiUpdate.parse({
      sidebarWidth: 320,
      worktreeCardGroupingFields: ['priority', 'from-a-newer-client']
    })

    expect(parsed.sidebarWidth).toBe(320)
    expect(parsed.worktreeCardGroupingFields).toBeUndefined()
  })
})
