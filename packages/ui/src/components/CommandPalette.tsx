import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { SearchBar } from './SearchBar'

export type CommandItem = {
  id: string
  label: string
  group?: string
  keywords?: string[]
  shortcut?: string
  onSelect: () => void
}

type CommandPaletteContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  registerCommands: (commands: CommandItem[]) => () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

function scoreCommand(command: CommandItem, query: string): number {
  if (!query) return 1
  const haystack = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase()) ? 1 : 0
}

export function CommandPaletteProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [commands, setCommands] = useState<CommandItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const registerCommands = useCallback((next: CommandItem[]) => {
    setCommands((current) => [...current, ...next])
    return () => {
      setCommands((current) => current.filter((command) => !next.some((item) => item.id === command.id)))
    }
  }, [])

  useKeyboardShortcut('k', () => setOpen((value) => !value))

  const filtered = useMemo(
    () => commands.filter((command) => scoreCommand(command, query) > 0),
    [commands, query],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      }
      if (event.key === 'Enter' && filtered[activeIndex]) {
        event.preventDefault()
        filtered[activeIndex]?.onSelect()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, filtered, open])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const command of filtered) {
      const group = command.group ?? 'Commands'
      const list = map.get(group) ?? []
      list.push(command)
      map.set(group, list)
    }
    return [...map.entries()]
  }, [filtered])

  const value = useMemo(
    () => ({ open, setOpen, registerCommands }),
    [open, registerCommands],
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[var(--ui-z-command)] flex items-start justify-center p-4 pt-[12vh]">
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
              aria-label="Close command palette"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-lg)]"
            >
              <div className="border-b border-[var(--ui-border)] p-3">
                <SearchBar
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search commands…"
                  aria-label="Search commands"
                />
                <p className="mt-2 px-1 text-xs text-[var(--ui-text-subtle)]">
                  Tip: Ctrl+K to open · ↑↓ navigate · Enter select · Esc close
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[var(--ui-text-muted)]">
                    No commands found.
                  </p>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group} className="mb-2">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-subtle)]">
                        {group}
                      </p>
                      <ul>
                        {items.map((command) => {
                          const flatIndex = filtered.findIndex((item) => item.id === command.id)
                          const isActive = flatIndex === activeIndex
                          return (
                            <li key={command.id}>
                              <button
                                type="button"
                                className={cn(
                                  'flex w-full items-center justify-between rounded-[var(--ui-radius)] px-3 py-2 text-left text-sm',
                                  isActive
                                    ? 'bg-[var(--ui-accent-soft)] text-[var(--ui-text)]'
                                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]',
                                )}
                                onMouseEnter={() => setActiveIndex(flatIndex)}
                                onClick={() => {
                                  command.onSelect()
                                  setOpen(false)
                                }}
                              >
                                <span>{command.label}</span>
                                {command.shortcut && (
                                  <kbd className="rounded border border-[var(--ui-border)] px-1.5 py-0.5 text-[10px] text-[var(--ui-text-subtle)]">
                                    {command.shortcut}
                                  </kbd>
                                )}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

export function useRegisterCommands(commands: CommandItem[]): void {
  const { registerCommands } = useCommandPalette()

  useEffect(() => {
    return registerCommands(commands)
  }, [commands, registerCommands])
}
