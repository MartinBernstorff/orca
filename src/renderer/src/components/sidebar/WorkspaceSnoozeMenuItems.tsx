import type { JSX } from 'react'
import { AlarmClock, AlarmClockOff } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { translate } from '@/i18n/i18n'
import { SNOOZE_PRESET_IDS, type SnoozePresetId } from '../../../../shared/worktree/snooze'

function getSnoozePresetLabel(preset: SnoozePresetId): string {
  switch (preset) {
    case 'oneHour':
      return translate('auto.components.sidebar.WorkspaceSnoozeMenuItems.oneHour', 'For 1 hour')
    case 'fourHours':
      return translate('auto.components.sidebar.WorkspaceSnoozeMenuItems.fourHours', 'For 4 hours')
    case 'tomorrow':
      return translate(
        'auto.components.sidebar.WorkspaceSnoozeMenuItems.tomorrow',
        'Until tomorrow'
      )
    case 'nextWeek':
      return translate(
        'auto.components.sidebar.WorkspaceSnoozeMenuItems.nextWeek',
        'Until next week'
      )
  }
}

export function WorkspaceSnoozeMenuItems({
  disabled,
  isSnoozed,
  onSnooze,
  onUnsnooze
}: {
  disabled: boolean
  isSnoozed: boolean
  onSnooze: (preset: SnoozePresetId) => void
  onUnsnooze: () => void
}): JSX.Element {
  if (isSnoozed) {
    return (
      <DropdownMenuItem onSelect={onUnsnooze} disabled={disabled}>
        <AlarmClockOff className="size-3.5" />
        {translate('auto.components.sidebar.WorkspaceSnoozeMenuItems.unsnooze', 'Unsnooze')}
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={disabled}>
        <AlarmClock className="size-3.5" />
        {translate('auto.components.sidebar.WorkspaceSnoozeMenuItems.snooze', 'Snooze')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-44">
        {SNOOZE_PRESET_IDS.map((preset) => (
          <DropdownMenuItem key={preset} onSelect={() => onSnooze(preset)}>
            {getSnoozePresetLabel(preset)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
