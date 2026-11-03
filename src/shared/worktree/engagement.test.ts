import { describe, expect, it } from 'vitest'
import { normalizeWorkspaceEngagement } from './engagement'

describe('normalizeWorkspaceEngagement', () => {
  it('keeps each known value', () => {
    expect(normalizeWorkspaceEngagement('engaged')).toBe('engaged')
    expect(normalizeWorkspaceEngagement('inbox')).toBe('inbox')
    expect(normalizeWorkspaceEngagement('queued')).toBe('queued')
  })

  it('defaults a missing or unknown value to inbox', () => {
    expect(normalizeWorkspaceEngagement(undefined)).toBe('inbox')
    expect(normalizeWorkspaceEngagement(null)).toBe('inbox')
    expect(normalizeWorkspaceEngagement('Engaged')).toBe('inbox')
  })
})
