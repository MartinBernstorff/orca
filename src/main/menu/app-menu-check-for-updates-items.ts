import { AUTO_UPDATE_DISABLED } from '../../shared/auto-update-disabled'
import { translateMain } from '../i18n/main-i18n'

/** Empty when this fork build has auto-update disabled. */
export function createCheckForUpdatesMenuItems(
  click: Electron.MenuItemConstructorOptions['click']
): Electron.MenuItemConstructorOptions[] {
  if (AUTO_UPDATE_DISABLED) {
    return []
  }
  return [{ label: translateMain('menu.checkForUpdates', 'Check for Updates...'), click }]
}
