import { useEffect } from 'react'

type KeyboardShortcutOptions = {
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {},
): void {
  const { enabled = true, preventDefault = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const modifier = isMac ? event.metaKey : event.ctrlKey

      if (!modifier) return

      if (event.key.toLowerCase() !== key.toLowerCase()) return

      if (preventDefault) {
        event.preventDefault()
      }

      callback()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [callback, enabled, key, preventDefault])
}
