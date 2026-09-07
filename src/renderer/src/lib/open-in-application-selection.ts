import type { OpenInApplication } from '../../../shared/ui-chrome-types'
import type { OpenInMenuEntry } from '@/components/open-in/WorktreeOpenInMenu'
import { useAppStore } from '@/store'

export const NO_OPEN_IN_APPLICATIONS: readonly OpenInApplication[] = []

export function resolveLastUsedOpenInEntry(
  entries: readonly OpenInMenuEntry[],
  lastUsedId: string | null | undefined
): OpenInMenuEntry | null {
  const remembered = lastUsedId ? entries.find((entry) => entry.id === lastUsedId) : undefined
  return remembered ?? entries[0] ?? null
}

export function recordLastUsedOpenInEntry(entryId: string): void {
  void useAppStore.getState().updateSettings({ lastUsedOpenInApplicationId: entryId })
}
