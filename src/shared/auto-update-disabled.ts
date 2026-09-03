// Fork-local kill switch: this build never checks for, downloads, or installs Orca updates.
// The env escape hatch exists so upstream's updater tests keep exercising the enabled path.
const autoUpdateEnabled =
  typeof process !== 'undefined' && process.env?.ORCA_ENABLE_AUTO_UPDATE === '1'

export const AUTO_UPDATE_DISABLED = !autoUpdateEnabled
