import React from 'react'

import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { WORKTREE_CARD_ROW_CHIP_CLASS } from './worktree-card-row-chip'
import type { WorktreeCardController } from './use-worktree-card-controller'

/** Hover-revealed delete affordance, shared by the linked refs row and the title row fallback. */
export function WorktreeCardDeleteQuickAction({
  card
}: {
  card: WorktreeCardController
}): React.JSX.Element {
  const { stopQuickActionPointerPropagation, handleWorkspaceQuickAction } = card

  return (
    <button
      type="button"
      data-workspace-board-preserve-open=""
      onPointerDown={stopQuickActionPointerPropagation}
      onClick={handleWorkspaceQuickAction}
      className={cn(
        WORKTREE_CARD_ROW_CHIP_CLASS,
        'ml-auto shrink-0 bg-transparent font-medium opacity-0 transition-opacity',
        'group-hover/worktree-card:opacity-100 group-focus-within/worktree-card:opacity-100 focus-visible:opacity-100',
        'text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive'
      )}
      aria-label={translate('auto.components.sidebar.WorktreeCard.6f09f58541', 'Delete workspace')}
    >
      {translate('auto.components.sidebar.WorktreeCard.deleteQuickAction', 'Delete')}
    </button>
  )
}
