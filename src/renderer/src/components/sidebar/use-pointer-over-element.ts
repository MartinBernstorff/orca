import { useEffect, useState } from 'react'

// Why native listeners: React's synthetic enter/leave count portals as inside and miss the leave when a portal unmounts under the pointer.
export function usePointerOverElement(ref: React.RefObject<HTMLElement | null>): boolean {
  const [pointerOver, setPointerOver] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const markOver = (): void => setPointerOver(true)
    const markOut = (): void => setPointerOver(false)
    element.addEventListener('pointerenter', markOver)
    element.addEventListener('pointerleave', markOut)
    return () => {
      element.removeEventListener('pointerenter', markOver)
      element.removeEventListener('pointerleave', markOut)
      setPointerOver(false)
    }
  }, [ref])
  return pointerOver
}
