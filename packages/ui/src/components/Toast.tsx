import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastRecord = ToastInput & { id: string }

type ToastContextValue = {
  toast: (input: ToastInput) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  default: 'border-[var(--ui-border)] bg-[var(--ui-surface)]',
  success: 'border-[var(--ui-success-border)] bg-[var(--ui-success-bg)]',
  error: 'border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)]',
  warning: 'border-[var(--ui-warning-border)] bg-[var(--ui-warning-bg)]',
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastRecord[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[var(--ui-z-toast)] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-[var(--ui-radius-lg)] border px-4 py-3 shadow-[var(--ui-shadow-md)]',
            variantClasses[item.variant ?? 'default'],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--ui-text)]">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-[var(--ui-text-muted)]">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              className="rounded px-1 text-xs text-[var(--ui-text-subtle)] hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text)]"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(item.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID()
      const durationMs = input.durationMs ?? 4000
      setToasts((current) => [...current, { ...input, id }])
      window.setTimeout(() => dismiss(id), durationMs)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
