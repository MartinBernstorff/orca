import { describe, expect, it } from 'vitest'
import { FolderWorkspaceUpdateArgs } from './repo-ipc-arg-schemas'

describe('FolderWorkspaceUpdateArgs snooze field', () => {
  // Why these exist: the schema strips unknown keys, so an unlisted field is dropped
  // silently and the renderer shows a snooze that never reached disk.
  it('keeps a wake time and its clear', () => {
    expect(
      FolderWorkspaceUpdateArgs.parse({
        folderWorkspaceId: 'fw-1',
        updates: { snoozedUntil: 1_800_000_000_000 }
      }).updates.snoozedUntil
    ).toBe(1_800_000_000_000)
    expect(
      FolderWorkspaceUpdateArgs.parse({
        folderWorkspaceId: 'fw-1',
        updates: { snoozedUntil: null }
      }).updates.snoozedUntil
    ).toBeNull()
  })

  it('rejects a non-finite wake time', () => {
    expect(
      FolderWorkspaceUpdateArgs.safeParse({
        folderWorkspaceId: 'fw-1',
        updates: { snoozedUntil: Number.POSITIVE_INFINITY }
      }).success
    ).toBe(false)
  })
})
