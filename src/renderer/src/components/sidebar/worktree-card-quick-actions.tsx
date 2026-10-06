import React from 'react'

import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { WORKTREE_CARD_ROW_CHIP_CLASS } from './worktree-card-row-chip'
import type { WorktreeCardController } from './use-worktree-card-controller'

const QUICK_ACTION_CLASS = cn(
  WORKTREE_CARD_ROW_CHIP_CLASS,
  'shrink-0 bg-transparent font-medium opacity-0 transition-opacity',
  'group-hover/worktree-card:opacity-100 group-focus-within/worktree-card:opacity-100 focus-visible:opacity-100'
)

/** Hover-revealed Open/Engage/Delete affordances, shared by the linked refs row and the title row fallback. */
export function WorktreeCardQuickActions({
  card
}: {
  card: WorktreeCardController
}): React.JSX.Element {
  const {
    stopQuickActionPointerPropagation,
    handleWorkspaceQuickAction,
    handleEngageQuickAction,
    handleOpenQuickAction,
    showEngageQuickAction,
    showOpenQuickAction,
    showDeleteQuickAction
  } = card

  return (
    <div className="ml-auto flex shrink-0 items-center">
      {showOpenQuickAction && (
        <button
          type="button"
          data-workspace-board-preserve-open=""
          onPointerDown={stopQuickActionPointerPropagation}
          onClick={handleOpenQuickAction}
          className={cn(
            QUICK_ACTION_CLASS,
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground'
          )}
          aria-label={translate(
            'auto.components.sidebar.WorktreeCard.openQuickActionLabel',
            'Open workspace'
          )}
        >
          {translate('auto.components.sidebar.WorktreeCard.openQuickAction', 'Open')}
        </button>
      )}
      {showEngageQuickAction && (
        <button
          type="button"
          data-workspace-board-preserve-open=""
          onPointerDown={stopQuickActionPointerPropagation}
          onClick={handleEngageQuickAction}
          className={cn(
            QUICK_ACTION_CLASS,
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground'
          )}
          aria-label={translate(
            'auto.components.sidebar.WorktreeCard.engageQuickActionLabel',
            'Engage workspace'
          )}
        >
          {translate('auto.components.sidebar.WorktreeCard.engageQuickAction', 'Engage')}
        </button>
      )}
      {showDeleteQuickAction && (
        <button
          type="button"
          data-workspace-board-preserve-open=""
          onPointerDown={stopQuickActionPointerPropagation}
          onClick={handleWorkspaceQuickAction}
          className={cn(
            QUICK_ACTION_CLASS,
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive'
          )}
          aria-label={translate(
            'auto.components.sidebar.WorktreeCard.6f09f58541',
            'Delete workspace'
          )}
        >
          {translate('auto.components.sidebar.WorktreeCard.deleteQuickAction', 'Delete')}
        </button>
      )}
    </div>
  )
}
