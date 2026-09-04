export type SnoozePresetId = 'oneHour' | 'fourHours' | 'tomorrow' | 'nextWeek'

export const SNOOZE_PRESET_IDS: readonly SnoozePresetId[] = [
  'oneHour',
  'fourHours',
  'tomorrow',
  'nextWeek'
]

const HOUR_MS = 60 * 60 * 1000

// Why local-time Date arithmetic and not now + 86_400_000: the calendar presets
// must land just after the user's own midnight, which DST transitions move.
function startOfNextLocalDay(now: number): number {
  const date = new Date(now)
  date.setHours(24, 0, 0, 0)
  return date.getTime()
}

function startOfNextLocalMonday(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  // Why the `|| 7`: on a Monday the modulo yields 0, which would resolve to a
  // wake time already in the past.
  date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7))
  return date.getTime()
}

export function resolveSnoozeUntil(preset: SnoozePresetId, now: number): number {
  switch (preset) {
    case 'oneHour':
      return now + HOUR_MS
    case 'fourHours':
      return now + 4 * HOUR_MS
    case 'tomorrow':
      return startOfNextLocalDay(now)
    case 'nextWeek':
      return startOfNextLocalMonday(now)
  }
}

export function normalizeSnoozedUntil(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function isWorkspaceSnoozed(
  workspace: { snoozedUntil?: number | null },
  now: number
): boolean {
  const until = normalizeSnoozedUntil(workspace.snoozedUntil)
  return until !== null && until > now
}
