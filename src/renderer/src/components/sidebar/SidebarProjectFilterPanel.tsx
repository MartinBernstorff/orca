import React, { useEffect, useRef, useState } from 'react'
import { Check, Server } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { RepoIconGlyph } from '@/components/repo/repo-icon'
import { resolveRepoHeaderColor } from './project-header-color'
import { cn } from '@/lib/utils'
import type { Repo } from '../../../../shared/repo-types'
import { translate } from '@/i18n/i18n'

function projectCommandFilter(_value: string, search: string, keywords?: string[]): number {
  const query = search.trim().toLowerCase()
  if (!query) {
    return 1
  }

  const [displayName = '', path = ''] = keywords ?? []
  const displayNameIndex = displayName.toLowerCase().indexOf(query)
  if (displayNameIndex !== -1) {
    return 2 + 1 / (displayNameIndex + 1)
  }

  const pathIndex = path.toLowerCase().indexOf(query)
  if (pathIndex !== -1) {
    return 1 + 1 / (pathIndex + 1)
  }

  return 0
}

type SidebarProjectFilterPanelProps = {
  repos: readonly Repo[]
  selectedRepoIds: ReadonlySet<string>
  onToggleRepo: (repoId: string) => void
}

/**
 * Search + selection body of the Projects filter. Lives in its own component so
 * it mounts and unmounts with the popover, which resets the query instead of
 * reopening onto a stale, pre-filtered list.
 */
export function SidebarProjectFilterPanel({
  repos,
  selectedRepoIds,
  onToggleRepo
}: SidebarProjectFilterPanelProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Why: `autoFocus` loses to the popover's own open-time focus of its content;
  // a frame later that has settled, so this focus sticks.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Command filter={projectCommandFilter} className="bg-transparent">
      <CommandInput
        ref={inputRef}
        placeholder={translate(
          'auto.components.sidebar.SidebarRepositoryFilterSection.83a820fa71',
          'Filter projects...'
        )}
        value={query}
        onValueChange={setQuery}
        className="h-8 py-2 text-xs"
        wrapperClassName="mx-1 rounded-[7px] border border-border/70 px-2"
        iconClassName="h-3.5 w-3.5"
      />
      <CommandList className="max-h-96 py-1">
        <CommandEmpty className="py-4 text-[11px]">
          {translate(
            'auto.components.sidebar.SidebarRepositoryFilterSection.4815c70605',
            'No projects match'
          )}
        </CommandEmpty>
        {repos.map((repo) => {
          const selected = selectedRepoIds.has(repo.id)
          return (
            <CommandItem
              key={repo.id}
              value={repo.id}
              keywords={[repo.displayName, repo.path]}
              // Why: the list keeps every project and marks the chosen ones, so
              // selecting must toggle rather than only add.
              onSelect={() => onToggleRepo(repo.id)}
              className="mx-1 my-0.5 items-center gap-2 rounded-[7px] px-2 py-1 text-[12px] leading-5 font-medium data-[selected=true]:bg-black/8 dark:data-[selected=true]:bg-white/14"
            >
              <Check
                className={cn('size-3 shrink-0 text-muted-foreground', !selected && 'opacity-0')}
                aria-hidden
              />
              <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">
                <RepoIconGlyph
                  repoIcon={repo.repoIcon}
                  color={resolveRepoHeaderColor(repo.badgeColor)}
                  className="size-4 shrink-0"
                  iconClassName="size-3.5"
                />
                <span className="truncate">{repo.displayName}</span>
                {repo.connectionId && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[9px] font-medium leading-none text-muted-foreground">
                    <Server className="size-2.5" />
                    {translate(
                      'auto.components.sidebar.SidebarRepositoryFilterSection.2656053db4',
                      'SSH'
                    )}
                  </span>
                )}
              </span>
            </CommandItem>
          )
        })}
      </CommandList>
    </Command>
  )
}
