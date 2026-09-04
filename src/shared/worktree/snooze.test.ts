import { describe, expect, it } from 'vitest'
import { isWorkspaceSnoozed, normalizeSnoozedUntil, resolveSnoozeUntil } from './snooze'

const HOUR_MS = 60 * 60 * 1000

describe('resolveSnoozeUntil', () => {
  it('adds plain deltas for the hour presets', () => {
    const now = new Date('2026-09-04T10:15:00').getTime()
    expect(resolveSnoozeUntil('oneHour', now) - now).toBe(HOUR_MS)
    expect(resolveSnoozeUntil('fourHours', now) - now).toBe(4 * HOUR_MS)
  })

  it('resolves tomorrow to the next local midnight', () => {
    const wake = new Date(resolveSnoozeUntil('tomorrow', new Date('2026-09-04T23:30:00').getTime()))
    expect(wake.getDate()).toBe(5)
    expect(wake.getHours()).toBe(0)
    expect(wake.getMinutes()).toBe(0)
  })

  it('resolves next week to the following Monday midnight', () => {
    // 2026-09-04 is a Friday.
    const wake = new Date(resolveSnoozeUntil('nextWeek', new Date('2026-09-04T09:00:00').getTime()))
    expect(wake.getDay()).toBe(1)
    expect(wake.getDate()).toBe(7)
    expect(wake.getHours()).toBe(0)
  })

  it('never resolves to the current day when it is already Monday', () => {
    const monday = new Date('2026-09-07T09:00:00').getTime()
    const wake = new Date(resolveSnoozeUntil('nextWeek', monday))
    expect(wake.getTime()).toBeGreaterThan(monday)
    expect(wake.getDate()).toBe(14)
  })
})

describe('isWorkspaceSnoozed', () => {
  it('treats a wake time in the past or exactly now as awake', () => {
    expect(isWorkspaceSnoozed({ snoozedUntil: 1000 }, 1001)).toBe(false)
    expect(isWorkspaceSnoozed({ snoozedUntil: 1000 }, 1000)).toBe(false)
    expect(isWorkspaceSnoozed({ snoozedUntil: 1000 }, 999)).toBe(true)
  })

  it('treats absent, null and malformed wake times as awake', () => {
    expect(isWorkspaceSnoozed({}, 0)).toBe(false)
    expect(isWorkspaceSnoozed({ snoozedUntil: null }, 0)).toBe(false)
    expect(isWorkspaceSnoozed({ snoozedUntil: Number.NaN }, 0)).toBe(false)
  })
})

describe('normalizeSnoozedUntil', () => {
  it('keeps positive finite numbers and rejects everything else', () => {
    expect(normalizeSnoozedUntil(1759000000000)).toBe(1759000000000)
    expect(normalizeSnoozedUntil(0)).toBeNull()
    expect(normalizeSnoozedUntil(-1)).toBeNull()
    expect(normalizeSnoozedUntil('soon')).toBeNull()
    expect(normalizeSnoozedUntil(Number.POSITIVE_INFINITY)).toBeNull()
  })
})
