import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { getRepoMapFromState } from '@/store/selectors'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { activateAndRevealWorkspace } from '@/lib/worktree-activation'
import { queueWorkspaceActivationTerminalFocus } from '@/lib/workspace-activation-terminal-focus'
import { getWorktreeHostIdentity } from '../../../../shared/worktree/host-qualified-identity'
import type { Worktree } from '../../../../shared/worktree/types'
import { getFilteredSidebarWorktrees } from './visible-worktrees'
import { computeWorkspaceJumpSections } from './workspace-jump-sections'
import {
  consumeWorkspaceJumpOpenRequest,
  subscribeWorkspaceJumpOpenRequest
} from './workspace-jump-open-request'
import { translate } from '@/i18n/i18n'

// Why: returns 1/0 rather than a match score so cmdk keeps the sidebar order instead of re-ranking.
function workspaceJumpFilter(_value: string, search: string, keywords?: string[]): number {
  const haystack = (keywords ?? []).join(' ').toLowerCase()
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return terms.every((term) => haystack.includes(term)) ? 1 : 0
}

function WorkspaceJumpPanel({
  onSelect
}: {
  onSelect: (worktree: Worktree) => void
}): React.JSX.Element {
  // Why: snapshot at open time so rows don't reorder under the cursor while agents change state.
  const [{ sections, repoNameById }] = useState(() => {
    const state = useAppStore.getState()
    const repoMap = getRepoMapFromState(state)
    return {
      sections: computeWorkspaceJumpSections(state, getFilteredSidebarWorktrees(state)),
      repoNameById: (repoId: string) => repoMap.get(repoId)?.displayName
    }
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // Why: `autoFocus` loses to the popover's own open-time focus of its content.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Command filter={workspaceJumpFilter} className="bg-transparent">
      <CommandInput
        ref={inputRef}
        placeholder={translate(
          'auto.components.sidebar.workspaceJump.placeholder',
          'Go to workspace...'
        )}
        className="h-8 py-2 text-xs"
        wrapperClassName="mx-1 rounded-[7px] border border-border/70 px-2"
        iconClassName="h-3.5 w-3.5"
      />
      <CommandList className="max-h-[min(480px,60vh)] py-1">
        <CommandEmpty className="py-4 text-[11px]">
          {translate('auto.components.sidebar.workspaceJump.empty', 'No workspaces match')}
        </CommandEmpty>
        {sections.map((section) => (
          <CommandGroup
            key={section.key}
            heading={section.headingPath.length > 0 ? section.headingPath.join(' / ') : undefined}
            className="p-0 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold"
          >
            {section.worktrees.map((worktree) => {
              const repoName = repoNameById(worktree.repoId)
              return (
                <CommandItem
                  key={getWorktreeHostIdentity(worktree)}
                  value={getWorktreeHostIdentity(worktree)}
                  keywords={[worktree.displayName, repoName ?? '']}
                  onSelect={() => onSelect(worktree)}
                  className="mx-1 my-0.5 gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-medium data-[selected=true]:bg-black/8 dark:data-[selected=true]:bg-white/14"
                >
                  <span className="min-w-0 flex-1 truncate">{worktree.displayName}</span>
                  {repoName && (
                    <span className="max-w-[45%] shrink-0 truncate text-[11px] font-normal text-muted-foreground">
                      {repoName}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

/** Cmd+K dropdown listing the filtered sidebar's workspaces in sidebar order. */
const SidebarWorkspaceJumpMenu = React.memo(function SidebarWorkspaceJumpMenu() {
  const [open, setOpen] = useState(false)
  const jumpedRef = useRef(false)

  useEffect(() => {
    if (consumeWorkspaceJumpOpenRequest()) {
      setOpen(true)
    }
    return subscribeWorkspaceJumpOpenRequest(() => setOpen(true))
  }, [])

  const selectWorkspace = useCallback((worktree: Worktree) => {
    jumpedRef.current = true
    setOpen(false)
    const activation = activateAndRevealWorkspace(
      worktree.id,
      worktree.hostId ? { executionHostId: worktree.hostId } : undefined
    )
    queueWorkspaceActivationTerminalFocus(worktree.id, activation)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor className="mx-2 h-0" />
      <PopoverContent
        align="start"
        sideOffset={0}
        className="w-[var(--radix-popover-trigger-width)] p-0 py-1"
        onCloseAutoFocus={(event) => {
          // Why: after a jump, focus belongs to the destination terminal, not the pre-open element.
          if (jumpedRef.current) {
            jumpedRef.current = false
            event.preventDefault()
          }
        }}
      >
        <WorkspaceJumpPanel onSelect={selectWorkspace} />
      </PopoverContent>
    </Popover>
  )
})

export default SidebarWorkspaceJumpMenu
