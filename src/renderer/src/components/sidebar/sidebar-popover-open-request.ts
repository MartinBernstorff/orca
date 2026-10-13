export type SidebarPopoverOpenRequest = {
  request: () => void
  consume: () => boolean
  subscribe: (onRequest: () => void) => () => void
}

// Why: sidebar popovers unmount with a collapsed sidebar, so a request made while it is
// closed is held until the popover mounts instead of being lost as an unheard event.
export function createSidebarPopoverOpenRequest(eventName: string): SidebarPopoverOpenRequest {
  let pending = false

  const consume = (): boolean => {
    const wasPending = pending
    pending = false
    return wasPending
  }

  return {
    request: () => {
      pending = true
      window.dispatchEvent(new CustomEvent(eventName))
    },
    consume,
    subscribe: (onRequest) => {
      const listener = (): void => {
        if (consume()) {
          onRequest()
        }
      }
      window.addEventListener(eventName, listener)
      return () => window.removeEventListener(eventName, listener)
    }
  }
}
