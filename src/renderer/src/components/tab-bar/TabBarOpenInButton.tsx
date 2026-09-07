import type React from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { getConnectionIdFromState } from '@/lib/connection-owner-resolution'
import { getLocalFileManagerLabel } from '@/lib/local-file-manager-label'
import {
  NO_OPEN_IN_APPLICATIONS,
  resolveLastUsedOpenInEntry
} from '@/lib/open-in-application-selection'
import {
  getOpenInEntryAvailability,
  getWorktreeOpenInEntries,
  openInMenuEntry,
  OpenInEntryIcon,
  WorktreeOpenInMenuBody
} from '@/components/open-in/WorktreeOpenInMenu'
import { translate } from '@/i18n/i18n'
import {
  SPLIT_BUTTON_CARET_CLASS,
  SPLIT_BUTTON_CLASS,
  SPLIT_BUTTON_SEGMENT_CLASS
} from './split-button-classes'

export function TabBarOpenInButton({
  worktreeId
}: {
  worktreeId: string
}): React.JSX.Element | null {
  const worktreePath = useAppStore((s) => s.getKnownWorktreeById(worktreeId)?.path ?? null)
  // Why: keep the tri-state — `undefined` means the host is gone or ambiguous, which is not the same as a local workspace.
  const connectionId = useAppStore((s) => getConnectionIdFromState(s, worktreeId))
  const settings = useAppStore((s) => s.settings)
  const openInApplications = useAppStore(
    (s) => s.settings?.openInApplications ?? NO_OPEN_IN_APPLICATIONS
  )
  const lastUsedId = useAppStore((s) => s.settings?.lastUsedOpenInApplicationId ?? null)

  const entries = getWorktreeOpenInEntries(openInApplications, getLocalFileManagerLabel())
  const primary = resolveLastUsedOpenInEntry(entries, lastUsedId)

  if (!worktreePath || !primary) {
    return null
  }

  const availability = getOpenInEntryAvailability(primary, settings, connectionId)
  const openInLabel = translate(
    'auto.components.tab.bar.TabBarOpenInButton.openInApp',
    'Open in {{value0}}',
    { value0: primary.label }
  )
  const menuLabel = translate(
    'auto.components.tab.bar.TabBarOpenInButton.moreOpenInApps',
    'More apps to open in'
  )

  return (
    <div className={SPLIT_BUTTON_CLASS}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={availability.disabled}
            onClick={() => {
              void openInMenuEntry({ entry: primary, worktreePath, connectionId })
            }}
            className={cn(
              SPLIT_BUTTON_SEGMENT_CLASS,
              'justify-center rounded-l-md rounded-r-none px-1.5 disabled:opacity-50'
            )}
            aria-label={openInLabel}
          >
            <OpenInEntryIcon entry={primary} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {availability.disabled && availability.metadata
            ? `${openInLabel} — ${availability.metadata}`
            : openInLabel}
        </TooltipContent>
      </Tooltip>
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(SPLIT_BUTTON_SEGMENT_CLASS, SPLIT_BUTTON_CARET_CLASS)}
                aria-label={menuLabel}
              >
                <ChevronDown className="size-3" strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {menuLabel}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-52">
          <WorktreeOpenInMenuBody worktreePath={worktreePath} connectionId={connectionId} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
