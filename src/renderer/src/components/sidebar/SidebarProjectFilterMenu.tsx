import React, { useCallback, useMemo, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RepoIconGlyph } from '@/components/repo/repo-icon'
import { SidebarProjectFilterPanel } from './SidebarProjectFilterPanel'
import type { Repo } from '../../../../shared/repo-types'
import { translate } from '@/i18n/i18n'

function TriggerLabel({ selectedRepos }: { selectedRepos: readonly Repo[] }): React.JSX.Element {
  const [first, second, ...rest] = selectedRepos
  if (!first) {
    return (
      <span className="truncate text-muted-foreground">
        {translate(
          'auto.components.sidebar.SidebarRepositoryFilterSection.allProjects',
          'All projects'
        )}
      </span>
    )
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
      <RepoIconGlyph
        repoIcon={first.repoIcon}
        color={first.badgeColor}
        className="size-4 shrink-0"
        iconClassName="size-3.5"
      />
      <span className="truncate">{first.displayName}</span>
      {second && <span className="truncate text-muted-foreground">, {second.displayName}</span>}
      {rest.length > 0 && <span className="shrink-0 text-muted-foreground">+{rest.length}</span>}
    </span>
  )
}

/**
 * Project filter, sitting in the sidebar itself with its own trigger rather
 * than nested inside the workspace options menu: picking which projects to see
 * is the filter people reach for constantly.
 */
const SidebarProjectFilterMenu = React.memo(function SidebarProjectFilterMenu() {
  const repos = useAppStore((s) => s.repos)
  const filterRepoIds = useAppStore((s) => s.filterRepoIds)
  const setFilterRepoIds = useAppStore((s) => s.setFilterRepoIds)
  const [open, setOpen] = useState(false)

  // Why: derive from current repos so stale ids (e.g. lingering after a repo
  // is removed) don't inflate counts or falsely signal an applied filter.
  const selectedRepoIdSet = useMemo(() => {
    const set = new Set<string>()
    for (const repo of repos) {
      if (filterRepoIds.includes(repo.id)) {
        set.add(repo.id)
      }
    }
    return set
  }, [repos, filterRepoIds])
  const selectedCount = selectedRepoIdSet.size
  const hasRepoFilter = selectedCount > 0
  const selectedRepos = useMemo(
    () => repos.filter((repo) => selectedRepoIdSet.has(repo.id)),
    [repos, selectedRepoIdSet]
  )

  const toggleRepo = useCallback(
    (repoId: string) => {
      setFilterRepoIds(
        selectedRepoIdSet.has(repoId)
          ? filterRepoIds.filter((id) => id !== repoId)
          : [...filterRepoIds.filter((id) => id !== repoId), repoId]
      )
    },
    [filterRepoIds, selectedRepoIdSet, setFilterRepoIds]
  )
  const clearRepos = useCallback(() => setFilterRepoIds([]), [setFilterRepoIds])

  if (repos.length <= 1) {
    return null
  }

  return (
    <div className="px-2 pt-1.5 pb-2" data-sidebar-project-filter="">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={translate(
              'auto.components.sidebar.SidebarProjectFilterMenu.ariaLabel',
              'Filter by project'
            )}
            className="h-7 w-full justify-between gap-2 px-2 text-xs font-normal"
          >
            <TriggerLabel selectedRepos={selectedRepos} />
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(320px,calc(100vw-1rem))] min-w-[var(--radix-popover-trigger-width)] p-0 py-1"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {translate(
                'auto.components.sidebar.SidebarRepositoryFilterSection.7679f0c268',
                'Projects'
              )}
              {hasRepoFilter && (
                <span className="ml-1.5 font-medium text-foreground">· {selectedCount}</span>
              )}
            </span>
            <button
              type="button"
              onClick={clearRepos}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent"
              disabled={!hasRepoFilter}
            >
              {translate(
                'auto.components.sidebar.SidebarRepositoryFilterSection.d3a9c4cea1',
                'Clear'
              )}
            </button>
          </div>

          <SidebarProjectFilterPanel
            repos={repos}
            selectedRepoIds={selectedRepoIdSet}
            onToggleRepo={toggleRepo}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
})

export default SidebarProjectFilterMenu
