import { describe, expect, it } from 'vitest'
import { getOptionalWorkspacePriorityFlag } from './worktree-priority-flag'

const parse = (value?: string | boolean) =>
  getOptionalWorkspacePriorityFlag(
    new Map(value === undefined ? [] : [['priority', value]]),
    'priority'
  )

describe('getOptionalWorkspacePriorityFlag', () => {
  it('leaves the priority unchanged when the flag is omitted', () => {
    expect(parse()).toBeUndefined()
  })

  it('accepts each level case-insensitively', () => {
    expect(parse('Urgent')).toBe('urgent')
    expect(parse('low')).toBe('low')
  })

  it('clears with none or null', () => {
    expect(parse('none')).toBeNull()
    expect(parse('null')).toBeNull()
  })

  it('rejects unknown levels and a bare flag', () => {
    expect(() => parse('p0')).toThrow(/urgent, high, medium, low, none/)
    expect(() => parse(true)).toThrow(/Invalid --priority/)
  })
})
