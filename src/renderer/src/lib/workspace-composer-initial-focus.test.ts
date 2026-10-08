// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { getWorkspaceComposerInitialFocusTarget } from './workspace-composer-initial-focus'

describe('getWorkspaceComposerInitialFocusTarget', () => {
  it('prefers the project combobox when both project and name fields exist', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button role="combobox" data-project-combobox-root="true"></button>
      <input data-workspace-name-input="true" />
    `

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(
      root.querySelector('[data-project-combobox-root="true"]')
    )
  })

  it('prefers the project combobox over a pre-filled source pill', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button role="combobox" data-project-combobox-root="true"></button>
      <div data-workspace-source-pill="true" tabindex="0"></div>
    `

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(
      root.querySelector('[data-project-combobox-root="true"]')
    )
  })

  it('prefers project focus over legacy repo trigger', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button role="combobox" data-repo-combobox-root="true"></button>
      <button role="combobox" data-project-combobox-root="true"></button>
    `

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(
      root.querySelector('[data-project-combobox-root="true"]')
    )
  })

  it('keeps a legacy repo-combobox fallback for alternate composer surfaces', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <button role="combobox" data-repo-combobox-root="true"></button>
      <input data-workspace-name-input="true" />
    `

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(
      root.querySelector('[data-repo-combobox-root="true"]')
    )
  })

  it('falls back to the workspace name input when no project picker exists', () => {
    const root = document.createElement('div')
    const nameInput = document.createElement('input')
    nameInput.setAttribute('data-workspace-name-input', 'true')
    root.append(nameInput)

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(nameInput)
  })

  it('falls back to the source pill when the name input is replaced by a selection', () => {
    const root = document.createElement('div')
    const pill = document.createElement('div')
    pill.setAttribute('data-workspace-source-pill', 'true')
    pill.setAttribute('tabindex', '0')
    root.append(pill)

    expect(getWorkspaceComposerInitialFocusTarget(root)).toBe(pill)
  })
})
