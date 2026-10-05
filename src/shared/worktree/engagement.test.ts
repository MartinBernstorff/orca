import { describe, expect, it } from 'vitest'
import { normalizeWorkspaceEngagement } from './engagement'

describe('normalizeWorkspaceEngagement', () => {
  it('keeps each known value', () => {
    expect(normalizeWorkspaceEngagement('engaged')).toBe('engaged')
    expect(normalizeWorkspaceEngagement('queued')).toBe('queued')
  })

  it('defaults a missing or unknown value to queued', () => {
    expect(normalizeWorkspaceEngagement(undefined)).toBe('queued')
    expect(normalizeWorkspaceEngagement(null)).toBe('queued')
    expect(normalizeWorkspaceEngagement('Engaged')).toBe('queued')
  })
})
