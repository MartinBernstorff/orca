import { describe, expect, it } from 'vitest'
import { getNestedGroupKey } from '../../../../shared/sidebar-group-by-levels'
import { createTestStore } from './store-test-helpers'

const QUEUED = 'engagement:queued'
const QUEUED_WORKING = getNestedGroupKey(QUEUED, 'agent-state:working')

describe('sidebar hover sections slice', () => {
  it('closes nested open sections when their parent closes', () => {
    const store = createTestStore()
    store.getState().openHoverGroup(QUEUED)
    store.getState().openHoverGroup(QUEUED_WORKING)

    store.getState().closeHoverGroup(QUEUED)

    expect([...store.getState().hoverOpenedGroups]).toEqual([])
  })

  it('keeps a pinned section open on leave until unpinned', () => {
    const store = createTestStore()
    store.getState().openHoverGroup(QUEUED)
    store.getState().toggleHoverGroupPin(QUEUED)

    store.getState().closeHoverGroup(QUEUED)
    expect(store.getState().hoverOpenedGroups.has(QUEUED)).toBe(true)

    store.getState().toggleHoverGroupPin(QUEUED)
    expect(store.getState().hoverOpenedGroups.has(QUEUED)).toBe(false)
    expect(store.getState().hoverPinnedGroups.has(QUEUED)).toBe(false)
  })

  it('reset closes a pinned section', () => {
    const store = createTestStore()
    store.getState().toggleHoverGroupPin(QUEUED)

    store.getState().resetHoverGroup(QUEUED)

    expect(store.getState().hoverOpenedGroups.size).toBe(0)
    expect(store.getState().hoverPinnedGroups.size).toBe(0)
  })
})
