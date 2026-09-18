// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { WorktreeCardLinkedRefsRow } from './worktree-card-linked-refs-row'
import type { WorktreeCardController } from './use-worktree-card-controller'
import type { WorktreeCardPresentation } from './worktree-card-presentation'

function renderRow(openUrl: ReturnType<typeof vi.fn>): { cardClick: ReturnType<typeof vi.fn> } {
  Object.assign(window, { api: { shell: { openUrl } } })
  const cardClick = vi.fn()
  const card = {
    stopQuickActionPointerPropagation: (event: React.PointerEvent) => event.stopPropagation()
  } as unknown as WorktreeCardController
  const presentation = {
    linkedRefs: [
      { key: 'linear', label: 'GUP-12', url: 'https://linear.app/acme/issue/GUP-12' },
      { key: 'review', label: '#4242', url: null }
    ],
    showRefsRowDeleteQuickAction: false
  } as unknown as WorktreeCardPresentation

  render(
    <div onClick={cardClick}>
      <WorktreeCardLinkedRefsRow card={card} presentation={presentation} />
    </div>
  )
  return { cardClick }
}

describe('WorktreeCardLinkedRefsRow', () => {
  afterEach(() => {
    cleanup()
  })

  it('opens the ref URL externally without activating the card', () => {
    const openUrl = vi.fn()
    const { cardClick } = renderRow(openUrl)

    fireEvent.click(screen.getByText('GUP-12'))

    expect(openUrl).toHaveBeenCalledWith('https://linear.app/acme/issue/GUP-12')
    expect(cardClick).not.toHaveBeenCalled()
  })

  it('does nothing when a ref has no resolved URL', () => {
    const openUrl = vi.fn()
    renderRow(openUrl)

    fireEvent.click(screen.getByText('#4242'))

    expect(openUrl).not.toHaveBeenCalled()
  })
})
