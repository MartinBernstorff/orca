// Fork-local kill switch: this build never checks for, downloads, or installs Orca updates.
// The env override is for the test suite only — the sandboxed renderer has no `process`, so a
// packaged build stays disabled regardless.
const autoUpdateEnabled =
  typeof process !== 'undefined' && process.env?.ORCA_ENABLE_AUTO_UPDATE === '1'

export const AUTO_UPDATE_DISABLED = !autoUpdateEnabled
