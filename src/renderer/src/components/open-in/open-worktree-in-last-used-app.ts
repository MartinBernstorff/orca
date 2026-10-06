import { useAppStore } from '@/store'
import { getLocalFileManagerLabel } from '@/lib/local-file-manager-label'
import {
  NO_OPEN_IN_APPLICATIONS,
  resolveLastUsedOpenInEntry
} from '@/lib/open-in-application-selection'
import { getWorktreeOpenInEntries, openInMenuEntry } from './WorktreeOpenInMenu'

/** Opens in the same app the tab-bar Open In button shows. */
export async function openWorktreeInLastUsedApp(args: {
  worktreePath: string
  connectionId?: string | null
}): Promise<void> {
  const settings = useAppStore.getState().settings
  const entries = getWorktreeOpenInEntries(
    settings?.openInApplications ?? NO_OPEN_IN_APPLICATIONS,
    getLocalFileManagerLabel()
  )
  const entry = resolveLastUsedOpenInEntry(entries, settings?.lastUsedOpenInApplicationId)
  if (entry) {
    await openInMenuEntry({ entry, ...args })
  }
}
