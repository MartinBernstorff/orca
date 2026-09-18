import React from 'react'

import { cn } from '@/lib/utils'
import type { WorktreeCardPresentation } from './worktree-card-presentation'
import { WorktreeCardDeleteQuickAction } from './worktree-card-delete-quick-action'
import type { WorktreeCardLinkedRef } from './worktree-card-linked-refs'
import { WORKTREE_CARD_ROW_CHIP_CLASS } from './worktree-card-row-chip'
import type { WorktreeCardController } from './use-worktree-card-controller'

const REF_CHIP_CLASS = cn(
  WORKTREE_CARD_ROW_CHIP_CLASS,
  'min-w-0 shrink truncate font-mono tracking-tight text-muted-foreground/50'
)

function LinkedRefChip({
  linkedRef,
  card
}: {
  linkedRef: WorktreeCardLinkedRef
  card: WorktreeCardController
}): React.JSX.Element {
  const { stopQuickActionPointerPropagation } = card
  const url = linkedRef.url

  if (!url) {
    return (
      <span className={REF_CHIP_CLASS} data-worktree-card-linked-ref={linkedRef.key}>
        {linkedRef.label}
      </span>
    )
  }

  return (
    <button
      type="button"
      // Why: the sidebar already costs a tab stop per card; these refs stay pointer-only.
      tabIndex={-1}
      data-workspace-board-preserve-open=""
      data-worktree-card-linked-ref={linkedRef.key}
      onPointerDown={stopQuickActionPointerPropagation}
      onClick={(event) => {
        event.stopPropagation()
        void window.api.shell.openUrl(url)
      }}
      className={cn(REF_CHIP_CLASS, 'hover:bg-accent hover:text-muted-foreground')}
    >
      {linkedRef.label}
    </button>
  )
}

/** Linked Linear/review identifiers on their own line, so the workspace name keeps the full title row. */
export function WorktreeCardLinkedRefsRow({
  card,
  presentation
}: {
  card: WorktreeCardController
  presentation: WorktreeCardPresentation
}): React.JSX.Element {
  const { linkedRefs, showRefsRowDeleteQuickAction } = presentation

  return (
    <div
      className="flex min-w-0 items-center gap-1 leading-none"
      data-worktree-card-linked-refs-row=""
    >
      {linkedRefs.map((linkedRef) => (
        <LinkedRefChip key={linkedRef.key} linkedRef={linkedRef} card={card} />
      ))}

      {showRefsRowDeleteQuickAction && <WorktreeCardDeleteQuickAction card={card} />}
    </div>
  )
}
