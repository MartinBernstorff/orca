import { describe, expect, it } from 'vitest'
import { getOptionalWorkspaceEngagementFlag } from './worktree-engagement-flag'

const parse = (value?: string | boolean) =>
  getOptionalWorkspaceEngagementFlag(
    new Map(value === undefined ? [] : [['engagement', value]]),
    'engagement'
  )

describe('getOptionalWorkspaceEngagementFlag', () => {
  it('leaves the engagement unchanged when the flag is omitted', () => {
    expect(parse()).toBeUndefined()
  })

  it('accepts each value case-insensitively', () => {
    expect(parse('Engaged')).toBe('engaged')
    expect(parse('queued')).toBe('queued')
  })

  it('rejects unknown values and a bare flag', () => {
    expect(() => parse('none')).toThrow(/engaged, queued/)
    expect(() => parse(true)).toThrow(/Invalid --engagement/)
  })
})
