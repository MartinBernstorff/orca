import React from 'react'

import { cn } from '@/lib/utils'
import { WorktreeCardHeader } from './worktree-card-header'
import { WorktreeCardLinkedRefsRow } from './worktree-card-linked-refs-row'
import { WorktreeCardMetaRow } from './worktree-card-meta-row'
import type { WorktreeCardPresentation } from './worktree-card-presentation'
import { WorktreeCardSecondaryRows } from './worktree-card-secondary-rows'
import type { WorktreeCardController } from './use-worktree-card-controller'

export function WorktreeCardParentContent({
  card,
  presentation
}: {
  card: WorktreeCardController
  presentation: WorktreeCardPresentation
}): React.JSX.Element {
  const { newCardStyle, lineageChildren, showInlineAgentList } = card
  const { titleOnlyCard } = presentation

  const identityContent = (
    <div
      className="group/worktree-card flex w-full min-w-0 flex-col gap-1.5"
      data-worktree-card-identity=""
    >
      <WorktreeCardHeader card={card} presentation={presentation} />
      {presentation.showLinkedRefsRow && (
        <WorktreeCardLinkedRefsRow card={card} presentation={presentation} />
      )}
      {presentation.hasMetaRow && <WorktreeCardMetaRow card={card} presentation={presentation} />}
    </div>
  )

  return (
    <div
      className={cn(
        'flex w-full min-w-0 gap-0.5 pl-0',
        titleOnlyCard ? 'items-center' : 'items-start'
      )}
      data-worktree-card-parent-content=""
    >
      {/* Content area */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1.5',
          // Why: inline agent rows intentionally outdent into the card gutter; inner elements handle truncation.
          showInlineAgentList || (!newCardStyle && lineageChildren)
            ? 'overflow-visible'
            : 'overflow-hidden'
        )}
      >
        {identityContent}
        <WorktreeCardSecondaryRows card={card} presentation={presentation} />
      </div>
    </div>
  )
}
