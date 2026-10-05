import { describe, expect, it } from 'vitest'
import { FolderWorkspaceUpdate } from './folder-workspace'

describe('FolderWorkspaceUpdate engagement', () => {
  it('keeps an engagement and rejects an unknown one', () => {
    expect(
      FolderWorkspaceUpdate.parse({ folderWorkspaceId: 'fw-1', updates: { engagement: 'engaged' } })
        .updates.engagement
    ).toBe('engaged')
    expect(
      FolderWorkspaceUpdate.safeParse({
        folderWorkspaceId: 'fw-1',
        updates: { engagement: 'busy' }
      }).success
    ).toBe(false)
  })
})
