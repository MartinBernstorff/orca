import { describe, expect, it } from 'vitest'
import { mergeNewIdsIntoFrozenOrder } from './frozen-sort-order'

describe('mergeNewIdsIntoFrozenOrder', () => {
  it('keeps the frozen order when only ranks changed', () => {
    expect(mergeNewIdsIntoFrozenOrder(['a', 'b', 'c'], ['c', 'b', 'a'])).toEqual(['a', 'b', 'c'])
  })

  it('drops removed ids', () => {
    expect(mergeNewIdsIntoFrozenOrder(['a', 'b', 'c'], ['c', 'a'])).toEqual(['a', 'c'])
  })

  it('inserts new ids after the frozen id that precedes them in the next order', () => {
    expect(mergeNewIdsIntoFrozenOrder(['a', 'b', 'c'], ['x', 'c', 'y', 'z', 'a', 'b'])).toEqual([
      'x',
      'a',
      'b',
      'c',
      'y',
      'z'
    ])
  })
})
