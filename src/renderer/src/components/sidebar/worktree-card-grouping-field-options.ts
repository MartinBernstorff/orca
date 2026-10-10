import type { WorktreeCardGroupingField } from '../../../../shared/ui-chrome-types'
import { translate } from '@/i18n/i18n'

export const GROUPING_FIELD_OPTIONS: {
  id: WorktreeCardGroupingField
  label: string
}[] = [
  {
    id: 'workspace-status',
    get label() {
      return translate(
        'auto.components.sidebar.SidebarWorkspaceOptionsMenu.workspaceStatusField',
        'Workspace status'
      )
    }
  },
  {
    id: 'priority',
    get label() {
      return translate('auto.components.sidebar.SidebarWorkspaceOptionsMenu.priority', 'Priority')
    }
  }
]
