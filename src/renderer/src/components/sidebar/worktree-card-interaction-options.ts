import type { WorktreeCardInteraction } from '../../../../shared/ui-chrome-types'
import { translate } from '@/i18n/i18n'

export const INTERACTION_OPTIONS: { id: WorktreeCardInteraction; label: string }[] = [
  {
    id: 'delete',
    get label() {
      return translate(
        'auto.components.sidebar.SidebarWorkspaceOptionsMenu.interactionDelete',
        'Delete button'
      )
    }
  }
]
