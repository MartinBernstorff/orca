import React, { useCallback, useMemo } from 'react'
import { Check, MousePointer2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

export type SidebarHoverSectionsContext = {
  openOnHoverGroups: ReadonlySet<string>
  hoverOpenedGroups: ReadonlySet<string>
  hoverPinnedGroups: ReadonlySet<string>
  openHoverGroup: (key: string) => void
  closeHoverGroup: (key: string) => void
  toggleHoverGroupPin: (key: string) => void
  toggleOpenOnHover: (key: string) => void
}

export function useSidebarHoverSectionsContext(
  openOnHoverGroups: ReadonlySet<string>
): SidebarHoverSectionsContext {
  const state = useAppStore(
    useShallow((s) => ({
      hoverOpenedGroups: s.hoverOpenedGroups,
      hoverPinnedGroups: s.hoverPinnedGroups,
      openHoverGroup: s.openHoverGroup,
      closeHoverGroup: s.closeHoverGroup,
      toggleHoverGroupPin: s.toggleHoverGroupPin,
      resetHoverGroup: s.resetHoverGroup,
      toggleOpenOnHoverDisabledGroup: s.toggleOpenOnHoverDisabledGroup
    }))
  )
  const { resetHoverGroup, toggleOpenOnHoverDisabledGroup } = state
  const toggleOpenOnHover = useCallback(
    (key: string) => {
      resetHoverGroup(key)
      toggleOpenOnHoverDisabledGroup(key)
    },
    [resetHoverGroup, toggleOpenOnHoverDisabledGroup]
  )
  return useMemo(
    () => ({
      openOnHoverGroups,
      hoverOpenedGroups: state.hoverOpenedGroups,
      hoverPinnedGroups: state.hoverPinnedGroups,
      openHoverGroup: state.openHoverGroup,
      closeHoverGroup: state.closeHoverGroup,
      toggleHoverGroupPin: state.toggleHoverGroupPin,
      toggleOpenOnHover
    }),
    [openOnHoverGroups, state, toggleOpenOnHover]
  )
}

export type HoverSectionHeaderState = {
  isOpenOnHover: boolean
  isHoverOpened: boolean
  /** Spread on the header row frame so the overlay inside it keeps the section open. */
  frameProps: Pick<React.HTMLAttributes<HTMLDivElement>, 'onMouseEnter' | 'onMouseLeave'>
}

export function getHoverSectionHeaderState(
  ctx: SidebarHoverSectionsContext,
  groupKey: string
): HoverSectionHeaderState {
  const isOpenOnHover = ctx.openOnHoverGroups.has(groupKey)
  return {
    isOpenOnHover,
    isHoverOpened: isOpenOnHover && ctx.hoverOpenedGroups.has(groupKey),
    frameProps: isOpenOnHover
      ? {
          onMouseEnter: () => ctx.openHoverGroup(groupKey),
          onMouseLeave: () => ctx.closeHoverGroup(groupKey)
        }
      : {}
  }
}

export function HoverSectionIndicator({
  open,
  pinned
}: {
  open: boolean
  pinned: boolean
}): React.JSX.Element {
  return (
    <MousePointer2
      aria-hidden
      data-hover-section-indicator={pinned ? 'pinned' : open ? 'open' : 'resting'}
      className={cn(
        'size-3 shrink-0',
        open ? 'text-foreground' : 'text-muted-foreground/60',
        pinned && 'fill-current'
      )}
    />
  )
}

export function SectionHeaderContextMenu({
  ctx,
  groupKey,
  children
}: {
  ctx: SidebarHoverSectionsContext
  groupKey: string
  children: React.ReactElement
}): React.JSX.Element {
  const enabled = ctx.openOnHoverGroups.has(groupKey)
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => ctx.toggleOpenOnHover(groupKey)}>
          <Check className={cn('size-3.5', !enabled && 'invisible')} />
          {translate('auto.components.sidebar.sectionHeader.openOnHover', 'Open on hover')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
