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
const NEUTRAL_TONE_CLASS =
  'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground'
const DESTRUCTIVE_TONE_CLASS =
  'text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive'
// Why: Open shows on every card, so it must not reserve title width while hidden; discrete display transition keeps the fade.
const COLLAPSED_UNTIL_HOVER_CLASS = cn(
  'hidden group-hover/worktree-card:inline-flex group-focus-within/worktree-card:inline-flex',
  'transition-[opacity,display] transition-discrete starting:opacity-0'
)

function QuickActionButton({
  card,
  onClick,
  className,
  ariaLabel,
  label
}: {
  card: WorktreeCardController
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className: string
  ariaLabel: string
  label: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      data-workspace-board-preserve-open=""
      onPointerDown={card.stopQuickActionPointerPropagation}
      onClick={onClick}
      className={cn(QUICK_ACTION_CLASS, className)}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  )
}

/** Hover-revealed Engage/Open/Delete affordances, shared by the linked refs row and the title row fallback. */
export function WorktreeCardQuickActions({
  card
}: {
  card: WorktreeCardController
}): React.JSX.Element {
  const {
    handleWorkspaceQuickAction,
    handleEngageQuickAction,
    handleOpenQuickAction,
    showEngageQuickAction,
    showOpenQuickAction,
    showDeleteQuickAction
  } = card

  return (
    <div className="ml-auto flex shrink-0 items-center">
      {showEngageQuickAction && (
        <QuickActionButton
          card={card}
          onClick={handleEngageQuickAction}
          className={NEUTRAL_TONE_CLASS}
          ariaLabel={translate(
            'auto.components.sidebar.WorktreeCard.engageQuickActionLabel',
            'Engage workspace'
          )}
          label={translate('auto.components.sidebar.WorktreeCard.engageQuickAction', 'Engage')}
        />
      )}
      {showOpenQuickAction && (
        <QuickActionButton
          card={card}
          onClick={handleOpenQuickAction}
          className={cn(NEUTRAL_TONE_CLASS, COLLAPSED_UNTIL_HOVER_CLASS)}
          ariaLabel={translate(
            'auto.components.sidebar.WorktreeCard.openQuickActionLabel',
            'Open workspace'
          )}
          label={translate('auto.components.sidebar.WorktreeCard.openQuickAction', 'Open')}
        />
      )}
      {showDeleteQuickAction && (
        <QuickActionButton
          card={card}
          onClick={handleWorkspaceQuickAction}
          className={DESTRUCTIVE_TONE_CLASS}
          ariaLabel={translate(
            'auto.components.sidebar.WorktreeCard.6f09f58541',
            'Delete workspace'
          )}
          label={translate('auto.components.sidebar.WorktreeCard.deleteQuickAction', 'Delete')}
        />
      )}
    </div>
  )
}
