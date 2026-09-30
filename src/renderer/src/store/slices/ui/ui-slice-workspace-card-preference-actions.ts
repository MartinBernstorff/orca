import type { UISlice, UISliceSet } from './ui-slice-contract'
import {
  DEFAULT_WORKTREE_CARD_INTERACTIONS,
  normalizeWorktreeCardInteractions
} from '../../../../../shared/constants'

/** Snooze visibility, empty status lanes, and card interaction preferences. */
export function createUiWorkspaceCardPreferenceActions(set: UISliceSet): Partial<UISlice> {
  return {
    showSnoozedWorkspaces: false,
    setShowSnoozedWorkspaces: (v) => set({ showSnoozedWorkspaces: v }),
    showEmptyWorkspaceStatuses: false,
    setShowEmptyWorkspaceStatuses: (v) => set({ showEmptyWorkspaceStatuses: v }),
    worktreeCardInteractions: [...DEFAULT_WORKTREE_CARD_INTERACTIONS],
    setWorktreeCardInteractions: (interactions) => {
      const normalized = normalizeWorktreeCardInteractions(interactions)
      set({ worktreeCardInteractions: normalized })
      window.api.ui.set({ worktreeCardInteractions: normalized }).catch(console.error)
    }
  }
}
