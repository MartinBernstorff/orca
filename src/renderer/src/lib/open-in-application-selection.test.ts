import { describe, expect, it } from 'vitest'
import { resolveLastUsedOpenInEntry } from './open-in-application-selection'
import type { OpenInMenuEntry } from '@/components/open-in/WorktreeOpenInMenu'

const vscode: OpenInMenuEntry = {
  id: 'vscode',
  label: 'VS Code',
  target: 'external-editor',
  command: 'code'
}
const zed: OpenInMenuEntry = { id: 'zed', label: 'Zed', target: 'external-editor', command: 'zed' }
const fileManager: OpenInMenuEntry = { id: 'file-manager', label: 'Finder', target: 'file-manager' }

describe('resolveLastUsedOpenInEntry', () => {
  it('returns the remembered entry', () => {
    expect(resolveLastUsedOpenInEntry([vscode, zed, fileManager], 'zed')).toEqual(zed)
  })

  it('remembers the file manager like any other row', () => {
    expect(resolveLastUsedOpenInEntry([vscode, zed, fileManager], 'file-manager')).toEqual(
      fileManager
    )
  })

  it('falls back to the first entry when nothing is remembered', () => {
    expect(resolveLastUsedOpenInEntry([vscode, zed, fileManager], null)).toEqual(vscode)
    expect(resolveLastUsedOpenInEntry([vscode, zed, fileManager], undefined)).toEqual(vscode)
  })

  it('falls back to the first entry when the remembered app was removed', () => {
    expect(resolveLastUsedOpenInEntry([vscode, fileManager], 'zed')).toEqual(vscode)
  })

  it('falls back to the file manager when no apps are configured', () => {
    expect(resolveLastUsedOpenInEntry([fileManager], 'zed')).toEqual(fileManager)
  })

  it('returns null when there is nothing to open with', () => {
    expect(resolveLastUsedOpenInEntry([], 'zed')).toBeNull()
  })
})
