const WORKSPACE_NAME_INPUT_SELECTOR = '[data-workspace-name-input="true"]'
const WORKSPACE_SOURCE_PILL_SELECTOR = '[data-workspace-source-pill="true"]'
const PROJECT_COMBOBOX_TRIGGER_SELECTOR = '[data-project-combobox-root="true"][role="combobox"]'
const LEGACY_REPO_COMBOBOX_TRIGGER_SELECTOR = '[data-repo-combobox-root="true"][role="combobox"]'

export function getWorkspaceComposerInitialFocusTarget(root: ParentNode): HTMLElement | null {
  // Why: picking the project comes first; selecting one hands focus on to the
  // name/source field. Fall back to that field on surfaces without a picker.
  return (
    root.querySelector<HTMLElement>(PROJECT_COMBOBOX_TRIGGER_SELECTOR) ??
    root.querySelector<HTMLElement>(LEGACY_REPO_COMBOBOX_TRIGGER_SELECTOR) ??
    root.querySelector<HTMLElement>(WORKSPACE_NAME_INPUT_SELECTOR) ??
    root.querySelector<HTMLElement>(WORKSPACE_SOURCE_PILL_SELECTOR)
  )
}
