import React from 'react'
import { AlarmClock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatUiRelativeTime } from '@/i18n/relative-time-format'
import { translate } from '@/i18n/i18n'
import { normalizeSnoozedUntil } from '../../../../shared/worktree/snooze'
import { SNOOZE_EXPIRY_TICK_MS } from './snooze-expiry-tick'
import { useNow } from '@/components/dashboard/useNow'

/**
 * Wake-time marker for a snoozed card. Only ever visible while the "Show
 * snoozed" filter is on, which is the one state where a snoozed row is
 * otherwise indistinguishable from an ordinary one.
 */
export function SnoozedUntilBadge({
  snoozedUntil
}: {
  snoozedUntil?: number | null
}): React.JSX.Element | null {
  const now = useNow(SNOOZE_EXPIRY_TICK_MS)
  const wakeAt = normalizeSnoozedUntil(snoozedUntil)
  if (wakeAt === null || wakeAt <= now) {
    return null
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex shrink-0 items-center gap-1 text-[10px] leading-none text-muted-foreground select-none">
          <AlarmClock className="size-2.5" />
          <span>{formatUiRelativeTime(wakeAt - now)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <span>
          {translate(
            'auto.components.sidebar.SnoozedUntilBadge.tooltip',
            'Snoozed until {{value0}}',
            { value0: new Date(wakeAt).toLocaleString() }
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
